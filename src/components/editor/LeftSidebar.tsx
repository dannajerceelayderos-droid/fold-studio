"use client";
import {
  Circle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LayoutTemplate,
  Layers,
  Lock,
  Minus,
  Palette,
  Shapes,
  Square,
  Type,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { assetUrl, importImageFile } from "@/lib/assets";
import { FONTS, makeEllipse, makeImage, makeLine, makePath, makeRect, makeText, SHAPE_PRESETS } from "@/lib/objects";
import { getDieline, TEMPLATE_LIST } from "@/lib/templates";
import type { AssetRef, Project } from "@/lib/types";
import { useEditor, type LeftTab } from "@/store/editor";
import { Button, ColorInput, Field } from "../ui/controls";
import { confirmDialog } from "../ui/Dialog";
import { toast } from "../ui/Toast";
import { TemplateThumb } from "../TemplateThumb";

export const TABS: { id: LeftTab; label: string; icon: typeof Layers }[] = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "text", label: "Text", icon: Type },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "shapes", label: "Shapes", icon: Shapes },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "templates", label: "Template", icon: LayoutTemplate },
];

function useTargetPanel() {
  const project = useEditor((s) => s.project!);
  const selectedPanel = useEditor((s) => s.selectedPanel);
  const dl = getDieline(project.templateId, project.dimensions);
  return dl.panels.find((p) => p.id === selectedPanel) ?? dl.panels.find((p) => p.id === "front")!;
}

export function LeftSidebar() {
  const tab = useEditor((s) => s.leftTab);
  const setTab = useEditor((s) => s.setLeftTab);
  return (
    <div className="flex h-full shrink-0 border-r border-line bg-surface">
      <nav className="flex w-[60px] flex-col items-center gap-1 border-r border-line py-2" aria-label="Editor tools">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`flex w-[52px] flex-col items-center gap-1 rounded-md py-2 text-[10.5px] font-medium transition-colors ${
              tab === t.id ? "bg-accent-soft text-accent-hover" : "text-ink-2 hover:bg-black/[0.04] hover:text-ink"
            }`}
          >
            <t.icon size={17} strokeWidth={1.75} />
            {t.label}
          </button>
        ))}
      </nav>
      <div className="no-scrollbar w-[244px] overflow-y-auto">
        <TabContent tab={tab} />
      </div>
    </div>
  );
}

export function TabContent({ tab }: { tab: LeftTab }) {
  return (
    <>
      {tab === "layers" && <LayersTab />}
      {tab === "text" && <TextTab />}
      {tab === "images" && <ImagesTab />}
      {tab === "shapes" && <ShapesTab />}
      {tab === "brand" && <BrandTab />}
      {tab === "templates" && <TemplatesTab />}
    </>
  );
}

const Head = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="px-4 pb-2 pt-4">
    <h2 className="text-[13px] font-semibold">{title}</h2>
    {sub && <p className="mt-0.5 text-[11.5px] leading-snug text-ink-2">{sub}</p>}
  </div>
);

function TargetNote() {
  const p = useTargetPanel();
  return <p className="px-4 pb-3 text-[11.5px] text-ink-2">Adds to: <span className="font-medium text-ink">{p.name}</span>. Click a panel to change.</p>;
}

