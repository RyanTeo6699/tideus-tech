"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { Tables } from "@/lib/database.types";
import { formatDocumentStatus } from "@/lib/case-workflows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CaseMaterialsFormProps = {
  caseId: string;
  caseTitle: string;
  useCaseTitle: string;
  documents: Tables<"case_documents">[];
};

export function CaseMaterialsForm({ caseId, caseTitle, useCaseTitle, documents }: CaseMaterialsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(
    documents.map((item) => ({
      id: item.id,
      label: item.label,
      required: item.required,
      description: item.description,
      status: item.status,
      materialReference: item.material_reference ?? "",
      notes: item.notes ?? ""
    }))
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState(
    "Mark what you already have, label the materials, and then generate the structured review output."
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Saving materials and generating review...");

    try {
      const saveResponse = await fetch(`/api/cases/${caseId}/documents`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documents: values
        })
      });

      const saveData = (await saveResponse.json().catch(() => null)) as { message?: string } | null;

      if (!saveResponse.ok) {
        throw new Error(saveData?.message || "Unable to save the materials state.");
      }

      const reviewResponse = await fetch(`/api/cases/${caseId}/review`, {
        method: "POST"
      });

      const reviewData = (await reviewResponse.json().catch(() => null)) as { message?: string } | null;

      if (!reviewResponse.ok) {
        throw new Error(reviewData?.message || "Unable to generate the case review.");
      }

      startTransition(() => {
        router.push(`/review-results/${caseId}`);
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
        <CardHeader>
          <CardTitle>{useCaseTitle}</CardTitle>
          <CardDescription>
            This page is meant to organize the package. If you are not uploading files yet, record the material name or note so the case still has a usable evidence map.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-700">{caseTitle}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {values.map((item, index) => (
          <Card className="shadow-none" key={item.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="text-lg">{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {item.required ? "Required" : "Optional"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`status-${item.id}`}>Material status</Label>
                <Select
                  id={`status-${item.id}`}
                  onChange={(event) =>
                    setValues((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, status: event.target.value } : entry
                      )
                    )
                  }
                  value={item.status}
                >
                  {["missing", "collecting", "needs-refresh", "ready", "not-applicable"].map((value) => (
                    <option key={value} value={value}>
                      {formatDocumentStatus(value)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`reference-${item.id}`}>Material reference</Label>
                <Input
                  id={`reference-${item.id}`}
                  onChange={(event) =>
                    setValues((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, materialReference: event.target.value } : entry
                      )
                    )
                  }
                  placeholder="Example: bank-statements-mar-2026.pdf"
                  value={item.materialReference}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${item.id}`}>Short note</Label>
                <Input
                  id={`notes-${item.id}`}
                  onChange={(event) =>
                    setValues((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, notes: event.target.value } : entry
                      )
                    )
                  }
                  placeholder="Anything that still needs attention"
                  value={item.notes}
                />
              </div>
            </CardContent>
          </Card>
        ))}
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
        {status === "loading" ? "Generating review..." : "Save materials and generate review"}
      </Button>
    </form>
  );
}
