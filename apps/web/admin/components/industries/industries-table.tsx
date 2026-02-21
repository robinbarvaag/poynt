"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createIndustry,
  deleteIndustry,
  seedIndustries,
  toggleIndustryActive,
  updateIndustry,
} from "../../actions/industries";
import type { IndustryListItem } from "../../views/industries/list";

type EditingState = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  promptHints: string;
};

export const IndustriesTable = ({
  industries,
}: {
  industries: IndustryListItem[];
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newIndustry, setNewIndustry] = useState({
    id: "",
    name: "",
    icon: "",
    promptHints: "",
  });

  const refresh = () => router.refresh();

  async function handleToggle(id: string) {
    setLoading(id);
    try {
      await toggleIndustryActive(id);
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Slett bransjen "${name}"? Dette kan ikkje angrast.`))
      return;
    setLoading(id);
    try {
      await deleteIndustry(id);
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setLoading(editing.id);
    try {
      await updateIndustry(editing.id, {
        name: editing.name,
        icon: editing.icon || undefined,
        sortOrder: editing.sortOrder,
        promptHints: editing.promptHints || undefined,
      });
      setEditing(null);
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleAdd() {
    if (!newIndustry.id || !newIndustry.name) return;
    setLoading("new");
    try {
      await createIndustry({
        id: newIndustry.id,
        name: newIndustry.name,
        icon: newIndustry.icon || undefined,
        promptHints: newIndustry.promptHints || undefined,
      });
      setShowAdd(false);
      setNewIndustry({ id: "", name: "", icon: "", promptHints: "" });
      refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSeed() {
    if (
      !window.confirm(
        "Seed standard bransjar? Dette vil feila om det allereie finst bransjar."
      )
    )
      return;
    setLoading("seed");
    try {
      const result = await seedIndustries();
      if (result.success) {
        refresh();
      } else {
        window.alert(result.error ?? "Seeding feila");
      }
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
        }}
      >
        <button
          type="button"
          style={btnStyle("primary")}
          onClick={() => setShowAdd(true)}
          disabled={showAdd}
        >
          + Ny bransje
        </button>
        {industries.length === 0 && (
          <button
            type="button"
            style={btnStyle("ghost")}
            onClick={handleSeed}
            disabled={loading === "seed"}
          >
            {loading === "seed" ? "Seeder..." : "Seed standard bransjar"}
          </button>
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
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Namn</th>
              <th style={thStyle}>Ikon</th>
              <th style={thStyle}>Rekkjefølge</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Handling</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && (
              <tr>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    placeholder="id (kebab-case)"
                    value={newIndustry.id}
                    onChange={(e) =>
                      setNewIndustry((p) => ({ ...p, id: e.target.value }))
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    placeholder="Namn"
                    value={newIndustry.name}
                    onChange={(e) =>
                      setNewIndustry((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    placeholder="Lucide icon"
                    value={newIndustry.icon}
                    onChange={(e) =>
                      setNewIndustry((p) => ({ ...p, icon: e.target.value }))
                    }
                  />
                </td>
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
            {industries.map((industry) => (
              <tr key={industry.id}>
                <td
                  style={{
                    ...tdStyle,
                    fontFamily: "monospace",
                    fontSize: "0.85em",
                  }}
                >
                  {industry.id}
                </td>
                <td style={tdStyle}>
                  {editing?.id === industry.id ? (
                    <input
                      style={inputStyle}
                      value={editing.name}
                      onChange={(e) =>
                        setEditing((p) => p && { ...p, name: e.target.value })
                      }
                    />
                  ) : (
                    industry.name
                  )}
                </td>
                <td style={tdStyle}>
                  {editing?.id === industry.id ? (
                    <input
                      style={{ ...inputStyle, width: "120px" }}
                      value={editing.icon}
                      onChange={(e) =>
                        setEditing((p) => p && { ...p, icon: e.target.value })
                      }
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.85em",
                        color: "var(--theme-elevation-500)",
                      }}
                    >
                      {industry.icon ?? "—"}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {editing?.id === industry.id ? (
                    <input
                      style={{ ...inputStyle, width: "70px" }}
                      type="number"
                      value={editing.sortOrder}
                      onChange={(e) =>
                        setEditing(
                          (p) =>
                            p && { ...p, sortOrder: Number(e.target.value) }
                        )
                      }
                    />
                  ) : (
                    industry.sortOrder
                  )}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "var(--style-radius-s)",
                      fontSize: "0.8em",
                      fontWeight: 500,
                      background: industry.isActive
                        ? "var(--theme-success-100)"
                        : "var(--theme-elevation-100)",
                      color: industry.isActive
                        ? "var(--theme-success-700)"
                        : "var(--theme-elevation-500)",
                    }}
                  >
                    {industry.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    {editing?.id === industry.id ? (
                      <>
                        <button
                          type="button"
                          style={btnStyle("primary")}
                          onClick={handleSaveEdit}
                          disabled={loading === industry.id}
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
                          onClick={() =>
                            setEditing({
                              id: industry.id,
                              name: industry.name,
                              icon: industry.icon ?? "",
                              sortOrder: industry.sortOrder,
                              promptHints: industry.promptHints ?? "",
                            })
                          }
                        >
                          Rediger
                        </button>
                        <button
                          type="button"
                          style={btnStyle("ghost")}
                          onClick={() => handleToggle(industry.id)}
                          disabled={loading === industry.id}
                        >
                          {industry.isActive ? "Deaktiver" : "Aktiver"}
                        </button>
                        <button
                          type="button"
                          style={btnStyle("danger")}
                          onClick={() =>
                            handleDelete(industry.id, industry.name)
                          }
                          disabled={loading === industry.id}
                        >
                          Slett
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {industries.length === 0 && !showAdd && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: "var(--theme-elevation-500)",
                    padding: "2rem",
                  }}
                >
                  Ingen bransjar. Klikk "Seed standard bransjar" for å starta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
