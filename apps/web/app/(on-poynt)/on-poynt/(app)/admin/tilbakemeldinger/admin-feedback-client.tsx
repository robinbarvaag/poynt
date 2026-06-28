"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  type FeedbackCategory,
  type FeedbackStatus,
  feedbackCategoryLabels,
  feedbackStatusLabels,
  feedbackStatuses,
} from "@poynt/planner-validators";
import {
  Badge,
  type BadgeProps,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  PageShell,
  Textarea,
} from "@poynt/ui";
import { useMemo, useState } from "react";

type AdminItem = {
  id: string;
  category: FeedbackCategory;
  title: string;
  description: string;
  status: FeedbackStatus;
  adminResponse: string | null;
  createdAt: string | Date;
  userName: string | null;
  userEmail: string | null;
};

const STATUS_VARIANT: Record<FeedbackStatus, BadgeProps["variant"]> = {
  received: "outline",
  reviewing: "secondary",
  planned: "default",
  resolved: "default",
  declined: "outline",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminFeedbackClient({ initial }: { initial: AdminItem[] }) {
  const [items, setItems] = useState<AdminItem[]>(initial);
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const s of feedbackStatuses) {
      c[s] = items.filter((i) => i.status === s).length;
    }
    return c;
  }, [items]);

  const visible =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  function patch(id: string, next: Partial<AdminItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }

  async function save(item: AdminItem) {
    setSavingId(item.id);
    try {
      await trpc.feedback.setStatus.mutate({
        id: item.id,
        status: item.status,
        adminResponse: item.adminResponse ?? "",
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageShell>
      <header className="space-y-1">
        <h1 className="font-heading font-semibold text-2xl">
          Tilbakemeldinger
        </h1>
        <p className="text-muted-foreground text-sm">
          Innspill og ønsker fra medlemmene. Sett status og skriv et valgfritt
          svar som vises for den som sendte inn.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Alle ({counts.all})
        </Button>
        {feedbackStatuses.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {feedbackStatusLabels[s]} ({counts[s] ?? 0})
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ingen innspill her.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((it) => (
            <li key={it.id}>
              <Card>
                <CardHeader className="gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{it.title}</CardTitle>
                    <Badge variant={STATUS_VARIANT[it.status]}>
                      {feedbackStatusLabels[it.status]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
                    <span>{feedbackCategoryLabels[it.category]}</span>
                    <span>·</span>
                    <span>{it.userName ?? it.userEmail ?? "Ukjent"}</span>
                    <span>·</span>
                    <span>{formatDate(it.createdAt)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                    {it.description}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-[12rem_1fr] sm:items-start">
                    <div className="space-y-1.5">
                      <Label htmlFor={`status-${it.id}`}>Status</Label>
                      <select
                        id={`status-${it.id}`}
                        value={it.status}
                        onChange={(e) =>
                          patch(it.id, {
                            status: e.target.value as FeedbackStatus,
                          })
                        }
                        className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                      >
                        {feedbackStatuses.map((s) => (
                          <option key={s} value={s}>
                            {feedbackStatusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`resp-${it.id}`}>
                        Svar til medlemmet (valgfritt)
                      </Label>
                      <Textarea
                        id={`resp-${it.id}`}
                        value={it.adminResponse ?? ""}
                        onChange={(e) =>
                          patch(it.id, { adminResponse: e.target.value })
                        }
                        className="min-h-20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => save(it)}
                      disabled={savingId === it.id}
                    >
                      {savingId === it.id ? "Lagrer…" : "Lagre"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
