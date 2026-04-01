import { notFound, redirect } from "next/navigation";

import type { Json } from "@/lib/database.types";
import { getComparisonDetail } from "@/lib/history";
import { DetailShell } from "@/components/dashboard/detail-shell";

type ComparisonDetailPageProps = {
  params: Promise<{
    comparisonId: string;
  }>;
};

export default async function ComparisonDetailPage({ params }: ComparisonDetailPageProps) {
  const { comparisonId } = await params;
  const detail = await getComparisonDetail(comparisonId);

  if (!detail.user) {
    redirect(`/login?next=/dashboard/comparisons/${comparisonId}`);
  }

  if (!detail.record) {
    notFound();
  }

  const snapshot = readSnapshot(detail.record.input_snapshot);

  return (
    <DetailShell
      backHref="/dashboard/comparisons"
      backLabel="Back to comparison history"
      eyebrow="Saved comparison"
      facts={[
        { label: "Created", value: formatDate(detail.record.created_at) },
        { label: "Lead options", value: `${detail.record.option_a} vs ${detail.record.option_b}` },
        { label: "Priority", value: formatValue(detail.record.priority) },
        { label: "Decision deadline", value: formatValue(readSnapshotString(snapshot, "decisionDeadline")) },
        { label: "Option A timeline fit", value: formatValue(readSnapshotString(snapshot, "optionATimelineFit")) },
        { label: "Option B timeline fit", value: formatValue(readSnapshotString(snapshot, "optionBTimelineFit")) }
      ]}
      notes={detail.record.profile_notes}
      notesLabel="Saved profile notes"
      primaryHref="/compare"
      primaryLabel="Start a new comparison"
      sections={[
        { title: "Why this matters", items: detail.record.result_why_matters },
        { title: "Risks or constraints", items: detail.record.result_risks_and_constraints, tone: "warning" },
        { title: "Missing information", items: detail.record.result_missing_information },
        { title: "Next steps", items: detail.record.result_next_steps, tone: "action" }
      ]}
      snapshotFacts={[
        { label: "Option A", value: readSnapshotString(snapshot, "optionA") || detail.record.option_a },
        { label: "Option A document load", value: formatValue(readSnapshotString(snapshot, "optionADocumentLoad")) },
        { label: "Option A timeline fit", value: formatValue(readSnapshotString(snapshot, "optionATimelineFit")) },
        { label: "Option B", value: readSnapshotString(snapshot, "optionB") || detail.record.option_b },
        { label: "Option B document load", value: formatValue(readSnapshotString(snapshot, "optionBDocumentLoad")) },
        { label: "Option B timeline fit", value: formatValue(readSnapshotString(snapshot, "optionBTimelineFit")) }
      ]}
      snapshotTitle="Comparison input snapshot"
      subtitle="Review the saved tradeoff, the lead recommendation, and the fallback logic in one place."
      summary={detail.record.result_summary}
      title={`${detail.record.option_a} vs ${detail.record.option_b}`}
    />
  );
}

function readSnapshot(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}

function readSnapshotString(snapshot: Record<string, Json>, key: string) {
  const value = snapshot[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatValue(value: string | null | undefined) {
  if (!value) {
    return "Not captured";
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
