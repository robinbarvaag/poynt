"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import {
  resyncPromptTemplate,
  seedPromptTemplates,
  togglePromptActive,
  upsertPromptTemplate,
} from "../../actions/prompts";
import type { PromptTemplateListItem } from "../../views/prompts/list";

const toolIdLabels: Record<string, string> = {
  "channel-guide": "Kanalveileder",
  "decline-generator": "Si nei-generator",
  "marketing-plan": "Markedsplan",
  "yearly-planner": "Årshjul",
  "podcast-to-content": "Podcast til innhold",
  "brand-brief": "Merkevarebrief",
  "content-radar": "Innholdsradar",
  "inquiry-reply": "Svar på henvendelser",
};

type EditingState = {
  id: string;
  name: string;
  description: string;
  template: string;
  toolId: string;
};

export const PromptsTable = ({
  templates,
}: {
  templates: PromptTemplateListItem[];
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = () => router.refresh();

  async function handleSaveEdit() {
    if (!editing) return;
    setLoading(editing.id);
    try {
      await upsertPromptTemplate({
        id: editing.id,
        toolId: editing.toolId,
        name: editing.name,
        description: editing.description || undefined,
        template: editing.template,
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
      await togglePromptActive(id);
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSeed() {
    setLoading("seed");
    try {
      const result = await seedPromptTemplates();
      if (result.count === 0) {
        window.alert("Alle standard-prompts er allerede lagt inn.");
      }
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleResync(id: string, name: string) {
    if (
      !window.confirm(
        `Tilbakestill «${name}» til standard-teksten? Dette overskriver endringer i denne ene malen.`
      )
    ) {
      return;
    }
    setLoading(id);
    try {
      const res = await resyncPromptTemplate(id);
      if (res.notFound) {
        window.alert(
          "Denne malen har ingen innebygd standard å tilbakestille til."
        );
      }
      refresh();
    } finally {
      setLoading(null);
    }
  }

  const tdStyle: React.CSSProperties = {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--theme-elevation-100)",
    fontSize: "var(--font-body-size)",
    verticalAlign: "top",
  };

  const thStyle: React.CSSProperties = {
    ...tdStyle,
    fontWeight: 600,
    background: "var(--theme-elevation-50)",
    textAlign: "left",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.25rem 0.5rem",
    border: "1px solid var(--theme-elevation-200)",
    borderRadius: "var(--style-radius-s)",
    fontSize: "var(--font-body-size)",
    background: "var(--theme-bg)",
    color: "var(--theme-text)",
    width: "100%",
    boxSizing: "border-box",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "200px",
    fontFamily: "monospace",
    fontSize: "0.85em",
    resize: "vertical",
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
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          style={btnStyle("ghost")}
          onClick={handleSeed}
          disabled={loading === "seed"}
        >
          {loading === "seed" ? "Seeder..." : "Seed standard-prompts"}
        </button>
      </div>

      <div
        style={{
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "var(--style-radius-s)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Verktøy</th>
              <th style={thStyle}>Navn</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <Fragment key={t.id}>
                <tr>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "0.15rem 0.5rem",
                        borderRadius: "var(--style-radius-s)",
                        background: "var(--theme-elevation-100)",
                        fontSize: "0.85em",
                        fontFamily: "monospace",
                      }}
                    >
                      {toolIdLabels[t.toolId] ?? t.toolId}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div>
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          fontWeight: 500,
                          color: "var(--theme-text)",
                          textAlign: "left",
                          fontSize: "var(--font-body-size)",
                        }}
                        onClick={() =>
                          setExpandedId(expandedId === t.id ? null : t.id)
                        }
                      >
                        {t.name} {expandedId === t.id ? "▲" : "▼"}
                      </button>
                      {t.description && (
                        <p
                          style={{
                            margin: "0.25rem 0 0",
                            color: "var(--theme-elevation-500)",
                            fontSize: "0.85em",
                          }}
                        >
                          {t.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "var(--style-radius-s)",
                        fontSize: "0.8em",
                        fontWeight: 500,
                        background: t.isActive
                          ? "var(--theme-success-100)"
                          : "var(--theme-elevation-100)",
                        color: t.isActive
                          ? "var(--theme-success-700)"
                          : "var(--theme-elevation-500)",
                      }}
                    >
                      {t.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        style={btnStyle("ghost")}
                        onClick={() =>
                          setEditing({
                            id: t.id,
                            name: t.name,
                            description: t.description ?? "",
                            template: t.template,
                            toolId: t.toolId,
                          })
                        }
                      >
                        Rediger
                      </button>
                      <button
                        type="button"
                        style={btnStyle("ghost")}
                        onClick={() => handleResync(t.id, t.name)}
                        disabled={loading === t.id}
                      >
                        Tilbakestill
                      </button>
                      <button
                        type="button"
                        style={btnStyle("ghost")}
                        onClick={() => handleToggle(t.id)}
                        disabled={loading === t.id}
                      >
                        {t.isActive ? "Deaktiver" : "Aktiver"}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === t.id && (
                  <tr key={`${t.id}-expanded`}>
                    <td
                      colSpan={4}
                      style={{
                        ...tdStyle,
                        background: "var(--theme-elevation-50)",
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          fontFamily: "monospace",
                          fontSize: "0.85em",
                          color: "var(--theme-elevation-700)",
                        }}
                      >
                        {t.template}
                      </pre>
                    </td>
                  </tr>
                )}
                {editing?.id === t.id && (
                  <tr key={`${t.id}-edit`}>
                    <td
                      colSpan={4}
                      style={{
                        ...tdStyle,
                        background: "var(--theme-elevation-50)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0.75rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <div>
                          <label
                            htmlFor="edit-template-name"
                            style={{
                              display: "block",
                              marginBottom: "0.25rem",
                              fontWeight: 500,
                            }}
                          >
                            Navn
                          </label>
                          <input
                            id="edit-template-name"
                            style={inputStyle}
                            value={editing.name}
                            onChange={(e) =>
                              setEditing(
                                (p) => p && { ...p, name: e.target.value }
                              )
                            }
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="edit-template-description"
                            style={{
                              display: "block",
                              marginBottom: "0.25rem",
                              fontWeight: 500,
                            }}
                          >
                            Beskrivelse
                          </label>
                          <input
                            id="edit-template-description"
                            style={inputStyle}
                            value={editing.description}
                            onChange={(e) =>
                              setEditing(
                                (p) =>
                                  p && { ...p, description: e.target.value }
                              )
                            }
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label
                          htmlFor="edit-template-text"
                          style={{
                            display: "block",
                            marginBottom: "0.25rem",
                            fontWeight: 500,
                          }}
                        >
                          Prompt-tekst
                        </label>
                        <textarea
                          id="edit-template-text"
                          style={textareaStyle}
                          value={editing.template}
                          onChange={(e) =>
                            setEditing(
                              (p) => p && { ...p, template: e.target.value }
                            )
                          }
                        />
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          style={btnStyle("primary")}
                          onClick={handleSaveEdit}
                          disabled={loading === editing.id}
                        >
                          {loading === editing.id ? "Lagrer..." : "Lagre"}
                        </button>
                        <button
                          type="button"
                          style={btnStyle("ghost")}
                          onClick={() => setEditing(null)}
                        >
                          Avbryt
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {templates.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: "var(--theme-elevation-500)",
                    padding: "2rem",
                  }}
                >
                  Ingen prompt-maler enda. Klikk «Seed standard-prompts» for å
                  legge inn standard-malene.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
