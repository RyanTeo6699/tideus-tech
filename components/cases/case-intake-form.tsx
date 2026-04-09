"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getCaseIntakeFields, type CaseIntakeValues, type UseCaseDefinition } from "@/lib/case-workflows";
import { FormShell } from "@/components/forms/form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ProfileFact = {
  label: string;
  value: string;
};

type CaseIntakeFormProps = {
  useCase: UseCaseDefinition;
  initialValues: Partial<CaseIntakeValues>;
  profileFacts: ProfileFact[];
};

export function CaseIntakeForm({ useCase, initialValues, profileFacts }: CaseIntakeFormProps) {
  const router = useRouter();
  const fields = useMemo(() => getCaseIntakeFields(useCase), [useCase]);
  const [values, setValues] = useState<CaseIntakeValues>({
    title: "",
    currentStatus: "",
    currentPermitExpiry: "",
    urgency: "",
    passportValidity: "",
    proofOfFundsStatus: "",
    refusalOrComplianceIssues: "",
    applicationReason: "",
    supportEntityName: "",
    supportEvidenceStatus: "",
    scenarioProgressStatus: "",
    notes: "",
    ...initialValues
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("The intake will create a saved case and seed the expected materials list.");

  function validate() {
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = values[field.name].trim();

      if (field.required && !value) {
        nextErrors[field.name] = "This field is required.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      setStatus("error");
      setMessage("Fix the highlighted fields before creating the case.");
      return;
    }

    setStatus("loading");
    setMessage("Creating case workspace...");

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          useCase: useCase.slug,
          ...values
        })
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            caseId?: string;
            nextHref?: string;
          }
        | null;

      if (!response.ok || !data?.caseId || !data.nextHref) {
        throw new Error(data?.message || "Unable to create the case.");
      }

      const nextHref = data.nextHref;

      startTransition(() => {
        router.push(nextHref);
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to create the case.");
    }
  }

  return (
    <FormShell
      aside={
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">What happens next</p>
            <div className="mt-4 space-y-3">
              {[
                "The case record is created and saved to your dashboard.",
                "Optional notes are normalized into structured workflow signals when possible.",
                "The expected materials list is seeded for this workflow.",
                "The next step moves directly into the materials review."
              ].map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-900">
            <p className="font-semibold uppercase tracking-[0.18em] text-emerald-800">Saved profile context</p>
            <p className="mt-2">
              {profileFacts.length > 0
                ? "Saved profile facts are already helping shape this intake so the workflow does not ask for the same core details again."
                : "You can still complete the case without a saved profile, but the profile page makes future intake steps shorter."}
            </p>
          </div>

          {profileFacts.length > 0 ? (
            <div className="space-y-3">
              {profileFacts.map((fact) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4" key={fact.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{fact.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-900">{fact.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      }
      description={useCase.intakeDescription}
      eyebrow={useCase.eyebrow}
      title={useCase.intakeTitle}
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => {
            const error = errors[field.name];

            return (
              <div className={cn("space-y-2", field.wide ? "md:col-span-2" : null)} key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    aria-invalid={Boolean(error)}
                    id={field.name}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    value={values[field.name]}
                  />
                ) : field.type === "select" ? (
                  <Select
                    aria-invalid={Boolean(error)}
                    id={field.name}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    value={values[field.name]}
                  >
                    <option value="">Select one</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    aria-invalid={Boolean(error)}
                    id={field.name}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    type={field.type === "date" ? "date" : "text"}
                    value={values[field.name]}
                  />
                )}
                {field.helper ? <p className="text-sm text-muted-foreground">{field.helper}</p> : null}
                {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              </div>
            );
          })}
        </div>

        <div
          className={cn("rounded-2xl border p-4 text-sm leading-6", {
            "border-slate-200 bg-slate-50 text-slate-700": status === "idle" || status === "loading",
            "border-red-200 bg-red-50 text-red-700": status === "error"
          })}
        >
          <p className="font-semibold uppercase tracking-[0.18em]">{status === "loading" ? "Working" : status === "error" ? "Error" : "Ready"}</p>
          <p className="mt-2">{message}</p>
        </div>

        <Button disabled={status === "loading"} type="submit">
          {status === "loading" ? "Creating case..." : "Save intake and continue"}
        </Button>
      </form>
    </FormShell>
  );
}
