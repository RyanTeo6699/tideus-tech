"use client";

import { startTransition, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";

import type { Tables } from "@/lib/database.types";
import {
  buildProfileSummaryFacts,
  formatStoredValue,
  getAgeBandOptions,
  getCurrentStatusOptions,
  getEducationLevelOptions,
  getEnglishTestStatusOptions,
  getExperienceOptions,
  getGoalOptions,
  getJobOfferSupportOptions,
  getMaritalStatusOptions,
  getRefusalHistoryOptions,
  getTimelineOptions,
  type ProfileFormValues
} from "@/lib/profile";
import { useLocaleContext } from "@/lib/i18n/client";
import { formatAppDateTime } from "@/lib/i18n/format";
import { pickLocale } from "@/lib/i18n/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ProfileFormProps = {
  initialValues: ProfileFormValues;
  email: string;
  updatedAt: string | null;
};

export function ProfileForm({ initialValues, email, updatedAt }: ProfileFormProps) {
  const { locale, messages } = useLocaleContext();
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState(
    pickLocale(
      locale,
      "资料档案只需要保存一次，Tideus 就会在案件资料收集与审查工作流中重复使用。",
      "資料檔案只需要儲存一次，Tideus 就會在案件資料收集與審查工作流中重複使用。"
    )
  );
  const [lastSavedLabel, setLastSavedLabel] = useState(updatedAt ? formatAppDateTime(updatedAt, locale) : pickLocale(locale, "尚未保存", "尚未儲存"));

  const optionSets = useMemo(
    () => ({
      currentStatus: getCurrentStatusOptions(locale),
      goal: getGoalOptions(locale),
      timeline: getTimelineOptions(locale),
      ageBand: getAgeBandOptions(locale),
      maritalStatus: getMaritalStatusOptions(locale),
      educationLevel: getEducationLevelOptions(locale),
      englishTestStatus: getEnglishTestStatusOptions(locale),
      experience: getExperienceOptions(locale),
      jobOfferSupport: getJobOfferSupportOptions(locale),
      refusalHistory: getRefusalHistoryOptions(locale)
    }),
    [locale]
  );

  const completion = useMemo(() => {
    const trackedValues = [
      values.currentStatus,
      values.goal,
      values.timeline,
      values.citizenship,
      values.ageBand,
      values.maritalStatus,
      values.educationLevel,
      values.englishTestStatus,
      values.canadianExperience,
      values.foreignExperience,
      values.jobOfferSupport,
      values.provincePreference
    ];

    return {
      completed: trackedValues.filter((value) => value.trim()).length,
      total: trackedValues.length
    };
  }, [values]);

  function validate() {
    const nextErrors: Record<string, string> = {};
    const requiredFields = [
      "currentStatus",
      "goal",
      "timeline",
      "citizenship",
      "ageBand",
      "maritalStatus",
      "educationLevel",
      "englishTestStatus",
      "canadianExperience",
      "foreignExperience",
      "jobOfferSupport",
      "provincePreference",
      "refusalHistoryFlag"
    ] as const;

    requiredFields.forEach((field) => {
      if (!values[field].trim()) {
        nextErrors[field] = pickLocale(locale, "此字段为必填。", "此欄位為必填。");
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage(pickLocale(locale, "请先修正高亮字段，再保存资料档案。", "請先修正高亮欄位，再儲存資料檔案。"));
      return;
    }

    setStatus("loading");
    setMessage(pickLocale(locale, "正在保存资料档案...", "正在儲存資料檔案..."));

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message || pickLocale(locale, "暂时无法保存资料档案。", "暫時無法儲存資料檔案。"));
      }

      setStatus("success");
      setMessage(data?.message || pickLocale(locale, "资料档案已保存。", "資料檔案已儲存。"));
      setLastSavedLabel(formatAppDateTime(new Date().toISOString(), locale));

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : pickLocale(locale, "暂时无法保存资料档案。", "暫時無法儲存資料檔案。"));
    }
  }

  const summaryFacts = useMemo(
    () =>
      buildProfileSummaryFacts(
        {
          user_id: "",
          email,
          full_name: values.fullName || null,
          current_status: values.currentStatus || null,
          current_country: null,
          target_goal: values.goal || null,
          target_timeline: values.timeline || null,
          citizenship: values.citizenship || null,
          age_band: values.ageBand || null,
          marital_status: values.maritalStatus || null,
          education_level: values.educationLevel || null,
          english_test_status: values.englishTestStatus || null,
          canadian_experience: values.canadianExperience || null,
          foreign_experience: values.foreignExperience || null,
          job_offer_support: values.jobOfferSupport || null,
          province_preference: values.provincePreference || null,
          refusal_history_flag: values.refusalHistoryFlag === "yes",
          consumer_plan_tier: "free",
          consumer_plan_status: "active",
          consumer_plan_source: "default-free",
          consumer_plan_activated_at: null,
          consumer_plan_current_period_end: null,
          billing_provider: null,
          billing_customer_id: null,
          billing_subscription_id: null,
          billing_last_event_id: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } satisfies Tables<"profiles">,
        locale
      ),
    [email, locale, values]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>{pickLocale(locale, "已保存的移民资料档案", "已儲存的移民資料檔案")}</CardTitle>
          <CardDescription>
            {pickLocale(
              locale,
              "把核心事实保存一次，受支持的案件工作流就能复用这些背景，而不必每次重新询问。",
              "把核心事實儲存一次，受支援的案件工作流就能重用這些背景，而不必每次重新詢問。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field error={fieldErrors.fullName} label={pickLocale(locale, "姓名", "姓名")} name="fullName" onChange={setValues} placeholder={pickLocale(locale, "可选", "可選")} value={values.fullName} />
              <ReadOnlyField label={pickLocale(locale, "账户邮箱", "帳戶電子郵件")} value={email} />

              <SelectField error={fieldErrors.currentStatus} label={pickLocale(locale, "当前所在地 / 身份", "目前所在地 / 身分")} name="currentStatus" onChange={setValues} options={optionSets.currentStatus} value={values.currentStatus} selectOne={messages.common.selectOne} />
              <SelectField error={fieldErrors.goal} label={pickLocale(locale, "主要移民目标", "主要移民目標")} name="goal" onChange={setValues} options={optionSets.goal} value={values.goal} selectOne={messages.common.selectOne} />
              <SelectField error={fieldErrors.timeline} label={pickLocale(locale, "计划时间线", "規劃時間線")} name="timeline" onChange={setValues} options={optionSets.timeline} value={values.timeline} selectOne={messages.common.selectOne} />
              <Field error={fieldErrors.citizenship} label={pickLocale(locale, "国籍", "國籍")} name="citizenship" onChange={setValues} placeholder={pickLocale(locale, "例如：印度", "例如：印度")} value={values.citizenship} />
              <SelectField error={fieldErrors.ageBand} label={pickLocale(locale, "年龄段", "年齡區間")} name="ageBand" onChange={setValues} options={optionSets.ageBand} value={values.ageBand} selectOne={messages.common.selectOne} />
              <SelectField error={fieldErrors.maritalStatus} label={pickLocale(locale, "婚姻状况", "婚姻狀況")} name="maritalStatus" onChange={setValues} options={optionSets.maritalStatus} value={values.maritalStatus} selectOne={messages.common.selectOne} />
              <SelectField error={fieldErrors.educationLevel} label={pickLocale(locale, "最高完成学历", "最高完成學歷")} name="educationLevel" onChange={setValues} options={optionSets.educationLevel} value={values.educationLevel} selectOne={messages.common.selectOne} />
              <SelectField error={fieldErrors.englishTestStatus} label={pickLocale(locale, "英语考试状态", "英語考試狀態")} name="englishTestStatus" onChange={setValues} options={optionSets.englishTestStatus} value={values.englishTestStatus} selectOne={messages.common.selectOne} />
              <SelectField error={fieldErrors.canadianExperience} label={pickLocale(locale, "加拿大经历", "加拿大經歷")} name="canadianExperience" onChange={setValues} options={optionSets.experience} value={values.canadianExperience} selectOne={messages.common.selectOne} />
              <SelectField error={fieldErrors.foreignExperience} label={pickLocale(locale, "海外经历", "海外經歷")} name="foreignExperience" onChange={setValues} options={optionSets.experience} value={values.foreignExperience} selectOne={messages.common.selectOne} />
              <SelectField error={fieldErrors.jobOfferSupport} label={pickLocale(locale, "工作录用支持", "工作錄用支持")} name="jobOfferSupport" onChange={setValues} options={optionSets.jobOfferSupport} value={values.jobOfferSupport} selectOne={messages.common.selectOne} />
              <Field
                error={fieldErrors.provincePreference}
                label={pickLocale(locale, "省份偏好", "省份偏好")}
                name="provincePreference"
                onChange={setValues}
                placeholder={pickLocale(locale, "例如：阿尔伯塔，或可接受多个省份", "例如：亞伯達，或可接受多個省份")}
                value={values.provincePreference}
              />
              <SelectField error={fieldErrors.refusalHistoryFlag} label={pickLocale(locale, "是否有拒签 / 合规历史", "是否有拒簽 / 合規歷史")} name="refusalHistoryFlag" onChange={setValues} options={optionSets.refusalHistory} value={values.refusalHistoryFlag} selectOne={messages.common.selectOne} />
            </div>

            <Button disabled={status === "loading"} type="submit">
              {status === "loading" ? pickLocale(locale, "正在保存...", "正在儲存...") : pickLocale(locale, "保存资料档案", "儲存資料檔案")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              {pickLocale(locale, "资料复用", "資料重用")}
            </Badge>
            <CardTitle>{pickLocale(locale, "会自动用于当前楔形工作流", "會自動用於目前楔形工作流")}</CardTitle>
            <CardDescription>
              {pickLocale(
                locale,
                "已保存的资料档案会回填案件资料收集，并让材料与审查工作流聚焦在真实包件，而不是重复背景问题。",
                "已儲存的資料檔案會回填案件資料收集，並讓材料與審查工作流聚焦在真實包件，而不是重複背景問題。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <UsageItem label={pickLocale(locale, "案件资料收集", "案件資料收集")} value={pickLocale(locale, "自动预填已保存字段", "自動預填已儲存欄位")} />
              <UsageItem label={pickLocale(locale, "材料工作台", "材料工作台")} value={pickLocale(locale, "保持包件脉络完整", "保持包件脈絡完整")} />
              <UsageItem label={pickLocale(locale, "结构化审查", "結構化審查")} value={pickLocale(locale, "支持更清晰的交接", "支援更清晰的交接")} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-slate-950">{pickLocale(locale, "资料覆盖率", "資料覆蓋率")}</p>
              <p className="mt-2">
                {pickLocale(
                  locale,
                  `当前已保存 ${completion.completed} / ${completion.total} 个核心字段。`,
                  `目前已儲存 ${completion.completed} / ${completion.total} 個核心欄位。`
                )}
              </p>
              <p className="mt-2 text-slate-500">
                {pickLocale(locale, "最近保存", "最近儲存")}：{lastSavedLabel}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pickLocale(locale, "保存状态", "儲存狀態")}</CardTitle>
            <CardDescription>
              {pickLocale(
                locale,
                "资料档案保存始终是显式动作，这样你能清楚知道工作台何时开始使用新的背景脉络。",
                "資料檔案儲存始終是顯式動作，這樣你能清楚知道工作台何時開始使用新的背景脈絡。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn("rounded-2xl border p-4 text-sm leading-6", {
                "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading",
                "border-emerald-200 bg-emerald-50 text-slate-900": status === "success",
                "border-red-200 bg-red-50 text-red-700": status === "error"
              })}
            >
              <p className="font-semibold uppercase tracking-[0.18em]">
                {status === "idle"
                  ? messages.common.ready
                  : status === "loading"
                    ? pickLocale(locale, "保存中", "儲存中")
                    : status === "success"
                      ? messages.common.saved
                      : messages.common.error}
              </p>
              <p className="mt-2">{message}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pickLocale(locale, "当前摘要", "目前摘要")}</CardTitle>
            <CardDescription>
              {pickLocale(
                locale,
                "这些细节最可能影响路线判断、时间安排与材料优先级。",
                "這些細節最可能影響路線判斷、時間安排與材料優先順序。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summaryFacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                {pickLocale(
                  locale,
                  "还没有保存核心资料。先在左侧填写字段，Tideus 就会开始在工作台内复用这些背景。",
                  "還沒有儲存核心資料。先在左側填寫欄位，Tideus 就會開始在工作台內重用這些背景。"
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {summaryFacts.map((fact) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={fact.label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{fact.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-900">{fact.value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  error
}: {
  label: string;
  name: keyof ProfileFormValues;
  value: string;
  onChange: Dispatch<SetStateAction<ProfileFormValues>>;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        aria-invalid={Boolean(error)}
        id={name}
        onChange={(event) => onChange((current) => ({ ...current, [name]: event.target.value }))}
        placeholder={placeholder}
        value={value}
      />
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input disabled value={value} />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  selectOne
}: {
  label: string;
  name: keyof ProfileFormValues;
  value: string;
  onChange: Dispatch<SetStateAction<ProfileFormValues>>;
  options: ReadonlyArray<{ label: string; value: string }>;
  error?: string;
  selectOne: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select
        aria-invalid={Boolean(error)}
        id={name}
        onChange={(event) => onChange((current) => ({ ...current, [name]: event.target.value }))}
        value={value}
      >
        <option value="">{selectOne}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

function UsageItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-900">{value}</p>
    </div>
  );
}
