"use client";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Italic,
  Lock,
  LockOpen,
  Replace,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { importImageFile } from "@/lib/assets";
import { BACKGROUNDS, LIGHTING, MATERIAL_LIST } from "@/lib/materials";
import { FONTS } from "@/lib/objects";
import { getDieline, TEMPLATES } from "@/lib/templates";
import type { ArtObject, BackgroundPresetId, ImageFit, LightingPresetId, TextAlign } from "@/lib/types";
import { fromDisplay, toDisplay } from "@/lib/units";
import { useEditor } from "@/store/editor";
import { ColorInput, Field, IconButton, NumberInput, Segmented, Slider } from "../ui/controls";
import { toast } from "../ui/Toast";

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[12px] font-semibold text-ink">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

const Row = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-2">{children}</div>;

export function useBrandSwatches() {
  const kit = useEditor((s) => s.project!.brandKit);
  return [kit.primary, kit.secondary, kit.accent, "#FFFFFF", "#20211F"];
}

export function PropertiesPanel({ embedded = false }: { embedded?: boolean }) {
  const project = useEditor((s) => s.project!);
  const selection = useEditor((s) => s.selection);
  const selected = project.objects.filter((o) => selection.includes(o.id));
  return (
    <aside className={embedded ? "" : "no-scrollbar h-full w-[272px] shrink-0 overflow-y-auto border-l border-line bg-surface"} aria-label="Properties">
      {selected.length === 1 ? (
        <ObjectProps o={selected[0]} />
      ) : selected.length > 1 ? (
        <MultiProps count={selected.length} />
      ) : (
        <>
          <PanelProps />
          <PackageProps />
          <MaterialProps />
          <PreviewProps />
        </>
      )}
    </aside>
  );
}

function MultiProps({ count }: { count: number }) {
  const { duplicateSelection, deleteSelection } = useEditor.getState();
  return (
    <Section title={`${count} objects selected`}>
      <p className="text-[12px] text-ink-2">Drag any of them to move the group. Shift-click to add or remove objects.</p>
      <div className="flex gap-1">
        <IconButton label="Duplicate" shortcut="⌘D" onClick={duplicateSelection}>
          <Copy size={15} />
        </IconButton>
        <IconButton label="Delete" shortcut="⌫" onClick={deleteSelection}>
          <Trash2 size={15} />
        </IconButton>
      </div>
    </Section>
  );
}

function PanelProps() {
  const project = useEditor((s) => s.project!);
  const panelId = useEditor((s) => s.selectedPanel);
  const setBg = useEditor((s) => s.setPanelBackground);
  const swatches = useBrandSwatches();
  const dl = getDieline(project.templateId, project.dimensions);
  const panel = dl.panels.find((p) => p.id === panelId);
  if (!panel)
    return (
      <Section title="Panel">
        <p className="text-[12px] leading-relaxed text-ink-2">Click a panel on the dieline to change its background, or an object to edit it.</p>
      </Section>
    );
  const bg = project.panels[panel.id]?.background ?? null;
  const count = project.objects.filter((o) => o.panelId === panel.id).length;
  return (
    <Section title={panel.name}>
      <p className="-mt-1 text-[11.5px] text-ink-2">
        {toDisplay(panel.width, project.units)} × {toDisplay(panel.height, project.units)} {project.units} · {count} {count === 1 ? "object" : "objects"}
        {panel.kind === "flap" ? " · folds inside" : ""}
      </p>
      <Field label="Background">
        <ColorInput ariaLabel="Panel background" value={bg} onChange={(c) => setBg([panel.id], c)} swatches={swatches} allowNone />
      </Field>
      <p className="text-[11px] text-ink-3">None shows the board colour from the material.</p>
    </Section>
  );
}