function LayersTab() {
  const project = useEditor((s) => s.project!);
  const selection = useEditor((s) => s.selection);
  const { setSelection, updateObject, selectPanel } = useEditor.getState();
  const dl = getDieline(project.templateId, project.dimensions);
  const [renaming, setRenaming] = useState<string | null>(null);
  const groups = dl.panels
    .map((p) => ({ panel: p, objects: project.objects.filter((o) => o.panelId === p.id).reverse() }))
    .filter((g) => g.objects.length || g.panel.kind === "face");
  return (
    <div>
      <Head title="Layers" sub="Top of each list is in front. Double-click a name to rename." />
      {groups.map(({ panel, objects }) => (
        <div key={panel.id} className="pb-2">
          <button onClick={() => selectPanel(panel.id)} className="flex w-full items-center justify-between px-4 py-1.5 text-left text-[11.5px] font-semibold text-ink-2 hover:text-ink">
            {panel.name}
            <span className="font-normal text-ink-3">{objects.length || ""}</span>
          </button>
          {objects.length === 0 && <p className="px-4 pb-1 text-[11.5px] text-ink-3">Empty</p>}
          <ul>
            {objects.map((o) => {
              const sel = selection.includes(o.id);
              return (
                <li key={o.id}>
                  <div
                    className={`group mx-2 flex h-8 items-center gap-1.5 rounded-md pl-2 pr-1 text-[12.5px] ${sel ? "bg-accent-soft text-accent-hover" : "hover:bg-black/[0.035]"}`}
                  >
                    <TypeIcon type={o.type} />
                    {renaming === o.id ? (
                      <input
                        autoFocus
                        className="field h-6 flex-1"
                        defaultValue={o.name}
                        maxLength={120}
                        onBlur={(e) => {
                          updateObject(o.id, { name: e.target.value.trim() || o.name });
                          setRenaming(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") setRenaming(null);
                        }}
                      />
                    ) : (
                      <button
                        className={`flex-1 truncate text-left ${o.hidden ? "text-ink-3" : ""}`}
                        onClick={(e) => setSelection(e.shiftKey ? (sel ? selection.filter((x) => x !== o.id) : [...selection, o.id]) : [o.id], o.panelId)}
                        onDoubleClick={() => setRenaming(o.id)}
                      >
                        {o.name}
                      </button>
                    )}
                    <button
                      aria-label={o.locked ? `Unlock ${o.name}` : `Lock ${o.name}`}
                      title={o.locked ? "Unlock" : "Lock"}
                      onClick={() => updateObject(o.id, { locked: !o.locked }, "lock")}
                      className={`rounded p-1 hover:bg-black/5 ${o.locked ? "text-ink" : "text-ink-3 opacity-0 group-hover:opacity-100 focus:opacity-100"}`}
                    >
                      <Lock size={12} />
                    </button>
                    <button
                      aria-label={o.hidden ? `Show ${o.name}` : `Hide ${o.name}`}
                      title={o.hidden ? "Show" : "Hide"}
                      onClick={() => updateObject(o.id, { hidden: !o.hidden }, "hide")}
                      className={`rounded p-1 hover:bg-black/5 ${o.hidden ? "text-ink" : "text-ink-3 opacity-0 group-hover:opacity-100 focus:opacity-100"}`}
                    >
                      {o.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  const I = type === "text" ? Type : type === "image" ? ImageIcon : type === "ellipse" ? Circle : type === "line" ? Minus : type === "path" ? Shapes : Square;
  return <I size={13} className="shrink-0 opacity-60" />;
}

function TextTab() {
  const p = useTargetPanel();
  const kit = useEditor((s) => s.project!.brandKit);
  const add = useEditor((s) => s.addObject);
  const presets = [
    { label: "Heading", sample: "Product name", font: kit.headingFont, size: 16, weight: 500 },
    { label: "Subheading", sample: "A short descriptor", font: kit.bodyFont, size: 8, weight: 500 },
    { label: "Body", sample: "Directions, ingredients\nand other details.", font: kit.bodyFont, size: 5.5, weight: 400 },
    { label: "Small print", sample: "Net wt. 30 ml", font: kit.bodyFont, size: 4.5, weight: 400 },
  ];
  return (
    <div>
      <Head title="Text" sub="Headings use your brand heading font; the rest use the body font." />
      <TargetNote />
      <div className="space-y-1.5 px-3">
        {presets.map((t) => {
          const stack = FONTS.find((f) => f.family === t.font)?.stack;
          return (
            <button
              key={t.label}
              onClick={() =>
                add(makeText(p.id, p.width, p.height, { text: t.sample, fontFamily: t.font, fontSize: t.size, fontWeight: t.weight, color: kit.primary, name: t.label, width: Math.max(10, p.width * 0.8) }))
              }
              className="block w-full rounded-lg border border-line px-3 py-2.5 text-left hover:border-line-strong hover:bg-[#fbfbfa]"
            >
              <span className="block text-[10.5px] font-medium text-ink-3">{t.label}</span>
              <span className="block truncate" style={{ fontFamily: stack, fontWeight: t.weight, fontSize: t.label === "Heading" ? 19 : t.label === "Subheading" ? 14 : 12 }}>
                {t.sample.split("\n")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function useUpload() {
  const commit = useEditor((s) => s.commit);
  return async (files: FileList | File[]) => {
    const out: AssetRef[] = [];
    for (const f of Array.from(files)) {
      try {
        out.push(await importImageFile(f));
      } catch (err) {
        toast.error((err as Error).message);
      }
    }
    if (out.length) commit((d) => void d.assets.push(...out));
    return out;
  };
}

function ImagesTab() {
  const project = useEditor((s) => s.project!);
  const add = useEditor((s) => s.addObject);
  const p = useTargetPanel();
  const upload = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const place = (a: AssetRef) => add(makeImage(p.id, p.width, p.height, a));
  return (
    <div>
      <Head title="Images" sub="PNG, JPEG or WebP up to 10 MB. Transparent PNGs keep their transparency." />
      <TargetNote />
      <div className="px-3">
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const files = e.target.files;
            if (!files) return;
            const added = await upload(files);
            e.target.value = "";
            if (added.length === 1) place(added[0]);
          }}
        />
        <button
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setOver(false);
            const added = await upload(e.dataTransfer.files);
            if (added.length === 1) place(added[0]);
          }}
          className={`flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed px-3 py-6 text-[12.5px] transition-colors ${
            over ? "border-accent bg-accent-soft/60" : "border-line-strong hover:border-accent"
          }`}
        >
          <Upload size={18} className="text-ink-2" />
          <span className="font-medium">Upload images</span>
          <span className="text-[11px] text-ink-3">or drop files here</span>
        </button>
        {project.assets.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-[11.5px] font-medium text-ink-2">In this project — click to place</p>
            <div className="grid grid-cols-3 gap-1.5 pb-4">
              {project.assets.map((a) => (
                <AssetTile key={a.id} a={a} onClick={() => place(a)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AssetTile({ a, onClick }: { a: AssetRef; onClick: () => void }) {
  const url = assetUrl(a.id);
  return (
    <button
      onClick={onClick}
      title={a.name}
      className="aspect-square overflow-hidden rounded-md border border-line bg-[repeating-conic-gradient(#f0f0ed_0_25%,#fff_0_50%)] bg-[length:10px_10px] hover:border-accent"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt={a.name} className="h-full w-full object-contain" /> : <span className="text-[10px] text-ink-3">Loading</span>}
    </button>
  );
}

function ShapesTab() {
  const p = useTargetPanel();
  const add = useEditor((s) => s.addObject);
  const kit = useEditor((s) => s.project!.brandKit);
  const basic = [
    { label: "Rectangle", icon: <Square size={22} strokeWidth={1.5} />, make: () => makeRect(p.id, p.width, p.height, { fill: kit.accent }) },
    { label: "Circle", icon: <Circle size={22} strokeWidth={1.5} />, make: () => makeEllipse(p.id, p.width, p.height, { fill: kit.accent }) },
    { label: "Line", icon: <Minus size={22} strokeWidth={1.5} />, make: () => makeLine(p.id, p.width, p.height, { stroke: kit.primary }) },
  ];
  return (
    <div>
      <Head title="Shapes" />
      <TargetNote />
      <div className="grid grid-cols-3 gap-1.5 px-3">
        {basic.map((b) => (
          <button key={b.label} onClick={() => add(b.make())} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-line text-[10.5px] font-medium text-ink-2 hover:border-line-strong hover:text-ink">
            {b.icon}
            {b.label}
          </button>
        ))}
        {SHAPE_PRESETS.map((s) => (
          <button
            key={s.id}
            onClick={() => add(makePath(p.id, p.width, p.height, s, { fill: kit.accent }))}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-line text-[10.5px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
          >
            <svg viewBox={`0 0 ${s.vb[0]} ${s.vb[1]}`} className="h-[22px] w-[22px]" aria-hidden>
              <path d={s.d} fill="currentColor" />
            </svg>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function BrandTab() {
  const project = useEditor((s) => s.project!);
  const selectedPanel = useEditor((s) => s.selectedPanel);
  const { commit, setPanelBackground, addObject } = useEditor.getState();
  const kit = project.brandKit;
  const p = useTargetPanel();
  const upload = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const setKit = (patch: Partial<Project["brandKit"]>, key: string) => commit((d) => void Object.assign(d.brandKit, patch), `brand:${key}`);
  const dl = getDieline(project.templateId, project.dimensions);
  const faceIds = dl.panels.filter((x) => x.kind === "face").map((x) => x.id);
  const logo = project.assets.find((a) => a.id === kit.logoAssetId);

  const applyAll = async (color: string, label: string) => {
    const ok = await confirmDialog({
      title: `Use ${label.toLowerCase()} on every face?`,
      message: "This replaces the background colour of all six faces. You can undo it.",
      confirm: "Apply to all faces",
    });
    if (ok) setPanelBackground(faceIds, color);
  };

  const colorRow = (k: "primary" | "secondary" | "accent", label: string) => (
    <div className="space-y-1.5">
      <Field label={label}>
        <ColorInput ariaLabel={`${label} colour`} value={kit[k]} onChange={(c) => c && setKit({ [k]: c }, k)} />
      </Field>
      <div className="flex gap-1.5">
        <Button size="sm" disabled={!selectedPanel} onClick={() => selectedPanel && setPanelBackground([selectedPanel], kit[k])}>
          Fill {dl.panels.find((x) => x.id === selectedPanel)?.name.toLowerCase() ?? "panel"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => applyAll(kit[k], label)}>
          All faces
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <Head title="Brand kit" sub="Changing a colour here doesn't recolour your design. Use the buttons to apply it where you want." />
      <div className="space-y-4 px-4 pb-6">
        <Field label="Brand name">
          <input className="field" value={kit.name} maxLength={120} placeholder="Your brand" onChange={(e) => setKit({ name: e.target.value }, "name")} />
        </Field>
        {colorRow("primary", "Primary")}
        {colorRow("secondary", "Secondary")}
        {colorRow("accent", "Accent")}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Heading font">
            <select className="field" value={kit.headingFont} onChange={(e) => setKit({ headingFont: e.target.value }, "hf")}>
              {FONTS.map((f) => (
                <option key={f.family}>{f.family}</option>
              ))}
            </select>
          </Field>
          <Field label="Body font">
            <select className="field" value={kit.bodyFont} onChange={(e) => setKit({ bodyFont: e.target.value }, "bf")}>
              {FONTS.map((f) => (
                <option key={f.family}>{f.family}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="-mt-2 text-[11px] text-ink-3">Custom font upload isn&apos;t available yet.</p>
        <div>
          <span className="mb-1 block text-[11.5px] font-medium text-ink-2">Logo</span>
          <input
            ref={input}
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const f = e.target.files;
              e.target.value = "";
              if (!f) return;
              const [a] = await upload(f);
              if (a) setKit({ logoAssetId: a.id }, "logo");
            }}
          />
          {logo ? (
            <div className="space-y-2">
              <div className="flex h-20 items-center justify-center rounded-lg border border-line bg-[repeating-conic-gradient(#f0f0ed_0_25%,#fff_0_50%)] bg-[length:10px_10px] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(logo.id)} alt="Brand logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="primary" onClick={() => addObject(makeImage(p.id, p.width, p.height, logo, "logo"))}>
                  Place on {p.name.toLowerCase()}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => input.current?.click()}>
                  Replace
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" onClick={() => input.current?.click()}>
              <Upload size={13} /> Upload logo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplatesTab() {
  const project = useEditor((s) => s.project!);
  const setTemplate = useEditor((s) => s.setTemplate);
  const list = useMemo(() => TEMPLATE_LIST, []);
  return (
    <div>
      <Head title="Template" sub="Switching keeps artwork on matching faces and resets the size to the template's default." />
      <div className="space-y-2 px-3 pb-4">
        {list.map((t) => (
          <button
            key={t.id}
            onClick={async () => {
              if (t.id === project.templateId) return;
              const ok = await confirmDialog({
                title: `Switch to ${t.name.toLowerCase()}?`,
                message: "Artwork moves to the matching faces of the new template and dimensions reset to its defaults. You can undo this.",
                confirm: "Switch template",
              });
              if (ok) setTemplate(t.id);
            }}
            className={`block w-full rounded-lg border p-2 text-left ${t.id === project.templateId ? "border-accent bg-accent-soft/40" : "border-line hover:border-line-strong"}`}
          >
            <TemplateThumb templateId={t.id} className="h-24 w-full" />
            <span className="mt-1.5 block text-[12.5px] font-medium">{t.name}</span>
            <span className="block text-[11px] leading-snug text-ink-2">{t.supports.slice(0, 2).join(", ")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
