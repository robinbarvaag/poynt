import { timingSafeEqual } from "node:crypto";
import { mcpHandler } from "@/lib/mcp/server";
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

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ secret: string }> }
) {
  const { secret } = await ctx.params;
  if (!authorized(req, secret)) {
    return Response.json({ error: "Ikke autorisert" }, { status: 401 });
  }
  return mcpHandler.fetch(req);
}

export { handle as GET, handle as POST, handle as DELETE };
