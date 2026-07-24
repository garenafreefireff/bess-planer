import { normalizePercent, roundToStep, safeDiv } from "./math";
import { createWarning } from "./validation";
import type { GeneratedCandidate, ResultCalculationConfig, Step2Assumptions } from "./types";

export function generateCandidates(assumptions: Step2Assumptions, config: ResultCalculationConfig): GeneratedCandidate[] {
  const candidates = new Map<string, GeneratedCandidate>();
  const multiplierPairs = candidateMultiplierPairs(assumptions, config);

  for (const { powerMultiplier, energyMultiplier } of multiplierPairs) {
    const powerKw = roundToStep(assumptions.powerKw * powerMultiplier, config.candidate.powerStepKw);
    const energyKwh = roundToStep(assumptions.energyKwh * energyMultiplier, config.candidate.energyStepKwh);
    if (powerKw <= 0 || energyKwh <= 0) {
      continue;
    }

    const nominalDurationHours = energyKwh / powerKw;
    const key = `${powerKw}:${energyKwh}`;
    if (candidates.has(key)) {
      continue;
    }

    const id = `cand-${powerKw}-${energyKwh}`;
    const warnings = [];
    if (nominalDurationHours < config.candidate.minDurationHours || nominalDurationHours > config.candidate.maxDurationHours) {
      warnings.push(
        createWarning(
          "INVALID_DURATION",
          "Candidate duration is outside the configured bounds.",
          { candidateId: id, field: "durationHours", blocking: true, severity: "error" }
        )
      );
    }

    const peakEvaluation = evaluatePeakShavingCandidate(id, powerKw, energyKwh, assumptions, config);
    warnings.push(...peakEvaluation.warnings);

    candidates.set(key, {
      id,
      powerKw,
      energyKwh,
      nominalDurationHours,
      ...peakEvaluation.metadata,
      warnings
    });
  }

  return [...candidates.values()].filter((candidate) => !candidate.warnings.some((warning) => warning.blocking));
}

function candidateMultiplierPairs(assumptions: Step2Assumptions, config: ResultCalculationConfig) {
  if (isPeakShavingOnly(assumptions)) {
    const multipliers = [...new Set([...config.candidate.powerMultipliers, ...config.candidate.energyMultipliers])]
      .sort((left, right) => left - right);
    return multipliers.map((multiplier) => ({
      powerMultiplier: multiplier,
      energyMultiplier: multiplier
    }));
  }

  return config.candidate.powerMultipliers.flatMap((powerMultiplier) => (
    config.candidate.energyMultipliers.map((energyMultiplier) => ({
      powerMultiplier,
      energyMultiplier
    }))
  ));
}

function isPeakShavingOnly(assumptions: Step2Assumptions) {
  const objectives = assumptions.selectedObjectives ?? [];
  return objectives.length === 1 && objectives.includes("peak_shaving");
}

function hasPeakShaving(assumptions: Step2Assumptions) {
  return (assumptions.selectedObjectives ?? []).includes("peak_shaving");
}

function getTargetPeakReductionKw(assumptions: Step2Assumptions, peakDemandKw: number) {
  const value = assumptions.targetPeakReductionValue ?? 0;
  if (value <= 0) {
    return 0;
  }

  if (assumptions.targetPeakReductionType === "percent") {
    return peakDemandKw * normalizePercent(value);
  }

  return value;
}

function emptyPeakMetadata() {
  return {
    designObjective: null,
    designPeakEventDurationHours: null,
    targetPeakReductionKw: null,
    usableAcEnergyPerEventKwh: null,
    energyLimitedPeakReductionKw: null,
    powerLimitedPeakReductionKw: null,
    effectivePeakReductionKw: null,
    technicalCoveragePct: null,
    meetsPeakReductionTarget: null,
    deliverableDurationAtReducedPeakHours: null
  };
}

function evaluatePeakShavingCandidate(
  candidateId: string,
  powerKw: number,
  energyKwh: number,
  assumptions: Step2Assumptions,
  config: ResultCalculationConfig
) {
  if (!hasPeakShaving(assumptions)) {
    return {
      metadata: emptyPeakMetadata(),
      warnings: []
    };
  }

  const peakDemandKw = assumptions.finalPeakDemandKw ?? Math.max(assumptions.powerKw, powerKw);
  const targetPeakReductionKw = getTargetPeakReductionKw(assumptions, peakDemandKw);
  const peakEventDurationHours = assumptions.peakEventDurationHours || config.dispatch.defaultPeakEventDurationHours;
  if (targetPeakReductionKw <= 0 || peakDemandKw <= 0 || peakEventDurationHours <= 0) {
    return {
      metadata: {
        ...emptyPeakMetadata(),
        designObjective: "peak_shaving",
        designPeakEventDurationHours: peakEventDurationHours,
        targetPeakReductionKw
      },
      warnings: [
        createWarning("PEAK_TARGET_MISSING", "Peak shaving target is missing, candidate coverage cannot be evaluated.", {
          candidateId,
          field: "targetPeakReductionValue",
          blocking: false
        })
      ]
    };
  }

  const dod = normalizePercent(assumptions.dodPct);
  const rte = normalizePercent(assumptions.rtePct);
  const etaDischarge = Math.sqrt(rte);
  const usableAcEnergyPerEventKwh = energyKwh * dod * etaDischarge;
  const energyLimitedPeakReductionKw = safeDiv(usableAcEnergyPerEventKwh, peakEventDurationHours);
  const powerLimitedPeakReductionKw = powerKw * config.dispatch.peakShavingRealizationFactor;
  const effectivePeakReductionKw = Math.max(
    0,
    Math.min(
      targetPeakReductionKw,
      powerLimitedPeakReductionKw,
      energyLimitedPeakReductionKw,
      peakDemandKw
    )
  );
  const technicalCoveragePct = safeDiv(effectivePeakReductionKw, targetPeakReductionKw) * 100;
  const minimumCoveragePct = assumptions.minimumPeakCoveragePct || config.dispatch.minimumPeakCoveragePct;
  const meetsPeakReductionTarget = technicalCoveragePct >= minimumCoveragePct;
  const deliverableDurationAtReducedPeakHours = effectivePeakReductionKw > 0
    ? usableAcEnergyPerEventKwh / effectivePeakReductionKw
    : null;
  const warnings = meetsPeakReductionTarget
    ? []
    : [
      createWarning("PEAK_TARGET_NOT_MET", "Candidate does not meet the configured peak reduction coverage threshold.", {
        candidateId,
        field: "technicalCoveragePct",
        blocking: false
      })
    ];

  return {
    metadata: {
      designObjective: "peak_shaving",
      designPeakEventDurationHours: peakEventDurationHours,
      targetPeakReductionKw,
      usableAcEnergyPerEventKwh,
      energyLimitedPeakReductionKw,
      powerLimitedPeakReductionKw,
      effectivePeakReductionKw,
      technicalCoveragePct,
      meetsPeakReductionTarget,
      deliverableDurationAtReducedPeakHours
    },
    warnings
  };
}
