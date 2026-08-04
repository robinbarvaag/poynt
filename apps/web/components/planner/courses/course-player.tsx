"use client";

import { ArticleRichText } from "@/components/article-rich-text";
import { PayloadImage, resolveMediaUrl } from "@/components/payload-image";
import { trpc } from "@/lib/planner/trpc";
import type { Course, Media } from "@/payload-types";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  DeviceFrame,
  DownloadCard,
  Heading,
  type LessonItem,
  LessonList,
  StepBlock,
  StepPager,
  VideoEmbed,
} from "@poynt/ui";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

type Lesson = NonNullable<
  NonNullable<Course["modules"]>[number]["lessons"]
>[number];

type LessonRow = {
  key: string;
  moduleIndex: number;
  moduleTitle: string;
  lesson: Lesson;
};

function lessonType(lesson: Lesson): LessonItem["type"] {
  if (lesson.videoUrl) return "video";
  if (lesson.steps && lesson.steps.length > 0) return "steg";
  return "tekst";
}

function lessonMeta(lesson: Lesson): string | undefined {
  if (lesson.steps && lesson.steps.length > 0)
    return `${lesson.steps.length} steg`;
  if (lesson.videoUrl) return "Video";
  return undefined;
}

export function CoursePlayer({
  course,
  initialCompleted = [],
}: {
  course: Course;
  /** Fullførte leksjonsnøkler fra planner_course_progress (server-lastet). */
  initialCompleted?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modules = course.modules ?? [];
  const rows: LessonRow[] = [];
  for (let mi = 0; mi < modules.length; mi++) {
    const mod = modules[mi];
    const lessons = mod.lessons ?? [];
    for (let li = 0; li < lessons.length; li++) {
      rows.push({
        key: `m${mi}-l${li}`,
        moduleIndex: mi,
        moduleTitle: mod.title,
        lesson: lessons[li],
      });
    }
  }

  // Uten ?leksjon= starter vi på første leksjon — ingen tom tilstand.
  const param = searchParams.get("leksjon");
  const selected =
    rows.find((r) => r.key === param)?.key ?? rows[0]?.key ?? null;

  const [completed, setCompleted] = React.useState<Set<string>>(
    () => new Set(initialCompleted)
  );

  const toggleComplete = React.useCallback(() => {
    if (!selected) return;
    const wasCompleted = completed.has(selected);

    // Optimistisk: oppdater UI-et med en gang, rull tilbake om lagringen feiler.
    setCompleted((prev) => {
      const next = new Set(prev);
      if (wasCompleted) {
        next.delete(selected);
      } else {
        next.add(selected);
      }
      return next;
    });

    trpc.courseProgress.setCompleted
      .mutate({
        courseSlug: course.slug,
        lessonKey: selected,
        completed: !wasCompleted,
      })
      .catch(() => {
        setCompleted((prev) => {
          const next = new Set(prev);
          if (wasCompleted) {
            next.add(selected);
          } else {
            next.delete(selected);
          }
          return next;
        });
      });
  }, [selected, completed, course.slug]);

  const setSelected = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("leksjon", value);
      router.replace(`?${params.toString()}`, { scroll: false });
      document
        .getElementById("innhold")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [router, searchParams]
  );

  const index = rows.findIndex((r) => r.key === selected);
  const active = index >= 0 ? rows[index] : null;
  const prevRow = index > 0 ? rows[index - 1] : null;
  const nextRow =
    index >= 0 && index < rows.length - 1 ? rows[index + 1] : null;

  if (rows.length === 0) {
    return (
      <p className="rounded-3xl bg-card p-8 text-center text-muted-foreground text-sm ring-1 ring-foreground/10">
        Dette kurset har ingen leksjoner enda.
      </p>
    );
  }

  const listItems = (mi: number): LessonItem[] =>
    rows
      .filter((r) => r.moduleIndex === mi)
      .map((r) => ({
        id: r.key,
        title: r.lesson.title,
        type: lessonType(r.lesson),
        meta: lessonMeta(r.lesson),
        completed: completed.has(r.key),
      }));

  return (
    <div
      id="innhold"
      className="scroll-mt-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12"
    >
      <aside className="mb-10 lg:mb-0">
        <div className="flex flex-col gap-8 lg:sticky lg:top-10">
          {modules.map((mod, mi) => (
            <LessonList
              key={`mod-${mi}-${mod.title}`}
              title={modules.length > 1 ? mod.title : "Innhold i kurset"}
              items={listItems(mi)}
              activeId={selected ?? undefined}
              onSelect={setSelected}
            />
          ))}
        </div>
      </aside>

      {active && (
        <article className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Leksjon {index + 1} av {rows.length}
              {modules.length > 1 ? ` · ${active.moduleTitle}` : ""}
            </span>
            <Heading variant="h2">{active.lesson.title}</Heading>
          </div>

          {active.lesson.videoUrl && (
            <VideoEmbed
              key={active.key}
              url={active.lesson.videoUrl}
              title={active.lesson.title}
            />
          )}

          {active.lesson.content && (
            <div className="prose prose-lg max-w-none prose-a:text-primary prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground">
              <ArticleRichText
                data={active.lesson.content as SerializedEditorState}
              />
            </div>
          )}

          {active.lesson.steps && active.lesson.steps.length > 0 && (
            <div className="flex flex-col gap-2">
              {active.lesson.steps.map((step, si) => {
                const image =
                  step.image && typeof step.image === "object"
                    ? (step.image as Media)
                    : null;
                return (
                  <StepBlock
                    key={step.id ?? `step-${si}`}
                    number={si + 1}
                    title={step.title}
                    substeps={(step.substeps ?? []).map((s) => s.text)}
                  >
                    {step.body && (
                      <ArticleRichText
                        data={step.body as SerializedEditorState}
                      />
                    )}
                    {image?.url && (
                      <DeviceFrame variant="browser">
                        <PayloadImage media={image} alt={step.title} />
                      </DeviceFrame>
                    )}
                  </StepBlock>
                );
              })}
            </div>
          )}

          {active.lesson.resources && active.lesson.resources.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-heading font-semibold text-sm">Ressurser</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {active.lesson.resources.map((resource, ri) => {
                  const file =
                    resource.file && typeof resource.file !== "number"
                      ? (resource.file as Media)
                      : null;
                  const url = file ? resolveMediaUrl(file) : undefined;
                  const isPdf = file?.mimeType?.includes("pdf") ?? false;
                  return (
                    <DownloadCard
                      key={resource.id ?? `res-${ri}`}
                      title={resource.title}
                      kind={isPdf ? "pdf" : "other"}
                      href={url}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <StepPager
            prev={
              prevRow
                ? { label: "Forrige", onClick: () => setSelected(prevRow.key) }
                : undefined
            }
            next={
              nextRow
                ? {
                    label: "Neste leksjon",
                    onClick: () => setSelected(nextRow.key),
                  }
                : undefined
            }
            completed={selected ? completed.has(selected) : false}
            onToggleComplete={toggleComplete}
          />
        </article>
      )}
    </div>
  );
}
