"use client";

import { ArticleRichText } from "@/components/article-rich-text";
import { resolveMediaUrl } from "@/components/payload-image";
import type { Course, Media } from "@/payload-types";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  ListDetail,
  ListDetailDetail,
  ListDetailDetailContent,
  ListDetailDetailHeader,
  ListDetailEmpty,
  ListDetailList,
  ListDetailListContent,
  ListDetailListHeader,
  ListDetailRow,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

type LessonRow = {
  key: string;
  moduleTitle: string;
  lesson: NonNullable<
    NonNullable<Course["modules"]>[number]["lessons"]
  >[number];
};

/** Gjør en YouTube/Vimeo-lenke om til en embed-URL. Andre URL-er brukes som de er. */
function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // Ugyldig URL — fall tilbake til rå-verdien.
  }
  return url;
}

export function CoursePlayer({ course }: { course: Course }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("leksjon");

  const modules = course.modules ?? [];
  const rows: LessonRow[] = [];
  for (let mi = 0; mi < modules.length; mi++) {
    const mod = modules[mi];
    const lessons = mod.lessons ?? [];
    for (let li = 0; li < lessons.length; li++) {
      rows.push({
        key: `m${mi}-l${li}`,
        moduleTitle: mod.title,
        lesson: lessons[li],
      });
    }
  }

  const setSelected = React.useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("leksjon", value);
      } else {
        params.delete("leksjon");
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  const active = rows.find((r) => r.key === selected) ?? null;

  return (
    <div className="flex h-[calc(100svh-7rem)] min-h-[30rem] flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/on-poynt/kurs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="arrow-left" className="size-4" />
          Kurs
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {course.title}
        </h1>
      </div>

      <ListDetail
        value={selected}
        onValueChange={setSelected}
        listWidth="22rem"
        className="flex-1"
      >
        <ListDetailList>
          <ListDetailListHeader>
            <span className="flex-1 text-sm font-medium">Innhald</span>
          </ListDetailListHeader>
          <ListDetailListContent>
            {modules.map((mod, mi) => (
              <div key={`mod-${mi}-${mod.title}`} className="mb-2">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {mod.title}
                </p>
                {(mod.lessons ?? []).map((lesson, li) => {
                  const key = `m${mi}-l${li}`;
                  return (
                    <ListDetailRow key={key} value={key}>
                      <span className="flex w-full items-center gap-2">
                        <Icon
                          name={lesson.videoUrl ? "play" : "file-text"}
                          className="size-3.5 shrink-0 text-muted-foreground"
                        />
                        <span className="flex-1 truncate">{lesson.title}</span>
                      </span>
                    </ListDetailRow>
                  );
                })}
              </div>
            ))}
            {rows.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Dette kurset har ingen leksjonar enda.
              </p>
            )}
          </ListDetailListContent>
        </ListDetailList>

        <ListDetailDetail
          empty={
            <ListDetailEmpty>
              <Icon name="graduation-cap" className="size-8 opacity-40" />
              <p className="text-sm">
                Vel ein leksjon til venstre for å starte.
              </p>
            </ListDetailEmpty>
          }
        >
          {active && (
            <>
              <ListDetailDetailHeader>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {active.moduleTitle}
                  </p>
                  <p className="truncate font-semibold">
                    {active.lesson.title}
                  </p>
                </div>
              </ListDetailDetailHeader>
              <ListDetailDetailContent>
                {active.lesson.videoUrl && (
                  <div className="mb-6 aspect-video w-full overflow-hidden rounded-2xl bg-muted">
                    <iframe
                      key={active.key}
                      src={toEmbedUrl(active.lesson.videoUrl)}
                      title={active.lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>
                )}

                {active.lesson.content && (
                  <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
                    <ArticleRichText
                      data={active.lesson.content as SerializedEditorState}
                    />
                  </div>
                )}

                {active.lesson.resources &&
                  active.lesson.resources.length > 0 && (
                    <div className="mt-8 border-t border-border pt-6">
                      <h3 className="mb-3 text-sm font-semibold">Ressursar</h3>
                      <ul className="space-y-2">
                        {active.lesson.resources.map((resource, ri) => {
                          const url =
                            resource.file && typeof resource.file !== "number"
                              ? resolveMediaUrl(resource.file as Media)
                              : undefined;
                          return (
                            <li key={resource.id ?? `res-${ri}`}>
                              {url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Icon name="download" className="size-4" />
                                  {resource.title}
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                  <Icon name="file-text" className="size-4" />
                                  {resource.title}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
              </ListDetailDetailContent>
            </>
          )}
        </ListDetailDetail>
      </ListDetail>
    </div>
  );
}
