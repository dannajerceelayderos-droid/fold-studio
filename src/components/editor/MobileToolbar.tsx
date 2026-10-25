"use client";
import { Copy, Image as ImageIcon, Layers, Palette, Shapes, SlidersHorizontal, Trash2, Type, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useEditor, type LeftTab } from "@/store/editor";
import { TabContent } from "./LeftSidebar";
import { PropertiesPanel } from "./PropertiesPanel";

type Sheet = LeftTab | "edit" | null;

const ITEMS: { id: Exclude<Sheet, null>; label: string; icon: typeof Type }[] = [
  { id: "text", label: "Text", icon: Type },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "shapes", label: "Shapes", icon: Shapes },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "edit", label: "Edit", icon: SlidersHorizontal },
];

/** Phone layout: a bottom tool bar whose tools open in a bottom sheet over the canvas. */
export function MobileToolbar() {
  const [sheet, setSheet] = useState<Sheet>(null);
  const selection = useEditor((s) => s.selection);
  const objectCount = useEditor((s) => s.project?.objects.length ?? 0);
  const editingText = useEditor((s) => s.editingText);
  const { duplicateSelection, deleteSelection, setSelection } = useEditor.getState();
  const prevCount = useRef(objectCount);

  // after adding something, close the sheet so the new object is visible and selected
  useEffect(() => {
    if (objectCount > prevCount.current && sheet && sheet !== "edit" && sheet !== "layers") setSheet(null);
    prevCount.current = objectCount;
  }, [objectCount, sheet]);

  // double-tapping text opens its properties
  useEffect(() => {
    if (editingText) setSheet("edit");
  }, [editingText]);

  const title = sheet === "edit" ? (selection.length ? "Edit selection" : "Panel and package") : ITEMS.find((i) => i.id === sheet)?.label;

  return (
    <>
      {sheet && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[62dvh] flex-col rounded-t-[18px] border-t border-line bg-surface shadow-[0_-8px_30px_rgba(32,33,31,0.14)]" role="dialog" aria-label={title}>
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-[14px] font-semibold">{title}</h2>
            <button onClick={() => setSheet(null)} aria-label="Close" className="-mr-1 rounded-md p-1.5 text-ink-2 hover:bg-black/5">
              <X size={18} />
            </button>
          </div>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+12px)]">
            {sheet === "edit" ? <PropertiesPanel embedded /> : <TabContent tab={sheet} />}
          </div>
        </div>
      )}

      {!sheet && selection.length > 0 && (
        <div className="absolute inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 flex justify-center px-3 pb-2">
          <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
            <button onClick={() => setSheet("edit")} className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-medium text-white">
              <SlidersHorizontal size={14} /> Edit
            </button>
            <button onClick={duplicateSelection} aria-label="Duplicate" className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-black/5">
              <Copy size={16} />
            </button>
            <button onClick={deleteSelection} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-full text-danger hover:bg-black/5">
              <Trash2 size={16} />
            </button>
            <button onClick={() => setSelection([])} aria-label="Deselect" className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-black/5">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <nav className="relative z-30 flex shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]" aria-label="Editor tools">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            onClick={() => setSheet(sheet === it.id ? null : it.id)}
            aria-pressed={sheet === it.id}
            className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${sheet === it.id ? "text-accent-hover" : "text-ink-2"}`}
          >
            <it.icon size={20} strokeWidth={1.75} />
            {it.label}
          </button>
        ))}
      </nav>
    </>
  );
}
