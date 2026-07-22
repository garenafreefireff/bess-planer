"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CloudUpload, FileSpreadsheet, Info, Settings2, ShieldCheck, Trash2, Upload, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buildSizingOptions, formatNumber } from "@/features/quick-sizing/data/quick-sizing-model";
import { useQuickSizingStore } from "@/features/quick-sizing/data/quick-sizing-store";

const steps = [
  [1, "Thông tin dự án", "Thiết lập thông tin cơ bản"],
  [2, "Upload phụ tải", "Tải dữ liệu bắt buộc"],
  [3, "Upload PV", "Dữ liệu tùy chọn"],
  [4, "Kiểm tra dữ liệu", "Xem chất lượng đầu vào"],
  [5, "Cấu hình mô hình", "Thiết lập tham số"],
  [6, "Xác nhận & chạy", "Kiểm tra trước phân tích"]
] as const;

type ProjectInfo = {
  name: string;
  location: string;
  industry: string;
  voltageLevel: string;
  timezone: string;
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

type ModelConfig = {
  objective: string;
  analysisYears: number;
  energyKwh: number;
  powerKw: number;
  optimizePeak: boolean;
  optimizeTou: boolean;
};

const draftKey = "energyinsight.bessPlanner.projectDraft.v1";

export function BessPlannerProjectWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const quickBasicInfo = useQuickSizingStore((state) => state.basicInfo);
  const quickAssumptions = useQuickSizingStore((state) => state.assumptions);
  const selectedOptionId = useQuickSizingStore((state) => state.selectedOptionId);
  const selectedQuickOption = useMemo(() => {
    const options = buildSizingOptions(quickAssumptions, quickBasicInfo);
    return options.find((option) => option.id === selectedOptionId) ?? options[1];
  }, [quickAssumptions, quickBasicInfo, selectedOptionId]);
  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<ProjectInfo>({ name: "", location: "", industry: "", voltageLevel: "", timezone: "UTC+07:00 Bangkok, Hanoi, Jakarta" });
  const [loadFile, setLoadFile] = useState<FileInspection | null>(null);
  const [pvFile, setPvFile] = useState<FileInspection | null>(null);
  const [config, setConfig] = useState<ModelConfig>({ objective: "Tối thiểu tổng chi phí vòng đời", analysisYears: 10, energyKwh: 1000, powerKw: 500, optimizePeak: true, optimizeTou: true });
  const [restored, setRestored] = useState(false);
  const suppressNextSave = useRef(false);

  useEffect(() => {
    if (source === "quick-sizing" && quickBasicInfo) {
      setCurrentStep(1);
      setProject({
        name: "",
        location: "",
        industry: quickBasicInfo.industry === "Khác" ? quickBasicInfo.customIndustry || "Khác" : quickBasicInfo.industry,
        voltageLevel: quickBasicInfo.voltageLevel,
        timezone: "UTC+07:00 Bangkok, Hanoi, Jakarta"
      });
      setLoadFile(null);
      setPvFile(null);
      setConfig({
        objective: "Tối thiểu tổng chi phí vòng đời",
        analysisYears: quickAssumptions.analysisYears,
        energyKwh: selectedQuickOption.energyKwh,
        powerKw: selectedQuickOption.powerKw,
        optimizePeak: quickBasicInfo.bessObjectives.includes("peak_shaving"),
        optimizeTou: quickBasicInfo.bessObjectives.includes("saving")
      });
      setRestored(true);
      return;
    }

    const raw = window.localStorage.getItem(draftKey);
    if (raw) {
      try {
        const draft = JSON.parse(raw) as { project?: ProjectInfo; loadFile?: FileInspection | null; pvFile?: FileInspection | null; config?: ModelConfig; currentStep?: number };
        if (draft.project) setProject(draft.project);
        if (draft.loadFile) setLoadFile(draft.loadFile);
        if (draft.pvFile) setPvFile(draft.pvFile);
        if (draft.config) setConfig(draft.config);
        if (draft.currentStep) setCurrentStep(Math.min(6, Math.max(1, draft.currentStep)));
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
    window.localStorage.setItem(draftKey, JSON.stringify({ project, loadFile, pvFile, config, currentStep, source, selectedOptionId }));
  }, [config, currentStep, loadFile, project, pvFile, restored, selectedOptionId, source]);

  const stepValidity = useMemo(() => ({
    1: Boolean(project.name.trim() && project.location.trim() && project.industry.trim() && project.voltageLevel.trim()),
    2: Boolean(loadFile && loadFile.status !== "invalid"),
    3: true,
    4: Boolean(loadFile && loadFile.status !== "invalid"),
    5: config.energyKwh > 0 && config.powerKw > 0 && config.analysisYears > 0,
    6: Boolean(loadFile && loadFile.status !== "invalid")
  }), [config, loadFile, project]);

  const goNext = () => {
    if (!stepValidity[currentStep as keyof typeof stepValidity]) return;
    if (currentStep < 6) setCurrentStep((step) => step + 1);
  };

  const finish = () => {
    if (!stepValidity[6]) return;
    window.localStorage.setItem("energyinsight.bessPlanner.lastProject.v1", JSON.stringify({ project, loadFile, pvFile, config, source, selectedOptionId, createdAt: Date.now() }));
    router.push("/customer-portal/du-an-cua-toi/ket-qua");
  };

  const clearDraft = () => {
    if (!window.confirm("Xóa toàn bộ bản nháp dự án đang nhập?")) return;
    suppressNextSave.current = true;
    window.localStorage.removeItem(draftKey);
    setCurrentStep(1);
    setProject({ name: "", location: "", industry: "", voltageLevel: "", timezone: "UTC+07:00 Bangkok, Hanoi, Jakarta" });
    setLoadFile(null);
    setPvFile(null);
    setConfig({ objective: "Tối thiểu tổng chi phí vòng đời", analysisYears: 10, energyKwh: 1000, powerKw: 500, optimizePeak: true, optimizeTou: true });
  };

  return (
    <main className="w-full pb-8 pt-7">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-muted"><span>Customer Portal</span><ArrowRight size={14} /><span>Dự án của tôi</span><ArrowRight size={14} /><span className="text-brand-navy">Tạo dự án</span></div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-[34px] font-bold text-brand-navy">Tạo dự án BESS Planner</h1><p className="mt-2 text-sm font-medium text-brand-muted">Hoàn thành sáu bước để chuẩn bị bộ dữ liệu và cấu hình phân tích.</p></div><div className="flex flex-wrap items-center gap-3">{source === "quick-sizing" ? <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-brand-green">Đã kế thừa cấu hình từ Quick Sizing</span> : null}<button className={buttonVariants({ variant: "secondary", size: "sm" })} onClick={clearDraft} type="button"><Trash2 size={16} />Xóa bản nháp</button></div></div>

      <WizardStepper currentStep={currentStep} validSteps={stepValidity} onStep={setCurrentStep} />

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-5 max-xl:grid-cols-1">
        <Card className="rounded-xl bg-white p-5 shadow-panel">
          {currentStep === 1 ? <ProjectInfoStep value={project} onChange={setProject} /> : null}
          {currentStep === 2 ? <UploadStep title="Dữ liệu phụ tải" required description="Tải file CSV chứa timestamp và công suất/điện năng. CSV được kiểm tra trực tiếp trên trình duyệt." file={loadFile} onFile={setLoadFile} /> : null}
          {currentStep === 3 ? <UploadStep title="Dữ liệu điện mặt trời" description="Bỏ qua bước này nếu dự án chưa có hệ thống PV hoặc chưa có chuỗi dữ liệu thực tế." file={pvFile} onFile={setPvFile} /> : null}
          {currentStep === 4 ? <QualityStep loadFile={loadFile} pvFile={pvFile} /> : null}
          {currentStep === 5 ? <ModelConfigStep value={config} onChange={setConfig} /> : null}
          {currentStep === 6 ? <ReviewStep project={project} loadFile={loadFile} pvFile={pvFile} config={config} /> : null}
        </Card>
        <WizardSidebar currentStep={currentStep} project={project} loadFile={loadFile} config={config} />
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-brand-line bg-white p-3 shadow-panel max-md:grid-cols-1">
        <button className={buttonVariants({ variant: "secondary", className: "h-11" })} disabled={currentStep === 1} onClick={() => setCurrentStep((step) => Math.max(1, step - 1))} type="button"><ArrowLeft size={17} />Quay lại</button>
        <span className="text-center text-sm font-semibold text-brand-muted">Bước {currentStep}/6 · Dữ liệu được lưu nháp trên trình duyệt</span>
        {currentStep < 6 ? <button className={buttonVariants({ className: "h-11 px-7" })} disabled={!stepValidity[currentStep as keyof typeof stepValidity]} onClick={goNext} type="button">Tiếp tục<ArrowRight size={18} /></button> : <button className={buttonVariants({ variant: "green", className: "h-11 px-7" })} disabled={!stepValidity[6]} onClick={finish} type="button"><Zap size={18} />Chạy phân tích demo</button>}
      </div>
    </main>
  );
}

function WizardStepper({ currentStep, validSteps, onStep }: { currentStep: number; validSteps: { 1: boolean; 2: boolean; 3: boolean; 4: boolean; 5: boolean; 6: boolean }; onStep: (step: number) => void }) {
  return <Card className="mt-4 overflow-x-auto rounded-xl bg-white p-3 shadow-panel"><div className="grid min-w-[1040px] grid-cols-[repeat(6,minmax(150px,1fr))] gap-2">{steps.map(([number, title, description]) => { const active = number === currentStep; const completed = number < currentStep && validSteps[number]; const accessible = number <= currentStep || (number === currentStep + 1 && validSteps[currentStep as keyof typeof validSteps]); return <button className={cn("grid grid-cols-[36px_1fr] items-center gap-2 rounded-lg border p-2.5 text-left", active ? "border-brand-blue bg-blue-50" : completed ? "border-green-100 bg-green-50/50" : "border-brand-line bg-white", !accessible && "cursor-not-allowed opacity-60")} disabled={!accessible} key={number} onClick={() => onStep(number)} type="button"><span className={cn("grid size-8 place-items-center rounded-full text-sm font-bold", active ? "bg-brand-blue text-white" : completed ? "bg-brand-green text-white" : "bg-slate-100 text-brand-muted")}>{completed ? <Check size={17} /> : number}</span><span><strong className="block text-xs text-brand-navy">{title}</strong><small className="mt-0.5 block text-[11px] font-medium text-brand-muted">{description}</small></span></button>; })}</div></Card>;
}

function ProjectInfoStep({ value, onChange }: { value: ProjectInfo; onChange: (value: ProjectInfo) => void }) {
  return <section><h2 className="text-xl font-bold text-brand-navy">1. Thông tin dự án</h2><p className="mt-2 text-sm font-medium text-brand-muted">Các trường bắt buộc phải hoàn thành trước khi tải dữ liệu.</p><div className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1"><TextField label="Tên dự án" required value={value.name} onChange={(name) => onChange({ ...value, name })} placeholder="Ví dụ: Nhà máy ABC - Bình Dương" /><TextField label="Địa điểm" required value={value.location} onChange={(location) => onChange({ ...value, location })} placeholder="Tỉnh/thành phố" /><TextField label="Ngành sản xuất" required value={value.industry} onChange={(industry) => onChange({ ...value, industry })} placeholder="Ví dụ: Dệt may" /><SelectField label="Cấp điện áp" required value={value.voltageLevel} onChange={(voltageLevel) => onChange({ ...value, voltageLevel })} options={["", "Hạ áp", "Trung áp", "Cao áp", "Chưa xác định"]} /><SelectField label="Múi giờ" required value={value.timezone} onChange={(timezone) => onChange({ ...value, timezone })} options={["UTC+07:00 Bangkok, Hanoi, Jakarta", "UTC+08:00 Singapore, Kuala Lumpur", "UTC+09:00 Tokyo, Seoul"]} /></div></section>;
}

function UploadStep({ title, description, required, file, onFile }: { title: string; description: string; required?: boolean; file: FileInspection | null; onFile: (file: FileInspection | null) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);

  const inspect = async (nextFile?: File | null) => {
    if (!nextFile) return;
    setReading(true);
    onFile(await inspectFile(nextFile));
    setReading(false);
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); void inspect(event.dataTransfer.files.item(0)); };

  return <section><h2 className="text-xl font-bold text-brand-navy">{title} {required ? <span className="text-red-500">*</span> : null}</h2><p className="mt-2 text-sm font-medium text-brand-muted">{description}</p><div className={cn("mt-5 grid min-h-[220px] place-items-center rounded-xl border-2 border-dashed text-center", dragging ? "border-brand-blue bg-blue-50" : "border-blue-200 bg-slate-50/50")} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><div><CloudUpload className="mx-auto text-brand-blue" size={46} /><p className="mt-3 text-sm font-semibold text-brand-navy">Kéo thả CSV/XLSX vào đây</p><p className="mt-1 text-xs font-medium text-brand-muted">CSV sẽ được preview; XLSX chỉ kiểm tra tên và kích thước ở frontend.</p><input accept=".csv,.xlsx,.xls" className="hidden" ref={inputRef} type="file" onChange={(event) => void inspect(event.target.files?.item(0))} /><button className={buttonVariants({ className: "mt-4 h-10" })} disabled={reading} onClick={() => inputRef.current?.click()} type="button"><Upload size={17} />{reading ? "Đang kiểm tra..." : "Chọn file"}</button></div></div>{file ? <FileResult file={file} onRemove={() => { onFile(null); if (inputRef.current) inputRef.current.value = ""; }} /> : <div className="mt-4 rounded-lg border border-dashed border-brand-line p-4 text-sm font-medium text-brand-muted">Chưa có file được chọn.</div>}</section>;
}

function FileResult({ file, onRemove }: { file: FileInspection; onRemove: () => void }) {
  return <div className={cn("mt-4 rounded-xl border p-4", file.status === "valid" ? "border-green-100 bg-green-50/50" : file.status === "warning" ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50")}><div className="grid grid-cols-[42px_1fr_auto] items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-white text-brand-blue"><FileSpreadsheet size={22} /></span><span><strong className="block text-sm text-brand-navy">{file.name}</strong><small className="font-medium text-brand-muted">{file.sizeLabel} · {file.extension.toUpperCase()} · {file.rowCount === null ? "Chưa đếm dòng" : `${formatNumber(file.rowCount, 0)} dòng dữ liệu`}</small></span><button aria-label="Xóa file" className="text-brand-muted hover:text-red-500" onClick={onRemove} type="button"><Trash2 size={19} /></button></div><div className="mt-3 grid gap-1 text-xs font-medium">{file.messages.map((message) => <span key={message}>• {message}</span>)}</div>{file.preview.length > 0 ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-xs"><thead><tr className="bg-white">{file.headers.map((header) => <th className="border border-brand-line px-3 py-2 text-left" key={header}>{header || "(trống)"}</th>)}</tr></thead><tbody>{file.preview.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td className="border border-brand-line bg-white px-3 py-2" key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div> : null}</div>;
}

function QualityStep({ loadFile, pvFile }: { loadFile: FileInspection | null; pvFile: FileInspection | null }) {
  const files = [["Phụ tải", loadFile], ["Điện mặt trời", pvFile]] as const;
  return <section><h2 className="text-xl font-bold text-brand-navy">4. Kiểm tra chất lượng dữ liệu</h2><p className="mt-2 text-sm font-medium text-brand-muted">Các kiểm tra dưới đây được thực hiện cục bộ trên trình duyệt và chưa thay thế bộ kiểm tra dữ liệu phía máy chủ.</p><div className="mt-5 grid gap-4">{files.map(([label, file]) => <Card className="rounded-xl p-4 shadow-none" key={label}><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold text-brand-navy"><ShieldCheck className="text-brand-blue" size={20} />{label}</h3><StatusBadge file={file} /></div>{file ? <div className="mt-4 grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1"><QualityMetric label="Tên file" value={file.name} /><QualityMetric label="Số dòng" value={file.rowCount === null ? "Chưa xác định" : formatNumber(file.rowCount, 0)} /><QualityMetric label="Số cột" value={formatNumber(file.headers.length, 0)} /><QualityMetric label="Định dạng" value={file.extension.toUpperCase()} /></div> : <p className="mt-4 text-sm font-medium text-brand-muted">{label === "Điện mặt trời" ? "Không có file PV; bước này là tùy chọn." : "Chưa có file phụ tải."}</p>}{file?.messages.length ? <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs font-medium leading-5 text-brand-muted">{file.messages.map((message) => <p key={message}>• {message}</p>)}</div> : null}</Card>)}</div></section>;
}

function ModelConfigStep({ value, onChange }: { value: ModelConfig; onChange: (value: ModelConfig) => void }) {
  return <section><h2 className="text-xl font-bold text-brand-navy">5. Cấu hình mô hình</h2><p className="mt-2 text-sm font-medium text-brand-muted">Cấu hình này được lưu cùng bản nháp và sẽ đi theo dự án sang màn hình kết quả demo.</p><div className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1"><SelectField label="Mục tiêu tối ưu" required value={value.objective} onChange={(objective) => onChange({ ...value, objective })} options={["Tối thiểu tổng chi phí vòng đời", "Tối đa NPV", "Tối thiểu Pmax hợp đồng", "Tối đa tỷ lệ tự dùng PV"]} /><SelectField label="Thời hạn phân tích" required value={String(value.analysisYears)} onChange={(analysisYears) => onChange({ ...value, analysisYears: Number(analysisYears) })} options={["5", "10", "15"]} /><NumberField label="Dung lượng tham chiếu" unit="kWh" value={value.energyKwh} onChange={(energyKwh) => onChange({ ...value, energyKwh })} /><NumberField label="Công suất tham chiếu" unit="kW" value={value.powerKw} onChange={(powerKw) => onChange({ ...value, powerKw })} /></div><div className="mt-5 grid grid-cols-2 gap-3 max-md:grid-cols-1"><ToggleCard title="Tối ưu Peak Shaving" description="Đưa chi phí công suất và Pmax vào mục tiêu." checked={value.optimizePeak} onChange={(optimizePeak) => onChange({ ...value, optimizePeak })} /><ToggleCard title="Tối ưu biểu giá TOU" description="Dịch chuyển năng lượng giữa thấp điểm và cao điểm." checked={value.optimizeTou} onChange={(optimizeTou) => onChange({ ...value, optimizeTou })} /></div></section>;
}

function ReviewStep({ project, loadFile, pvFile, config }: { project: ProjectInfo; loadFile: FileInspection | null; pvFile: FileInspection | null; config: ModelConfig }) {
  return <section><h2 className="text-xl font-bold text-brand-navy">6. Xác nhận trước khi chạy</h2><p className="mt-2 text-sm font-medium text-brand-muted">Kiểm tra lại dữ liệu. Nút chạy hiện tạo kết quả demo trên frontend và chưa gửi file ra ngoài.</p><div className="mt-5 grid grid-cols-2 gap-4 max-lg:grid-cols-1"><ReviewCard title="Dự án" rows={[["Tên", project.name], ["Địa điểm", project.location], ["Ngành", project.industry], ["Điện áp", project.voltageLevel]]} /><ReviewCard title="Dữ liệu" rows={[["Phụ tải", loadFile?.name || "Chưa có"], ["Trạng thái", loadFile?.status || "Chưa kiểm tra"], ["PV", pvFile?.name || "Không sử dụng"]]} /><ReviewCard title="Cấu hình" rows={[["Mục tiêu", config.objective], ["Thời hạn", `${config.analysisYears} năm`], ["Sizing tham chiếu", `${formatNumber(config.powerKw, 0)} kW / ${formatNumber(config.energyKwh, 0)} kWh`], ["Peak shaving", config.optimizePeak ? "Có" : "Không"], ["TOU", config.optimizeTou ? "Có" : "Không"]]} /></div><div className="mt-5 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium leading-6 text-brand-blue"><Info className="shrink-0" size={20} /><span>Frontend sẽ lưu snapshot dự án vào localStorage rồi mở màn hình kết quả. Không có file nào được upload lên máy chủ trong phiên bản này.</span></div></section>;
}

function WizardSidebar({ currentStep, project, loadFile, config }: { currentStep: number; project: ProjectInfo; loadFile: FileInspection | null; config: ModelConfig }) {
  return <aside className="sticky top-24 h-fit"><Card className="rounded-xl bg-white p-5 shadow-panel"><h2 className="text-lg font-bold text-brand-navy">Tóm tắt dự án</h2><div className="mt-4 grid gap-3"><SummaryRow label="Bước hiện tại" value={`${currentStep}/6`} /><SummaryRow label="Tên dự án" value={project.name || "Chưa nhập"} /><SummaryRow label="Phụ tải" value={loadFile?.name || "Chưa có file"} /><SummaryRow label="Cấu hình" value={`${formatNumber(config.powerKw, 0)} kW / ${formatNumber(config.energyKwh, 0)} kWh`} /><SummaryRow label="Thời hạn" value={`${config.analysisYears} năm`} /></div><div className="mt-5 rounded-xl bg-blue-50 p-4 text-xs font-medium leading-5 text-brand-muted"><Settings2 className="mb-2 text-brand-blue" size={20} />Dữ liệu nháp được lưu trên trình duyệt để có thể tiếp tục sau khi tải lại trang.</div></Card></aside>;
}

async function inspectFile(file: File): Promise<FileInspection> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const messages: string[] = [];
  const allowed = ["csv", "xlsx", "xls"];
  if (!allowed.includes(extension)) return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: null, headers: [], preview: [], status: "invalid", messages: ["Định dạng không được hỗ trợ. Chỉ chấp nhận CSV/XLSX/XLS."] };
  if (file.size === 0) return { name: file.name, sizeLabel: "0 KB", extension, rowCount: 0, headers: [], preview: [], status: "invalid", messages: ["File rỗng."] };
  if (file.size > 50 * 1024 * 1024) {
    return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: null, headers: [], preview: [], status: "warning", messages: ["File lớn hơn 50 MB nên frontend không đọc toàn bộ nội dung. Hãy chia nhỏ file hoặc kiểm tra bằng dịch vụ xử lý dữ liệu."] };
  }
  if (extension !== "csv") return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: null, headers: [], preview: [], status: "warning", messages: [...messages, "Frontend chưa đọc nội dung Excel; file sẽ cần được kiểm tra đầy đủ khi tích hợp dịch vụ xử lý dữ liệu."] };

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: Math.max(0, lines.length - 1), headers: lines[0]?.split(",") ?? [], preview: [], status: "invalid", messages: [...messages, "CSV cần có header và ít nhất một dòng dữ liệu."] };
  const delimiter = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((item) => item.trim());
  const normalizedHeaders = headers.map((item) => item.toLowerCase());
  const hasTime = normalizedHeaders.some((item) => ["timestamp", "time", "datetime", "date_time", "thoi_gian"].includes(item));
  const hasValue = normalizedHeaders.some((item) => ["value", "kw", "kwh", "power", "energy", "cong_suat", "dien_nang"].includes(item));
  if (!hasTime) messages.push("Không nhận diện được cột thời gian phổ biến.");
  if (!hasValue) messages.push("Không nhận diện được cột công suất/điện năng phổ biến.");
  const preview = lines.slice(1, 6).map((line) => line.split(delimiter).map((item) => item.trim()));
  const inconsistent = preview.some((row) => row.length !== headers.length);
  if (inconsistent) messages.push("Một số dòng preview có số cột không khớp header.");
  const invalid = inconsistent || headers.length < 2;
  return { name: file.name, sizeLabel: formatFileSize(file.size), extension, rowCount: lines.length - 1, headers, preview, status: invalid ? "invalid" : messages.length > 0 ? "warning" : "valid", messages: messages.length > 0 ? messages : ["Cấu trúc CSV hợp lệ ở mức kiểm tra frontend."] };
}

