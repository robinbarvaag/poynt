import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Sjekk om brukaren prøver å få tilgang til /min-side
  if (request.nextUrl.pathname.startsWith("/min-side")) {
    // Sjekk om payload-token cookie eksisterer
    const token = request.cookies.get("payload-token");

    if (!token) {
      // Redirect til innlogging
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/min-side/:path*"],
};
