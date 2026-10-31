import { requireClinician } from "@/lib/server/clinic";
import { teamTemplates } from "@/lib/server/templates";
import { BUILTIN_TEMPLATES } from "@/lib/care/templates";
import { specialtyOf } from "@/lib/care/specialties";
import { instrumentOf } from "@/lib/care/instruments";
import { prettyDate, toIso } from "@/lib/care/dates";
import { CopyBuiltin, DeleteTemplate } from "@/components/clinic/TemplateTools";
import { LinkButton, PageTitle } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Plan templates" };

export default async function TemplatesPage() {
  const { org } = await requireClinician("/clinic/templates");
  const mine = await teamTemplates(org.id);
  const count = (b: { items: unknown[] }) => `${b.items.length} item${b.items.length === 1 ? "" : "s"}`;
  return (
    <div className="space-y-8">
      <div>
        <PageTitle eyebrow={org.name} title="Plan" accent="templates." />
        <p className="-mt-2 max-w-2xl text-haze">Start new plans from your team&apos;s own templates, or from a loci structure template. Structure templates hold sections and prompts only. Each item needs your words before a plan can be sent.</p>
      </div>

      <section aria-labelledby="team-h" className="space-y-3">
        <h2 id="team-h" className="text-xl font-bold">Your team&apos;s templates</h2>
        {mine.length === 0 && <p className="glass rounded-3xl p-5 text-sm text-haze" data-testid="no-team-templates">None yet. Copy a structure template below, or save any plan as a template from its plan page.</p>}
        <ul className="grid gap-3 md:grid-cols-2">
          {mine.map((t) => (
            <li key={t.id} className="glass flex min-w-0 flex-col rounded-3xl p-5" data-testid="team-template">
              <p className="label-mono text-[11px] text-haze">{specialtyOf(t.specialty).label} · {count(t.body)} · {t.body.signs.length} warning signs</p>
              <p className="mt-1 text-lg font-bold break-words">{t.name}</p>
              {t.description && <p className="mt-1 text-sm text-haze">{t.description}</p>}
              <p className="mt-2 text-xs text-haze/80">Updated {prettyDate(toIso(t.updated_at))}{t.author ? ` by ${t.author}` : ""}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <LinkButton href={`/clinic/new?template=${t.id}`} className="h-10 px-4 text-sm" data-testid="use-template">Use for a new plan</LinkButton>
                <LinkButton href={`/clinic/templates/${t.id}`} variant="outline" className="h-10 px-4 text-sm" data-testid="edit-template"><Icon name="edit" className="h-4 w-4" /> Edit</LinkButton>
                <DeleteTemplate orgId={org.id} id={t.id} name={t.name} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="builtin-h" className="space-y-3">
        <h2 id="builtin-h" className="text-xl font-bold">loci structure templates</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {BUILTIN_TEMPLATES.map((t) => (
            <li key={t.id} className="glass flex min-w-0 flex-col rounded-3xl p-5" data-testid="builtin-template">
              <p className="label-mono text-[11px] text-haze">{specialtyOf(t.specialty).label} · {count(t.body)} · structure only</p>
              <p className="mt-1 text-lg font-bold break-words">{t.name}</p>
              <p className="mt-1 text-sm text-haze">{t.description}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {t.body.items.map((it, i) => (
                  <li key={i} className="rounded-full border border-white/10 px-2.5 py-1 text-[#e9e4ff]/85">{it.title}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-haze">Suggested measures: {t.body.measures.map((m) => instrumentOf(m)?.short).join(", ")}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <LinkButton href={`/clinic/new?template=${encodeURIComponent(t.id)}`} className="h-10 px-4 text-sm" data-testid="use-builtin">Use for a new plan</LinkButton>
                <CopyBuiltin orgId={org.id} id={t.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
