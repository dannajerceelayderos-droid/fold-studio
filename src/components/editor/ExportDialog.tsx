"use client";
import { Box, FileJson, Shapes as ShapesIcon } from "lucide-react";
import { useState } from "react";
import { assetDataUrl } from "@/lib/assets";
import { MATERIALS } from "@/lib/materials";
import { buildExportFile, download, safeName } from "@/lib/projectIO";
import { exportDielineSvg, type SvgExportOptions } from "@/lib/render/svg";
import { getDieline } from "@/lib/templates";
import { useEditor } from "@/store/editor";
import type { ViewPreset } from "../package3d/PackageScene";
import { Button, Segmented } from "../ui/controls";
import { Dialog } from "../ui/Dialog";
import { toast } from "../ui/Toast";
import { editorScene } from "./sceneRef";

type Tab = "png" | "svg" | "json";

export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = useEditor((s) => s.project!);
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  const [tab, setTab] = useState<Tab>("png");
  const [angle, setAngle] = useState<"current" | ViewPreset>("three-quarter");
  const [scale, setScale] = useState<"1" | "2" | "3">("2");
  const [transparent, setTransparent] = useState(project.preview.background === "transparent");
  const [svgOpt, setSvgOpt] = useState<SvgExportOptions>({ includeArtwork: true, includeCut: true, includeFold: true, includeDimensions: true, includeGuides: false });
  const [busy, setBusy] = useState(false);
  const name = safeName(project.name);

  const exportPng = async () => {
    if (!editorScene.current) {
      setView(view === "2d" ? (window.innerWidth < 768 ? "3d" : "split") : view);
      toast.info("Opening the 3D preview — try the export again in a moment.");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      const url = await editorScene.current.capture({ scale: Number(scale), transparent, view: angle === "current" ? undefined : angle });
      download(`${name}-${angle}.png`, url);
      toast.success("PNG exported");
    } catch (e) {
      toast.error(`The preview couldn't be exported: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportSvg = async () => {
    setBusy(true);
    try {
      const dl = getDieline(project.templateId, project.dimensions);
      const hrefs = new Map<string, string>();
      const missing: string[] = [];
      for (const o of project.objects) {
        if (o.type === "image" && !hrefs.has(o.assetId)) {
          const url = await assetDataUrl(o.assetId);
          if (url) hrefs.set(o.assetId, url);
          else missing.push(o.name);
        }
      }
      const svg = exportDielineSvg(project, dl, MATERIALS[project.material], (id) => hrefs.get(id), svgOpt);
      download(`${name}-dieline.svg`, new Blob([svg], { type: "image/svg+xml" }));
      if (missing.length) toast.error(`Exported, but ${missing.length} image(s) couldn't be found and were left out.`);
      else toast.success("Dieline SVG exported");
    } catch (e) {
      toast.error(`The SVG couldn't be exported: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportJson = async () => {
    setBusy(true);
    try {
      const file = await buildExportFile(project);
      download(`${name}.foldstudio.json`, new Blob([JSON.stringify(file)], { type: "application/json" }));
      toast.success("Project file exported");
    } finally {
      setBusy(false);
    }
  };

  const check = (k: keyof SvgExportOptions, label: string) => (
    <label className="flex items-center gap-2 text-[13px]">
      <input type="checkbox" className="accent-[var(--accent)]" checked={svgOpt[k]} onChange={(e) => setSvgOpt({ ...svgOpt, [k]: e.target.checked })} />
      {label}
    </label>
  );

  const tabs: { id: Tab; label: string; icon: typeof Box }[] = [
    { id: "png", label: "3D mockup", icon: Box },
    { id: "svg", label: "Flat dieline", icon: ShapesIcon },
    { id: "json", label: "Project file", icon: FileJson },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Export"
      width={520}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" disabled={busy} onClick={tab === "png" ? exportPng : tab === "svg" ? exportSvg : exportJson}>
            {busy ? "Exporting…" : tab === "png" ? "Download PNG" : tab === "svg" ? "Download SVG" : "Download project file"}
          </Button>
        </>
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`flex flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left text-[12.5px] font-medium ${tab === t.id ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-strong"}`}
          >
            <t.icon size={16} className="text-ink-2" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "png" && (
        <div className="space-y-4">
          <p className="text-ink-2">A PNG of the 3D preview, rendered from your current design, material and lighting.</p>
          <div className="space-y-1.5">
            <span className="text-[12px] font-medium text-ink-2">Angle</span>
            <div>
              <Segmented
                label="Angle"
                value={angle}
                onChange={setAngle}
                options={[
                  { value: "three-quarter", label: "Three-quarter" },
                  { value: "front", label: "Front" },
                  { value: "side", label: "Side" },
                  { value: "current", label: "Current view" },
                ]}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-[12px] font-medium text-ink-2">Resolution</span>
            <div>
              <Segmented label="Resolution" value={scale} onChange={setScale} options={[{ value: "1", label: "Standard" }, { value: "2", label: "High (2×)" }, { value: "3", label: "Extra (3×)" }]} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" className="accent-[var(--accent)]" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
            Transparent background
          </label>
        </div>
      )}

      {tab === "svg" && (
        <div className="space-y-4">
          <p className="text-ink-2">The flat dieline at 1:1 scale in millimetres, with artwork embedded. Selection handles and editor guides are never included.</p>
          <div className="grid grid-cols-2 gap-2">
            {check("includeArtwork", "Artwork")}
            {check("includeCut", "Cut lines")}
            {check("includeFold", "Fold lines")}
            {check("includeDimensions", "Dimensions")}
            {check("includeGuides", "Safe-area guides")}
          </div>
          <div className="rounded-lg bg-workspace px-3.5 py-3 text-[12.5px] leading-relaxed">
            <p className="font-medium">Before you send this to a printer</p>
            <p className="mt-1 text-ink-2">
              This file is a visual dieline, not a production-ready file. Fold Studio doesn&apos;t yet add bleed, check image resolution, convert to CMYK or embed colour profiles, outline or embed fonts,
              or account for board thickness and creasing tolerances. Ask your printer for their approved dieline and place your artwork on it.
            </p>
          </div>
        </div>
      )}

      {tab === "json" && (
        <div className="space-y-3">
          <p className="text-ink-2">
            A single file with your design, settings, brand kit and uploaded images. Import it from the dashboard to restore the project in any browser.
          </p>
          <p className="text-[12px] text-ink-3">{project.assets.length ? `Includes ${project.assets.length} image${project.assets.length === 1 ? "" : "s"}.` : "No images to include."}</p>
        </div>
      )}
    </Dialog>
  );
}
