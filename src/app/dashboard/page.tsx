"use client";
import { Copy, Download, FileUp, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/site/AppHeader";
import { TemplateThumb } from "@/components/TemplateThumb";
import { Button } from "@/components/ui/controls";
import { ConfirmHost, confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";
import { cloneProject } from "@/lib/project";
import { buildExportFile, download, ensureSample, importProject, parseExportFile, safeName } from "@/lib/projectIO";
import { localRepo } from "@/lib/storage/db";
import { TEMPLATE_LIST } from "@/lib/templates";
import type { ProjectMeta } from "@/lib/types";

function relTime(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<ProjectMeta[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [newOpen, setNewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await localRepo.list());
    } catch {
      setFailed(true);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await ensureSample();
      } catch {
        /* handled by refresh */
      }
      refresh();
    })();
    if (new URLSearchParams(window.location.search).get("error") === "storage") toast.error("The project couldn't be created because browser storage is unavailable.");
  }, [refresh]);

  const shown = useMemo(() => {
    const list = (items ?? []).filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
    return sort === "name" ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
  }, [items, q, sort]);

  const onImport = async (f: File) => {
    try {
      if (f.size > 80 * 1024 * 1024) throw new Error("That file is larger than 80 MB.");
      const parsed = parseExportFile(await f.text());
      const p = await importProject(parsed);
      toast.success(`Imported “${p.name}”`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="min-h-dvh bg-bg">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.025em]">Your packaging</h1>
            <p className="mt-1 text-[14px] text-ink-2">Projects are saved in this browser. Download a project file to back one up or move it to another device.</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => (e.target.files?.[0] && onImport(e.target.files[0]), (e.target.value = ""))} />
            <Button onClick={() => fileRef.current?.click()}>
              <FileUp size={15} /> Import
            </Button>
            <div className="relative">
              <Button variant="primary" onClick={() => setNewOpen((v) => !v)} aria-haspopup="menu" aria-expanded={newOpen}>
                <Plus size={15} /> New project
              </Button>
              {newOpen && (
                <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-line bg-surface p-1 shadow-[var(--shadow-pop)]" onMouseLeave={() => setNewOpen(false)}>
                  {TEMPLATE_LIST.map((t) => (
                    <Link key={t.id} role="menuitem" href={`/editor/new?template=${t.id}`} className="block rounded-md px-3 py-2 hover:bg-black/[0.04]">
                      <span className="block text-[13px] font-medium">{t.name}</span>
                      <span className="block text-[11.5px] text-ink-2">
                        {t.defaults.width} × {t.defaults.height} × {t.defaults.depth} mm to start
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {failed && (
          <div role="alert" className="mt-6 rounded-lg border border-[#e8c9c5] bg-[#fbf1ef] px-4 py-3 text-[13.5px] text-danger">
            This browser is blocking site storage, so projects can&apos;t be saved. Allow site data for this page (or leave private browsing) and reload.
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <label className="relative block w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className="field !h-9 !pl-8" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
          </label>
          <select className="field !h-9 !w-auto" value={sort} onChange={(e) => setSort(e.target.value as "recent" | "name")} aria-label="Sort projects">
            <option value="recent">Recently edited</option>
            <option value="name">Name</option>
          </select>
        </div>

        <section className="mt-5" aria-label="Projects">
          {items === null ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-[var(--radius-lg)] bg-black/[0.04]" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong px-6 py-16 text-center">
              <h2 className="text-[17px] font-semibold">Start your first package</h2>
              <p className="mx-auto mt-1 max-w-sm text-[14px] text-ink-2">Pick a template below, set its size and start placing artwork. You&apos;ll see it folded as you go.</p>
            </div>
          ) : shown.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-ink-2">No projects match “{q}”.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {shown.map((p) => (
                <ProjectCard key={p.id} p={p} onChange={refresh} onOpen={() => router.push(`/editor/${p.id}`)} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-16" aria-labelledby="start-tpl">
          <div className="flex items-baseline justify-between">
            <h2 id="start-tpl" className="text-[17px] font-semibold tracking-[-0.015em]">
              Start from a template
            </h2>
            <Link href="/templates" className="text-[13px] font-medium text-accent hover:text-accent-hover">
              All templates
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {TEMPLATE_LIST.map((t) => (
              <Link key={t.id} href={`/editor/new?template=${t.id}`} className="group flex gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-3 hover:border-line-strong">
                <TemplateThumb templateId={t.id} className="h-28 w-36 shrink-0" />
                <div className="py-1">
                  <h3 className="text-[14px] font-semibold">{t.name}</h3>
                  <p className="mt-1 text-[12.5px] leading-snug text-ink-2">{t.description}</p>
                  <span className="mt-2 inline-block text-[12.5px] font-medium text-accent group-hover:text-accent-hover">Use template</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <ConfirmHost />
    </div>
  );
}

function ProjectCard({ p, onChange, onOpen }: { p: ProjectMeta; onChange: () => void; onOpen: () => void }) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menu]);

  const act = async (k: "rename" | "duplicate" | "export" | "delete") => {
    setMenu(false);
    try {
      if (k === "rename") setRenaming(true);
      if (k === "duplicate") {
        const full = await localRepo.get(p.id);
        if (!full) throw new Error("Project not found");
        const c = cloneProject(full);
        await localRepo.save(c, p.thumbnail);
        toast.success(`Created “${c.name}”`);
        onChange();
      }
      if (k === "export") {
        const full = await localRepo.get(p.id);
        if (!full) throw new Error("Project not found");
        const f = await buildExportFile(full);
        download(`${safeName(full.name)}.foldstudio.json`, new Blob([JSON.stringify(f)], { type: "application/json" }));
      }
      if (k === "delete") {
        const ok = await confirmDialog({
          title: `Delete “${p.name}”?`,
          message: p.isSample ? "The sample can be restored later from the templates page." : "This removes the project and its uploaded images from this browser. It can't be undone.",
          confirm: "Delete project",
          danger: true,
        });
        if (!ok) return;
        await localRepo.remove(p.id);
        toast.success("Project deleted");
        onChange();
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="group relative rounded-[var(--radius-lg)] border border-line bg-surface transition-colors hover:border-line-strong">
      <button onClick={onOpen} className="block w-full text-left" aria-label={`Open ${p.name}`}>
        <div className="aspect-[4/3] overflow-hidden rounded-t-[var(--radius-lg)] bg-workspace">
          {p.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <TemplateThumb templateId={p.templateId} className="h-full w-full !rounded-none" />
          )}
        </div>
      </button>
      <div className="flex items-start gap-1 px-3 pb-3 pt-2.5">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              className="field !h-7"
              defaultValue={p.name}
              maxLength={120}
              aria-label="Project name"
              onBlur={async (e) => {
                const n = e.target.value.trim();
                setRenaming(false);
                if (n && n !== p.name) {
                  await localRepo.rename(p.id, n);
                  onChange();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setRenaming(false);
              }}
            />
          ) : (
            <h3 className="truncate text-[13.5px] font-medium">{p.name}</h3>
          )}
          <p className="mt-0.5 text-[12px] text-ink-3">
            {p.isSample ? "Sample, " : ""}edited {relTime(p.updatedAt)}
          </p>
        </div>
        <div className="relative" ref={ref}>
          <button aria-label={`Actions for ${p.name}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className="rounded-md p-1 text-ink-2 hover:bg-black/5 hover:text-ink">
            <MoreHorizontal size={16} />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
              {[
                { k: "rename" as const, l: "Rename", i: Pencil },
                { k: "duplicate" as const, l: "Duplicate", i: Copy },
                { k: "export" as const, l: "Download file", i: Download },
                { k: "delete" as const, l: "Delete", i: Trash2 },
              ].map(({ k, l, i: I }) => (
                <button key={k} role="menuitem" onClick={() => act(k)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-black/[0.04] ${k === "delete" ? "text-danger" : ""}`}>
                  <I size={14} /> {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
