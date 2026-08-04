"use client";

import type { EmailPreview } from "@poynt/email";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Forhåndsvisning av e-postmalene: malliste til venstre, rendret e-post i en
 * sandboxa iframe til høyre. Mobil/desktop-bryteren endrer bare bredden på
 * iframen — e-postene er responsive på samme måte som i ekte klienter.
 */
export function EmailPreviewPanel({ previews }: { previews: EmailPreview[] }) {
  const [activeKey, setActiveKey] = useState(previews[0]?.key);
  const [mobile, setMobile] = useState(false);

  const groups = useMemo(() => {
    const byGroup = new Map<string, EmailPreview[]>();
    for (const preview of previews) {
      const list = byGroup.get(preview.group) ?? [];
      list.push(preview);
      byGroup.set(preview.group, list);
    }
    return [...byGroup.entries()];
  }, [previews]);

  const active = previews.find((p) => p.key === activeKey) ?? previews[0];
  if (!active) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        gap: "1.5rem",
        alignItems: "start",
      }}
    >
      <nav aria-label="E-postmaler">
        {groups.map(([group, items]) => (
          <div key={group} style={{ marginBottom: "1.25rem" }}>
            <p
              style={{
                margin: "0 0 0.35rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--theme-elevation-400)",
              }}
            >
              {group}
            </p>
            {items.map((item) => {
              const isActive = item.key === active.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveKey(item.key)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.45rem 0.6rem",
                    marginBottom: "2px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: isActive ? 600 : 400,
                    background: isActive
                      ? "var(--theme-elevation-100)"
                      : "transparent",
                    color: isActive
                      ? "var(--theme-elevation-800)"
                      : "var(--theme-elevation-600)",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div>
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0 }}>{active.label}</h2>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {[
                { label: "Desktop", value: false },
                { label: "Mobil", value: true },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setMobile(option.value)}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "999px",
                    border: "1px solid var(--theme-elevation-150)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    background:
                      mobile === option.value
                        ? "var(--theme-elevation-800)"
                        : "transparent",
                    color:
                      mobile === option.value
                        ? "var(--theme-elevation-0)"
                        : "var(--theme-elevation-600)",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p
            style={{
              margin: "0.5rem 0 0",
              maxWidth: "70ch",
              color: "var(--theme-elevation-500)",
            }}
          >
            {active.description}
          </p>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "0.85rem",
              color: "var(--theme-elevation-500)",
            }}
          >
            <strong style={{ color: "var(--theme-elevation-700)" }}>
              Emne:
            </strong>{" "}
            {active.subject}
            {" · "}
            <strong style={{ color: "var(--theme-elevation-700)" }}>
              Til:
            </strong>{" "}
            {active.to}
          </p>
          {active.editHint ? (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
              <Link href={active.editHint.href} prefetch={false}>
                {active.editHint.label} →
              </Link>
            </p>
          ) : null}
        </div>

        <div
          style={{
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#f2fafa",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <iframe
            title={`Forhåndsvisning: ${active.label}`}
            srcDoc={active.html}
            sandbox=""
            style={{
              width: mobile ? "375px" : "100%",
              maxWidth: "100%",
              height: "72vh",
              minHeight: "480px",
              border: "none",
              background: "#f2fafa",
            }}
          />
        </div>
      </div>
    </div>
  );
}
