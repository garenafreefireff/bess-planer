"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Info,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, FieldErrors, Path, useForm, type UseFormRegisterReturn } from "react-hook-form";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { quickSizingApi, readQuickSizingApiError } from "../api/quick-sizing.api";
import {
  backupDurationOptions,
  bessObjectiveOptions,
  budgetRangeOptions,
  estimatedLoadRangeOptions,
  exportPolicyOptions,
  industryOptions,
  QUICK_SIZING_DRAFT_KEY,
  quickBillSuggestions,
  sampleQuickSizingStep1,
  shiftPatternOptions,
  solarCapacityUnitOptions,
  solarGenerationUnitOptions,
  solarObjectiveOptions,
  solarStatusOptions,
  summaryIcons,
  supportSteps,
  voltageLevelOptions
} from "../data/quick-sizing-step1-config";
import {
  defaultQuickSizingStep1Values,
  quickSizingStep1Schema,
  sanitizeQuickSizingStep1Payload,
  type QuickSizingStep1FormValues
} from "../data/quick-sizing-step1-schema";
import { useQuickSizingStore } from "../data/quick-sizing-store";
import { stepperItems } from "../data/quick-sizing-content";

const draftExpiryMs = 1000 * 60 * 60 * 24 * 14;

export function QuickSizingContent() {
  const router = useRouter();
  const storedBasicInfo = useQuickSizingStore((state) => state.basicInfo);
  const setBasicInfo = useQuickSizingStore((state) => state.setBasicInfo);
  const clearFlow = useQuickSizingStore((state) => state.clearFlow);
  const hasRestoredDraft = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    clearErrors,
    control,
    formState: { errors, isSubmitted },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch
  } = useForm<QuickSizingStep1FormValues>({
    defaultValues: defaultQuickSizingStep1Values,
    mode: "onBlur",
    resolver: zodResolver(quickSizingStep1Schema),
    shouldFocusError: true
  });

  const values = watch();
  const selectedObjectives = values.bessObjectives ?? [];
  const showSolarFields = values.solarStatus === "yes" || values.solarStatus === "planned";
  const showBackupFields = selectedObjectives.includes("backup");
  const showPeakFields = selectedObjectives.includes("peak_shaving");
  const showSolarWarning = selectedObjectives.includes("solar_optimization") && values.solarStatus === "none";

  useEffect(() => {
    if (hasRestoredDraft.current || typeof window === "undefined") {
      return;
    }

    hasRestoredDraft.current = true;
    const rawDraft = window.localStorage.getItem(QUICK_SIZING_DRAFT_KEY);
    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as { savedAt?: number; values?: QuickSizingStep1FormValues };
      if (!draft.savedAt || Date.now() - draft.savedAt > draftExpiryMs || !draft.values) {
        window.localStorage.removeItem(QUICK_SIZING_DRAFT_KEY);
        return;
      }

      const restoredValues = { ...defaultQuickSizingStep1Values, ...draft.values };
      reset(restoredValues);
      if (!storedBasicInfo) {
        setBasicInfo(restoredValues);
      }
      toast.info("Đã khôi phục thông tin từ lần nhập trước.");
    } catch {
      window.localStorage.removeItem(QUICK_SIZING_DRAFT_KEY);
    }
  }, [reset, setBasicInfo, storedBasicInfo]);

  useEffect(() => {
    const subscription = watch((currentValues) => {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(
        QUICK_SIZING_DRAFT_KEY,
        JSON.stringify({
          savedAt: Date.now(),
          values: currentValues
        })
      );
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  const submitStep = async (formValues: QuickSizingStep1FormValues) => {
    const payload = sanitizeQuickSizingStep1Payload(formValues);

    setIsSubmitting(true);
    try {
      const analysisRun = await quickSizingApi.createQuickSizingRun(payload);
      setBasicInfo(formValues, analysisRun);
      window.localStorage.setItem(
        QUICK_SIZING_DRAFT_KEY,
        JSON.stringify({
          savedAt: Date.now(),
          values: formValues,
          payload,
          analysisRunId: analysisRun.id,
          engineVersion: analysisRun.engine_version
        })
      );
      toast.success("Đã tạo bộ giả định ban đầu.");
      router.push("/quick-sizing/gia-dinh");
    } catch (error) {
      toast.error(readQuickSizingApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = (formErrors: FieldErrors<QuickSizingStep1FormValues>) => {
    toast.error("Vui lòng kiểm tra các thông tin còn thiếu.");
    const firstErrorName = findFirstErrorName(formErrors);
    if (!firstErrorName) {
      return;
    }

    const target = document.querySelector<HTMLElement>(`[name="${firstErrorName}"], [data-field="${firstErrorName}"]`);
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
    target?.focus();
  };

  const applySampleData = () => {
    reset(sampleQuickSizingStep1 as QuickSizingStep1FormValues);
    toast.success("Đã áp dụng dữ liệu mẫu. Anh/chị có thể chỉnh sửa trước khi tiếp tục.");
  };

  const clearForm = () => {
    if (!window.confirm("Toàn bộ dữ liệu đã nhập tại bước này sẽ bị xóa.")) {
      return;
    }

    reset(defaultQuickSizingStep1Values);
    clearFlow();
    window.localStorage.removeItem(QUICK_SIZING_DRAFT_KEY);
    toast.success("Đã xóa dữ liệu bước 1.");
  };

  const toggleObjective = (objective: string) => {
    const currentObjectives = getValues("bessObjectives") ?? [];
    const isSelected = currentObjectives.includes(objective);

    if (isSelected) {
      setValue(
        "bessObjectives",
        currentObjectives.filter((item) => item !== objective),
        { shouldDirty: true, shouldValidate: isSubmitted }
      );
      return;
    }

    if (currentObjectives.length >= 3) {
      setError("bessObjectives", { type: "manual", message: "Chỉ được chọn tối đa 3 mục tiêu" });
      return;
    }

    clearErrors("bessObjectives");
    setValue("bessObjectives", [...currentObjectives, objective], { shouldDirty: true, shouldValidate: isSubmitted });
  };

  return (
    <section className="mx-auto w-[min(1440px,calc(100%_-_40px))] pb-6 pt-5 max-sm:w-[min(100%_-_28px,640px)]">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-muted">
        <span>Trang chủ</span>
        <ArrowRight size={14} aria-hidden />
        <span className="text-brand-navy">Quick Sizing</span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_560px] items-end gap-6 max-xl:grid-cols-1">
        <div>
          <h1 className="text-[32px] font-bold leading-tight text-brand-navy">Ước tính nhanh hệ thống BESS</h1>
          <p className="mt-2 max-w-[760px] text-sm font-semibold leading-5 text-brand-muted">
            Cung cấp một số thông tin cơ bản để EnergyInsight xây dựng cấu hình BESS và bộ giả định ban đầu phù hợp với doanh nghiệp.
          </p>
        </div>
        <QuickSizingStepper />
      </div>

      <form className="mt-4 grid grid-cols-[minmax(0,2.25fr)_minmax(300px,0.75fr)] gap-5 max-lg:grid-cols-1" onSubmit={handleSubmit(submitStep, handleInvalidSubmit)}>
        <Card className="min-w-0 rounded-[14px] bg-white p-5 shadow-panel max-sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">Thông tin doanh nghiệp và nhu cầu sử dụng BESS</h2>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-brand-muted">
              Các thông tin này được dùng để tạo bộ giả định sơ bộ. Anh/chị có thể kiểm tra và điều chỉnh ở bước tiếp theo.
            </p>
          </div>

          <BusinessInformationSection errors={errors} register={register} values={values} />
          <ElectricityUsageSection control={control} errors={errors} register={register} setValue={setValue} values={values} />
          <SolarSystemSection control={control} errors={errors} register={register} setValue={setValue} showSolarFields={showSolarFields} values={values} />
          <BessObjectivesSection
            errors={errors}
            selectedObjectives={selectedObjectives}
            setValue={setValue}
            showBackupFields={showBackupFields}
            showPeakFields={showPeakFields}
            showSolarWarning={showSolarWarning}
            toggleObjective={toggleObjective}
            values={values}
          />
          <BudgetSection control={control} errors={errors} register={register} values={values} />

          <QuickSizingActionBar applySampleData={applySampleData} clearForm={clearForm} isSubmitting={isSubmitting} />
        </Card>

        <QuickSizingSummaryPanel values={values} />
      </form>
    </section>
  );
}

function QuickSizingStepper() {
  return (
    <div className="grid h-[72px] grid-cols-[auto_1fr_auto_1fr_auto] items-center rounded-lg border border-brand-line bg-white px-5 shadow-panel">
      {stepperItems.map((step, index) => (
        <Fragment key={step.number}>
          <div className="flex items-center gap-3">
            <span className={cn("grid size-8 place-items-center rounded-full text-base font-bold", step.active ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-navy/70")}>
              {step.number}
            </span>
            <span>
              <strong className={cn("block text-xs", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.title}</strong>
              <small className={cn("block text-xs font-bold", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.description}</small>
            </span>
          </div>
          {index < stepperItems.length - 1 ? <span className="mx-4 border-t-2 border-dashed border-blue-200" /> : null}
        </Fragment>
      ))}
    </div>
  );
}

function BusinessInformationSection({
  errors,
  register,
  values
}: {
  errors: FieldErrors<QuickSizingStep1FormValues>;
  register: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["register"];
  values: QuickSizingStep1FormValues;
}) {
  return (
    <FormSection description="Nhận diện loại hình vận hành để chọn mẫu phụ tải ban đầu phù hợp." title="A. Thông tin doanh nghiệp">
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <FormField error={errors.industry?.message} htmlFor="industry" label="Ngành hoạt động" required>
          <input
            className={inputClass(Boolean(errors.industry))}
            id="industry"
            list="industry-options"
            placeholder="Chọn ngành hoạt động"
            {...register("industry")}
          />
          <datalist id="industry-options">
            {industryOptions.map((option) => <option key={option} value={option} />)}
          </datalist>
        </FormField>
        <FormField
          error={errors.estimatedLoadRange?.message}
          htmlFor="estimatedLoadRange"
          label="Quy mô phụ tải ước tính"
          required
          tooltip="Công suất điện lớn nhất hoặc quy mô phụ tải mà doanh nghiệp đang sử dụng."
        >
          <SelectInput error={Boolean(errors.estimatedLoadRange)} id="estimatedLoadRange" options={estimatedLoadRangeOptions} placeholder="Chọn quy mô phụ tải" register={register("estimatedLoadRange")} />
        </FormField>
        {values.industry === "Khác" ? (
          <FormField error={errors.customIndustry?.message} htmlFor="customIndustry" label="Nhập ngành hoạt động" required>
            <input className={inputClass(Boolean(errors.customIndustry))} id="customIndustry" placeholder="Ví dụ: Trung tâm dữ liệu" {...register("customIndustry")} />
          </FormField>
        ) : null}
      </div>
    </FormSection>
  );
}

function ElectricityUsageSection({
  control,
  errors,
  register,
  setValue,
  values
}: {
  control: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["control"];
  errors: FieldErrors<QuickSizingStep1FormValues>;
  register: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["register"];
  setValue: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["setValue"];
  values: QuickSizingStep1FormValues;
}) {
  return (
    <FormSection description="Các thông tin này giúp hệ thống tạo đường cong phụ tải giả định tốt hơn." title="B. Đặc điểm sử dụng điện">
      <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Controller
          control={control}
          name="monthlyElectricityBillVnd"
          render={({ field }) => (
            <FormField error={errors.monthlyElectricityBillVnd?.message} htmlFor="monthlyElectricityBillVnd" label="Tiền điện trung bình mỗi tháng" required>
              <CurrencyInput
                error={Boolean(errors.monthlyElectricityBillVnd)}
                id="monthlyElectricityBillVnd"
                onChange={field.onChange}
                placeholder="Nhập số tiền"
                unit="VNĐ/tháng"
                value={field.value}
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {quickBillSuggestions.map((suggestion) => (
                  <button
                    className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand-blue hover:bg-blue-100"
                    key={suggestion.label}
                    onClick={() => setValue("monthlyElectricityBillVnd", suggestion.value, { shouldDirty: true, shouldValidate: true })}
                    type="button"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </FormField>
          )}
        />
        <FormField error={errors.voltageLevel?.message} htmlFor="voltageLevel" label="Cấp điện áp" required tooltip="Cấp điện áp ảnh hưởng tới biểu giá điện áp dụng.">
          <SelectInput error={Boolean(errors.voltageLevel)} id="voltageLevel" options={voltageLevelOptions} placeholder="Chọn cấp điện áp" register={register("voltageLevel")} />
        </FormField>
        <NumberWithUnitInput
          error={errors.operatingHoursPerDay?.message}
          label="Số giờ hoạt động mỗi ngày"
          max={24}
          min={1}
          name="operatingHoursPerDay"
          setValue={setValue}
          unit="giờ/ngày"
          value={values.operatingHoursPerDay}
        />
        <NumberWithUnitInput
          error={errors.operatingDaysPerWeek?.message}
          label="Số ngày hoạt động mỗi tuần"
          max={7}
          min={1}
          name="operatingDaysPerWeek"
          setValue={setValue}
          unit="ngày/tuần"
          value={values.operatingDaysPerWeek}
        />
        <FormField error={errors.shiftPattern?.message} htmlFor="shiftPattern" label="Đặc điểm ca vận hành" required>
          <SelectInput error={Boolean(errors.shiftPattern)} id="shiftPattern" options={shiftPatternOptions} placeholder="Chọn ca vận hành" register={register("shiftPattern")} />
        </FormField>
      </div>
    </FormSection>
  );
}

function SolarSystemSection({
  control,
  errors,
  register,
  setValue,
  showSolarFields,
  values
}: {
  control: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["control"];
  errors: FieldErrors<QuickSizingStep1FormValues>;
  register: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["register"];
  setValue: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["setValue"];
  showSolarFields: boolean;
  values: QuickSizingStep1FormValues;
}) {
  return (
    <FormSection title="C. Hệ thống điện mặt trời">
      <fieldset>
        <legend className="text-sm font-bold text-brand-navy">Doanh nghiệp hiện có hệ thống điện mặt trời không?</legend>
        <div className="mt-2.5 grid grid-cols-4 gap-2.5 max-md:grid-cols-2 max-sm:grid-cols-1">
          {solarStatusOptions.map((option) => (
            <RadioCard
              checked={values.solarStatus === option.value}
              key={option.value}
              label={option.label}
              name="solarStatus"
              onChange={() => setValue("solarStatus", option.value, { shouldDirty: true, shouldValidate: true })}
              value={option.value}
            />
          ))}
        </div>
      </fieldset>

      <div className={cn("grid overflow-hidden transition-all duration-300", showSolarFields ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="min-h-0">
          <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
            <Controller
              control={control}
              name="solarCapacityValue"
              render={({ field }) => (
                <FormField error={errors.solarCapacityValue?.message} htmlFor="solarCapacityValue" label="Công suất hệ thống điện mặt trời" required={values.solarStatus === "yes"}>
                  <NumberUnitGroup
                    error={Boolean(errors.solarCapacityValue)}
                    id="solarCapacityValue"
                    onChange={field.onChange}
                    unitOptions={solarCapacityUnitOptions}
                    unitRegister={register("solarCapacityUnit")}
                    value={field.value}
                  />
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="solarMonthlyGenerationValue"
              render={({ field }) => (
                <FormField error={errors.solarMonthlyGenerationValue?.message} htmlFor="solarMonthlyGenerationValue" label="Sản lượng điện mặt trời ước tính">
                  <NumberUnitGroup
                    error={Boolean(errors.solarMonthlyGenerationValue)}
                    id="solarMonthlyGenerationValue"
                    onChange={field.onChange}
                    unitOptions={solarGenerationUnitOptions}
                    unitRegister={register("solarMonthlyGenerationUnit")}
                    value={field.value}
                  />
                  <p className="mt-1 text-xs font-semibold text-brand-muted">Có thể để trống để hệ thống tự tạo giả định.</p>
                </FormField>
              )}
            />
            <FormField error={errors.exportPolicy?.message} htmlFor="exportPolicy" label="Cơ chế xử lý điện dư">
              <SelectInput error={Boolean(errors.exportPolicy)} id="exportPolicy" options={exportPolicyOptions} placeholder="Chọn cơ chế xử lý" register={register("exportPolicy")} />
            </FormField>
          </div>
          <div className="mt-4">
            <span className="text-sm font-bold text-brand-navy">Mục tiêu liên quan đến PV</span>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
              {solarObjectiveOptions.map((objective) => (
                <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border border-brand-line px-3 text-sm font-semibold text-brand-navy hover:border-brand-blue" key={objective}>
                  <input className="size-4 accent-brand-blue" type="checkbox" value={objective} {...register("solarObjectives")} />
                  {objective}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}

function BessObjectivesSection({
  errors,
  selectedObjectives,
  setValue,
  showBackupFields,
  showPeakFields,
  showSolarWarning,
  toggleObjective,
  values
}: {
  errors: FieldErrors<QuickSizingStep1FormValues>;
  selectedObjectives: string[];
  setValue: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["setValue"];
  showBackupFields: boolean;
  showPeakFields: boolean;
  showSolarWarning: boolean;
  toggleObjective: (objective: string) => void;
  values: QuickSizingStep1FormValues;
}) {
  return (
    <FormSection title="D. Mục tiêu đầu tư BESS">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-navy">Mục tiêu chính khi đầu tư BESS</h3>
          <p className="mt-1 text-xs font-semibold text-brand-muted">Chọn ít nhất 1 và tối đa 3 mục tiêu.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">Đã chọn {selectedObjectives.length}/3 mục tiêu</span>
      </div>
      <div data-field="bessObjectives" tabIndex={-1} className="mt-3 grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {bessObjectiveOptions.map((objective) => {
          const Icon = objective.icon;
          const isSelected = selectedObjectives.includes(objective.value);

          return (
            <SelectableOptionCard
              description={objective.description}
              icon={<Icon size={24} aria-hidden />}
              key={objective.value}
              onToggle={() => toggleObjective(objective.value)}
              selected={isSelected}
              title={objective.title}
            />
          );
        })}
      </div>
      {errors.bessObjectives?.message ? <FieldError message={errors.bessObjectives.message} /> : null}
      {showSolarWarning ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-[#FFF8E7] px-3 py-2 text-sm font-semibold text-amber-800">
          Mục tiêu này thường phù hợp với doanh nghiệp đang có hoặc dự kiến triển khai điện mặt trời.
        </div>
      ) : null}
      {showBackupFields ? (
        <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-blue-50/50 p-3 max-md:grid-cols-1">
          <NumberWithUnitInput
            error={errors.backupCriticalLoadPercent?.message}
            label="Tỷ lệ tải quan trọng cần duy trì"
            max={100}
            min={5}
            name="backupCriticalLoadPercent"
            setValue={setValue}
            unit="%"
            value={values.backupCriticalLoadPercent}
          />
          <FormField error={errors.backupDurationHours?.message} htmlFor="backupDurationHours" label="Thời gian dự phòng mong muốn" required>
            <select
              className={inputClass(Boolean(errors.backupDurationHours))}
              id="backupDurationHours"
              name="backupDurationHours"
              onChange={(event) => setValue("backupDurationHours", Number(event.target.value), { shouldDirty: true, shouldValidate: true })}
              value={values.backupDurationHours ?? ""}
            >
              <option value="" disabled>Chọn thời gian</option>
              {backupDurationOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
            </select>
          </FormField>
        </div>
      ) : null}
      {showPeakFields ? (
        <div className="mt-3 grid grid-cols-3 gap-4 rounded-lg bg-blue-50/50 p-3 max-xl:grid-cols-2 max-md:grid-cols-1">
          <NumberWithUnitInput
            error={errors.estimatedPeakDemandKw?.message}
            label="Công suất đỉnh ước tính"
            min={0}
            name="estimatedPeakDemandKw"
            setValue={setValue}
            unit="kW"
            value={values.estimatedPeakDemandKw}
          />
          <NumberWithUnitInput
            error={errors.targetPeakReductionValue?.message}
            label="Mức giảm Pmax mong muốn"
            min={0}
            name="targetPeakReductionValue"
            setValue={setValue}
            unit={values.targetPeakReductionType === "percent" ? "%" : "kW"}
            value={values.targetPeakReductionValue}
          />
          <FormField htmlFor="targetPeakReductionType" label="Loại mục tiêu giảm Pmax">
            <select className={inputClass(false)} id="targetPeakReductionType" value={values.targetPeakReductionType} onChange={(event) => setValue("targetPeakReductionType", event.target.value as "percent" | "kw", { shouldDirty: true })}>
              <option value="percent">Theo %</option>
              <option value="kw">Theo kW</option>
            </select>
          </FormField>
        </div>
      ) : null}
    </FormSection>
  );
}

function BudgetSection({
  control,
  errors,
  register,
  values
}: {
  control: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["control"];
  errors: FieldErrors<QuickSizingStep1FormValues>;
  register: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["register"];
  values: QuickSizingStep1FormValues;
}) {
  return (
    <FormSection description="Ngân sách chỉ được sử dụng để giới hạn phạm vi cấu hình đề xuất, không phải báo giá chính thức." title="E. Ngân sách đầu tư">
      <div className="grid grid-cols-4 gap-2.5 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {budgetRangeOptions.map((option) => (
          <RadioCard key={option} checked={values.budgetRange === option} label={option} name="budgetRange" register={register("budgetRange")} value={option} />
        ))}
      </div>
      {values.budgetRange === "Nhập ngân sách tùy chỉnh" ? (
        <div className="mt-3 max-w-md">
          <Controller
            control={control}
            name="customBudgetVnd"
            render={({ field }) => (
              <FormField error={errors.customBudgetVnd?.message} htmlFor="customBudgetVnd" label="Ngân sách tùy chỉnh">
                <CurrencyInput error={Boolean(errors.customBudgetVnd)} id="customBudgetVnd" onChange={field.onChange} placeholder="Nhập ngân sách" unit="VNĐ" value={field.value} />
              </FormField>
            )}
          />
        </div>
      ) : null}
    </FormSection>
  );
}

function QuickSizingSummaryPanel({ values }: { values: QuickSizingStep1FormValues }) {
  const objectiveLabels = useMemo(
    () => values.bessObjectives?.map((value) => bessObjectiveOptions.find((option) => option.value === value)?.title ?? value).join(", "),
    [values.bessObjectives]
  );

  const rows = [
    { key: "industry", label: "Ngành", value: values.industry === "Khác" ? values.customIndustry : values.industry },
    { key: "estimatedLoadRange", label: "Quy mô phụ tải", value: values.estimatedLoadRange },
    { key: "monthlyElectricityBillVnd", label: "Tiền điện/tháng", value: values.monthlyElectricityBillVnd ? formatCurrency(values.monthlyElectricityBillVnd) : "" },
    { key: "solarStatus", label: "Điện mặt trời", value: solarStatusOptions.find((option) => option.value === values.solarStatus)?.label },
    { key: "bessObjectives", label: "Mục tiêu", value: objectiveLabels },
    { key: "budgetRange", label: "Ngân sách", value: values.budgetRange === "Nhập ngân sách tùy chỉnh" ? formatCurrency(values.customBudgetVnd) : values.budgetRange }
  ];

  return (
    <aside className="sticky top-20 h-fit min-w-0 rounded-[14px] border border-brand-line bg-white p-4 shadow-panel max-lg:static">
      <h2 className="text-base font-bold text-brand-navy">Thông tin sẽ được sử dụng như thế nào?</h2>
      <div className="mt-3 grid gap-2">
        {supportSteps.map(({ icon: Icon, title }, index) => (
          <div className="grid grid-cols-[28px_1fr] items-center gap-2.5 text-sm font-semibold text-brand-navy" key={title}>
            <span className="grid size-7 place-items-center rounded-full bg-blue-50 text-brand-blue">
              <Icon size={15} aria-hidden />
            </span>
            <span>{index + 1}. {title}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-blue-50/60 p-3">
        <h3 className="text-sm font-bold text-brand-navy">Tóm tắt dữ liệu đã nhập</h3>
        <div className="mt-2.5 grid gap-2.5">
          {rows.map((row) => {
            const Icon = summaryIcons[row.key as keyof typeof summaryIcons] ?? summaryIcons.fallback;
            return (
              <div className="grid grid-cols-[20px_1fr] gap-2 text-sm" key={row.key}>
                <Icon className="text-brand-blue" size={15} aria-hidden />
                <span className="grid gap-0.5">
                  <span className="font-semibold text-brand-muted">{row.label}</span>
                  <strong className="font-bold text-brand-navy">{row.value || "Chưa cung cấp"}</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 grid gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-semibold leading-5 text-brand-muted">
        <span className="grid grid-cols-[18px_1fr] gap-2">
          <Info className="mt-0.5 text-brand-blue" size={16} aria-hidden />
          <span>Kết quả Quick Sizing là ước tính sơ bộ, không thay thế thiết kế kỹ thuật hoặc tư vấn đầu tư chính thức.</span>
        </span>
        <span className="grid grid-cols-[18px_1fr] gap-2">
          <ShieldCheck className="mt-0.5 text-brand-green" size={16} aria-hidden />
          <span>Dữ liệu chỉ dùng để tạo kết quả cho phiên làm việc này.</span>
        </span>
      </div>
    </aside>
  );
}

function QuickSizingActionBar({
  applySampleData,
  clearForm,
  isSubmitting
}: {
  applySampleData: () => void;
  clearForm: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-5 grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-t border-brand-line bg-white/95 px-5 py-3 backdrop-blur max-md:grid-cols-1">
      <button className={buttonVariants({ variant: "secondary", className: "h-10 border-brand-line text-brand-navy" })} onClick={clearForm} type="button">
        <Trash2 size={17} />
        Xóa toàn bộ
      </button>
      <button className={buttonVariants({ variant: "secondary", className: "h-10" })} onClick={applySampleData} type="button">
        <RotateCcw size={17} />
        Dùng dữ liệu mẫu
      </button>
      <span />
      <button
        className={buttonVariants({ className: "h-10 bg-brand-blue text-white hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60" })}
        disabled={isSubmitting}
        type="submit"
      >
        <Sparkles size={17} />
        {isSubmitting ? "Đang tính toán..." : "Tiếp tục đến giả định"}
        <ArrowRight size={17} />
      </button>
    </div>
  );
}

function FormSection({ children, description, title }: { children: ReactNode; description?: string; title: string }) {
  return (
    <section className="mt-5 border-t border-blue-50 pt-4">
      <h3 className="text-base font-bold text-brand-navy">{title}</h3>
      {description ? <p className="mt-1 text-sm font-semibold leading-5 text-brand-muted">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function FormField({
  children,
  error,
  htmlFor,
  label,
  required,
  tooltip
}: {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
  tooltip?: string;
}) {
  return (
    <label className="grid gap-1.5" htmlFor={htmlFor}>
      <span className="flex items-center gap-2 text-sm font-bold text-brand-navy">
        {label} {required ? <span className="text-red-600">*</span> : null}
        {tooltip ? <Tooltip content={tooltip} /> : null}
      </span>
      {children}
      {error ? <FieldError message={error} /> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span className="flex items-center gap-2 text-xs font-bold text-red-600">
      <CircleAlert size={14} aria-hidden />
      {message}
    </span>
  );
}

function Tooltip({ content }: { content: string }) {
  return (
    <span className="group relative inline-flex" tabIndex={0}>
      <Info className="text-brand-muted" size={15} aria-label={content} />
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 hidden w-64 -translate-x-1/2 rounded-lg bg-brand-navy px-3 py-2 text-xs font-semibold leading-5 text-white shadow-soft group-hover:block group-focus:block">
        {content}
      </span>
    </span>
  );
}

function CurrencyInput({
  error,
  id,
  onChange,
  placeholder,
  unit,
  value
}: {
  error?: boolean;
  id: string;
  onChange: (value: number | null) => void;
  placeholder: string;
  unit: string;
  value: number | null;
}) {
  return (
    <span className="relative block">
      <input
        className={cn(inputClass(error), "pr-28")}
        id={id}
        inputMode="numeric"
        name={id}
        onChange={(event) => onChange(parseCurrency(event.target.value))}
        placeholder={placeholder}
        value={formatCurrency(value)}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted">{unit}</span>
    </span>
  );
}

function NumberWithUnitInput({
  error,
  label,
  max,
  min,
  name,
  setValue,
  unit,
  value
}: {
  error?: string;
  label: string;
  max?: number;
  min: number;
  name: Path<QuickSizingStep1FormValues>;
  setValue: ReturnType<typeof useForm<QuickSizingStep1FormValues>>["setValue"];
  unit: string;
  value: number | null;
}) {
  const inputId = String(name);

  return (
    <FormField error={error} htmlFor={inputId} label={label} required>
      <div className="grid gap-1.5">
        <span className="relative block">
          <input
            className={cn(inputClass(Boolean(error)), "pr-24")}
            id={inputId}
            inputMode="numeric"
            max={max}
            min={min}
            name={inputId}
            onChange={(event) => setValue(name, numberOrNull(event.target.value) as never, { shouldDirty: true, shouldValidate: true })}
            type="number"
            value={value ?? ""}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted">{unit}</span>
        </span>
        <input
          aria-label={label}
          className="h-1.5 accent-brand-blue"
          max={max}
          min={min}
          onChange={(event) => setValue(name, Number(event.target.value) as never, { shouldDirty: true, shouldValidate: true })}
          type="range"
          value={value ?? min}
        />
      </div>
    </FormField>
  );
}

function NumberUnitGroup({
  error,
  id,
  onChange,
  unitOptions,
  unitRegister,
  value
}: {
  error?: boolean;
  id: string;
  onChange: (value: number | null) => void;
  unitOptions: string[];
  unitRegister: UseFormRegisterReturn;
  value: number | null;
}) {
  return (
    <span className="grid grid-cols-[1fr_112px]">
      <input className={cn(inputClass(error), "rounded-r-none")} id={id} inputMode="decimal" name={id} onChange={(event) => onChange(numberOrNull(event.target.value))} type="number" value={value ?? ""} />
      <select className="h-10 rounded-r-lg border border-l-0 border-brand-line bg-white px-3 text-sm font-bold text-brand-navy outline-none focus:border-brand-blue" {...unitRegister}>
        {unitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </span>
  );
}

function SelectInput({
  error,
  id,
  options,
  placeholder,
  register
}: {
  error?: boolean;
  id: string;
  options: string[];
  placeholder: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <span className="relative block">
      <select className={cn(inputClass(error), "appearance-none pr-10")} id={id} {...register} defaultValue="">
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} aria-hidden />
    </span>
  );
}

function RadioCard({
  checked,
  label,
  name,
  onChange,
  register,
  value
}: {
  checked: boolean;
  label: string;
  name: string;
  onChange?: () => void;
  register?: UseFormRegisterReturn;
  value: string;
}) {
  return (
    <label className={cn("flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border px-3 text-sm font-bold transition focus-within:ring-2 focus-within:ring-brand-blue/20", checked ? "border-brand-blue bg-blue-50 text-brand-blue" : "border-brand-line bg-white text-brand-navy hover:border-brand-blue")}>
      <input className="size-4 accent-brand-blue" checked={onChange ? checked : undefined} name={name} onChange={onChange} type="radio" value={value} {...register} />
      {label}
    </label>
  );
}

function SelectableOptionCard({
  description,
  icon,
  onToggle,
  selected,
  title
}: {
  description: string;
  icon: ReactNode;
  onToggle: () => void;
  selected: boolean;
  title: string;
}) {
  return (
    <button
      className={cn(
        "min-h-[108px] rounded-lg border bg-white p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue",
        selected ? "border-brand-blue bg-blue-50 shadow-[0_0_0_1px_rgba(7,91,234,0.16)]" : "border-brand-line hover:border-brand-blue hover:bg-blue-50/50"
      )}
      onClick={onToggle}
      type="button"
      aria-pressed={selected}
    >
      <span className={cn("flex items-center justify-between gap-3", selected ? "text-brand-blue" : "text-brand-navy")}>
        {icon}
        {selected ? <Check size={18} aria-hidden /> : null}
      </span>
      <strong className="mt-2.5 block text-sm text-brand-navy">{title}</strong>
      <span className="mt-1.5 block text-xs font-semibold leading-5 text-brand-muted">{description}</span>
    </button>
  );
}

function inputClass(error?: boolean) {
  return cn(
    "h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15",
    error ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : "border-brand-line"
  );
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN").format(value);
}

function parseCurrency(value: string) {
  const numericValue = Number(value.replace(/\D/g, ""));
  return Number.isNaN(numericValue) || numericValue === 0 ? null : numericValue;
}

function numberOrNull(value: string) {
  if (value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

function findFirstErrorName(errors: FieldErrors<QuickSizingStep1FormValues>) {
  const [firstKey] = Object.keys(errors);
  return firstKey;
}
