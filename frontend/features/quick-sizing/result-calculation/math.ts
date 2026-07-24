export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function safeDiv(numerator: number, denominator: number, fallback = 0) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }

  return numerator / denominator;
}

export function roundToStep(value: number, step: number) {
  if (step <= 0) {
    return value;
  }

  return Math.round(value / step) * step;
}

export function normalizePercent(value: number) {
  return value / 100;
}

export function presentValue(value: number, ratePct: number, year: number) {
  return value / Math.pow(1 + normalizePercent(ratePct), year);
}

export function uniqueNumbers(values: Array<number | null>) {
  return values.filter((value): value is number => value !== null && Number.isFinite(value));
}

export function minMax(values: Array<number | null>) {
  const valid = uniqueNumbers(values);
  if (valid.length === 0) {
    return { min: null, max: null };
  }

  return { min: Math.min(...valid), max: Math.max(...valid) };
}

export function normalizedValue(value: number | null, min: number, max: number, invert = false) {
  if (value === null || !Number.isFinite(value) || max === min) {
    return 0;
  }

  const normalized = clamp((value - min) / (max - min), 0, 1);
  return invert ? 1 - normalized : normalized;
}
