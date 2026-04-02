import Link from "next/link";

import type { CopilotWorkspaceData } from "@/lib/copilot";
import type { Tables } from "@/lib/database.types";
import { buildProfileSummaryFacts, getProfileCompletion } from "@/lib/profile";
import { getCopilotStructuredResponse, getCopilotUserMessageMetadata } from "@/lib/legacy/tool-results";
import { siteConfig } from "@/lib/site";
import { CopilotComposer } from "@/components/copilot/copilot-composer";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CopilotWorkspace({ user, profile, threads, activeThread, messages }: CopilotWorkspaceData) {
  if (!user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-border/80 bg-white/80 p-8 shadow-soft">
          <Badge variant="secondary" className="mb-5">
            Sign in required
          </Badge>
          <h2 className="font-serif text-3xl text-foreground">Copilot keeps the work useful by keeping it tied to a real account.</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Sign in to create threads, save structured responses, and keep the full decision history available from your dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants({ size: "lg" })} href="/login?next=/copilot">
              Log in
            </Link>
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/signup?next=/copilot">
              Create account
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card/90 p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Response format</p>
          <div className="mt-6 space-y-5">
            <ResponsePreviewSection
              body="Copilot starts by narrowing the answer to the most decision-relevant takeaway instead of broad commentary."
              title="Summary"
            />
            <ResponsePreviewList
              items={[
                "Key considerations that shape the answer",
                "Missing information that could still change the recommendation",
                "Next steps ordered for execution"
              ]}
              title="What gets saved"
            />
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ?? "Member";
  const turns = buildTurns(messages);
  const profileFacts = buildProfileSummaryFacts(profile).slice(0, 6);
  const profileCompletion = getProfileCompletion(profile);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-6">
        <div className="rounded-[32px] border border-border/80 bg-card/90 p-6 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">{displayName}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep each thread scoped to one decision, evidence question, or planning blocker.
              </p>
            </div>
            <Badge variant="secondary">{threads.length} threads</Badge>
          </div>

          <div className="mt-6 grid gap-3">
            <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")} href="/copilot">
              New thread
            </Link>
            <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")} href="/dashboard/copilot">
              View full history
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card/90 p-6 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Profile context</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Copilot applies the saved immigration profile automatically when it is available.
              </p>
            </div>
            <Badge variant="secondary">
              {profileCompletion.completed}/{profileCompletion.total}
            </Badge>
          </div>

          {profileFacts.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-border bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
              No reusable profile facts are saved yet. Add them once and Copilot can stop asking for the same background every time.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {profileFacts.map((fact) => (
                <div className="rounded-2xl border border-border bg-background/80 p-4" key={fact.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{fact.label}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{fact.value}</p>
                </div>
              ))}
            </div>
          )}

          <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5 w-full")} href="/dashboard/profile">
            Manage saved profile
          </Link>
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card/90 p-6 shadow-soft">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recent threads</p>
          </div>

          {threads.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
              No threads yet. Start with one focused question and Tideus will save the response as a structured thread.
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => {
                const isActive = activeThread?.id === thread.id;

                return (
                  <Link
                    className={cn(
                      "block rounded-[24px] border px-4 py-4 transition-colors",
                      isActive
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-border bg-background/80 hover:border-foreground/15 hover:bg-background"
                    )}
                    href={`/copilot?thread=${thread.id}`}
                    key={thread.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{thread.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{thread.summary || "No saved summary yet."}</p>
                      </div>
                      <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {formatDate(thread.updated_at)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[32px] border border-border/80 bg-white/85 p-8 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-5">
                Copilot
              </Badge>
              <h2 className="font-serif text-4xl text-foreground">
                {activeThread ? activeThread.title : "Start a focused thread"}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {activeThread
                  ? "Thread history stays structured so each turn can be reviewed as a decision, not a loose chat log."
                  : "Use one thread per question so the saved history stays easy to review from the workspace and the dashboard."}
              </p>
            </div>

            <div className="text-sm leading-6 text-muted-foreground">
              <p>Signed in as</p>
              <p className="font-semibold text-foreground">{user.email ?? siteConfig.supportEmail}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card/90 p-8 shadow-soft">
          {activeThread ? (
            turns.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-background/70 p-6 text-sm leading-6 text-muted-foreground">
                This thread does not have saved turns yet. Use the form below to add the first question.
              </div>
            ) : (
              <div className="space-y-6">
                {turns.map((turn) => (
                  <div className="rounded-[28px] border border-border bg-background/70 p-6" key={turn.key}>
                    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Question</p>
                        <p className="mt-4 text-base leading-7 text-foreground">{turn.user.content}</p>

                        {turn.userMetadata ? (
                          <div className="mt-5 grid gap-3">
                            <MetadataBlock label="Stage" value={formatStage(turn.userMetadata.stage)} />
                            <MetadataBlock label="Objective" value={formatObjective(turn.userMetadata.objective)} />
                            <MetadataBlock label="Context" value={turn.userMetadata.context} />
                            <MetadataBlock label="Constraints" value={turn.userMetadata.constraints} />
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-5">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Summary</p>
                          <p className="mt-4 text-lg leading-8 text-foreground">
                            {turn.response?.summary || turn.assistant?.content || "No structured response saved."}
                          </p>
                        </div>

                        {turn.response ? (
                          <>
                            <ResponsePreviewList items={turn.response.keyConsiderations} title="Key considerations" />
                            <ResponsePreviewList items={turn.response.missingInformation} title="Missing information" />
                            <ResponsePreviewList items={turn.response.nextSteps} title="Next steps" tone="action" />
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : threads.length > 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-background/70 p-6 text-sm leading-6 text-muted-foreground">
              Select a thread from the left to review its history, or start a new thread below.
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-border bg-background/70 p-6 text-sm leading-6 text-muted-foreground">
              No Copilot history yet. Start with one decision, one blocker, or one evidence question and Tideus will save the response as a thread.
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card/90 p-8 shadow-soft">
          <CopilotComposer profileAvailable={profileFacts.length > 0} threadId={activeThread?.id} threadTitle={activeThread?.title} />
        </div>
      </div>
    </div>
  );
}

type Turn = {
  key: string;
  user: Tables<"copilot_messages">;
  assistant: Tables<"copilot_messages"> | null;
  userMetadata: ReturnType<typeof getCopilotUserMessageMetadata>;
  response: ReturnType<typeof getCopilotStructuredResponse>;
};

function buildTurns(messages: Tables<"copilot_messages">[]): Turn[] {
  const turns: Turn[] = [];

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];

    if (message.role !== "user") {
      continue;
    }

    const assistant = messages[index + 1]?.role === "assistant" ? messages[index + 1] : null;

    turns.push({
      key: message.id,
      user: message,
      assistant,
      userMetadata: getCopilotUserMessageMetadata(message.metadata),
      response: assistant ? getCopilotStructuredResponse(assistant.metadata) : null
    });
  }

  return turns;
}

function ResponsePreviewSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-base leading-7 text-foreground">{body}</p>
    </div>
  );
}

function ResponsePreviewList({
  title,
  items,
  tone = "default"
}: {
  title: string;
  items: string[];
  tone?: "default" | "action";
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            className={cn("rounded-2xl border p-4 text-sm leading-6", {
              "border-border bg-white text-foreground": tone === "default",
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

function MetadataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-sm leading-6">
      <p className="font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-foreground">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatStage(value: string) {
  const labels: Record<string, string> = {
    research: "Early research",
    comparing: "Comparing options",
    documents: "Preparing documents",
    ready: "Ready to file"
  };

  return labels[value] ?? value;
}

function formatObjective(value: string) {
  const labels: Record<string, string> = {
    "choose-next-step": "Choose the next step",
    "document-plan": "Prioritize documents",
    "risk-review": "Review the main risk",
    "timeline-planning": "Sequence the timeline"
  };

  return labels[value] ?? value;
}
