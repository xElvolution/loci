import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { exportUser } from "@/lib/server/repo";
import { rateLimit } from "@/lib/server/rate-limit";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`export:${user.id}`, 10, 3600_000).ok) return NextResponse.json({ error: "Too many exports. Try again later." }, { status: 429 });
  const data = await exportUser(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="loci-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
