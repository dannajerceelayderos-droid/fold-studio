"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CssBox } from "@/components/CssBox";
import { AppHeader } from "@/components/site/AppHeader";
import { TemplateThumb } from "@/components/TemplateThumb";
import { toast } from "@/components/ui/Toast";
import { exampleProjects } from "@/lib/examples";
import { restoreSample } from "@/lib/projectIO";
import { COMING_SOON, TEMPLATE_LIST } from "@/lib/templates";

const CATEGORIES = ["All", "Folding cartons", "Mailer boxes", "Sleeves", "Labels", "Product inserts", "Packaging sets"];

export default function TemplatesPage() {
  const router = useRouter();
  const [cat, setCat] = useState("All");
  const examples = useMemo(() => exampleProjects(), []);
  const previewFor = (id: string) => examples.find((e) => e.templateId === id && (id === "mailer" || e.isSample))!;
  const available = TEMPLATE_LIST.filter((t) => cat === "All" || t.category === cat);
  const soon = COMING_SOON.filter((c) => cat === "All" || c.name === cat);

  return (
    <div className="min-h-dvh bg-bg">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em]">Templates</h1>
        <p className="mt-1 max-w-xl text-[14px] text-ink-2">Each template is a real dieline you can resize. Pick one to start a new project.</p>
        <div className="no-scrollbar mt-6 flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${cat === c ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:text-ink"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          {available.map((t) => (
            <article key={t.id} className="grid gap-6 rounded-[20px] border border-line bg-surface p-5 md:grid-cols-[1.2fr_1fr_1fr]">
              <TemplateThumb templateId={t.id} className="h-56 w-full" />
              <div className="flex items-center justify-center rounded-md bg-workspace py-6">
                <CssBox project={previewFor(t.id)} size={180} />
              </div>
              <div className="flex flex-col">
                <p className="text-[12px] font-medium text-ink-3">{t.category}</p>
                <h2 className="mt-1 text-[18px] font-semibold">{t.name}</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{t.description}</p>
                <ul className="mt-3 space-y-1 text-[13px] text-ink-2">
                  {t.supports.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                  <li>
                    Sizes: W {t.limits.width[0]}–{t.limits.width[1]}, H {t.limits.height[0]}–{t.limits.height[1]}, D {t.limits.depth[0]}–{t.limits.depth[1]} mm
                  </li>
                </ul>
                <div className="mt-auto flex gap-2 pt-5">
                  <Link href={`/editor/new?template=${t.id}`} className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-[13.5px] font-medium text-white hover:bg-accent-hover">
                    Use template
                  </Link>
                  {t.id === "carton" && (
                    <button
                      onClick={async () => {
                        try {
                          const s = await restoreSample();
                          router.push(`/editor/${s.id}`);
                        } catch {
                          toast.error("Browser storage is unavailable. Allow site data and try again.");
                        }
                      }}
                      className="inline-flex h-9 items-center rounded-lg border border-line px-4 text-[13.5px] font-medium hover:border-line-strong"
                    >
                      Open the sample
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
          {soon.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {soon.map((c) => (
                <div key={c.name} className="rounded-[16px] border border-dashed border-line-strong p-5" aria-disabled="true">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[14.5px] font-semibold text-ink-2">{c.name}</h2>
                    <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink-3">Coming soon</span>
                  </div>
                  <p className="mt-2 text-[13px] text-ink-3">{c.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
