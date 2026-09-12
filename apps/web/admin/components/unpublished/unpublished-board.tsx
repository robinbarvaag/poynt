"use client";

import type { UnpublishedRow } from "@/lib/unpublished-overview";
import { Button, toast } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { publishDocument } from "../../actions/publish";

/**
 * Brettet i «Klar til publisering» (/admin/upublisert): alt innhold der siste
 * versjon er et utkast — enten aldri publisert, eller publisert og endret
 * etterpå.
 *
 * Tastaturet er hovedpoenget: pil opp/ned (eller J/K) flytter markøren, P
 * publiserer raden, Shift+P publiserer alt i lista, Enter åpner dokumentet.
 * Radene forsvinner ikke ved publisering — de blir stående som «Publisert» til
 * siden lastes på nytt, så man ser hva som faktisk ble gjort.
 */

type RowState = "idle" | "publishing" | "published" | "error";

interface BoardRow extends UnpublishedRow {
  state: RowState;
  error?: string;
}

type Filter = "all" | "changed" | "never-published";

const STATUS_META: Record<
  UnpublishedRow["status"],
  { label: string; color: string }
> = {
  changed: {
    label: "Endret siden publisering",
    color: "var(--theme-warning-500, #eab308)",
  },
  "never-published": {
    label: "Aldri publisert",
    color: "var(--theme-elevation-400)",
  },
};

const rowKey = (row: { collection: string; id: string | number }) =>
  `${row.collection}:${row.id}`;

const editHref = (row: UnpublishedRow) =>
  `/admin/collections/${row.collection}/${row.id}`;

function formatDateTime(iso: string | null): string {
  if (!iso) return "–";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const cell: CSSProperties = {
  padding: "0.55rem 0.75rem",
  borderBottom: "1px solid var(--theme-elevation-100)",
  verticalAlign: "top",
};

const headCell: CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--theme-elevation-500)",
  borderBottom: "1px solid var(--theme-elevation-150)",
};

const kbd: CSSProperties = {
  display: "inline-block",
  minWidth: "1.4rem",
  padding: "0.1rem 0.35rem",
  border: "1px solid var(--theme-elevation-200)",
  borderBottomWidth: 2,
  borderRadius: "0.25rem",
  background: "var(--theme-elevation-50)",
  fontFamily: "var(--font-mono, monospace)",
  fontSize: "0.72rem",
  textAlign: "center",
};

