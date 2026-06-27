"use client";

import {
  type InspirationSourceTypeValue,
  inspirationSourceTypeLabels,
  inspirationSourceTypes,
} from "@poynt/planner-validators";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createInspirationSource,
  deleteInspirationSource,
  fetchInspirationNow,
  toggleInspirationSourceActive,
  updateInspirationSource,
} from "../../actions/inspiration";
import type {
  InspirationRecentItem,
  InspirationSourceItem,
} from "../../views/inspiration/list";

type EditingState = {
  id: string;
  label: string;
  url: string;
  type: InspirationSourceTypeValue;
  personName: string;
};

function fmtDate(d: unknown): string {
  if (!d) return "Aldri";
  return new Date(d as string).toLocaleString("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const InspirationSourcesTable = ({
  sources,
  counts,
  recentItems,
}: {
  sources: InspirationSourceItem[];
  counts: Record<string, number>;
  recentItems: InspirationRecentItem[];
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [newSource, setNewSource] = useState<{
    label: string;
    url: string;
    type: InspirationSourceTypeValue;
    personName: string;
  }>({ label: "", url: "", type: "rss", personName: "" });

  const refresh = () => router.refresh();

  async function handleAdd() {
    if (!newSource.label || !newSource.url) return;
    setLoading("new");
    try {
      await createInspirationSource({
        label: newSource.label,
        url: newSource.url,
        type: newSource.type,
        personName: newSource.personName || undefined,
      });
      setShowAdd(false);
      setNewSource({ label: "", url: "", type: "rss", personName: "" });
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setLoading(editing.id);
    try {
      await updateInspirationSource(editing.id, {
        label: editing.label,
        url: editing.url,
        type: editing.type,
        personName: editing.personName || null,
      });
      setEditing(null);
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleToggle(id: string) {
    setLoading(id);
    try {
      await toggleInspirationSourceActive(id);
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (
      !window.confirm(
        `Slett kilden "${label}" og dens hentede saker? Kan ikke angres.`
      )
    )
      return;
    setLoading(id);
    try {
      await deleteInspirationSource(id);
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleFetch(sourceId?: string) {
    setLoading(sourceId ?? "fetch-all");
    setMsg(null);
    try {
      const res = await fetchInspirationNow(sourceId);
      setMsg(
        res.success
          ? "Henting startet i bakgrunnen. Oppdater om et lite øyeblikk for å se nye saker."
          : `Kunne ikke starte: ${res.error ?? "ukjent feil"}`
      );
    } finally {
      setLoading(null);
    }
  }

  const tdStyle: React.CSSProperties = {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--theme-elevation-100)",
    fontSize: "var(--font-body-size)",
    verticalAlign: "middle",
  };
  const thStyle: React.CSSProperties = {
    ...tdStyle,
    fontWeight: 600,
    background: "var(--theme-elevation-50)",
    textAlign: "left",
    whiteSpace: "nowrap",
  };
  const inputStyle: React.CSSProperties = {
    padding: "0.25rem 0.5rem",
    border: "1px solid var(--theme-elevation-200)",
    borderRadius: "var(--style-radius-s)",
    fontSize: "var(--font-body-size)",
    background: "var(--theme-bg)",
    color: "var(--theme-text)",
    width: "100%",
  };
  const btnStyle = (
    variant: "primary" | "ghost" | "danger"
  ): React.CSSProperties => ({
    padding: "0.25rem 0.75rem",
    border: "none",
    borderRadius: "var(--style-radius-s)",
    fontSize: "var(--font-body-size)",
    cursor: "pointer",
    background:
      variant === "primary"
        ? "var(--theme-success-600)"
        : variant === "danger"
          ? "var(--theme-error-600)"
          : "var(--theme-elevation-100)",
    color: variant === "ghost" ? "var(--theme-text)" : "white",
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          style={btnStyle("primary")}
          onClick={() => setShowAdd(true)}
          disabled={showAdd}
        >
          + Ny kilde
        </button>
        <button
          type="button"
          style={btnStyle("ghost")}
          onClick={() => handleFetch()}
          disabled={loading === "fetch-all" || sources.length === 0}
        >
          {loading === "fetch-all" ? "Starter…" : "Hent alle nå"}
        </button>
        {msg && (
          <span
            style={{ fontSize: "0.82em", color: "var(--theme-elevation-600)" }}
          >
            {msg}
          </span>
        )}
      </div>

      <div
        style={{
          overflowX: "auto",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "var(--style-radius-s)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Navn</th>
              <th style={thStyle}>URL</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Person</th>
              <th style={thStyle}>Saker</th>
              <th style={thStyle}>Sist hentet</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && (
              <tr>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    placeholder="Navn"
                    value={newSource.label}
                    onChange={(e) =>
                      setNewSource((p) => ({ ...p, label: e.target.value }))
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    placeholder="https://…/feed"
                    value={newSource.url}
                    onChange={(e) =>
                      setNewSource((p) => ({ ...p, url: e.target.value }))
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <select
                    style={inputStyle}
                    value={newSource.type}
                    onChange={(e) =>
                      setNewSource((p) => ({
                        ...p,
                        type: e.target.value as InspirationSourceTypeValue,
                      }))
                    }
                  >
                    {inspirationSourceTypes.map((t) => (
                      <option key={t} value={t}>
                        {inspirationSourceTypeLabels[t]}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    placeholder="(valgfritt)"
                    value={newSource.personName}
                    onChange={(e) =>
                      setNewSource((p) => ({
                        ...p,
                        personName: e.target.value,
                      }))
                    }
                  />
                </td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      style={btnStyle("primary")}
                      onClick={handleAdd}
                      disabled={loading === "new"}
                    >
                      Lagre
                    </button>
                    <button
                      type="button"
                      style={btnStyle("ghost")}
                      onClick={() => setShowAdd(false)}
                    >
                      Avbryt
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {sources.map((source) => {
              const isEditing = editing?.id === source.id;
              return (
                <tr key={source.id}>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <input
                        style={inputStyle}
                        value={editing.label}
                        onChange={(e) =>
                          setEditing(
                            (p) => p && { ...p, label: e.target.value }
                          )
                        }
                      />
                    ) : (
                      source.label
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <input
                        style={inputStyle}
                        value={editing.url}
                        onChange={(e) =>
                          setEditing((p) => p && { ...p, url: e.target.value })
                        }
                      />
                    ) : (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "0.85em",
                          color: "var(--theme-elevation-500)",
                          textDecoration: "underline",
                        }}
                      >
                        {source.url.replace(/^https?:\/\//, "").slice(0, 40)}
                      </a>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <select
                        style={inputStyle}
                        value={editing.type}
                        onChange={(e) =>
                          setEditing(
                            (p) =>
                              p && {
                                ...p,
                                type: e.target
                                  .value as InspirationSourceTypeValue,
                              }
                          )
                        }
                      >
                        {inspirationSourceTypes.map((t) => (
                          <option key={t} value={t}>
                            {inspirationSourceTypeLabels[t]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      inspirationSourceTypeLabels[
                        source.type as InspirationSourceTypeValue
                      ]
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <input
                        style={inputStyle}
                        value={editing.personName}
                        onChange={(e) =>
                          setEditing(
                            (p) => p && { ...p, personName: e.target.value }
                          )
                        }
                      />
                    ) : (
                      (source.personName ?? "—")
                    )}
                  </td>
                  <td style={tdStyle}>{counts[source.id] ?? 0}</td>
                  <td
                    style={{
                      ...tdStyle,
                      fontSize: "0.85em",
                      color: "var(--theme-elevation-500)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtDate(source.lastFetchedAt)}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "var(--style-radius-s)",
                        fontSize: "0.8em",
                        fontWeight: 500,
                        background: source.isActive
                          ? "var(--theme-success-100)"
                          : "var(--theme-elevation-100)",
                        color: source.isActive
                          ? "var(--theme-success-700)"
                          : "var(--theme-elevation-500)",
                      }}
                    >
                      {source.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            style={btnStyle("primary")}
                            onClick={handleSaveEdit}
                            disabled={loading === source.id}
                          >
                            Lagre
                          </button>
                          <button
                            type="button"
                            style={btnStyle("ghost")}
                            onClick={() => setEditing(null)}
                          >
                            Avbryt
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            style={btnStyle("ghost")}
                            onClick={() => handleFetch(source.id)}
                            disabled={loading === source.id}
                          >
                            Hent
                          </button>
                          <button
                            type="button"
                            style={btnStyle("ghost")}
                            onClick={() =>
                              setEditing({
                                id: source.id,
                                label: source.label,
                                url: source.url,
                                type: source.type as InspirationSourceTypeValue,
                                personName: source.personName ?? "",
                              })
                            }
                          >
                            Rediger
                          </button>
                          <button
                            type="button"
                            style={btnStyle("ghost")}
                            onClick={() => handleToggle(source.id)}
                            disabled={loading === source.id}
                          >
                            {source.isActive ? "Deaktiver" : "Aktiver"}
                          </button>
                          <button
                            type="button"
                            style={btnStyle("danger")}
                            onClick={() =>
                              handleDelete(source.id, source.label)
                            }
                            disabled={loading === source.id}
                          >
                            Slett
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sources.length === 0 && !showAdd && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: "var(--theme-elevation-500)",
                    padding: "2rem",
                  }}
                >
                  Ingen kilder ennå. Legg til en offentlig RSS-feed eller
                  nettside for å gi radaren ekstern inspirasjon.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {recentItems.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.1em", marginBottom: "0.75rem" }}>
            Sist destillerte saker
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            {recentItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--theme-elevation-150)",
                  borderRadius: "var(--style-radius-m)",
                  background: "var(--theme-bg)",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "var(--theme-text)",
                        textDecoration: "underline",
                      }}
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </div>
                {item.summary && (
                  <div
                    style={{
                      fontSize: "0.88em",
                      color: "var(--theme-elevation-600)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {item.summary}
                  </div>
                )}
                {Array.isArray(item.topics) && item.topics.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.35rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {item.topics.map((topic) => (
                      <span
                        key={topic}
                        style={{
                          fontSize: "0.75em",
                          padding: "0.1rem 0.45rem",
                          borderRadius: "var(--style-radius-s)",
                          background: "var(--theme-elevation-100)",
                          color: "var(--theme-elevation-600)",
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
