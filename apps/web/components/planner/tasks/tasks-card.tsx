"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Skeleton,
  Text,
  cn,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";
import { useEffect, useState } from "react";

// Lett type — trpc serialiserer datoer til string, og vi viser dem ikke.
interface Task {
  id: string;
  title: string;
  category: string | null;
  source: string;
  done: boolean;
}

/**
 * «Dine oppgaver» — det delte gjøremåls-lageret samlet på dashbordet. Oppgaver
 * kommer enten fra verktøyene (f.eks. markedsplanen) eller legges til manuelt
 * her. Limet som binder verktøyene sammen.
 */
export function TasksCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await trpc.task.list.query({ status: "all" });
        if (active) setTasks(rows);
      } catch {
        if (active) toast.error("Kunne ikke hente oppgavene.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const total = tasks.length;
  const doneCount = done.length;

  const toggle = async (task: Task) => {
    // Optimistisk — flipp lokalt, rull tilbake ved feil.
    setTasks((xs) =>
      xs.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    try {
      await trpc.task.toggle.mutate({ id: task.id });
    } catch {
      setTasks((xs) =>
        xs.map((t) => (t.id === task.id ? { ...t, done: task.done } : t))
      );
      toast.error("Kunne ikke oppdatere oppgaven.");
    }
  };

  const remove = async (id: string) => {
    const prev = tasks;
    setTasks((xs) => xs.filter((t) => t.id !== id));
    try {
      await trpc.task.remove.mutate({ id });
    } catch {
      setTasks(prev);
      toast.error("Kunne ikke slette oppgaven.");
    }
  };

  const add = async () => {
    const value = title.trim();
    if (!value) return;
    setAdding(true);
    try {
      const created = await trpc.task.add.mutate({ title: value });
      if (created) setTasks((xs) => [created, ...xs]);
      setTitle("");
    } catch {
      toast.error("Kunne ikke legge til oppgaven.");
    } finally {
      setAdding(false);
    }
  };

  const renderTask = (task: Task) => (
    <li key={task.id} className="group flex items-start gap-3">
      <Checkbox
        id={`task-${task.id}`}
        checked={task.done}
        onCheckedChange={() => toggle(task)}
        className="mt-0.5"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={cn(
          "flex-1 cursor-pointer text-sm leading-snug",
          task.done && "text-muted-foreground line-through"
        )}
      >
        {task.title}
        {task.category && (
          <Badge variant="muted" size="sm" className="ml-2 align-middle">
            {task.category}
          </Badge>
        )}
      </label>
      <button
        type="button"
        onClick={() => remove(task.id)}
        aria-label="Slett oppgaven"
        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Icon name="x" className="size-4" />
      </button>
    </li>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Icon name="check-circle" className="size-5 text-primary" />
            Dine oppgaver
          </CardTitle>
          {total > 0 && (
            <span className="text-muted-foreground text-sm">
              {doneCount} av {total} fullført
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : (
          <>
            {open.length > 0 ? (
              <ul className="space-y-2.5">{open.map(renderTask)}</ul>
            ) : (
              total === 0 && (
                <Text variant="muted" customStyles="text-sm">
                  Ingen oppgaver enda. Lag en markedsplan, eller legg til en
                  oppgave under.
                </Text>
              )
            )}

            {open.length === 0 && total > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                <Icon
                  name="check-circle"
                  className="mx-auto mb-2 size-7 text-primary"
                />
                <p className="font-medium text-sm">
                  Alt er gjort — bra jobba! 🎉
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Klar for neste steg? Planlegg innholdet for året i årshjulet.
                </p>
                <Button asChild size="sm" className="mt-3 gap-2">
                  <Link href="/on-poynt/verktoy/arsplanlegger">
                    <Icon name="calendar-days" className="size-4" />
                    Til årshjulet
                  </Link>
                </Button>
              </div>
            )}

            {/* Fullførte (sammenleggbart) */}
            {done.length > 0 && (
              <div className="border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowDone((v) => !v)}
                  className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground"
                >
                  <Icon
                    name="chevron-right"
                    className={cn(
                      "size-3.5 transition-transform",
                      showDone && "rotate-90"
                    )}
                  />
                  {done.length} fullført
                </button>
                {showDone && (
                  <ul className="mt-2.5 space-y-2.5">{done.map(renderTask)}</ul>
                )}
              </div>
            )}

            {/* Legg til */}
            <div className="flex gap-2 pt-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
                placeholder="Legg til en oppgave …"
                disabled={adding}
              />
              <Button
                onClick={add}
                disabled={adding || !title.trim()}
                size="icon"
                aria-label="Legg til oppgave"
              >
                <Icon name="plus" className="size-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
