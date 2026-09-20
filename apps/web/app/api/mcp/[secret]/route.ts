import { timingSafeEqual } from "node:crypto";
import { mcpHandler } from "@/lib/mcp/server";
import { SUBSCRIPTION_ID_META_KEY } from "@modelcontextprotocol/server";
import type { NextRequest } from "next/server";

/**
 * MCP-endepunkt for Claude: POST /api/mcp/<MCP_SECRET>. Hemmeligheten ligger i
 * URL-en fordi claude.ai-connectorer ikke kan sende egne headere (kun OAuth
 * eller ingen auth). Klienter som kan sende headere (Claude Code) kan i stedet
 * bruke `Authorization: Bearer <MCP_SECRET>` mot en vilkårlig sti. Uten
 * MCP_SECRET i miljøet er endepunktet avslått. Se docs/MCP.md.
 */

export const maxDuration = 60;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function authorized(req: NextRequest, pathSecret: string): boolean {
  const secret = process.env.MCP_SECRET;
  if (!secret || secret.length < 16) return false;
  if (safeEqual(pathSecret, secret)) return true;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return !!bearer && safeEqual(bearer, secret);
}

/**
 * `subscriptions/listen` ber om en SSE-strøm som står åpen til klienten lukker
 * den. På Vercel lever funksjonen da til `maxDuration` og felles med «Task
 * timed out after 60 seconds» — én gang i minuttet så lenge en klient er
 * tilkoblet. Vi har ingenting å varsle om (verktøylista er statisk, og
 * ingenting kaller `mcpHandler.notify`), så vi kvitterer med et tomt abonnement
 * og lukker det med en gang. Se også `capabilities` i lib/mcp/server.ts, som
 * gjør at veloppdragne klienter ikke spør om dette i det hele tatt.
 */
function emptySubscription(id: unknown): Response {
  const frame = (message: unknown) =>
    `event: message\ndata: ${JSON.stringify(message)}\n\n`;
  const meta = { [SUBSCRIPTION_ID_META_KEY]: id };
  const body =
    frame({
      jsonrpc: "2.0",
      method: "notifications/subscriptions/acknowledged",
      params: { notifications: {}, _meta: meta },
    }) +
    frame({
      jsonrpc: "2.0",
      id,
      result: { resultType: "complete", _meta: meta },
    });
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ secret: string }> }
) {
  const { secret } = await ctx.params;
  if (!authorized(req, secret)) {
    return Response.json({ error: "Ikke autorisert" }, { status: 401 });
  }
  if (req.method !== "POST") return mcpHandler.fetch(req);

  // Kroppen må leses for å kunne avvise listen-strømmer, så den sendes videre
  // i en ny Request (en Request-kropp kan bare leses én gang).
  const raw = await req.text();
  let message: { method?: unknown; id?: unknown } | undefined;
  try {
    message = JSON.parse(raw);
  } catch {
    message = undefined;
  }
  if (message?.method === "subscriptions/listen" && message.id !== undefined) {
    return emptySubscription(message.id);
  }
  return mcpHandler.fetch(
    new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: raw,
    })
  );
}

export { handle as GET, handle as POST, handle as DELETE };
