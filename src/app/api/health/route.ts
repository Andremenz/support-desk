import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function getErrorDetails(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "unknown";

  return {
    code,
    error: message.replace(
      /(postgres(?:ql)?:\/\/)[^/\s@]+@/gi,
      "$1[REDACTED]@",
    ),
  };
}

export async function GET() {
  try {
    const users = await prisma.user.count();
    return NextResponse.json(
      { ok: true, users },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    const details = getErrorDetails(error);
    console.error("Health check database query failed", details.code);

    return NextResponse.json(
      { ok: false, ...details },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
