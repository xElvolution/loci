import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClinician } from "@/lib/server/clinic";
import { teamTemplate } from "@/lib/server/templates";
import { TemplateEditor } from "@/components/clinic/TemplateTools";
import { PageTitle } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Edit template" };

export default async function TemplatePage(props: PageProps<"/clinic/templates/[id]">) {
  const { id } = await props.params;
  const { org } = await requireClinician(`/clinic/templates/${id}`);
  const t = await teamTemplate(org.id, id);
  if (!t) notFound();
  return (
    <div className="space-y-6">
      <Link href="/clinic/templates" className="inline-flex items-center gap-1.5 text-sm text-haze hover:text-white">
        <Icon name="arrowL" className="h-4 w-4" /> All templates
      </Link>
      <PageTitle eyebrow={t.based_on ? "Team template, copied from a loci structure" : "Team template"} title="Edit" accent={t.name} />
      <TemplateEditor orgId={org.id} id={t.id} name={t.name} description={t.description} specialty={t.specialty} horizonDays={t.horizon_days} body={t.body} />
    </div>
  );
}
