"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  type FeedbackCategory,
  type FeedbackStatus,
  createFeedbackSchema,
  feedbackCategories,
  feedbackCategoryLabels,
  feedbackStatusLabels,
} from "@poynt/planner-validators";
import {
  Badge,
  type BadgeProps,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  PageShell,
  Textarea,
} from "@poynt/ui";
import { useState } from "react";

type FeedbackItem = {
  id: string;
  category: FeedbackCategory;
  title: string;
  description: string;
  status: FeedbackStatus;
  adminResponse: string | null;
  createdAt: string | Date;
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

export function FeedbackClient({ initial }: { initial: FeedbackItem[] }) {
  const [items, setItems] = useState<FeedbackItem[]>(initial);
  const [category, setCategory] = useState<FeedbackCategory>("challenge");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError(null);
    setSuccess(false);
    const parsed = createFeedbackSchema.safeParse({
      category,
      title,
      description,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Sjekk feltene.");
      return;
    }

    setSubmitting(true);
    try {
      await trpc.feedback.create.mutate(parsed.data);
      const fresh = (await trpc.feedback.listMine.query()) as FeedbackItem[];
      setItems(fresh);
      setTitle("");
      setDescription("");
      setCategory("challenge");
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke sende inn.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <header className="space-y-1">
        <h1 className="font-heading font-semibold text-2xl">
          Tilbakemelding & ønsker
        </h1>
        <p className="text-muted-foreground text-sm">
          Hva sliter du med i hverdagen som vi kunne hjulpet deg å løse? Hvilke
          verktøy eller funksjoner ønsker du deg? Send det inn — vi leser alt og
          gir deg status tilbake.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send inn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kategori</Label>
            <div className="flex flex-wrap gap-2">
              {feedbackCategories.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={c === category ? "default" : "outline"}
                  onClick={() => setCategory(c)}
                >
                  {feedbackCategoryLabels[c]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb-title">Tittel</Label>
            <Input
              id="fb-title"
              value={title}
              maxLength={140}
              placeholder="Kort oppsummert — f.eks. «Svar på Google-anmeldelser»"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb-desc">Beskrivelse</Label>
            <Textarea
              id="fb-desc"
              value={description}
              maxLength={4000}
              placeholder="Beskriv behovet eller utfordringen — gjerne med et konkret eksempel."
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && (
            <p className="text-sm text-foreground">
              Takk! Innspillet ditt er sendt inn.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? "Sender…" : "Send inn"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-heading font-semibold text-lg">
          Dine innsendinger
        </h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Du har ikke sendt inn noe ennå.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
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
                      <span>{formatDate(it.createdAt)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                      {it.description}
                    </p>
                    {it.adminResponse && (
                      <div className="rounded-md border bg-muted/40 p-3 text-sm">
                        <p className="mb-1 font-medium text-xs">
                          Svar fra Poynt
                        </p>
                        <p className="whitespace-pre-wrap">
                          {it.adminResponse}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
