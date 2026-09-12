import type { getPayload } from "payload";

/** Felles hjelpere for MCP-verktøyene. */

export type Payload = Awaited<ReturnType<typeof getPayload>>;

export const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export const adminUrl = (id: number | string, collection = "pages") =>
  `${siteUrl}/admin/collections/${collection}/${id}`;

export const text = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

export const fail = (message: string) => ({
  isError: true,
  content: [{ type: "text" as const, text: message }],
});

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

/** ID fra et relasjonsfelt, uansett om det er populert eller ikke. */
export function relationId(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    return typeof id === "number" ? id : undefined;
  }
  return undefined;
}

export const isNumericId = (idOrSlug: string) => {
  const asId = Number(idOrSlug);
  return Number.isInteger(asId) && String(asId) === idOrSlug ? asId : null;
};
