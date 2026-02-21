"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deletePromptTemplate,
  togglePromptActive,
  upsertPromptTemplate,
} from "../../actions/prompts";
import type { PromptTemplateListItem } from "../../views/prompts/list";

function generateId(toolId: string, name: string): string {
  return `${toolId}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const toolIdLabels: Record<string, string> = {
  "channel-guide": "Kanalveileder",
  "decline-generator": "Si nei-generator",
  "marketing-plan": "Markedsplan",
  "yearly-planner": "Årshjul",
  "podcast-to-content": "Podcast til innhold",
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
  const [showAdd, setShowAdd] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    toolId: "",
    name: "",
    description: "",
    template: "",
  });
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

  async function handleAdd() {
    if (!newTemplate.name || !newTemplate.template || !newTemplate.toolId)
      return;
    const id = generateId(newTemplate.toolId, newTemplate.name);
    setLoading("new");
    try {
      await upsertPromptTemplate({
        id,
        toolId: newTemplate.toolId,
        name: newTemplate.name,
        description: newTemplate.description || undefined,
        template: newTemplate.template,
      });
      setShowAdd(false);
      setNewTemplate({
        toolId: "",
        name: "",
        description: "",
        template: "",
      });
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

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Slett malen "${name}"?`)) return;
    setLoading(id);
    try {
      await deletePromptTemplate(id);
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
      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          style={btnStyle("primary")}
          onClick={() => setShowAdd(true)}
          disabled={showAdd}
        >
          + Ny mal
        </button>
      </div>

      {showAdd && (
        <div
          style={{
            border: "1px solid var(--theme-elevation-200)",
            borderRadius: "var(--style-radius-s)",
            padding: "1rem",
            marginBottom: "1rem",
            background: "var(--theme-elevation-50)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Ny prompt-mal</h3>
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
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontWeight: 500,
                }}
              >
                Verktøy
              </label>
              <select
                style={inputStyle}
                value={newTemplate.toolId}
                onChange={(e) =>
                  setNewTemplate((p) => ({ ...p, toolId: e.target.value }))
                }
              >
                <option value="">Velg verktøy</option>
                {Object.entries(toolIdLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontWeight: 500,
                }}
              >
                Navn
              </label>
              <input
                style={inputStyle}
                placeholder="Navn"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontWeight: 500,
                }}
              >
                Beskrivelse (valgfritt)
              </label>
              <input
                style={inputStyle}
                placeholder="Beskrivelse"
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontWeight: 500,
              }}
            >
              Prompt-tekst
            </label>
            <textarea
              style={textareaStyle}
              placeholder="Skriv prompt-teksten her..."
              value={newTemplate.template}
              onChange={(e) =>
                setNewTemplate((p) => ({ ...p, template: e.target.value }))
              }
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              style={btnStyle("primary")}
              onClick={handleAdd}
              disabled={loading === "new"}
            >
              {loading === "new" ? "Lagrer..." : "Lagre"}
            </button>
            <button
              type="button"
              style={btnStyle("ghost")}
              onClick={() => setShowAdd(false)}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

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
              <>
                <tr key={t.id}>
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
                        onClick={() => handleToggle(t.id)}
                        disabled={loading === t.id}
                      >
                        {t.isActive ? "Deaktiver" : "Aktiver"}
                      </button>
                      <button
                        type="button"
                        style={btnStyle("danger")}
                        onClick={() => handleDelete(t.id, t.name)}
                        disabled={loading === t.id}
                      >
                        Slett
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
                            style={{
                              display: "block",
                              marginBottom: "0.25rem",
                              fontWeight: 500,
                            }}
                          >
                            Navn
                          </label>
                          <input
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
                            style={{
                              display: "block",
                              marginBottom: "0.25rem",
                              fontWeight: 500,
                            }}
                          >
                            Beskrivelse
                          </label>
                          <input
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
                          style={{
                            display: "block",
                            marginBottom: "0.25rem",
                            fontWeight: 500,
                          }}
                        >
                          Prompt-tekst
                        </label>
                        <textarea
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
              </>
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
                  Ingen prompt-maler enda. Klikk «+ Ny mal» for å komme i gang.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
