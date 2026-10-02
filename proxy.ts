import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifySessionToken(session);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/customer") && payload.role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (
    pathname.startsWith("/agent") &&
    payload.role !== "AGENT" &&
    payload.role !== "FOUNDER"
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/founder") && payload.role !== "FOUNDER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/customer/:path*", "/agent/:path*", "/founder/:path*"],
};
