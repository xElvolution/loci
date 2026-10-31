import { NextResponse } from "next/server";
import { one } from "@/lib/server/db";
import { qlooConfigured } from "@/lib/server/qloo-http";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  try {
    db = Boolean(await one<{ ok: number }>("SELECT 1 AS ok"));
  } catch {
    db = false;
  }
  return NextResponse.json({ ok: db, db, qloo: qlooConfigured() }, { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