export const UnpublishedBoard = ({
  rows: initial,
}: { rows: UnpublishedRow[] }) => {
  const router = useRouter();
  const [rows, setRows] = useState<BoardRow[]>(
    initial.map((row) => ({ ...row, state: "idle" }))
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState(0);
  const [bulkRunning, setBulkRunning] = useState(false);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      changed: rows.filter((r) => r.status === "changed").length,
      "never-published": rows.filter((r) => r.status === "never-published")
        .length,
    }),
    [rows]
  );

  const pending = visible.filter(
    (r) => r.state === "idle" || r.state === "error"
  );

  // Markøren skal aldri peke utenfor lista når filteret endrer seg.
  useEffect(() => {
    setSelected((current) =>
      Math.min(current, Math.max(visible.length - 1, 0))
    );
  }, [visible.length]);

  const patchRow = useCallback((key: string, patch: Partial<BoardRow>) => {
    setRows((prev) =>
      prev.map((r) => (rowKey(r) === key ? { ...r, ...patch } : r))
    );
  }, []);

  const publishRow = useCallback(
    async (row: BoardRow): Promise<boolean> => {
      if (row.state === "publishing" || row.state === "published") return false;
      const key = rowKey(row);
      patchRow(key, { state: "publishing", error: undefined });
      const result = await publishDocument(row.collection, row.id);
      if (result.success) {
        patchRow(key, { state: "published" });
        toast.success(`«${row.title}» er publisert.`);
        return true;
      }
      patchRow(key, { state: "error", error: result.error });
      toast.error(`Kunne ikke publisere «${row.title}»: ${result.error}`);
      return false;
    },
    [patchRow]
  );

  const publishAll = useCallback(async () => {
    if (bulkRunning || pending.length === 0) return;
    setBulkRunning(true);
    let done = 0;
    for (const row of pending) {
      // Én om gangen: hver publisering revaliderer nettsiden i en
      // afterChange-hook.
      const ok = await publishRow(row);
      if (ok) done += 1;
    }
    setBulkRunning(false);
    toast.success(
      done === pending.length
        ? `Publiserte ${done} ${done === 1 ? "dokument" : "dokumenter"}.`
        : `Publiserte ${done} av ${pending.length}. Se radene som feilet.`
    );
    router.refresh();
  }, [bulkRunning, pending, publishRow, router]);

  // Hurtigtaster. Hopper over når fokus står i et skjemafelt, og når en
  // modifikator (bortsett fra Shift+P) er nede — Cmd+P skal fortsatt skrive ut.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // Raden håndterte tasten selv (Enter på en fokusert rad).
      if (event.defaultPrevented) return;

      const current = visible[selected];

      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        setSelected((i) => Math.min(i + 1, Math.max(visible.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        setSelected((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === "Enter" && current) {
        event.preventDefault();
        router.push(editHref(current));
        return;
      }
      if (event.key === "P" && event.shiftKey) {
        event.preventDefault();
        void publishAll();
        return;
      }
      if (event.key === "p" && current) {
        event.preventDefault();
        void publishRow(current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, selected, publishRow, publishAll, router]);

  // Hold den markerte raden synlig når man tastar seg nedover lange lister.
  useEffect(() => {
    const current = visible[selected];
    if (!current) return;
    rowRefs.current[rowKey(current)]?.scrollIntoView({ block: "nearest" });
  }, [selected, visible]);

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "0.5rem",
          background: "var(--theme-elevation-50)",
          textAlign: "center",
        }}
      >
        <strong>Alt er publisert.</strong>
        <p
          style={{
            margin: "0.5rem 0 0",
            color: "var(--theme-elevation-500)",
            fontSize: "0.85rem",
          }}
        >
          Ingen sider, blogginnlegg eller andre dokumenter har endringer som
          venter.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        {(
          [
            ["all", "Alt"],
            ["changed", "Endret siden publisering"],
            ["never-published", "Aldri publisert"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            buttonStyle={filter === value ? "primary" : "pill"}
            size="small"
            margin={false}
            onClick={() => setFilter(value)}
            disabled={bulkRunning}
          >
            {`${label} (${counts[value]})`}
          </Button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <Button
          buttonStyle="pill"
          size="small"
          margin={false}
          onClick={publishAll}
          disabled={bulkRunning || pending.length === 0}
        >
          {bulkRunning
            ? "Publiserer …"
            : pending.length === 0
              ? "Ingenting å publisere"
              : `Publiser alle i lista (${pending.length})`}
        </Button>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.78rem",
            color: "var(--theme-elevation-500)",
            flexWrap: "wrap",
          }}
        >
          <span style={kbd}>↑</span>
          <span style={kbd}>↓</span>
          flytt
          <span style={kbd}>P</span>
          publiser
          <span style={kbd}>⇧P</span>
          publiser alle
          <span style={kbd}>↵</span>
          åpne
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Tittel", "Type", "Status", "Endret", "Publisert", ""].map(
                (heading) => (
                  <th key={heading || "handling"} style={headCell}>
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => {
              const key = rowKey(row);
              const isSelected = index === selected;
              const meta = STATUS_META[row.status];
              const isDone = row.state === "published";
              return (
                <tr
                  key={key}
                  ref={(el) => {
                    rowRefs.current[key] = el;
                  }}
                  tabIndex={0}
                  onClick={() => setSelected(index)}
                  onFocus={() => setSelected(index)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    router.push(editHref(row));
                  }}
                  style={{
                    background: isSelected
                      ? "var(--theme-elevation-50)"
                      : "transparent",
                    boxShadow: isSelected
                      ? "inset 3px 0 0 var(--theme-text)"
                      : undefined,
                    opacity: isDone ? 0.55 : 1,
                    cursor: "pointer",
                  }}
                >
                  <td style={cell}>
                    <Link
                      href={editHref(row)}
                      prefetch={false}
                      style={{ textDecoration: "none" }}
                    >
                      {row.title}
                    </Link>
                    {row.slug && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.72rem",
                          color: "var(--theme-elevation-400)",
                        }}
                      >
                        /{row.slug}
                      </span>
                    )}
                    {row.state === "error" && row.error && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          color: "var(--theme-error-500, #ef4444)",
                        }}
                      >
                        {row.error}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      ...cell,
                      fontSize: "0.82rem",
                      color: "var(--theme-elevation-600)",
                    }}
                  >
                    {row.collectionLabel}
                  </td>
                  <td style={cell}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: isDone
                            ? "var(--theme-success-500, #22c55e)"
                            : meta.color,
                        }}
                      />
                      {isDone ? "Publisert" : meta.label}
                    </span>
                  </td>
                  <td
                    style={{
                      ...cell,
                      fontSize: "0.8rem",
                      color: "var(--theme-elevation-600)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateTime(row.draftUpdatedAt)}
                  </td>
                  <td
                    style={{
                      ...cell,
                      fontSize: "0.8rem",
                      color: "var(--theme-elevation-600)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateTime(row.publishedAt)}
                  </td>
                  <td style={{ ...cell, whiteSpace: "nowrap" }}>
                    <Button
                      buttonStyle="pill"
                      size="small"
                      margin={false}
                      onClick={() => {
                        setSelected(index);
                        void publishRow(row);
                      }}
                      disabled={
                        bulkRunning ||
                        row.state === "publishing" ||
                        row.state === "published"
                      }
                    >
                      {row.state === "publishing"
                        ? "Publiserer …"
                        : row.state === "published"
                          ? "Publisert"
                          : "Publiser"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
