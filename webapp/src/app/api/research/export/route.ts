import { currentUser } from "@/lib/server/auth";
import { orgsOf } from "@/lib/server/repo";
import { logResearchAccess, orgResearch } from "@/lib/server/research";
import { toCsv } from "@/lib/care/research";

/** Aggregate-only research CSV for a team admin. Small groups are suppressed before anything is written. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const orgId = new URL(req.url).searchParams.get("org") ?? "";
  const org = (await orgsOf(user.id)).find((o) => o.id === orgId);
  if (!org || org.role !== "admin") return new Response("Only team admins can export research numbers.", { status: 403 });
  const a = await orgResearch(org.id);
  await logResearchAccess(org.id, user.id, "export", a);
  return new Response(toCsv(a), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="loci-research-aggregate.csv"`, "cache-control": "no-store" },
  });
}
