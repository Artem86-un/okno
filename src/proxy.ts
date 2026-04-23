import { NextResponse, type NextRequest } from "next/server";
import { appMode, isSupabaseConfigured } from "@/lib/env";

const protectedMatchers = ["/dashboard", "/schedule", "/clients", "/settings", "/team"];

function buildLoginRedirect(
  request: NextRequest,
  reason: "auth" | "setup" | "disabled",
) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("reason", reason);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  if (!protectedMatchers.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (appMode === "demo") {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured) {
    return buildLoginRedirect(request, "setup");
  }

  const hasSessionCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
    );

  if (!hasSessionCookie) {
    return buildLoginRedirect(request, "auth");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/schedule/:path*",
    "/clients/:path*",
    "/settings/:path*",
    "/team/:path*",
  ],
};
