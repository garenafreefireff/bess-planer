"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CloudUpload, FileSpreadsheet, Info, LoaderCircle, Settings2, ShieldCheck, Trash2, Upload, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type Dispatch, type DragEvent, type SetStateAction } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { leadsApi } from "@/lib/api/leads.api";
import { cn } from "@/lib/utils";
import { buildSizingOptions, formatNumber } from "@/features/quick-sizing/data/quick-sizing-model";
import { useQuickSizingStore } from "@/features/quick-sizing/data/quick-sizing-store";
import {
  analysesApi,
  bessCatalogApi,
  datasetsApi,
  filesApi,
  projectsApi,
  readWorkspaceApiError,
  sitesApi,
  type BessCatalogResponse,
  type DatasetResponse,
  type DatasetType,
  type WorkspaceFileKind,
  type WorkspaceFileResponse,
  type SiteResponse
} from "../api/workspace.api";
import { ProjectBackendInfoStep as ProjectInfoStep } from "./project-backend-info-step";

const steps = [
  [1, "Thông tin dự án", "Thiết lập thông tin cơ bản"],
  [2, "Upload phụ tải", "Tải dữ liệu bắt buộc"],
  [3, "Upload PV", "Dữ liệu tùy chọn"],
  [4, "Kiểm tra dữ liệu", "Xem chất lượng đầu vào"],
  [5, "Cấu hình Sizing Lab", "Sizing, BESS và tài chính"],
  [6, "Xác nhận & chạy", "Bắt đầu phân tích"]
] as const;

type ProjectInfo = {
  name: string;
  location: string;
  industry: string;
  voltageLevel: string;
  timezone: string;
  siteId: string;
  bessCatalogId: string;
};

type FileInspection = {
  name: string;
  sizeLabel: string;
  extension: string;
  rowCount: number | null;
  headers: string[];
  preview: string[][];
  status: "valid" | "warning" | "invalid";
  messages: string[];
};

type PersistentUploadStatus =
  | "idle"
  | "inspecting"
  | "uploading"
  | "validating"
  | "ready"
  | "warning"
  | "invalid"
  | "failed";

type PersistedDatasetSummary = {
  rowCount: number;
  validRowCount: number;
  intervalMinutes: number | null;
  startAt: string | null;
  endAt: string | null;
};

type PersistentUploadState = {
  localFile: File | null;
  projectId: string | null;
  fileId: string | null;
  datasetId: string | null;
  fileName: string;
  fileVersion: number | null;
  uploadStatus: PersistentUploadStatus;
  message: string;
  error: string | null;
  datasetSummary: PersistedDatasetSummary | null;
  savedAt: string | null;
};

type StoredPersistentUploadState = Omit<PersistentUploadState, "localFile">;

type ModelConfig = {
  emsParityVersion: string;
  objective: string;
  analysisYears: number;
  energyKwh: number;
  powerKw: number;
  optimizePeak: boolean;
  optimizeTou: boolean;
  billingMode: "2tc" | "tou";
  sizingMode: "auto" | "range";
  energyMinKwh: number;
  energyMaxKwh: number;
  energyStepKwh: number;
  powerMinKw: number;
  powerMaxKw: number;
  powerStepKw: number;
  loadValueUnit: "kw" | "kwh";
  pvValueUnit: "kw" | "kwh";
  socMinPct: number;
  socMaxPct: number;
  socSafetyPct: number;
  chargeEfficiencyPct: number;
  dischargeEfficiencyPct: number;
  batteryCostVndPerKwh: number;
  pcsCostVndPerKw: number;
  epcPct: number;
  otherCostPct: number;
  annualOpexPct: number;
  discountRatePct: number;
  electricityEscalationPct: number;
  realizationRatePct: number;
  demandChargeVndPerKwMonth: number;
  peakPriceVndPerKwh: number;
  normalPriceVndPerKwh: number;
  offpeakPriceVndPerKwh: number;
  peakWindows: string;
  offpeakWindows: string;
  sundayNoPeak: boolean;
};

const defaultModelConfig: ModelConfig = {
  emsParityVersion: "tool-c-tariff-config-2026-07-25",
  objective: "SLSM cân bằng tiết kiệm × ROI",
  analysisYears: 10,
  energyKwh: 1000,
  powerKw: 500,
  optimizePeak: true,
  optimizeTou: true,
  billingMode: "2tc",
  sizingMode: "auto",
  energyMinKwh: 250,
  energyMaxKwh: 2000,
  energyStepKwh: 250,
  powerMinKw: 100,
  powerMaxKw: 1000,
  powerStepKw: 100,
  loadValueUnit: "kw",
  pvValueUnit: "kw",
  socMinPct: 10,
  socMaxPct: 93,
  socSafetyPct: 5,
  chargeEfficiencyPct: 95,
  dischargeEfficiencyPct: 95,
  batteryCostVndPerKwh: 5_000_000,
  pcsCostVndPerKw: 4_000_000,
  epcPct: 0,
  otherCostPct: 0,
  annualOpexPct: 2,
  discountRatePct: 8,
  electricityEscalationPct: 5,
  realizationRatePct: 60,
  demandChargeVndPerKwMonth: 285_414,
  peakPriceVndPerKwh: 3640,
  normalPriceVndPerKwh: 1987,
  offpeakPriceVndPerKwh: 1300,
  peakWindows: "17:30-22:30",
  offpeakWindows: "00:00-06:00",
  sundayNoPeak: true
};

function applyCatalogToModelConfig(current: ModelConfig, catalog: BessCatalogResponse): ModelConfig {
  const next = { ...current };
  const energyKwh = readCatalogNumber(catalog.battery, "energy_kwh");
  const powerKw = readCatalogNumber(catalog.pcs, "power_kw");
  const dodPct = readCatalogNumber(catalog.battery, "dod_pct");
  const rtePct = readCatalogNumber(catalog.battery, "round_trip_efficiency_pct");
  const batteryCost = readCatalogNumber(catalog.cost, "battery_unit_cost_per_kwh");
  const pcsCost = readCatalogNumber(catalog.cost, "pcs_unit_cost_per_kw");
  const epcPct = readCatalogNumber(catalog.cost, "epc_pct");
  const otherCostPct = readCatalogNumber(catalog.cost, "other_cost_pct");
  const annualOpexPct = readCatalogNumber(catalog.cost, "annual_opex_pct");
  const currency = readCatalogString(catalog.cost, "currency")?.toUpperCase();

  if (energyKwh !== null && energyKwh > 0) {
    next.energyKwh = energyKwh;
    next.energyMinKwh = Math.max(50, Math.round(energyKwh * 0.5));
    next.energyMaxKwh = Math.max(100, Math.round(energyKwh * 1.5));
    next.energyStepKwh = Math.max(50, Math.round(energyKwh * 0.25));
  }

  if (powerKw !== null && powerKw > 0) {
    next.powerKw = powerKw;
    next.powerMinKw = Math.max(25, Math.round(powerKw * 0.5));
    next.powerMaxKw = Math.max(50, Math.round(powerKw * 1.5));
    next.powerStepKw = Math.max(25, Math.round(powerKw * 0.25));
  }

  if (dodPct !== null && dodPct > 0 && dodPct <= 100) {
    next.socMinPct = clampNumber(100 - dodPct, 0, 95);
    if (next.socMaxPct <= next.socMinPct) next.socMaxPct = Math.min(100, next.socMinPct + 5);
  }

  if (rtePct !== null && rtePct > 0 && rtePct <= 100) {
    const singleLegEfficiencyPct = Math.round(Math.sqrt(rtePct / 100) * 1000) / 10;
    next.chargeEfficiencyPct = singleLegEfficiencyPct;
    next.dischargeEfficiencyPct = singleLegEfficiencyPct;
  }

  if (!currency || currency === "VND") {
    if (batteryCost !== null) next.batteryCostVndPerKwh = batteryCost;
    if (pcsCost !== null) next.pcsCostVndPerKw = pcsCost;
  }
  if (epcPct !== null) next.epcPct = epcPct;
  if (otherCostPct !== null) next.otherCostPct = otherCostPct;
  if (annualOpexPct !== null) next.annualOpexPct = annualOpexPct;

  return next;
}

