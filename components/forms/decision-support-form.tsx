"use client";

import { useState } from "react";

import { siteConfig } from "@/lib/site";
import type { StructuredDecisionResult } from "@/lib/tool-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormShell } from "@/components/forms/form-shell";
import { cn } from "@/lib/utils";

type DecisionSupportVariant = "assessment" | "compare";

type ToolField = {
  name: string;
  label: string;
  placeholder?: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  options?: Array<{
    label: string;
    value: string;
  }>;
  helper?: string;
  wide?: boolean;
};

type ToolConfig = {
  eyebrow: string;
  title: string;
  description: string;
  submitLabel: string;
  emptyStateTitle: string;
  emptyStateBody: string;
  apiPath: string;
  fields: ToolField[];
};

type ContextNotice = {
  title: string;
  body: string;
};

const toolConfigs: Record<DecisionSupportVariant, ToolConfig> = {
  assessment: {
    eyebrow: "Legacy surface",
    title: "Legacy assessment intake",
    description:
      "This older intake remains in the codebase for migration continuity, but the primary product flow now starts from saved cases.",
    submitLabel: "Save legacy assessment",
    emptyStateTitle: "No legacy assessment yet",
    emptyStateBody: `Complete the form to generate a legacy structured assessment. Sign in to save the result and profile details to ${siteConfig.name}.`,
    apiPath: "/api/assessments",
    fields: [
      {
        name: "currentStatus",
        label: "Current location or status",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Outside Canada", value: "outside-canada" },
          { label: "Visitor in Canada", value: "visitor" },
          { label: "Student in Canada", value: "student" },
          { label: "Worker in Canada", value: "worker" }
        ]
      },
      {
        name: "goal",
        label: "Primary immigration goal",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Permanent residence", value: "permanent-residence" },
          { label: "Study permit", value: "study-permit" },
          { label: "Work permit", value: "work-permit" },
          { label: "Family sponsorship", value: "family-sponsorship" }
        ]
      },
      {
        name: "timeline",
        label: "Desired timeline",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "0 to 6 months", value: "0-6" },
          { label: "6 to 12 months", value: "6-12" },
          { label: "12 months or more", value: "12-plus" }
        ]
      },
      {
        name: "citizenship",
        label: "Citizenship",
        type: "text",
        required: true,
        placeholder: "Example: India"
      },
      {
        name: "ageBand",
        label: "Age band",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "18 to 24", value: "18-24" },
          { label: "25 to 34", value: "25-34" },
          { label: "35 to 44", value: "35-44" },
          { label: "45 or more", value: "45-plus" }
        ]
      },
      {
        name: "maritalStatus",
        label: "Marital status",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Single", value: "single" },
          { label: "Married or common-law", value: "married-or-common-law" },
          { label: "Separated or divorced", value: "separated-or-divorced" },
          { label: "Widowed", value: "widowed" }
        ]
      },
      {
        name: "educationLevel",
        label: "Highest completed education",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Secondary or less", value: "secondary-or-less" },
          { label: "Diploma or trade", value: "diploma-or-trade" },
          { label: "Bachelor's degree", value: "bachelors" },
          { label: "Graduate degree", value: "graduate" }
        ]
      },
      {
        name: "englishTestStatus",
        label: "English test status",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Completed", value: "completed" },
          { label: "Booked", value: "booked" },
          { label: "Not started", value: "not-started" }
        ]
      },
      {
        name: "canadianExperience",
        label: "Canadian experience",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "None", value: "none" },
          { label: "Under 1 year", value: "under-1-year" },
          { label: "1 to 3 years", value: "1-3-years" },
          { label: "3 or more years", value: "3-plus-years" }
        ]
      },
      {
        name: "foreignExperience",
        label: "Foreign experience",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "None", value: "none" },
          { label: "Under 1 year", value: "under-1-year" },
          { label: "1 to 3 years", value: "1-3-years" },
          { label: "3 or more years", value: "3-plus-years" }
        ]
      },
      {
        name: "jobOfferSupport",
        label: "Job offer support",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Confirmed job offer support", value: "confirmed" },
          { label: "In discussion", value: "in-discussion" },
          { label: "No current support", value: "none" }
        ]
      },
      {
        name: "provincePreference",
        label: "Province preference",
        type: "text",
        required: true,
        placeholder: "Example: Alberta or open to multiple provinces"
      },
      {
        name: "refusalHistoryFlag",
        label: "Any refusal history",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" }
        ]
      },
      {
        name: "notes",
        label: "Context notes",
        type: "textarea",
        required: true,
        wide: true,
        placeholder:
          "Share the details that could change the strategy, such as work history, funding pressure, employer situation, family facts, urgency, or prior refusals.",
        helper: "Use this field for the details that changed, the facts still missing, or the constraints the recommendation should weigh carefully."
      }
    ]
  },
  compare: {
    eyebrow: "Legacy surface",
    title: "Legacy comparison intake",
    description:
      "This older tradeoff flow remains available for migration continuity, but it is no longer part of the primary case workspace.",
    submitLabel: "Save legacy comparison",
    emptyStateTitle: "No legacy comparison yet",
    emptyStateBody: `Enter two options and how each fits the current situation if you need to save a legacy comparison record in ${siteConfig.name}.`,
    apiPath: "/api/comparisons",
    fields: [
      {
        name: "optionA",
        label: "Option A",
        type: "text",
        required: true,
        placeholder: "Example: Express Entry"
      },
      {
        name: "optionADocumentLoad",
        label: "Option A documentation load",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" }
        ]
      },
      {
        name: "optionATimelineFit",
        label: "Option A timeline fit",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Strong fit", value: "strong" },
          { label: "Moderate fit", value: "moderate" },
          { label: "Weak fit", value: "weak" }
        ]
      },
      {
        name: "optionB",
        label: "Option B",
        type: "text",
        required: true,
        placeholder: "Example: Provincial Nominee Program"
      },
      {
        name: "optionBDocumentLoad",
        label: "Option B documentation load",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" }
        ]
      },
      {
        name: "optionBTimelineFit",
        label: "Option B timeline fit",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Strong fit", value: "strong" },
          { label: "Moderate fit", value: "moderate" },
          { label: "Weak fit", value: "weak" }
        ]
      },
      {
        name: "priority",
        label: "Main decision priority",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Speed", value: "speed" },
          { label: "Lower documentation lift", value: "documentation" },
          { label: "Overall certainty", value: "certainty" }
        ]
      },
      {
        name: "decisionDeadline",
        label: "Decision deadline",
        type: "select",
        required: true,
        options: [
          { label: "Select one", value: "" },
          { label: "Within 30 days", value: "within-30" },
          { label: "Within 90 days", value: "within-90" },
          { label: "Flexible", value: "flexible" }
        ]
      },
      {
        name: "profileNotes",
        label: "Decision notes",
        type: "textarea",
        required: true,
        wide: true,
        placeholder:
          "Add the route-specific details that affect this decision, such as timing pressure, family needs, employer uncertainty, location constraints, or budget limits.",
        helper:
          "Keep this focused on the tradeoff itself. If you already have a saved profile, Tideus can reuse that context automatically."
      }
    ]
  }
};

