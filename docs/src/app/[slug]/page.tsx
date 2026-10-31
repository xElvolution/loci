import { notFound } from "next/navigation";
import { Chrome } from "@/components/Chrome";
import { allDocs, renderDoc } from "@/lib/docs";

export const dynamicParams = false;
export const generateStaticParams = () => allDocs().map((d) => ({ slug: d.slug }));

export async function generateMetadata({ params }: PageProps<"/[slug]">) {
  const doc = renderDoc((await params).slug);
  return { title: doc?.meta.title ?? "Not found" };
}

export default async function Doc({ params }: PageProps<"/[slug]">) {
  const doc = renderDoc((await params).slug);
  if (!doc) notFound();
  return (
    <Chrome current={doc.meta.slug}>
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_200px]">
        <article className="min-w-0">
          <p className="label-mono text-ember">{doc.meta.group}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl" data-testid="doc-title">{doc.meta.title}</h1>
          {/* Our own committed Markdown, rendered at build time. */}
          <div className="md mt-8" dangerouslySetInnerHTML={{ __html: doc.html }} />
        </article>
        {doc.toc.length > 2 && (
          <aside className="hidden xl:block">
            <div className="sticky top-24 text-sm">
              <p className="label-mono text-haze">On this page</p>
              <ul className="mt-2 space-y-1">
                {doc.toc.map((t) => (
                  <li key={t.id}><a href={`#${t.id}`} className="text-haze hover:text-white">{t.text}</a></li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </Chrome>
  );
}