function readCatalogNumber(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readCatalogString(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const draftKey = "energyinsight.bessPlanner.projectDraft.v1";
const reusableUploadStatuses: PersistentUploadStatus[] = ["ready", "warning"];

function emptyPersistentUpload(localFile: File | null = null): PersistentUploadState {
  return {
    localFile,
    projectId: null,
    fileId: null,
    datasetId: null,
    fileName: localFile?.name ?? "",
    fileVersion: null,
    uploadStatus: localFile ? "idle" : "idle",
    message: localFile ? "File đã sẵn sàng để upload khi chạy phân tích." : "",
    error: null,
    datasetSummary: null,
    savedAt: null
  };
}

function serializePersistentUpload(upload: PersistentUploadState): StoredPersistentUploadState {
  return {
    fileId: upload.fileId,
    projectId: upload.projectId,
    datasetId: upload.datasetId,
    fileName: upload.fileName,
    fileVersion: upload.fileVersion,
    uploadStatus: upload.uploadStatus,
    message: upload.message,
    error: upload.error,
    datasetSummary: upload.datasetSummary,
    savedAt: upload.savedAt
  };
}

function hydratePersistentUpload(upload?: Partial<StoredPersistentUploadState>): PersistentUploadState {
  if (!upload) return emptyPersistentUpload();
  return {
    ...emptyPersistentUpload(),
    fileId: upload.fileId ?? null,
    projectId: upload.projectId ?? null,
    datasetId: upload.datasetId ?? null,
    fileName: upload.fileName ?? "",
    fileVersion: upload.fileVersion ?? null,
    uploadStatus: upload.uploadStatus ?? "idle",
    message: upload.message ?? "",
    error: upload.error ?? null,
    datasetSummary: upload.datasetSummary ?? null,
    savedAt: upload.savedAt ?? null
  };
}

function datasetSummary(dataset: DatasetResponse): PersistedDatasetSummary {
  return {
    rowCount: dataset.row_count,
    validRowCount: dataset.valid_row_count,
    intervalMinutes: dataset.interval_minutes,
    startAt: dataset.start_at,
    endAt: dataset.end_at
  };
}

function uploadStateFromBackend(file: WorkspaceFileResponse, dataset: DatasetResponse): PersistentUploadState {
  return {
    ...emptyPersistentUpload(),
    projectId: file.project_id,
    fileId: file.id,
    datasetId: dataset.id,
    fileName: file.original_name,
    fileVersion: file.version,
    uploadStatus: dataset.status === "invalid" ? "invalid" : dataset.status,
    message: dataset.status === "warning"
      ? "Dataset đã lưu nhưng có cảnh báo chất lượng."
      : dataset.status === "invalid"
        ? "Dataset đã lưu nhưng chưa đủ điều kiện chạy phân tích."
        : "Dataset đã lưu và đang được chọn làm dữ liệu active.",
    error: dataset.status === "invalid" ? "Dataset không hợp lệ." : null,
    datasetSummary: datasetSummary(dataset),
    savedAt: new Date().toISOString()
  };
}

async function refreshPersistentUploadMetadata(
  upload: PersistentUploadState,
  setUpload: Dispatch<SetStateAction<PersistentUploadState>>
) {
  if (!upload.fileId || !upload.datasetId) return;
  try {
    const [file, dataset] = await Promise.all([
      filesApi.get(upload.fileId),
      datasetsApi.get(upload.datasetId)
    ]);
    setUpload((current) => ({
      ...uploadStateFromBackend(file, dataset),
      localFile: current.localFile
    }));
  } catch (error) {
    const message = readWorkspaceApiError(error);
    setUpload((current) => ({
      ...current,
      uploadStatus: "failed",
      message: `Không tải được metadata đã lưu: ${message}`,
      error: message
    }));
  }
}

export function BessPlannerProjectWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const quickBasicInfo = useQuickSizingStore((state) => state.basicInfo);
  const quickAssumptions = useQuickSizingStore((state) => state.assumptions);
  const selectedOptionId = useQuickSizingStore((state) => state.selectedOptionId);
  const selectedQuickOption = useMemo(() => {
    const options = buildSizingOptions(quickAssumptions, quickBasicInfo);
    return options.find((option) => option.id === selectedOptionId)
      ?? options[1]
      ?? options[0]
      ?? { powerKw: quickAssumptions.powerKw, energyKwh: quickAssumptions.energyKwh };
  }, [quickAssumptions, quickBasicInfo, selectedOptionId]);
  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<ProjectInfo>({ name: "", location: "", industry: "", voltageLevel: "", timezone: "UTC+07:00 Bangkok, Hanoi, Jakarta", siteId: "", bessCatalogId: "" });
  const [projectRecordId, setProjectRecordId] = useState<string | null>(null);
  const [loadFile, setLoadFile] = useState<FileInspection | null>(null);
  const [pvFile, setPvFile] = useState<FileInspection | null>(null);
  const [loadSourceFile, setLoadSourceFile] = useState<File | null>(null);
  const [pvSourceFile, setPvSourceFile] = useState<File | null>(null);
  const [loadUpload, setLoadUpload] = useState<PersistentUploadState>(() => emptyPersistentUpload());
  const [pvUpload, setPvUpload] = useState<PersistentUploadState>(() => emptyPersistentUpload());
  const [config, setConfig] = useState<ModelConfig>(defaultModelConfig);
  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [catalogItems, setCatalogItems] = useState<BessCatalogResponse[]>([]);
  const [resourceLoading, setResourceLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStage, setSaveStage] = useState("");
  const [restored, setRestored] = useState(false);
  const suppressNextSave = useRef(false);
  const refreshedDraftUploads = useRef(false);

  useEffect(() => {
    let active = true;
    const loadResources = async () => {
      setResourceLoading(true);
      try {
        const [sitePage, catalogPage] = await Promise.all([
          sitesApi.list({ page: 1, page_size: 100 }),
          bessCatalogApi.list({ page: 1, page_size: 100, status: "active" })
        ]);
        if (!active) return;
        setSites(sitePage.items.filter((item) => item.status === "active"));
        setCatalogItems(catalogPage.items.filter((item) => item.status === "active"));
      } catch (error) {
        if (active) toast.error(`Không thể tải địa điểm hoặc cấu hình BESS: ${readWorkspaceApiError(error)}`);
      } finally {
        if (active) setResourceLoading(false);
      }
    };
    void loadResources();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (source === "quick-sizing" && quickBasicInfo) {
      setCurrentStep(1);
      setProject({
        name: "",
        location: "",
        industry: quickBasicInfo.industry === "Khác" ? quickBasicInfo.customIndustry || "Khác" : quickBasicInfo.industry,
        voltageLevel: quickBasicInfo.voltageLevel,
        timezone: "UTC+07:00 Bangkok, Hanoi, Jakarta",
        siteId: "",
        bessCatalogId: ""
      });
      setLoadFile(null);
      setPvFile(null);
      setLoadSourceFile(null);
      setPvSourceFile(null);
      setProjectRecordId(null);
      setLoadUpload(emptyPersistentUpload());
      setPvUpload(emptyPersistentUpload());
      setConfig({
        ...defaultModelConfig,
        analysisYears: quickAssumptions.analysisYears,
        energyKwh: selectedQuickOption.energyKwh,
        powerKw: selectedQuickOption.powerKw,
        energyMinKwh: Math.max(50, Math.round(selectedQuickOption.energyKwh * 0.5)),
        energyMaxKwh: Math.max(100, Math.round(selectedQuickOption.energyKwh * 1.5)),
        energyStepKwh: Math.max(50, Math.round(selectedQuickOption.energyKwh * 0.25)),
        powerMinKw: Math.max(25, Math.round(selectedQuickOption.powerKw * 0.5)),
        powerMaxKw: Math.max(50, Math.round(selectedQuickOption.powerKw * 1.5)),
        powerStepKw: Math.max(25, Math.round(selectedQuickOption.powerKw * 0.25)),
        optimizePeak: quickBasicInfo.bessObjectives.includes("peak_shaving"),
        optimizeTou: quickBasicInfo.bessObjectives.includes("saving")
      });
      setRestored(true);
      return;
    }

    const raw = window.localStorage.getItem(draftKey);
    if (raw) {
      try {
        const draft = JSON.parse(raw) as {
          project?: ProjectInfo;
          config?: ModelConfig;
          currentStep?: number;
          projectRecordId?: string | null;
          projectId?: string | null;
          loadUpload?: Partial<StoredPersistentUploadState>;
          pvUpload?: Partial<StoredPersistentUploadState>;
        };
        if (draft.project) {
          const defaultProject: ProjectInfo = {
            name: "",
            location: "",
            industry: "",
            voltageLevel: "",
            timezone: "UTC+07:00 Bangkok, Hanoi, Jakarta",
            siteId: "",
            bessCatalogId: ""
          };
          setProject({ ...defaultProject, ...draft.project });
        }
        if (draft.config) {
          const legacyDraft = draft.config.emsParityVersion !== defaultModelConfig.emsParityVersion;
          setConfig({
            ...defaultModelConfig,
            ...(legacyDraft ? {} : draft.config),
            sizingMode: draft.config.sizingMode ?? defaultModelConfig.sizingMode,
            energyKwh: draft.config.energyKwh ?? defaultModelConfig.energyKwh,
            powerKw: draft.config.powerKw ?? defaultModelConfig.powerKw,
            energyMinKwh: draft.config.energyMinKwh ?? defaultModelConfig.energyMinKwh,
            energyMaxKwh: draft.config.energyMaxKwh ?? defaultModelConfig.energyMaxKwh,
            energyStepKwh: draft.config.energyStepKwh ?? defaultModelConfig.energyStepKwh,
            powerMinKw: draft.config.powerMinKw ?? defaultModelConfig.powerMinKw,
            powerMaxKw: draft.config.powerMaxKw ?? defaultModelConfig.powerMaxKw,
            powerStepKw: draft.config.powerStepKw ?? defaultModelConfig.powerStepKw,
            objective: defaultModelConfig.objective,
            loadValueUnit: "kw",
            pvValueUnit: "kw"
          });
        }
        if (draft.currentStep) setCurrentStep(Math.min(6, Math.max(1, draft.currentStep)));
        setProjectRecordId(draft.projectRecordId ?? draft.projectId ?? null);
        setLoadUpload(hydratePersistentUpload(draft.loadUpload));
        setPvUpload(hydratePersistentUpload(draft.pvUpload));
      } catch {
        window.localStorage.removeItem(draftKey);
      }
    }
    setRestored(true);
  }, [quickAssumptions.analysisYears, quickBasicInfo, selectedQuickOption.energyKwh, selectedQuickOption.powerKw, source]);

  useEffect(() => {
    if (!restored) return;
    if (suppressNextSave.current) {
      suppressNextSave.current = false;
      return;
    }
    window.localStorage.setItem(draftKey, JSON.stringify({
      project,
      config,
      currentStep,
      source,
      selectedOptionId,
      projectRecordId,
      loadUpload: serializePersistentUpload(loadUpload),
      pvUpload: serializePersistentUpload(pvUpload)
    }));
  }, [config, currentStep, loadUpload, project, projectRecordId, pvUpload, restored, selectedOptionId, source]);

  useEffect(() => {
    if (!restored || refreshedDraftUploads.current) return;
    refreshedDraftUploads.current = true;
    void refreshPersistentUploadMetadata(loadUpload, setLoadUpload);
    void refreshPersistentUploadMetadata(pvUpload, setPvUpload);
  }, [loadUpload, pvUpload, restored]);

  const chooseCatalog = (bessCatalogId: string) => {
    const selectedCatalog = catalogItems.find((item) => item.id === bessCatalogId);
    setProject((current) => ({ ...current, bessCatalogId }));
    if (selectedCatalog) {
      setConfig((current) => applyCatalogToModelConfig(current, selectedCatalog));
      toast.success("Đã áp dụng cấu hình BESS vào Sizing Lab.");
    }
  };

  const handleLoadInspection = (nextFile: FileInspection | null) => {
    setLoadFile(nextFile);
    if (!nextFile || nextFile.status === "invalid") {
      setLoadUpload(emptyPersistentUpload());
    }
  };

  const handlePvInspection = (nextFile: FileInspection | null) => {
    setPvFile(nextFile);
    if (!nextFile || nextFile.status === "invalid") {
      setPvUpload(emptyPersistentUpload());
    }
  };

  const handleLoadSourceFile = (nextFile: File | null) => {
    setLoadSourceFile(nextFile);
    setLoadUpload(emptyPersistentUpload(nextFile));
  };

  const handlePvSourceFile = (nextFile: File | null) => {
    setPvSourceFile(nextFile);
    setPvUpload(emptyPersistentUpload(nextFile));
  };

  const hasReusableLoadUpload = Boolean(
    projectRecordId
    && loadUpload.projectId === projectRecordId
    && loadUpload.datasetId
    && reusableUploadStatuses.includes(loadUpload.uploadStatus)
  );
  const hasValidLoadInput = Boolean(
    (loadFile && loadFile.status !== "invalid" && loadSourceFile) || hasReusableLoadUpload
  );

  const stepValidity = useMemo(() => ({
    1: Boolean(project.name.trim() && project.location.trim() && project.industry.trim() && project.voltageLevel.trim() && project.siteId && project.bessCatalogId),
    2: hasValidLoadInput,
    3: true,
    4: hasValidLoadInput,
    5: config.energyKwh > 0 && config.powerKw > 0 && config.analysisYears > 0 && config.socMaxPct > config.socMinPct && config.chargeEfficiencyPct > 0 && config.dischargeEfficiencyPct > 0 && (config.sizingMode === "auto" || (config.energyMaxKwh >= config.energyMinKwh && config.powerMaxKw >= config.powerMinKw && config.energyStepKwh > 0 && config.powerStepKw > 0)),
    6: hasValidLoadInput
  }), [config, hasValidLoadInput, project]);

  const goNext = () => {
    if (!stepValidity[currentStep as keyof typeof stepValidity]) return;
    if (currentStep < 6) setCurrentStep((step) => step + 1);
  };

  const buildProjectConfiguration = () => ({
    location: project.location,
    industry: project.industry,
    voltageLevel: project.voltageLevel,
    timezone: project.timezone,
    ...config,
    source,
    selectedOptionId
  });

  const ensureProjectRecord = async () => {
    if (projectRecordId) {
      const updatedProject = await projectsApi.update(projectRecordId, {
        site_id: project.siteId,
        bess_catalog_id: project.bessCatalogId,
        name: project.name,
        project_type: "bess_planning",
        status: "draft",
        configuration: buildProjectConfiguration()
      });
      return updatedProject;
    }

    const createdProject = await projectsApi.create({
      site_id: project.siteId,
      bess_catalog_id: project.bessCatalogId,
      name: project.name,
      project_type: "bess_planning",
      status: "draft",
      configuration: buildProjectConfiguration(),
      scenarios: [],
      dataset_ids: []
    });
    setProjectRecordId(createdProject.id);
    return createdProject;
  };

  const persistUpload = async (
    projectId: string,
    kind: WorkspaceFileKind,
    datasetType: DatasetType,
    upload: PersistentUploadState,
    sourceFile: File | null,
    setUpload: Dispatch<SetStateAction<PersistentUploadState>>
  ) => {
    if (
      upload.projectId === projectId
      && upload.datasetId
      && reusableUploadStatuses.includes(upload.uploadStatus)
    ) {
      setSaveStage("Đang chọn dataset active...");
      await datasetsApi.activate(upload.datasetId);
      return upload;
    }
    if (!sourceFile) {
      throw new Error(kind === "load_profile" ? "Chưa có file phụ tải hợp lệ." : "Chưa có file PV hợp lệ.");
    }

    let uploadedFile: WorkspaceFileResponse | null = null;
    try {
      setUpload((current) => ({ ...current, uploadStatus: "uploading", message: "Đang upload file lên storage...", error: null }));
      uploadedFile = await filesApi.upload(sourceFile, { project_id: projectId, kind });
      setUpload((current) => ({
        ...current,
        projectId: uploadedFile?.project_id ?? current.projectId,
        fileId: uploadedFile?.id ?? current.fileId,
        fileName: uploadedFile?.original_name ?? current.fileName,
        fileVersion: uploadedFile?.version ?? current.fileVersion,
        uploadStatus: "validating",
        message: "Đang tạo dataset và kiểm tra chất lượng..."
      }));
      const dataset = await datasetsApi.create({
        project_id: uploadedFile.project_id,
        file_id: uploadedFile.id,
        dataset_type: datasetType,
        activate: true
      });
      const nextUpload = uploadStateFromBackend(uploadedFile, dataset);
      setUpload(nextUpload);
      if (dataset.status === "invalid") {
        throw new Error(`${uploadedFile.original_name} chưa đủ điều kiện để chạy phân tích.`);
      }
      return nextUpload;
    } catch (error) {
      const message = readWorkspaceApiError(error);
      setUpload((current) => ({
        ...current,
        projectId: uploadedFile?.project_id ?? current.projectId,
        fileId: uploadedFile?.id ?? current.fileId,
        fileName: uploadedFile?.original_name ?? current.fileName,
        fileVersion: uploadedFile?.version ?? current.fileVersion,
        uploadStatus: "failed",
        message,
        error: message
      }));
      throw error;
    }
  };

  const finish = async () => {
    if (!stepValidity[6] || isSaving) return;
    setIsSaving(true);
    let createdProjectId = "";
    try {
      setSaveStage("Đang tạo dự án...");
      const createdProject = await ensureProjectRecord();
      createdProjectId = createdProject.id;

      setSaveStage("Đang xử lý dữ liệu và tối ưu phương án BESS...");
      setSaveStage("Đang lưu file phụ tải...");
      await persistUpload(
        createdProject.id,
        "load_profile",
        "load_profile",
        loadUpload,
        loadSourceFile,
        setLoadUpload
      );
      if (
        pvSourceFile
        || (
          pvUpload.projectId === createdProject.id
          && pvUpload.datasetId
          && reusableUploadStatuses.includes(pvUpload.uploadStatus)
        )
      ) {
        setSaveStage("Đang lưu file PV...");
        await persistUpload(
          createdProject.id,
          "pv_profile",
          "pv_profile",
          pvUpload,
          pvSourceFile,
          setPvUpload
        );
      }

      setSaveStage("Đang tối ưu phương án BESS...");
      await analysesApi.createSizingLab(createdProject.id);
      if (source === "quick-sizing") {
        const resultCode = window.localStorage.getItem("energyinsight.quickSizing.latestResultCode");
        if (resultCode) {
          await leadsApi.markQuickSizingConversion({
            result_code: resultCode,
            project_id: createdProject.id,
            selected_candidate_id: selectedOptionId
          }).catch(() => undefined);
          window.localStorage.removeItem("energyinsight.quickSizing.latestResultCode");
        }
      }
      window.localStorage.removeItem(draftKey);
      toast.success("Đã hoàn tất phân tích và lưu phiên bản file đầu vào.");
      router.push(`/customer-portal/du-an-cua-toi/ket-qua?projectId=${createdProject.id}`);
    } catch (error) {
      const message = readWorkspaceApiError(error);
      toast.error(createdProjectId ? `Dự án đã được tạo nhưng xử lý dữ liệu chưa hoàn tất: ${message}` : message);
    } finally {
      setSaveStage("");
      setIsSaving(false);
    }
  };

  const clearDraft = () => {
    if (!window.confirm("Xóa toàn bộ bản nháp dự án đang nhập?")) return;
    suppressNextSave.current = true;
    window.localStorage.removeItem(draftKey);
    setCurrentStep(1);
    setProject({ name: "", location: "", industry: "", voltageLevel: "", timezone: "UTC+07:00 Bangkok, Hanoi, Jakarta", siteId: "", bessCatalogId: "" });
    setProjectRecordId(null);
    setLoadFile(null);
    setPvFile(null);
    setLoadSourceFile(null);
    setPvSourceFile(null);
    setLoadUpload(emptyPersistentUpload());
    setPvUpload(emptyPersistentUpload());
    setConfig(defaultModelConfig);
  };

  return (
    <main className="w-full pb-8 pt-7">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-muted"><span>Customer Portal</span><ArrowRight size={14} /><span>Dự án của tôi</span><ArrowRight size={14} /><span className="text-brand-navy">Tạo dự án</span></div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-[34px] font-bold text-brand-navy">Tạo dự án Sizing Lab</h1><p className="mt-2 text-sm font-medium text-brand-muted">Hoàn thành sáu bước để chuẩn bị bộ dữ liệu và cấu hình phân tích.</p></div><div className="flex flex-wrap items-center gap-3">{source === "quick-sizing" ? <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-brand-green">Đã kế thừa cấu hình từ Quick Sizing</span> : null}<button className={buttonVariants({ variant: "secondary", size: "sm" })} onClick={clearDraft} type="button"><Trash2 size={16} />Xóa bản nháp</button></div></div>

      <WizardStepper currentStep={currentStep} validSteps={stepValidity} onStep={setCurrentStep} />

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-5 max-xl:grid-cols-1">
        <Card className="rounded-xl bg-white p-5 shadow-panel">
          {currentStep === 1 ? <ProjectInfoStep value={project} onCatalogChange={chooseCatalog} onChange={setProject} sites={sites} catalogItems={catalogItems} loading={resourceLoading} /> : null}
          {currentStep === 2 ? <UploadStep title="Dữ liệu phụ tải" required description="Hỗ trợ timestamp hoặc định dạng EMS date_iso/day_index + step + P_load_kW + P_pv_kW. File EMS kết hợp sẽ được tự tách Load/PV." file={loadFile} sourceFile={loadSourceFile} uploadState={loadUpload} onFile={handleLoadInspection} onSourceFile={handleLoadSourceFile} /> : null}
          {currentStep === 3 ? <UploadStep title="Dữ liệu điện mặt trời" description="Có thể bỏ qua nếu file phụ tải ở bước trước đã chứa cột P_pv_kW; hệ thống sẽ tự tách dữ liệu PV." file={pvFile} sourceFile={pvSourceFile} uploadState={pvUpload} onFile={handlePvInspection} onSourceFile={handlePvSourceFile} /> : null}
          {currentStep === 4 ? <QualityStep loadFile={loadFile} pvFile={pvFile} loadUpload={loadUpload} pvUpload={pvUpload} /> : null}
          {currentStep === 5 ? <ModelConfigStep value={config} onChange={setConfig} /> : null}
          {currentStep === 6 ? <ReviewStep project={project} loadFile={loadFile} pvFile={pvFile} loadUpload={loadUpload} pvUpload={pvUpload} config={config} /> : null}
        </Card>
        <WizardSidebar currentStep={currentStep} project={project} loadFile={loadFile} loadUpload={loadUpload} config={config} />
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-brand-line bg-white p-3 shadow-panel max-md:grid-cols-1">
        <button className={buttonVariants({ variant: "secondary", className: "h-11" })} disabled={currentStep === 1} onClick={() => setCurrentStep((step) => Math.max(1, step - 1))} type="button"><ArrowLeft size={17} />Quay lại</button>
        <span className="text-center text-sm font-semibold text-brand-muted">Bước {currentStep}/6 · Bản nháp lưu cấu hình và metadata dataset</span>
        {currentStep < 6 ? <button className={buttonVariants({ className: "h-11 px-7" })} disabled={!stepValidity[currentStep as keyof typeof stepValidity]} onClick={goNext} type="button">Tiếp tục<ArrowRight size={18} /></button> : <button className={buttonVariants({ variant: "green", className: "h-11 px-7" })} disabled={!stepValidity[6] || isSaving} onClick={() => void finish()} type="button">{isSaving ? <LoaderCircle className="animate-spin" size={18} /> : <Zap size={18} />}{isSaving ? saveStage || "Đang xử lý..." : "Chạy Sizing Lab"}</button>}
      </div>
    </main>
  );
}

function WizardStepper({ currentStep, validSteps, onStep }: { currentStep: number; validSteps: { 1: boolean; 2: boolean; 3: boolean; 4: boolean; 5: boolean; 6: boolean }; onStep: (step: number) => void }) {
  return <Card className="mt-4 overflow-x-auto rounded-xl bg-white p-3 shadow-panel"><div className="grid min-w-[1040px] grid-cols-[repeat(6,minmax(150px,1fr))] gap-2">{steps.map(([number, title, description]) => { const active = number === currentStep; const completed = number < currentStep && validSteps[number]; const accessible = number <= currentStep || (number === currentStep + 1 && validSteps[currentStep as keyof typeof validSteps]); return <button className={cn("grid grid-cols-[36px_1fr] items-center gap-2 rounded-lg border p-2.5 text-left", active ? "border-brand-blue bg-blue-50" : completed ? "border-green-100 bg-green-50/50" : "border-brand-line bg-white", !accessible && "cursor-not-allowed opacity-60")} disabled={!accessible} key={number} onClick={() => onStep(number)} type="button"><span className={cn("grid size-8 place-items-center rounded-full text-sm font-bold", active ? "bg-brand-blue text-white" : completed ? "bg-brand-green text-white" : "bg-slate-100 text-brand-muted")}>{completed ? <Check size={17} /> : number}</span><span><strong className="block text-xs text-brand-navy">{title}</strong><small className="mt-0.5 block text-[11px] font-medium text-brand-muted">{description}</small></span></button>; })}</div></Card>;
}

function UploadStep({ title, description, required, file, sourceFile, uploadState, onFile, onSourceFile }: { title: string; description: string; required?: boolean; file: FileInspection | null; sourceFile: File | null; uploadState: PersistentUploadState; onFile: (file: FileInspection | null) => void; onSourceFile: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);

  const inspect = async (nextFile?: File | null) => {
    if (!nextFile) return;
    setReading(true);
    try {
      const inspected = await inspectFile(nextFile);
      onFile(inspected);
      onSourceFile(inspected.status === "invalid" ? null : nextFile);
    } finally {
      setReading(false);
    }
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); void inspect(event.dataTransfer.files.item(0)); };
  const reusableDataset = Boolean(uploadState.datasetId && reusableUploadStatuses.includes(uploadState.uploadStatus));

  return <section><h2 className="text-xl font-bold text-brand-navy">{title} {required ? <span className="text-red-500">*</span> : null}</h2><p className="mt-2 text-sm font-medium text-brand-muted">{description}</p><div className={cn("mt-5 grid min-h-[220px] place-items-center rounded-xl border-2 border-dashed text-center", dragging ? "border-brand-blue bg-blue-50" : "border-blue-200 bg-slate-50/50")} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><div><CloudUpload className="mx-auto text-brand-blue" size={46} /><p className="mt-3 text-sm font-semibold text-brand-navy">Kéo thả CSV/XLSX vào đây</p><p className="mt-1 text-xs font-medium text-brand-muted">CSV sẽ được xem trước; XLSX được kiểm tra tên và kích thước trước khi xử lý đầy đủ.</p><input accept=".csv,.xlsx" className="hidden" ref={inputRef} type="file" onChange={(event) => void inspect(event.target.files?.item(0))} /><button className={buttonVariants({ className: "mt-4 h-10" })} disabled={reading} onClick={() => inputRef.current?.click()} type="button"><Upload size={17} />{reading ? "Đang kiểm tra..." : "Chọn file"}</button></div></div>{file ? <><FileResult file={file} onRemove={() => { onFile(null); onSourceFile(null); if (inputRef.current) inputRef.current.value = ""; }} /><UploadPersistenceStatus upload={uploadState} />{!sourceFile && !reusableDataset ? <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Trình duyệt không thể khôi phục file gốc từ bản nháp. Hãy chọn lại file hoặc dùng dataset đã lưu trước khi tiếp tục.</div> : null}</> : reusableDataset ? <UploadPersistenceStatus upload={uploadState} /> : <div className="mt-4 rounded-lg border border-dashed border-brand-line p-4 text-sm font-medium text-brand-muted">Chưa có file được chọn.</div>}</section>;
}

function UploadPersistenceStatus({ upload }: { upload: PersistentUploadState }) {
  if (upload.uploadStatus === "idle" && !upload.fileId && !upload.datasetId) return null;
  const tone = upload.uploadStatus === "failed" || upload.uploadStatus === "invalid"
    ? "border-red-200 bg-red-50 text-red-700"
    : upload.uploadStatus === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-green-100 bg-green-50 text-brand-green";
  return (
    <div className={cn("mt-3 rounded-lg border px-4 py-3 text-sm font-semibold", tone)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{formatUploadStatus(upload.uploadStatus)}</span>
        {upload.fileVersion ? <span>File v{upload.fileVersion}</span> : null}
      </div>
      {upload.message ? <p className="mt-1 text-xs font-medium leading-5">{upload.message}</p> : null}
      {upload.datasetSummary ? (
        <p className="mt-1 text-xs font-medium leading-5">
          {formatNumber(upload.datasetSummary.validRowCount, 0)}/{formatNumber(upload.datasetSummary.rowCount, 0)} dòng hợp lệ · chu kỳ {upload.datasetSummary.intervalMinutes ?? "—"} phút
        </p>
      ) : null}
      {upload.error ? <p className="mt-1 text-xs font-bold">{upload.error}</p> : null}
    </div>
  );
}

function FileResult({ file, onRemove }: { file: FileInspection; onRemove: () => void }) {
  return <div className={cn("mt-4 rounded-xl border p-4", file.status === "valid" ? "border-green-100 bg-green-50/50" : file.status === "warning" ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50")}><div className="grid grid-cols-[42px_1fr_auto] items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-white text-brand-blue"><FileSpreadsheet size={22} /></span><span><strong className="block text-sm text-brand-navy">{file.name}</strong><small className="font-medium text-brand-muted">{file.sizeLabel} · {file.extension.toUpperCase()} · {file.rowCount === null ? "Chưa đếm dòng" : `${formatNumber(file.rowCount, 0)} dòng dữ liệu`}</small></span><button aria-label="Xóa file" className="text-brand-muted hover:text-red-500" onClick={onRemove} type="button"><Trash2 size={19} /></button></div><div className="mt-3 grid gap-1 text-xs font-medium">{file.messages.map((message) => <span key={message}>• {message}</span>)}</div>{file.preview.length > 0 ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-xs"><thead><tr className="bg-white">{file.headers.map((header) => <th className="border border-brand-line px-3 py-2 text-left" key={header}>{header || "(trống)"}</th>)}</tr></thead><tbody>{file.preview.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td className="border border-brand-line bg-white px-3 py-2" key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div> : null}</div>;
}

function QualityStep({ loadFile, pvFile, loadUpload, pvUpload }: { loadFile: FileInspection | null; pvFile: FileInspection | null; loadUpload: PersistentUploadState; pvUpload: PersistentUploadState }) {
  const files = [["Phụ tải", loadFile, loadUpload], ["Điện mặt trời", pvFile, pvUpload]] as const;
  return <section><h2 className="text-xl font-bold text-brand-navy">4. Kiểm tra chất lượng dữ liệu</h2><p className="mt-2 text-sm font-medium text-brand-muted">Đây là bước kiểm tra sơ bộ. Hệ thống sẽ tiếp tục kiểm tra cấu trúc thời gian, dữ liệu trùng và các dòng không hợp lệ trước khi phân tích.</p><div className="mt-5 grid gap-4">{files.map(([label, file, upload]) => <Card className="rounded-xl p-4 shadow-none" key={label}><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold text-brand-navy"><ShieldCheck className="text-brand-blue" size={20} />{label}</h3><StatusBadge file={file} upload={upload} /></div>{file ? <div className="mt-4 grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1"><QualityMetric label="Tên file" value={file.name} /><QualityMetric label="Số dòng" value={file.rowCount === null ? "Chưa xác định" : formatNumber(file.rowCount, 0)} /><QualityMetric label="Số cột" value={formatNumber(file.headers.length, 0)} /><QualityMetric label="Định dạng" value={file.extension.toUpperCase()} /></div> : upload.datasetSummary ? <div className="mt-4 grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1"><QualityMetric label="Tên file" value={upload.fileName} /><QualityMetric label="Dòng hợp lệ" value={`${formatNumber(upload.datasetSummary.validRowCount, 0)}/${formatNumber(upload.datasetSummary.rowCount, 0)}`} /><QualityMetric label="Chu kỳ" value={upload.datasetSummary.intervalMinutes ? `${upload.datasetSummary.intervalMinutes} phút` : "Chưa xác định"} /><QualityMetric label="Phiên bản" value={upload.fileVersion ? `v${upload.fileVersion}` : "—"} /></div> : <p className="mt-4 text-sm font-medium text-brand-muted">{label === "Điện mặt trời" ? "Không có file PV; bước này là tùy chọn." : "Chưa có file phụ tải."}</p>}{file?.messages.length ? <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs font-medium leading-5 text-brand-muted">{file.messages.map((message) => <p key={message}>• {message}</p>)}</div> : null}</Card>)}</div></section>;
}

function ModelConfigStep({ value, onChange }: { value: ModelConfig; onChange: (value: ModelConfig) => void }) {
  const energyCount = Math.max(1, Math.floor((value.energyMaxKwh - value.energyMinKwh) / Math.max(value.energyStepKwh, 1)) + 1);
  const powerCount = Math.max(1, Math.floor((value.powerMaxKw - value.powerMinKw) / Math.max(value.powerStepKw, 1)) + 1);
  const candidateCount = value.sizingMode === "auto" ? 15 : Math.min(120, energyCount * powerCount);

  return (
    <section>
      <h2 className="text-xl font-bold text-brand-navy">5. Cấu hình Sizing Lab</h2>
      <p className="mt-2 text-sm font-medium text-brand-muted">Thiết lập phạm vi phương án, giới hạn BESS, biểu giá và giả định tài chính dùng cho phân tích.</p>

      <div className="mt-5 grid gap-4">
        <Card className="rounded-xl p-4 shadow-none">
          <h3 className="font-bold text-brand-navy">A. Phạm vi công suất và dung lượng</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <SelectField label="Chế độ sizing" value={value.sizingMode} onChange={(sizingMode) => onChange({ ...value, sizingMode: sizingMode as ModelConfig["sizingMode"] })} options={["auto", "range"]} />
            <SelectField label="Phương pháp chọn" required value={value.objective} onChange={(objective) => onChange({ ...value, objective })} options={["SLSM cân bằng tiết kiệm × ROI"]} />
            <NumberField label="Dung lượng tham chiếu" unit="kWh" value={value.energyKwh} onChange={(energyKwh) => onChange({ ...value, energyKwh })} />
            <NumberField label="Công suất tham chiếu" unit="kW" value={value.powerKw} onChange={(powerKw) => onChange({ ...value, powerKw })} />
          </div>
          {value.sizingMode === "range" ? <div className="mt-4 grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1"><NumberField label="E tối thiểu" unit="kWh" value={value.energyMinKwh} onChange={(energyMinKwh) => onChange({ ...value, energyMinKwh })} /><NumberField label="E tối đa" unit="kWh" value={value.energyMaxKwh} onChange={(energyMaxKwh) => onChange({ ...value, energyMaxKwh })} /><NumberField label="Bước E" unit="kWh" value={value.energyStepKwh} onChange={(energyStepKwh) => onChange({ ...value, energyStepKwh })} /><NumberField label="P tối thiểu" unit="kW" value={value.powerMinKw} onChange={(powerMinKw) => onChange({ ...value, powerMinKw })} /><NumberField label="P tối đa" unit="kW" value={value.powerMaxKw} onChange={(powerMaxKw) => onChange({ ...value, powerMaxKw })} /><NumberField label="Bước P" unit="kW" value={value.powerStepKw} onChange={(powerStepKw) => onChange({ ...value, powerStepKw })} /></div> : null}
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-brand-blue">Dự kiến phân tích {candidateCount} phương án BESS.</div>
        </Card>

        <Card className="rounded-xl p-4 shadow-none">
          <h3 className="font-bold text-brand-navy">B. Dữ liệu và thông số BESS</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1"><SelectField label="Đơn vị dữ liệu Load (EMS)" value={value.loadValueUnit} onChange={(loadValueUnit) => onChange({ ...value, loadValueUnit: loadValueUnit as ModelConfig["loadValueUnit"] })} options={["kw"]} /><SelectField label="Đơn vị dữ liệu PV (EMS)" value={value.pvValueUnit} onChange={(pvValueUnit) => onChange({ ...value, pvValueUnit: pvValueUnit as ModelConfig["pvValueUnit"] })} options={["kw"]} /><NumberField label="SOC tối thiểu" unit="%" value={value.socMinPct} onChange={(socMinPct) => onChange({ ...value, socMinPct })} /><NumberField label="SOC tối đa" unit="%" value={value.socMaxPct} onChange={(socMaxPct) => onChange({ ...value, socMaxPct })} /><NumberField label="SOC safety buffer" unit="%" value={value.socSafetyPct} onChange={(socSafetyPct) => onChange({ ...value, socSafetyPct })} /><NumberField label="Hiệu suất sạc" unit="%" value={value.chargeEfficiencyPct} onChange={(chargeEfficiencyPct) => onChange({ ...value, chargeEfficiencyPct })} /><NumberField label="Hiệu suất xả" unit="%" value={value.dischargeEfficiencyPct} onChange={(dischargeEfficiencyPct) => onChange({ ...value, dischargeEfficiencyPct })} /></div>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-brand-muted">Oracle LP-PF tự tối ưu dispatch theo biểu giá đã chọn; không dùng các hệ số Peak/TOU ước lượng.</div>
        </Card>

        <Card className="rounded-xl p-4 shadow-none">
          <h3 className="font-bold text-brand-navy">C. Biểu giá điện</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1"><SelectField label="Chế độ biểu giá" value={value.billingMode} onChange={(billingMode) => onChange({ ...value, billingMode: billingMode as ModelConfig["billingMode"] })} options={["2tc", "tou"]} /><NumberField label="Giá cao điểm" unit="đ/kWh" value={value.peakPriceVndPerKwh} onChange={(peakPriceVndPerKwh) => onChange({ ...value, peakPriceVndPerKwh })} /><NumberField label="Giá bình thường" unit="đ/kWh" value={value.normalPriceVndPerKwh} onChange={(normalPriceVndPerKwh) => onChange({ ...value, normalPriceVndPerKwh })} /><NumberField label="Giá thấp điểm" unit="đ/kWh" value={value.offpeakPriceVndPerKwh} onChange={(offpeakPriceVndPerKwh) => onChange({ ...value, offpeakPriceVndPerKwh })} /><NumberField label="Phí công suất" unit="đ/kW-tháng" value={value.demandChargeVndPerKwMonth} onChange={(demandChargeVndPerKwMonth) => onChange({ ...value, demandChargeVndPerKwMonth })} /><TextField label="Khung cao điểm" value={value.peakWindows} onChange={(peakWindows) => onChange({ ...value, peakWindows })} /><TextField label="Khung thấp điểm" value={value.offpeakWindows} onChange={(offpeakWindows) => onChange({ ...value, offpeakWindows })} /></div>
          <div className="mt-4"><ToggleCard title="Chủ nhật không có giờ cao điểm" description="Đúng quy tắc lịch đang dùng trong EMS Sizing Lab." checked={value.sundayNoPeak} onChange={(sundayNoPeak) => onChange({ ...value, sundayNoPeak })} /></div>
        </Card>

        <Card className="rounded-xl p-4 shadow-none">
          <h3 className="font-bold text-brand-navy">D. Chi phí đầu tư</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1"><NumberField label="Chi phí battery" unit="đ/kWh" value={value.batteryCostVndPerKwh} onChange={(batteryCostVndPerKwh) => onChange({ ...value, batteryCostVndPerKwh })} /><NumberField label="Chi phí PCS" unit="đ/kW" value={value.pcsCostVndPerKw} onChange={(pcsCostVndPerKw) => onChange({ ...value, pcsCostVndPerKw })} /><NumberField label="OPEX hằng năm" unit="% CAPEX" value={value.annualOpexPct} onChange={(annualOpexPct) => onChange({ ...value, annualOpexPct })} /></div>
        </Card>

        <Card className="rounded-xl p-4 shadow-none">
          <h3 className="font-bold text-brand-navy">E. Giả định tài chính</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1"><SelectField label="Thời hạn phân tích" required value={String(value.analysisYears)} onChange={(analysisYears) => onChange({ ...value, analysisYears: Number(analysisYears) })} options={["5", "10", "15"]} /><NumberField label="Tỷ lệ chiết khấu" unit="%" value={value.discountRatePct} onChange={(discountRatePct) => onChange({ ...value, discountRatePct })} /><NumberField label="Tỷ lệ hiện thực hóa" unit="%" value={value.realizationRatePct} onChange={(realizationRatePct) => onChange({ ...value, realizationRatePct })} /></div>
        </Card>
      </div>
    </section>
  );
}

function ReviewStep({ project, loadFile, pvFile, loadUpload, pvUpload, config }: { project: ProjectInfo; loadFile: FileInspection | null; pvFile: FileInspection | null; loadUpload: PersistentUploadState; pvUpload: PersistentUploadState; config: ModelConfig }) {
  const loadName = loadUpload.fileName || loadFile?.name || "Chưa có";
  const pvName = pvUpload.fileName || pvFile?.name || "Không sử dụng";
  return <section><h2 className="text-xl font-bold text-brand-navy">6. Xác nhận trước khi chạy</h2><p className="mt-2 text-sm font-medium text-brand-muted">Kiểm tra lại dữ liệu trước khi chạy. File đầu vào sẽ được lưu vào storage backend, tạo dataset và gắn active cho project.</p><div className="mt-5 grid grid-cols-2 gap-4 max-lg:grid-cols-1"><ReviewCard title="Dự án" rows={[["Tên", project.name], ["Địa điểm", project.location], ["Ngành", project.industry], ["Điện áp", project.voltageLevel]]} /><ReviewCard title="Dữ liệu" rows={[["Phụ tải", loadName], ["Trạng thái Load", formatUploadStatus(loadUpload.uploadStatus)], ["PV", pvName], ["Trạng thái PV", formatUploadStatus(pvUpload.uploadStatus)]]} /><ReviewCard title="Cấu hình" rows={[["Mục tiêu", config.objective], ["Thời hạn", `${config.analysisYears} năm`], ["Sizing tham chiếu", `${formatNumber(config.powerKw, 0)} kW / ${formatNumber(config.energyKwh, 0)} kWh`], ["Biểu giá", config.billingMode === "2tc" ? "2TC — TOU + công suất" : "TOU-only"], ["Chọn phương án", "Pareto + SLSM"]]} /></div><div className="mt-5 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium leading-6 text-brand-blue"><Info className="shrink-0" size={20} /><span>Analysis sẽ chạy từ dataset active của project. Nếu chọn file mới, hệ thống chỉ tạo version mới và không xóa phiên bản cũ.</span></div></section>;
}

function WizardSidebar({ currentStep, project, loadFile, loadUpload, config }: { currentStep: number; project: ProjectInfo; loadFile: FileInspection | null; loadUpload: PersistentUploadState; config: ModelConfig }) {
  return <aside className="sticky top-24 h-fit"><Card className="rounded-xl bg-white p-5 shadow-panel"><h2 className="text-lg font-bold text-brand-navy">Tóm tắt dự án</h2><div className="mt-4 grid gap-3"><SummaryRow label="Bước hiện tại" value={`${currentStep}/6`} /><SummaryRow label="Tên dự án" value={project.name || "Chưa nhập"} /><SummaryRow label="Phụ tải" value={loadUpload.fileName || loadFile?.name || "Chưa có file"} /><SummaryRow label="Cấu hình" value={`${formatNumber(config.powerKw, 0)} kW / ${formatNumber(config.energyKwh, 0)} kWh`} /><SummaryRow label="Thời hạn" value={`${config.analysisYears} năm`} /></div><div className="mt-5 rounded-xl bg-blue-50 p-4 text-xs font-medium leading-5 text-brand-muted"><Settings2 className="mb-2 text-brand-blue" size={20} />Bản nháp lưu cấu hình và metadata file/dataset. File gốc được lưu trong backend storage khi chạy phân tích.</div></Card></aside>;
}

async function inspectFile(file: File): Promise<FileInspection> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const messages: string[] = [];
  const allowed = ["csv", "xlsx"];
  if (!allowed.includes(extension)) return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: null, headers: [], preview: [], status: "invalid", messages: ["Định dạng không được hỗ trợ. Chỉ chấp nhận CSV hoặc XLSX."] };
  if (file.size === 0) return { name: file.name, sizeLabel: "0 KB", extension, rowCount: 0, headers: [], preview: [], status: "invalid", messages: ["File rỗng."] };
  if (file.size > 50 * 1024 * 1024) {
    return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: null, headers: [], preview: [], status: "invalid", messages: ["File vượt giới hạn upload 50 MB. Hãy chia nhỏ file trước khi tiếp tục."] };
  }
  if (extension !== "csv") return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: null, headers: [], preview: [], status: "warning", messages: [...messages, "Nội dung Excel sẽ được kiểm tra đầy đủ khi bắt đầu xử lý dữ liệu."] };

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: Math.max(0, lines.length - 1), headers: lines[0]?.split(",") ?? [], preview: [], status: "invalid", messages: [...messages, "CSV cần có header và ít nhất một dòng dữ liệu."] };
  const delimiter = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((item) => item.trim());
  const normalizedHeaders = headers.map(normalizeDatasetHeader);
  const hasTimestamp = normalizedHeaders.some((item) => ["timestamp", "time", "datetime", "date_time", "thoi_gian"].includes(item));
  const hasDayIndexStep = normalizedHeaders.includes("day_index") && normalizedHeaders.includes("step");
  const hasDateStep = normalizedHeaders.some((item) => ["date_iso", "date"].includes(item)) && normalizedHeaders.includes("step");
  const hasIndexedTime = hasDayIndexStep || hasDateStep;
  const hasLoadValue = normalizedHeaders.some((item) => ["p_load_kw", "load_kw", "p_load", "load", "demand", "cong_suat"].includes(item));
  const hasPvValue = normalizedHeaders.some((item) => ["p_pv_kw", "pv_kw", "p_pv", "pv", "pv_power", "solar_kw"].includes(item));
  const hasGenericValue = normalizedHeaders.some((item) => ["value", "kw", "kwh", "power", "energy", "dien_nang"].includes(item));
  const hasTime = hasTimestamp || hasIndexedTime;
  const hasValue = hasLoadValue || hasPvValue || hasGenericValue;
  if (!hasTime) messages.push("Không nhận diện được timestamp hoặc cặp day_index + step.");
  if (!hasValue) messages.push("Không nhận diện được cột công suất/điện năng phổ biến.");
  if (hasDayIndexStep) messages.push("Đã nhận diện định dạng EMS: day_index + step, 96 bước/ngày.");
  if (hasDateStep) messages.push("Đã nhận diện định dạng EMS: date_iso + step, 96 bước/ngày.");
  if (hasLoadValue && hasPvValue) messages.push("File chứa đồng thời P_load_kW và P_pv_kW; hệ thống sẽ tự tách Load/PV.");
  const preview = lines.slice(1, 6).map((line) => line.split(delimiter).map((item) => item.trim()));
  const inconsistent = preview.some((row) => row.length !== headers.length);
  if (inconsistent) messages.push("Một số dòng preview có số cột không khớp header.");
  const invalid = inconsistent || headers.length < 2 || !hasTime || !hasValue;
  return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: lines.length - 1, headers, preview, status: invalid ? "invalid" : "valid", messages: messages.length > 0 ? messages : ["Cấu trúc CSV hợp lệ ở bước kiểm tra sơ bộ."] };
}

function normalizeDatasetHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatFileSize(size: number) { return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`; }
function SelectField({ label, value, onChange, options, required }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean }) { return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label} {required ? <span className="text-red-500">*</span> : null}<select className="h-11 rounded-lg border border-brand-line bg-white px-4 text-sm font-medium outline-none focus:border-brand-blue" onChange={(event) => onChange(event.target.value)} required={required} value={value}>{options.map((option) => <option disabled={option === ""} key={option || "empty"} value={option}>{option || "Chọn giá trị"}</option>)}</select></label>; }
function NumberField({ label, unit, value, onChange }: { label: string; unit: string; value: number; onChange: (value: number) => void }) { return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label}<span className="grid grid-cols-[1fr_100px]"><input className="h-11 rounded-l-lg border border-r-0 border-brand-line px-4 text-right text-sm font-medium outline-none focus:border-brand-blue" min={0} step="any" onChange={(event) => onChange(Math.max(0, Number(event.target.value)))} type="number" value={value} /><span className="grid h-11 place-items-center rounded-r-lg border border-brand-line bg-slate-50 text-xs text-brand-muted">{unit}</span></span></label>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label}<input className="h-11 rounded-lg border border-brand-line bg-white px-4 text-sm font-medium outline-none focus:border-brand-blue" onChange={(event) => onChange(event.target.value)} type="text" value={value} /></label>; }
function ToggleCard({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) { return <button className={cn("grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border p-4 text-left", checked ? "border-brand-blue bg-blue-50" : "border-brand-line")} onClick={() => onChange(!checked)} type="button"><span><strong className="block text-sm text-brand-navy">{title}</strong><small className="mt-1 block text-xs font-medium text-brand-muted">{description}</small></span><span className={cn("h-6 w-11 rounded-full p-1", checked ? "bg-brand-blue" : "bg-slate-300")}><span className={cn("block size-4 rounded-full bg-white transition", checked && "translate-x-5")} /></span></button>; }
function formatUploadStatus(status: PersistentUploadStatus) {
  const labels: Record<PersistentUploadStatus, string> = {
    idle: "Chưa upload",
    inspecting: "Đang kiểm tra",
    uploading: "Đang upload",
    validating: "Đang tạo dataset",
    ready: "Dataset sẵn sàng",
    warning: "Dataset có cảnh báo",
    invalid: "Dataset không hợp lệ",
    failed: "Upload thất bại"
  };
  return labels[status];
}
function StatusBadge({ file, upload }: { file: FileInspection | null; upload?: PersistentUploadState }) { if (!file && upload?.datasetId) return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", upload.uploadStatus === "warning" ? "bg-amber-50 text-amber-700" : upload.uploadStatus === "invalid" || upload.uploadStatus === "failed" ? "bg-red-50 text-red-600" : "bg-green-50 text-brand-green")}>{formatUploadStatus(upload.uploadStatus)}</span>; if (!file) return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-brand-muted">Chưa có dữ liệu</span>; const label = file.status === "valid" ? "Hợp lệ" : file.status === "warning" ? "Có cảnh báo" : "Không hợp lệ"; return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", file.status === "valid" ? "bg-green-50 text-brand-green" : file.status === "warning" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600")}>{label}</span>; }
function QualityMetric({ label, value }: { label: string; value: string }) { return <span className="rounded-lg bg-slate-50 p-3"><small className="block text-xs font-semibold text-brand-muted">{label}</small><strong className="mt-1 block break-words text-sm text-brand-navy">{value}</strong></span>; }
function ReviewCard({ title, rows }: { title: string; rows: string[][] }) { return <Card className="rounded-xl p-4 shadow-none"><h3 className="flex items-center gap-2 font-bold text-brand-navy"><CheckCircle2 className="text-brand-green" size={19} />{title}</h3><div className="mt-3 grid gap-2">{rows.map(([label, value]) => <SummaryRow key={label} label={label} value={value} />)}</div></Card>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 text-sm"><span className="font-medium text-brand-muted">{label}</span><strong className="text-right text-brand-navy">{value}</strong></div>; }
