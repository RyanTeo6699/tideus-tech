import { notFound, redirect } from "next/navigation";

import type { Json } from "@/lib/database.types";
import { getAssessmentDetail } from "@/lib/legacy/history";
import { DetailShell } from "@/components/dashboard/detail-shell";

type AssessmentDetailPageProps = {
  params: Promise<{
    assessmentId: string;
  }>;
};

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { assessmentId } = await params;
  const detail = await getAssessmentDetail(assessmentId);

  if (!detail.user) {
    redirect(`/login?next=/dashboard/assessments/${assessmentId}`);
  }

  if (!detail.record) {
    notFound();
  }

  const snapshot = readSnapshot(detail.record.input_snapshot);

  return (
    <DetailShell
      backHref="/dashboard/assessments"
      backLabel="Back to legacy assessment records"
      eyebrow="Legacy archive"
      facts={[
        { label: "Created", value: formatDate(detail.record.created_at) },
        { label: "Current status", value: formatValue(detail.record.current_status) },
        { label: "Primary goal", value: formatValue(detail.record.goal) },
        { label: "Timeline", value: formatValue(detail.record.timeline) },
        { label: "Citizenship", value: readSnapshotString(snapshot, "citizenship") || "Not captured" },
        { label: "Province focus", value: readSnapshotString(snapshot, "provincePreference") || "Not captured" }
      ]}
      notes={detail.record.notes}
      notesLabel="Saved context notes"
      primaryHref="/start-case"
      primaryLabel="Start a new case"
      sections={[
        { title: "Why this matters", items: detail.record.result_why_matters },
        { title: "Risks or constraints", items: detail.record.result_risks_and_constraints, tone: "warning" },
        { title: "Missing information", items: detail.record.result_missing_information },
        { title: "Next steps", items: detail.record.result_next_steps, tone: "action" }
      ]}
      snapshotFacts={[
        { label: "Age band", value: formatValue(readSnapshotString(snapshot, "ageBand")) },
        { label: "Marital status", value: formatValue(readSnapshotString(snapshot, "maritalStatus")) },
        { label: "Education", value: formatValue(readSnapshotString(snapshot, "educationLevel")) },
        { label: "English test", value: formatValue(readSnapshotString(snapshot, "englishTestStatus")) },
        { label: "Canadian experience", value: formatValue(readSnapshotString(snapshot, "canadianExperience")) },
        { label: "Foreign experience", value: formatValue(readSnapshotString(snapshot, "foreignExperience")) },
        { label: "Job offer support", value: formatValue(readSnapshotString(snapshot, "jobOfferSupport")) },
        { label: "Refusal history", value: readSnapshotBoolean(snapshot, "refusalHistoryFlag") ? "Yes" : "No" }
      ]}
      snapshotTitle="Assessment profile snapshot"
      subtitle="Review the saved legacy intake, the structured recommendation, and the next actions from one place."
      summary={detail.record.result_summary}
      title={`${formatValue(detail.record.current_status)} to ${formatValue(detail.record.goal)}`}
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

function readSnapshotBoolean(snapshot: Record<string, Json>, key: string) {
  return snapshot[key] === true;
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
