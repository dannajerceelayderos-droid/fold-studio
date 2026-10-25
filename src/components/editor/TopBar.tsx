"use client";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Download,
  Grid3x3,
  Keyboard,
  Loader2,
  Maximize,
  Minus,
  MoreHorizontal,
  Play,
  Plus,
  Redo2,
  Ruler,
  ScanLine,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useEditor, type ViewMode } from "@/store/editor";
import { Button, IconButton, Segmented } from "../ui/controls";
import { Dialog } from "../ui/Dialog";
import { LogoMark } from "../ui/Logo";

export const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const mod = () => (isMac() ? "⌘" : "Ctrl+");

export function TopBar({ onExport, onPreview, onSave, menu }: { onExport: () => void; onPreview: () => void; onSave: () => void; menu: { label: string; onClick: () => void }[] }) {
  const project = useEditor((s) => s.project!);
  const status = useEditor((s) => s.saveStatus);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const view = useEditor((s) => s.view);
  const zoom = useEditor((s) => s.zoom);
  const showGuides = useEditor((s) => s.showGuides);
  const showDimensions = useEditor((s) => s.showDimensions);
  const showGrid = useEditor((s) => s.showGrid);
  const { undo, redo, setView, setZoom, fit, toggle, commit } = useEditor.getState();
  const [name, setName] = useState(project.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const m = mod();

  useEffect(() => setName(project.name), [project.name]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const statusUi = {
    saved: { icon: <Check size={13} />, text: "Saved in this browser", cls: "text-ink-3" },
    saving: { icon: <Loader2 size={13} className="animate-spin" />, text: "Saving…", cls: "text-ink-3" },
    unsaved: { icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />, text: "Unsaved changes", cls: "text-ink-2" },
    error: { icon: <CircleAlert size={13} />, text: "Save failed — retry", cls: "text-danger" },
  }[status];

  const show2d = view !== "3d";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-2">
      <Link href="/dashboard" className="flex h-8 items-center gap-1.5 rounded-md px-2 text-ink-2 hover:bg-black/5 hover:text-ink" aria-label="Back to dashboard">
        <ArrowLeft size={15} />
        <LogoMark size={18} />
      </Link>
      <div className="mx-1 h-5 w-px bg-line" />
      <input
        aria-label="Project name"
        value={name}
        maxLength={120}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const n = name.trim();
          if (n && n !== project.name) commit((d) => void (d.name = n));
          else setName(project.name);
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="h-8 w-[min(260px,22vw)] truncate rounded-md border border-transparent bg-transparent px-2 text-[13.5px] font-medium hover:border-line focus:border-accent focus:outline-none"
      />
      {project.isSample && <span className="hidden rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hover lg:inline">Editable sample</span>}
      <button onClick={onSave} className={`hidden items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] hover:bg-black/5 md:flex ${statusUi.cls}`} title={`Save now (${m}S)`}>
        {statusUi.icon}
        {statusUi.text}
      </button>

      <div className="ml-auto flex items-center gap-0.5">
        <IconButton label="Undo" shortcut={`${m}Z`} disabled={!canUndo} onClick={undo}>
          <Undo2 size={16} />
        </IconButton>
        <IconButton label="Redo" shortcut={`${m}⇧Z`} disabled={!canRedo} onClick={redo}>
          <Redo2 size={16} />
        </IconButton>
      </div>
      <div className="mx-1 h-5 w-px bg-line" />
      <Segmented<ViewMode>
        label="View mode"
        value={view}
        onChange={setView}
        options={[
          { value: "2d", label: "2D", title: "Flat dieline (1)" },
          { value: "split", label: "Split", title: "2D and 3D side by side (2)" },
          { value: "3d", label: "3D", title: "Folded package (3)" },
        ]}
      />
      {show2d && (
        <div className="ml-1 hidden items-center gap-0.5 lg:flex">
          <IconButton label="Zoom out" shortcut="−" onClick={() => setZoom(zoom / 1.25)}>
            <Minus size={15} />
          </IconButton>
          <button onClick={() => setZoom(1)} className="h-8 w-12 rounded-md text-[12px] tabular-nums text-ink-2 hover:bg-black/5" title="Reset zoom">
            {Math.round(zoom * 100)}%
          </button>
          <IconButton label="Zoom in" shortcut="+" onClick={() => setZoom(zoom * 1.25)}>
            <Plus size={15} />
          </IconButton>
          <IconButton label="Fit to view" shortcut="0" onClick={fit}>
            <Maximize size={14} />
          </IconButton>
          <IconButton label="Safe-area guides" active={showGuides} onClick={() => toggle("showGuides")}>
            <ScanLine size={15} />
          </IconButton>
          <IconButton label="Dimensions" active={showDimensions} onClick={() => toggle("showDimensions")}>
            <Ruler size={15} />
          </IconButton>
          <IconButton label="Grid (5 mm)" active={showGrid} onClick={() => toggle("showGrid")}>
            <Grid3x3 size={15} />
          </IconButton>
        </div>
      )}
      <div className="mx-1 h-5 w-px bg-line" />
      <Button size="sm" variant="ghost" onClick={onPreview} title="Full-screen 3D preview">
        <Play size={13} /> Preview
      </Button>
      <Button size="sm" variant="primary" onClick={onExport}>
        <Download size={13} /> Export
      </Button>
      <div className="relative" ref={menuRef}>
        <IconButton label="More" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
          <MoreHorizontal size={16} />
        </IconButton>
        {menuOpen && (
          <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-60 rounded-lg border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
            {menu.map((it) => (
              <button
                key={it.label}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  it.onClick();
                }}
                className="block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-black/[0.04]"
              >
                {it.label}
              </button>
            ))}
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setKeysOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-black/[0.04]"
            >
              <Keyboard size={14} /> Keyboard shortcuts
            </button>
            <div className="mt-1 border-t border-line px-2.5 pb-1 pt-2 text-[11.5px] leading-snug text-ink-3">
              Projects are saved in this browser only. Export the project file to keep a copy or move it to another device.
            </div>
          </div>
        )}
      </div>
      <Dialog open={keysOpen} onClose={() => setKeysOpen(false)} title="Keyboard shortcuts" width={400}>
        <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[13px]">
          {[
            ["Undo", `${m}Z`],
            ["Redo", `${m}⇧Z`],
            ["Save now", `${m}S`],
            ["Duplicate selection", `${m}D`],
            ["Delete selection", "Delete / ⌫"],
            ["Deselect", "Esc"],
            ["Nudge 1 mm (Shift: 5 mm)", "Arrow keys"],
            ["2D / Split / 3D", "1 / 2 / 3"],
            ["Zoom in / out / fit", "+ / − / 0"],
            ["Pan the dieline", "Space + drag, or scroll"],
            ["Zoom at cursor", `${m}scroll or pinch`],
          ].map(([a, b]) => (
            <div key={a} className="contents">
              <dt className="text-ink-2">{a}</dt>
              <dd className="font-medium tabular-nums">{b}</dd>
            </div>
          ))}
        </dl>
      </Dialog>
    </header>
  );
}
