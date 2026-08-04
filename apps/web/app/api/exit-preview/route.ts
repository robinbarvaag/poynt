import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/** Slår av draft mode (lenken i forhåndsvisnings-banneret). */
export async function GET(req: NextRequest) {
  (await draftMode()).disable();
  const path = req.nextUrl.searchParams.get("path") || "/";
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return NextResponse.redirect(new URL(safePath, req.nextUrl.origin));
}