type DecisionSupportFormProps = {
  variant: DecisionSupportVariant;
  initialValues?: Partial<Record<string, string>>;
  contextNotice?: ContextNotice | null;
};

export function DecisionSupportForm({ variant, initialValues, contextNotice }: DecisionSupportFormProps) {
  const config = toolConfigs[variant];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const baseValues = Object.fromEntries(config.fields.map((field) => [field.name, ""]));

    if (!initialValues) {
      return baseValues;
    }

    return {
      ...baseValues,
      ...Object.fromEntries(
        Object.entries(initialValues).map(([key, value]) => [key, typeof value === "string" ? value : ""])
      )
    };
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [result, setResult] = useState<StructuredDecisionResult | null>(null);

  function validate() {
    const nextErrors: Record<string, string> = {};

    for (const field of config.fields) {
      const value = values[field.name]?.trim() ?? "";

      if (field.required && !value) {
        nextErrors[field.name] = "This field is required.";
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNotice(null);

    if (!validate()) {
      setStatus("error");
      setResult(null);
      setErrorMessage("Fix the highlighted fields before generating the result.");
      return;
    }

    setStatus("loading");
    setResult(null);

    try {
      const response = await fetch(config.apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            result?: StructuredDecisionResult;
            saved?: boolean;
          }
        | null;

      if (!response.ok || !data?.result) {
        throw new Error(data?.message || "Unable to generate this result.");
      }

      setResult(data.result);
      setNotice(
        data.saved
          ? {
              tone: "success",
              title: "Saved to dashboard",
              body: data.message || "This result is now available from your account workspace."
            }
          : {
              tone: "warning",
              title: "Result ready",
              body: data.message || "Sign in to save this result to your dashboard."
            }
      );
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setResult(null);
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong while generating the result.");
    }
  }

  return (
    <FormShell
      aside={<ResultPanel config={config} errorMessage={errorMessage} notice={notice} result={result} status={status} />}
      description={config.description}
      eyebrow={config.eyebrow}
      title={config.title}
    >
      <div className="space-y-5">
        {contextNotice ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">{contextNotice.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-900">{contextNotice.body}</p>
          </div>
        ) : null}

        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            {config.fields.map((field) => {
              const error = fieldErrors[field.name];

              return (
                <div className={cn("space-y-2", field.wide ? "md:col-span-2" : null)} key={field.name}>
                  <Label htmlFor={`${variant}-${field.name}`}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      aria-invalid={Boolean(error)}
                      id={`${variant}-${field.name}`}
                      onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                      placeholder={field.placeholder}
                      value={values[field.name]}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      aria-invalid={Boolean(error)}
                      id={`${variant}-${field.name}`}
                      onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                      value={values[field.name]}
                    >
                      {field.options?.map((option) => (
                        <option key={option.value || option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      aria-invalid={Boolean(error)}
                      id={`${variant}-${field.name}`}
                      onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                      placeholder={field.placeholder}
                      value={values[field.name]}
                    />
                  )}

                  {field.helper ? <p className="text-sm text-muted-foreground">{field.helper}</p> : null}
                  {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
                </div>
              );
            })}
          </div>

          <Button className="w-full sm:w-auto" disabled={status === "loading"} type="submit">
            {status === "loading" ? "Generating..." : config.submitLabel}
          </Button>
        </form>
      </div>
    </FormShell>
  );
}

type Notice = {
  tone: "success" | "warning";
  title: string;
  body: string;
};

type ResultPanelProps = {
  config: ToolConfig;
  status: "idle" | "loading" | "error" | "success";
  errorMessage: string;
  notice: Notice | null;
  result: StructuredDecisionResult | null;
};

function ResultPanel({ config, errorMessage, notice, result, status }: ResultPanelProps) {
  if (status === "loading") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Generating result</p>
        <div className="space-y-3">
          <div className="h-4 w-3/4 rounded-full bg-muted" />
          <div className="h-4 w-full rounded-full bg-muted" />
          <div className="h-4 w-5/6 rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-destructive">Unable to continue</p>
        <p className="mt-3 text-sm leading-6 text-foreground">{errorMessage}</p>
      </div>
    );
  }

  if (status === "success" && result) {
    return (
      <div className="space-y-6">
        {notice ? (
          <div
            className={cn("rounded-[24px] border p-5", {
              "border-emerald-200 bg-emerald-50": notice.tone === "success",
              "border-amber-200 bg-amber-50": notice.tone === "warning"
            })}
          >
            <p
              className={cn("text-sm font-semibold uppercase tracking-[0.2em]", {
                "text-emerald-800": notice.tone === "success",
                "text-amber-800": notice.tone === "warning"
              })}
            >
              {notice.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground">{notice.body}</p>
          </div>
        ) : null}

        <ResultSection body={result.summary} title="Summary" />
        <ResultList items={result.whyThisMatters} title="Why this matters" />
        <ResultList items={result.risksAndConstraints} title="Risks or constraints" tone="warning" />
        <ResultList items={result.missingInformation} title="Missing information" />
        <ResultList items={result.nextSteps} title="Next steps" tone="action" />
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-dashed border-border bg-background/70 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{config.emptyStateTitle}</p>
      <p className="mt-3 text-sm leading-6 text-foreground">{config.emptyStateBody}</p>
    </div>
  );
}

function ResultSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-lg leading-8 text-foreground">{body}</p>
    </div>
  );
}

function ResultList({
  title,
  items,
  tone = "default"
}: {
  title: string;
  items: string[];
  tone?: "default" | "warning" | "action";
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            className={cn("rounded-2xl border p-4 text-sm leading-6", {
              "border-border bg-background text-foreground": tone === "default",
              "border-amber-200 bg-amber-50 text-slate-900": tone === "warning",
              "border-emerald-200 bg-emerald-50 text-slate-900": tone === "action"
            })}
            key={item}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
