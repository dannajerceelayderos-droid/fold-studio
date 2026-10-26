"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAssets } from "@/lib/assets";
import { cloneProject } from "@/lib/project";
import { buildExportFile, download, safeName } from "@/lib/projectIO";
import { SAMPLE_ID, sampleProject } from "@/lib/sample";
import { localRepo } from "@/lib/storage/db";
import { getDieline } from "@/lib/templates";
import { useEditor } from "@/store/editor";
import { Button } from "../ui/controls";
import { ConfirmHost, confirmDialog } from "../ui/Dialog";
import { toast } from "../ui/Toast";
import { Canvas2D } from "./Canvas2D";
import { ExportDialog } from "./ExportDialog";
import { LeftSidebar } from "./LeftSidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import { editorScene } from "./sceneRef";
import { TopBar } from "./TopBar";
import { MobileToolbar } from "./MobileToolbar";
import { PracticeCard, resetPracticeFlags } from "./PracticeCard";
import { PRACTICE_ID, practiceProject } from "@/lib/practice";
import { useIsMobile } from "./useIsMobile";
import { Viewport3D } from "./Viewport3D";

const PackageScene = dynamic(() => import("../package3d/PackageScene").then((m) => m.PackageScene), { ssr: false });

async function makeThumbnail(): Promise<string | null> {
  const api = editorScene.current;
  if (!api) return null;
  try {
    const url = await api.capture({ scale: 1, transparent: false, view: "three-quarter" });
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const w = 480;
    const h = Math.round((img.height / img.width) * w);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

export function Editor({ projectId }: { projectId: string }) {
  const router = useRouter();
  const project = useEditor((s) => s.project);
  const view = useEditor((s) => s.view);
  const revision = useEditor((s) => s.revision);
  const mobile = useIsMobile();
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [exportOpen, setExportOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const saving = useRef(false);
  const lastThumb = useRef(0);

  // phones show one view at a time
  useEffect(() => {
    if (mobile && useEditor.getState().view === "split") useEditor.getState().setView("2d");
  }, [mobile, view]);

  // load
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let p = await localRepo.get(projectId);
        if (!p && (projectId === SAMPLE_ID || projectId === PRACTICE_ID)) {
          p = projectId === PRACTICE_ID ? practiceProject() : sampleProject();
          await localRepo.save(p, null);
        }
        if (!alive) return;
        if (!p) return setState("missing");
        await ensureAssets(p.assets.map((a) => a.id));
        useEditor.getState().load(p);
        setState("ready");
      } catch (e) {
        console.error(e);
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
      useEditor.setState({ project: null });
      editorScene.current = null;
    };
  }, [projectId]);

  const save = useCallback(async (withThumb = false) => {
    const s = useEditor.getState();
    if (!s.project) return;
    if (saving.current || s.transientBase) {
      // a save is in flight or a drag is in progress — try again shortly
      setTimeout(() => {
        const n = useEditor.getState();
        if (n.revision !== n.savedRevision) save(withThumb);
      }, 600);
      return;
    }
    saving.current = true;
    const rev = s.revision;
    s.setSaveStatus("saving");
    try {
      const p = { ...s.project, updatedAt: new Date().toISOString() };
      let thumb: string | null | undefined;
      if (withThumb || Date.now() - lastThumb.current > 8000) {
        thumb = await makeThumbnail();
        if (thumb) lastThumb.current = Date.now();
        else thumb = undefined;
      }
      await localRepo.save(p, thumb);
      const now = useEditor.getState();
      now.setSaveStatus(now.revision === rev ? "saved" : "unsaved", rev);
    } catch (e) {
      console.error(e);
      useEditor.getState().setSaveStatus("error");
      toast.error("Your changes couldn't be saved in this browser. Export the project file to keep a copy, then try again.");
    } finally {
      saving.current = false;
    }
  }, []);

  // debounced autosave on every revision (writes only when something changed)
  useEffect(() => {
    if (state !== "ready") return;
    const s = useEditor.getState();
    if (s.revision === s.savedRevision) return;
    const t = setTimeout(() => save(), 900);
    return () => clearTimeout(t);
  }, [revision, state, save]);

  // first thumbnail once the 3D scene has rendered
  useEffect(() => {
    if (state !== "ready") return;
    const t = setTimeout(async () => {
      const thumb = await makeThumbnail();
      const p = useEditor.getState().project;
      if (thumb && p) {
        lastThumb.current = Date.now();
        localRepo.save(p, thumb).catch(() => {});
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [state]);

  // warn before leaving with unsaved work
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      const st = useEditor.getState().saveStatus;
      if (st === "unsaved" || st === "saving" || st === "error") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useEditor.getState();
      if (!s.project) return;
      const t = e.target as HTMLElement;
      const typing = t.closest("input, textarea, select, [contenteditable=true]");
      const meta = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (meta && k === "s") {
        e.preventDefault();
        save(true);
        return;
      }
      if (typing) {
        if (e.key === "Escape") (t as HTMLElement).blur();
        return;
      }
      if (meta && k === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (meta && k === "y") {
        e.preventDefault();
        s.redo();
      } else if (meta && k === "d") {
        e.preventDefault();
        s.duplicateSelection();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (s.selection.length) {
          e.preventDefault();
          s.deleteSelection();
        }
      } else if (e.key === "Escape") {
        if (presenting) setPresenting(false);
        else s.setSelection([], s.selectedPanel);
      } else if (e.key.startsWith("Arrow") && s.selection.length) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        s.commit((d) => {
          for (const o of d.objects) if (s.selection.includes(o.id) && !o.locked) {
            o.x += dx;
            o.y += dy;
          }
        }, `nudge:${s.selection.join(",")}`);
      } else if (!meta && !e.altKey) {
        if (k === "1") s.setView("2d");
        else if (k === "2") s.setView("split");
        else if (k === "3") s.setView("3d");
        else if (k === "=" || k === "+") s.setZoom(s.zoom * 1.25);
        else if (k === "-") s.setZoom(s.zoom / 1.25);
        else if (k === "0") s.fit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, presenting]);

  if (state === "loading") return <div className="grid h-dvh place-items-center bg-workspace text-[13px] text-ink-3">Opening project…</div>;
  if (state === "missing" || state === "error")
    return (
      <div className="grid h-dvh place-items-center bg-bg px-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">{state === "missing" ? "This project isn't in this browser" : "The project couldn't be opened"}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
            {state === "missing"
              ? "Projects are saved in the browser where you made them. Open it there, or import its project file from the dashboard."
              : "Browser storage may be blocked or full. Check that site data is allowed for this page and reload."}
          </p>
          <Link href="/dashboard" className="mt-5 inline-flex h-9 items-center rounded-lg bg-accent px-4 text-[13.5px] font-medium text-white hover:bg-accent-hover">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  if (!project) return null;

  const menu = [
    { label: "Save now", onClick: () => save(true) },
    {
      label: "Duplicate project",
      onClick: async () => {
        const copy = cloneProject(project);
        await localRepo.save(copy, null);
        toast.success(`Created “${copy.name}”`);
        router.push(`/editor/${copy.id}`);
      },
    },
    {
      label: "Download project file",
      onClick: async () => {
        const f = await buildExportFile(project);
        download(`${safeName(project.name)}.foldstudio.json`, new Blob([JSON.stringify(f)], { type: "application/json" }));
      },
    },
    ...(project.id === PRACTICE_ID
      ? [
          {
            label: "Start practice over",
            onClick: async () => {
              const ok = await confirmDialog({ title: "Start the practice over?", message: "The cookie box goes back to its starting design and the checklist clears.", confirm: "Start over", danger: true });
              if (!ok) return;
              const s = practiceProject();
              await localRepo.save(s, null);
              resetPracticeFlags();
              useEditor.getState().load(s);
              toast.success("Practice reset");
            },
          },
        ]
      : project.isSample
      ? [
          {
            label: "Reset sample to original",
            onClick: async () => {
              const ok = await confirmDialog({ title: "Reset the sample?", message: "Your edits to the sample project will be replaced with the original design.", confirm: "Reset sample", danger: true });
              if (!ok) return;
              const s = sampleProject();
              await localRepo.save(s, null);
              useEditor.getState().load(s);
              toast.success("Sample reset");
            },
          },
        ]
      : []),
  ];

  const dl = getDieline(project.templateId, project.dimensions);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-workspace">
      <TopBar mobile={mobile} onExport={() => setExportOpen(true)} onPreview={() => setPresenting(true)} onSave={() => save(true)} menu={menu} />
      {mobile ? (
        <>
          <main className="relative min-h-0 flex-1">
            {view === "3d" ? <Viewport3D /> : <Canvas2D />}
            <PracticeCard mobile />
          </main>
          <MobileToolbar />
        </>
      ) : (
        <div className="flex min-h-0 flex-1">
          <LeftSidebar />
          <main className="relative flex min-w-0 flex-1">
            {view !== "3d" && (
              <div className="relative min-h-0 min-w-0 flex-1">
                <Canvas2D />
              </div>
            )}
            {view === "split" && <div className="w-px bg-line" />}
            {view !== "2d" && (
              <div className="relative min-h-0 min-w-0 flex-1">
                <Viewport3D />
              </div>
            )}
            <PracticeCard mobile={false} />
          </main>
          <PropertiesPanel />
        </div>
      )}
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ConfirmHost />
      {presenting && (
        <div className="fixed inset-0 z-[80] bg-workspace">
          <PackageScene project={project} dl={dl} className="absolute inset-0" label={`Full-screen preview of ${project.name}`} />
          <div className="absolute left-5 top-5 text-[13px]">
            <p className="font-semibold">{project.name}</p>
            <p className="text-ink-2">Drag to rotate · scroll to zoom</p>
          </div>
          <Button className="absolute right-5 top-5" onClick={() => setPresenting(false)}>
            <X size={14} /> Close preview
          </Button>
        </div>
      )}
    </div>
  );
}
