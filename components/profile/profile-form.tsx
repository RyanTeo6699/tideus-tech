"use client";

import { startTransition, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";

import {
  ageBandOptions,
  currentStatusOptions,
  educationLevelOptions,
  englishTestStatusOptions,
  experienceOptions,
  formatStoredValue,
  goalOptions,
  jobOfferSupportOptions,
  maritalStatusOptions,
  refusalHistoryOptions,
  timelineOptions,
  type ProfileFormValues
} from "@/lib/profile";
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
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("Save your profile once and Tideus will reuse it across the case intake and review workflow.");
  const [lastSavedLabel, setLastSavedLabel] = useState(formatDateTime(updatedAt));

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
        nextErrors[field] = "This field is required.";
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage("Fix the highlighted fields before saving the profile.");
      return;
    }

    setStatus("loading");
    setMessage("Saving profile...");

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
        throw new Error(data?.message || "Unable to save the profile.");
      }

      setStatus("success");
      setMessage(data?.message || "Profile saved.");
      setLastSavedLabel(formatDateTime(new Date().toISOString()));

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save the profile.");
    }
  }

  const summaryFacts = [
    { label: "Current status", value: formatStoredValue(values.currentStatus) },
    { label: "Primary goal", value: formatStoredValue(values.goal) },
    { label: "Timeline", value: formatStoredValue(values.timeline) },
    { label: "Citizenship", value: values.citizenship.trim() || null },
    { label: "Province preference", value: values.provincePreference.trim() || null },
    { label: "English test", value: formatStoredValue(values.englishTestStatus) }
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>Saved immigration profile</CardTitle>
          <CardDescription>
            Keep the core facts in one place so supported case workflows can reuse them instead of re-asking for the same background every time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                error={fieldErrors.fullName}
                label="Full name"
                name="fullName"
                onChange={setValues}
                placeholder="Optional"
                value={values.fullName}
              />
              <ReadOnlyField label="Account email" value={email} />

              <SelectField
                error={fieldErrors.currentStatus}
                label="Current location or status"
                name="currentStatus"
                onChange={setValues}
                options={currentStatusOptions}
                value={values.currentStatus}
              />
              <SelectField
                error={fieldErrors.goal}
                label="Primary immigration goal"
                name="goal"
                onChange={setValues}
                options={goalOptions}
                value={values.goal}
              />
              <SelectField
                error={fieldErrors.timeline}
                label="Planning timeline"
                name="timeline"
                onChange={setValues}
                options={timelineOptions}
                value={values.timeline}
              />
              <Field
                error={fieldErrors.citizenship}
                label="Citizenship"
                name="citizenship"
                onChange={setValues}
                placeholder="Example: India"
                value={values.citizenship}
              />
              <SelectField
                error={fieldErrors.ageBand}
                label="Age band"
                name="ageBand"
                onChange={setValues}
                options={ageBandOptions}
                value={values.ageBand}
              />
              <SelectField
                error={fieldErrors.maritalStatus}
                label="Marital status"
                name="maritalStatus"
                onChange={setValues}
                options={maritalStatusOptions}
                value={values.maritalStatus}
              />
              <SelectField
                error={fieldErrors.educationLevel}
                label="Highest completed education"
                name="educationLevel"
                onChange={setValues}
                options={educationLevelOptions}
                value={values.educationLevel}
              />
              <SelectField
                error={fieldErrors.englishTestStatus}
                label="English test status"
                name="englishTestStatus"
                onChange={setValues}
                options={englishTestStatusOptions}
                value={values.englishTestStatus}
              />
              <SelectField
                error={fieldErrors.canadianExperience}
                label="Canadian experience"
                name="canadianExperience"
                onChange={setValues}
                options={experienceOptions}
                value={values.canadianExperience}
              />
              <SelectField
                error={fieldErrors.foreignExperience}
                label="Foreign experience"
                name="foreignExperience"
                onChange={setValues}
                options={experienceOptions}
                value={values.foreignExperience}
              />
              <SelectField
                error={fieldErrors.jobOfferSupport}
                label="Job offer support"
                name="jobOfferSupport"
                onChange={setValues}
                options={jobOfferSupportOptions}
                value={values.jobOfferSupport}
              />
              <Field
                error={fieldErrors.provincePreference}
                label="Province preference"
                name="provincePreference"
                onChange={setValues}
                placeholder="Example: Alberta or open to multiple provinces"
                value={values.provincePreference}
              />
              <SelectField
                error={fieldErrors.refusalHistoryFlag}
                label="Any refusal history"
                name="refusalHistoryFlag"
                onChange={setValues}
                options={refusalHistoryOptions}
                value={values.refusalHistoryFlag}
              />
            </div>

            <Button disabled={status === "loading"} type="submit">
              {status === "loading" ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Profile reuse
          </Badge>
          <CardTitle>Used automatically across the wedge workflow</CardTitle>
          <CardDescription>
            Saved profile context is reused to prefill case intake and keep the materials and review workflow focused on the actual package.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <UsageItem label="Case intake" value="Prefills saved fields" />
            <UsageItem label="Materials" value="Keeps the package contextual" />
            <UsageItem label="Review" value="Supports cleaner handoff" />
          </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-slate-950">Profile coverage</p>
              <p className="mt-2">
                {completion.completed} of {completion.total} core fields are currently saved.
              </p>
              <p className="mt-2 text-slate-500">Last saved: {lastSavedLabel}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Profile saving stays explicit so it is clear when the workspace is using new context.</CardDescription>
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
                  ? "Ready"
                  : status === "loading"
                    ? "Saving"
                    : status === "success"
                      ? "Saved"
                      : "Error"}
              </p>
              <p className="mt-2">{message}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current summary</CardTitle>
            <CardDescription>These are the details most likely to influence routing, timing, and document priorities.</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryFacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                No core profile facts have been saved yet. Add the fields on the left and Tideus will start reusing them across the workspace.
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
  error
}: {
  label: string;
  name: keyof ProfileFormValues;
  value: string;
  onChange: Dispatch<SetStateAction<ProfileFormValues>>;
  options: Array<{ label: string; value: string }>;
  error?: string;
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
        <option value="">Select one</option>
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
