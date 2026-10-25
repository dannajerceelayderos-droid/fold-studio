"use client";
import dynamic from "next/dynamic";
import { Box, Minus, PackageOpen, Plus, RotateCcw, RotateCw } from "lucide-react";
import { useCallback } from "react";
import { getDieline } from "@/lib/templates";
import { useEditor } from "@/store/editor";
import type { SceneApi, ViewPreset } from "../package3d/PackageScene";
import { IconButton, Slider } from "../ui/controls";
import { editorScene } from "./sceneRef";

const PackageScene = dynamic(() => import("../package3d/PackageScene").then((m) => m.PackageScene), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-[12px] text-ink-3">Loading 3D preview…</div>,
});

const VIEWS: { id: ViewPreset; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "three-quarter", label: "¾" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
  { id: "top", label: "Top" },
];

export function Viewport3D() {
  const project = useEditor((s) => s.project!);
  const setPreview = useEditor((s) => s.setPreview);
  const dl = getDieline(project.templateId, project.dimensions);
  const setRef = useCallback((api: SceneApi | null) => {
    editorScene.current = api;
  }, []);
  const pv = project.preview;
  const lidLabel = project.templateId === "mailer" ? "Open lid" : "Open top";

  return (
    <div className="relative h-full w-full bg-workspace">
      <PackageScene onApi={setRef} project={project} dl={dl} className="absolute inset-0" />
      <div className="absolute left-3 top-3 flex items-center gap-0.5 rounded-lg border border-line bg-surface/90 p-0.5 backdrop-blur">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => editorScene.current?.setView(v.id)}
            className="h-7 rounded-md px-2 text-[12px] font-medium text-ink-2 hover:bg-black/5 hover:text-ink"
            aria-label={`${v.label === "¾" ? "Three-quarter" : v.label} view`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-0.5 rounded-lg border border-line bg-surface/90 p-0.5 backdrop-blur">
        <IconButton label="Zoom in" onClick={() => editorScene.current?.zoom(1.2)}>
          <Plus size={15} />
        </IconButton>
        <IconButton label="Zoom out" onClick={() => editorScene.current?.zoom(1 / 1.2)}>
          <Minus size={15} />
        </IconButton>
        <IconButton label="Reset camera" onClick={() => editorScene.current?.reset()}>
          <RotateCcw size={15} />
        </IconButton>
        <IconButton label={pv.autoRotate ? "Stop rotating" : "Auto-rotate"} active={pv.autoRotate} onClick={() => setPreview({ autoRotate: !pv.autoRotate })}>
          <RotateCw size={15} />
        </IconButton>
      </div>
      <div className="absolute bottom-3 left-1/2 flex w-[min(440px,calc(100%-24px))] -translate-x-1/2 items-center gap-4 rounded-lg border border-line bg-surface/92 px-3 py-2 backdrop-blur">
        <label className="flex flex-1 items-center gap-2 text-[11.5px] font-medium text-ink-2">
          <Box size={14} className="shrink-0" />
          <span className="w-9 shrink-0">Fold</span>
          <Slider ariaLabel="Fold amount" min={0} max={1} step={0.01} value={pv.fold} onChange={(v) => setPreview({ fold: v })} />
        </label>
        <label className="flex flex-1 items-center gap-2 text-[11.5px] font-medium text-ink-2">
          <PackageOpen size={14} className="shrink-0" />
          <span className="shrink-0">{lidLabel}</span>
          <Slider ariaLabel={lidLabel} min={0} max={1} step={0.01} value={pv.open} onChange={(v) => setPreview({ open: v })} />
        </label>
      </div>
    </div>
  );
}