function PackageProps() {
  const project = useEditor((s) => s.project!);
  const { setDimensions, setTemplate, commit } = useEditor.getState();
  const t = TEMPLATES[project.templateId];
  const u = project.units;
  const d = project.dimensions;
  const lim = t.limits;
  const dim = (k: "width" | "height" | "depth", label: string) => (
    <Field label={label}>
      <NumberInput
        ariaLabel={`${label} in ${u}`}
        value={toDisplay(d[k], u)}
        min={toDisplay(lim[k][0], u)}
        max={toDisplay(lim[k][1], u)}
        step={u === "mm" ? 1 : 0.05}
        suffix={u}
        onChange={(v) => setDimensions({ ...d, [k]: fromDisplay(v, u) }, `dims:${k}`)}
      />
    </Field>
  );
  return (
    <Section
      title="Package"
      action={<Segmented label="Units" value={u} options={[{ value: "mm", label: "mm" }, { value: "in", label: "in" }]} onChange={(v) => commit((p) => void (p.units = v))} />}
    >
      <Field label="Template">
        <select className="field" value={project.templateId} onChange={(e) => setTemplate(e.target.value as never)} aria-label="Template">
          {Object.values(TEMPLATES).map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        {dim("width", "Width")}
        {dim("height", "Height")}
        {dim("depth", "Depth")}
      </div>
      <p className="text-[11px] leading-snug text-ink-3">
        Width {toDisplay(lim.width[0], u)}–{toDisplay(lim.width[1], u)}, height {toDisplay(lim.height[0], u)}–{toDisplay(lim.height[1], u)}, depth{" "}
        {toDisplay(lim.depth[0], u)}–{toDisplay(lim.depth[1], u)} {u}. Artwork keeps its place on each panel when you resize.
      </p>
    </Section>
  );
}

function MaterialProps() {
  const project = useEditor((s) => s.project!);
  const setMaterial = useEditor((s) => s.setMaterial);
  return (
    <Section title="Material">
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Material">
        {MATERIAL_LIST.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={project.material === m.id}
            onClick={() => setMaterial(m.id)}
            className={`group rounded-md border p-1.5 text-left transition-colors ${project.material === m.id ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-strong"}`}
          >
            <span
              className="block h-7 rounded-[4px] border border-black/5"
              style={{
                background: m.clearcoat ? `linear-gradient(135deg, ${m.color} 40%, #ffffff 55%, ${m.color} 70%)` : m.color,
              }}
            />
            <span className="mt-1 block truncate text-[10.5px] font-medium text-ink">{m.name}</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-snug text-ink-3">A visual approximation of the board, not a print or material specification.</p>
    </Section>
  );
}

function PreviewProps() {
  const pv = useEditor((s) => s.project!.preview);
  const setPreview = useEditor((s) => s.setPreview);
  return (
    <Section title="3D preview">
      <Row>
        <Field label="Background">
          <select className="field" value={pv.background} onChange={(e) => setPreview({ background: e.target.value as BackgroundPresetId })}>
            {Object.entries(BACKGROUNDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lighting">
          <select className="field" value={pv.lighting} onChange={(e) => setPreview({ lighting: e.target.value as LightingPresetId })}>
            {Object.entries(LIGHTING).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
      </Row>
      <Field label={`Shadow ${Math.round(pv.shadow * 100)}%`}>
        <Slider ariaLabel="Shadow intensity" min={0} max={1} step={0.05} value={pv.shadow} onChange={(v) => setPreview({ shadow: v })} />
      </Field>
    </Section>
  );
}

function ObjectProps({ o }: { o: ArtObject }) {
  const project = useEditor((s) => s.project!);
  const editingText = useEditor((s) => s.editingText);
  const { updateObject, duplicateSelection, deleteSelection, reorder, commit } = useEditor.getState();
  const swatches = useBrandSwatches();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const u = project.units;
  const set = (patch: Partial<ArtObject>, key?: string) => updateObject(o.id, patch, key);
  const dis = o.locked;

  useEffect(() => {
    if (editingText === o.id) {
      textRef.current?.focus();
      textRef.current?.select();
    }
  }, [editingText, o.id]);

  const len = (k: "x" | "y" | "width" | "height", label: string, min?: number) => (
    <Field label={label}>
      <NumberInput
        ariaLabel={label}
        disabled={dis}
        value={toDisplay(o[k], u)}
        min={min}
        step={u === "mm" ? 0.5 : 0.02}
        suffix={u}
        onChange={(v) => set({ [k]: fromDisplay(v, u) } as Partial<ArtObject>)}
      />
    </Field>
  );

  const label = { text: "Text", image: o.type === "image" && o.role === "logo" ? "Logo" : "Image", rect: "Rectangle", ellipse: "Circle", line: "Line", path: "Shape" }[o.type];

  return (
    <>
      <Section
        title={label}
        action={
          <div className="-mr-1.5 flex">
            <IconButton label={o.locked ? "Unlock" : "Lock"} active={o.locked} onClick={() => set({ locked: !o.locked }, "lock")}>
              {o.locked ? <Lock size={14} /> : <LockOpen size={14} />}
            </IconButton>
            <IconButton label="Duplicate" shortcut="⌘D" onClick={duplicateSelection}>
              <Copy size={14} />
            </IconButton>
            <IconButton label="Delete" shortcut="⌫" disabled={dis} onClick={deleteSelection}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        }
      >
        <Field label="Layer name">
          <input className="field" value={o.name} maxLength={120} onChange={(e) => set({ name: e.target.value }, "name")} />
        </Field>
        {o.type === "text" && (
          <>
            <Field label="Text" hint="Press Enter for a new line.">
              <textarea
                ref={textRef}
                className="field"
                rows={Math.min(6, Math.max(2, o.text.split("\n").length))}
                value={o.text}
                disabled={dis}
                maxLength={5000}
                onChange={(e) => set({ text: e.target.value }, "text")}
              />
            </Field>
            <Field label="Font">
              <select className="field" disabled={dis} value={o.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })}>
                {FONTS.map((f) => (
                  <option key={f.family} value={f.family}>
                    {f.family}
                  </option>
                ))}
              </select>
            </Field>
            <Row>
              <Field label="Size">
                <NumberInput ariaLabel="Font size" disabled={dis} value={o.fontSize} min={1} max={400} step={0.5} suffix="pt" onChange={(v) => set({ fontSize: v })} />
              </Field>
              <Field label="Weight">
                <select className="field" disabled={dis} value={o.fontWeight} onChange={(e) => set({ fontWeight: Number(e.target.value) })}>
                  {[300, 400, 500, 600, 700, 800].map((w) => (
                    <option key={w} value={w}>
                      {{ 300: "Light", 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold", 800: "Heavy" }[w]}
                    </option>
                  ))}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Line height">
                <NumberInput ariaLabel="Line height" disabled={dis} value={o.lineHeight} min={0.5} max={4} step={0.05} onChange={(v) => set({ lineHeight: v })} />
              </Field>
              <Field label="Letter spacing">
                <NumberInput ariaLabel="Letter spacing" disabled={dis} value={o.letterSpacing * 1000} min={-500} max={2000} step={10} precision={0} suffix="‰" onChange={(v) => set({ letterSpacing: v / 1000 })} />
              </Field>
            </Row>
            <div className="flex items-center justify-between">
              <Segmented<TextAlign>
                label="Alignment"
                value={o.align}
                onChange={(v) => set({ align: v })}
                options={[
                  { value: "left", label: <AlignLeft size={14} aria-label="Left" />, title: "Align left" },
                  { value: "center", label: <AlignCenter size={14} aria-label="Centre" />, title: "Align centre" },
                  { value: "right", label: <AlignRight size={14} aria-label="Right" />, title: "Align right" },
                ]}
              />
              <IconButton label="Italic" active={o.italic} onClick={() => set({ italic: !o.italic })}>
                <Italic size={14} />
              </IconButton>
            </div>
            <Field label="Colour">
              <ColorInput ariaLabel="Text colour" value={o.color} onChange={(c) => c && set({ color: c }, "color")} swatches={swatches} />
            </Field>
            <button
              className="text-[11.5px] font-medium text-accent hover:text-accent-hover"
              onClick={() => {
                const lines = o.text.split("\n").length;
                set({ height: Math.max(2, lines * o.lineHeight * o.fontSize * 0.352778) });
              }}
            >
              Fit box height to text
            </button>
          </>
        )}
        {o.type === "image" && (
          <>
            <Field label="Fit">
              <Segmented<ImageFit>
                label="Image fit"
                value={o.fit}
                onChange={(v) => set({ fit: v })}
                options={[
                  { value: "contain", label: "Fit" },
                  { value: "cover", label: "Fill" },
                  { value: "stretch", label: "Stretch" },
                ]}
              />
            </Field>
            <p className="text-[11px] leading-snug text-ink-3">Fill crops the image to its box. Drag a corner to resize; hold Shift to change the proportions.</p>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  const a = await importImageFile(f);
                  commit((p) => {
                    p.assets.push(a);
                    const t = p.objects.find((x) => x.id === o.id);
                    if (t && t.type === "image") {
                      t.assetId = a.id;
                      t.height = (t.width * a.height) / a.width;
                    }
                  });
                  toast.success("Image replaced");
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            />
            <button
              disabled={dis}
              onClick={() => fileRef.current?.click()}
              className="flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-[12.5px] font-medium hover:border-line-strong disabled:opacity-45"
            >
              <Replace size={14} /> Replace image
            </button>
          </>
        )}
        {(o.type === "rect" || o.type === "ellipse" || o.type === "path") && (
          <>
            <Field label="Fill">
              <ColorInput ariaLabel="Fill colour" value={o.fill} onChange={(c) => set({ fill: c }, "fill")} swatches={swatches} allowNone />
            </Field>
            <Field label="Border">
              <ColorInput ariaLabel="Border colour" value={o.stroke} onChange={(c) => set({ stroke: c }, "stroke")} swatches={swatches} allowNone />
            </Field>
            <Row>
              <Field label="Border width">
                <NumberInput ariaLabel="Border width" value={o.strokeWidth} min={0} max={50} step={0.1} suffix="mm" onChange={(v) => set({ strokeWidth: v })} />
              </Field>
              {o.type === "rect" && (
                <Field label="Corner radius">
                  <NumberInput ariaLabel="Corner radius" value={o.cornerRadius} min={0} max={500} step={0.5} suffix="mm" onChange={(v) => set({ cornerRadius: v })} />
                </Field>
              )}
            </Row>
          </>
        )}
        {o.type === "line" && (
          <>
            <Field label="Colour">
              <ColorInput ariaLabel="Line colour" value={o.stroke} onChange={(c) => c && set({ stroke: c }, "stroke")} swatches={swatches} />
            </Field>
            <Field label="Thickness">
              <NumberInput ariaLabel="Line thickness" value={o.strokeWidth} min={0.05} max={50} step={0.05} suffix="mm" onChange={(v) => set({ strokeWidth: v })} />
            </Field>
          </>
        )}
      </Section>
      <Section title="Position and size">
        <Row>
          {len("x", "X")}
          {len("y", "Y")}
          {len("width", "Width", u === "mm" ? 0.5 : 0.02)}
          {len("height", "Height", u === "mm" ? 0.5 : 0.02)}
        </Row>
        <Row>
          <Field label="Rotation">
            <NumberInput ariaLabel="Rotation" disabled={dis} value={o.rotation} min={-360} max={360} step={1} suffix="°" precision={1} onChange={(v) => set({ rotation: v })} />
          </Field>
          <Field label="Opacity">
            <NumberInput ariaLabel="Opacity" value={Math.round(o.opacity * 100)} min={0} max={100} step={5} suffix="%" precision={0} onChange={(v) => set({ opacity: v / 100 })} />
          </Field>
        </Row>
        <p className="text-[11px] text-ink-3">Position is measured from the top-left of the panel, before rotation.</p>
        <div className="flex items-center gap-0.5">
          <span className="mr-auto text-[11.5px] font-medium text-ink-2">Arrange</span>
          <IconButton label="Bring to front" onClick={() => reorder(o.id, "top")}>
            <ArrowUpToLine size={14} />
          </IconButton>
          <IconButton label="Bring forward" onClick={() => reorder(o.id, "up")}>
            <ChevronUp size={15} />
          </IconButton>
          <IconButton label="Send backward" onClick={() => reorder(o.id, "down")}>
            <ChevronDown size={15} />
          </IconButton>
          <IconButton label="Send to back" onClick={() => reorder(o.id, "bottom")}>
            <ArrowDownToLine size={14} />
          </IconButton>
        </div>
      </Section>
    </>
  );
}
