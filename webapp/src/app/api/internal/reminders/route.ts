import { timingSafeEqual } from "node:crypto";
import { runDueReminders } from "@/lib/server/reminders/service";

/** Scheduler hook: POST with `Authorization: Bearer $CRON_SECRET`. Disabled (404) when CRON_SECRET is not set. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Not found", { status: 404 });
  const got = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  const want = Buffer.from(secret);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return new Response("Forbidden", { status: 403 });
  return Response.json(await runDueReminders());
}