function formatFileSize(size: number) { return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`; }
function TextField({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) { return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label} {required ? <span className="text-red-500">*</span> : null}<input className="h-11 rounded-lg border border-brand-line px-4 text-sm font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} value={value} /></label>; }
function SelectField({ label, value, onChange, options, required }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean }) { return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label} {required ? <span className="text-red-500">*</span> : null}<select className="h-11 rounded-lg border border-brand-line bg-white px-4 text-sm font-medium outline-none focus:border-brand-blue" onChange={(event) => onChange(event.target.value)} required={required} value={value}>{options.map((option) => <option disabled={option === ""} key={option || "empty"} value={option}>{option || "Chọn giá trị"}</option>)}</select></label>; }
function NumberField({ label, unit, value, onChange }: { label: string; unit: string; value: number; onChange: (value: number) => void }) { return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label}<span className="grid grid-cols-[1fr_100px]"><input className="h-11 rounded-l-lg border border-r-0 border-brand-line px-4 text-right text-sm font-medium outline-none focus:border-brand-blue" min={1} onChange={(event) => onChange(Math.max(1, Number(event.target.value)))} type="number" value={value} /><span className="grid h-11 place-items-center rounded-r-lg border border-brand-line bg-slate-50 text-xs text-brand-muted">{unit}</span></span></label>; }
function ToggleCard({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) { return <button className={cn("grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border p-4 text-left", checked ? "border-brand-blue bg-blue-50" : "border-brand-line")} onClick={() => onChange(!checked)} type="button"><span><strong className="block text-sm text-brand-navy">{title}</strong><small className="mt-1 block text-xs font-medium text-brand-muted">{description}</small></span><span className={cn("h-6 w-11 rounded-full p-1", checked ? "bg-brand-blue" : "bg-slate-300")}><span className={cn("block size-4 rounded-full bg-white transition", checked && "translate-x-5")} /></span></button>; }
function StatusBadge({ file }: { file: FileInspection | null }) { if (!file) return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-brand-muted">Chưa có dữ liệu</span>; const label = file.status === "valid" ? "Hợp lệ" : file.status === "warning" ? "Có cảnh báo" : "Không hợp lệ"; return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", file.status === "valid" ? "bg-green-50 text-brand-green" : file.status === "warning" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600")}>{label}</span>; }
function QualityMetric({ label, value }: { label: string; value: string }) { return <span className="rounded-lg bg-slate-50 p-3"><small className="block text-xs font-semibold text-brand-muted">{label}</small><strong className="mt-1 block break-words text-sm text-brand-navy">{value}</strong></span>; }
function ReviewCard({ title, rows }: { title: string; rows: string[][] }) { return <Card className="rounded-xl p-4 shadow-none"><h3 className="flex items-center gap-2 font-bold text-brand-navy"><CheckCircle2 className="text-brand-green" size={19} />{title}</h3><div className="mt-3 grid gap-2">{rows.map(([label, value]) => <SummaryRow key={label} label={label} value={value} />)}</div></Card>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 text-sm"><span className="font-medium text-brand-muted">{label}</span><strong className="text-right text-brand-navy">{value}</strong></div>; }
