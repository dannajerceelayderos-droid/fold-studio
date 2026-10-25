import { nanoid } from "nanoid";
import type {
  ArtObject,
  BrandKit,
  EllipseObject,
  ImageObject,
  LineObject,
  PathObject,
  RectObject,
  TextObject,
} from "./types";

export const PT_TO_MM = 0.352778;
export const uid = (p = "o") => `${p}_${nanoid(10)}`;

export const FONTS = [
  { family: "Inter", stack: "'Inter Variable', Inter, system-ui, sans-serif" },
  { family: "Fraunces", stack: "'Fraunces Variable', Fraunces, Georgia, serif" },
  { family: "Helvetica", stack: "Helvetica, 'Helvetica Neue', Arial, sans-serif" },
  { family: "Arial", stack: "Arial, Helvetica, sans-serif" },
  { family: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  { family: "Times New Roman", stack: "'Times New Roman', Times, serif" },
  { family: "Courier New", stack: "'Courier New', Courier, monospace" },
] as const;

export function fontStack(family: string): string {
  return FONTS.find((f) => f.family === family)?.stack ?? `${family}, sans-serif`;
}

const base = (panelId: string, name: string, x: number, y: number, width: number, height: number) => ({
  id: uid(),
  name,
  panelId,
  x,
  y,
  width,
  height,
  rotation: 0,
  opacity: 1,
  locked: false,
  hidden: false,
});

export function textLines(t: Pick<TextObject, "text">): string[] {
  return t.text.split("\n");
}

export function textBoxHeight(t: Pick<TextObject, "text" | "fontSize" | "lineHeight">): number {
  return textLines(t).length * t.lineHeight * t.fontSize * PT_TO_MM;
}

/** Baseline y (mm, relative to object top) for line i — shared by SVG and canvas renderers. */
export function baselineY(t: Pick<TextObject, "fontSize" | "lineHeight">, i: number): number {
  const s = t.fontSize * PT_TO_MM;
  return ((t.lineHeight - 1) / 2 + 0.8 + i * t.lineHeight) * s;
}

export function makeText(
  panelId: string,
  pw: number,
  ph: number,
  opts: Partial<TextObject> = {},
): TextObject {
  const t: TextObject = {
    ...base(panelId, "Text", 0, 0, Math.min(pw * 0.8, 60), 10),
    type: "text",
    text: "Your text",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: 500,
    italic: false,
    align: "center",
    lineHeight: 1.2,
    letterSpacing: 0,
    color: "#20211F",
    ...opts,
  };
  if (!opts.height) t.height = Math.max(4, textBoxHeight(t));
  if (opts.x === undefined) t.x = (pw - t.width) / 2;
  if (opts.y === undefined) t.y = (ph - t.height) / 2;
  t.name = opts.name ?? (t.text.split("\n")[0].slice(0, 24) || "Text");
  return t;
}

export function makeRect(panelId: string, pw: number, ph: number, opts: Partial<RectObject> = {}): RectObject {
  const w = Math.min(pw * 0.5, 40);
  const h = Math.min(ph * 0.3, 24);
  return {
    ...base(panelId, "Rectangle", (pw - w) / 2, (ph - h) / 2, w, h),
    type: "rect",
    fill: "#68775A",
    stroke: null,
    strokeWidth: 0.5,
    cornerRadius: 0,
    ...opts,
  };
}

export function makeEllipse(panelId: string, pw: number, ph: number, opts: Partial<EllipseObject> = {}): EllipseObject {
  const s = Math.min(pw, ph) * 0.4;
  return {
    ...base(panelId, "Circle", (pw - s) / 2, (ph - s) / 2, s, s),
    type: "ellipse",
    fill: "#68775A",
    stroke: null,
    strokeWidth: 0.5,
    ...opts,
  };
}

export function makeLine(panelId: string, pw: number, ph: number, opts: Partial<LineObject> = {}): LineObject {
  const w = pw * 0.6;
  return {
    ...base(panelId, "Line", (pw - w) / 2, ph / 2 - 1, w, 2),
    type: "line",
    stroke: "#20211F",
    strokeWidth: 0.4,
    ...opts,
  };
}

export function makePath(
  panelId: string,
  pw: number,
  ph: number,
  shape: ShapePreset,
  opts: Partial<PathObject> = {},
): PathObject {
  const s = Math.min(pw, ph) * 0.4;
  const ratio = shape.vb[0] / shape.vb[1];
  const w = ratio >= 1 ? s : s * ratio;
  const h = ratio >= 1 ? s / ratio : s;
  return {
    ...base(panelId, shape.name, (pw - w) / 2, (ph - h) / 2, w, h),
    type: "path",
    d: shape.d,
    vbWidth: shape.vb[0],
    vbHeight: shape.vb[1],
    fill: "#68775A",
    stroke: null,
    strokeWidth: 0.5,
    ...opts,
  };
}

export function makeImage(
  panelId: string,
  pw: number,
  ph: number,
  asset: { id: string; width: number; height: number; name: string },
  role: ImageObject["role"] = "image",
): ImageObject {
  const maxW = pw * 0.6;
  const maxH = ph * 0.5;
  const r = asset.width / Math.max(1, asset.height);
  let w = maxW;
  let h = w / r;
  if (h > maxH) {
    h = maxH;
    w = h * r;
  }
  return {
    ...base(panelId, asset.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 24) || "Image", (pw - w) / 2, (ph - h) / 2, w, h),
    type: "image",
    assetId: asset.id,
    fit: "contain",
    role,
  };
}

export interface ShapePreset {
  id: string;
  name: string;
  d: string;
  vb: [number, number];
}

export const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: "leaf",
    name: "Leaf",
    vb: [60, 100],
    d: "M30 2 C52 20 58 52 44 76 C38 87 34 92 30 98 C26 92 22 87 16 76 C2 52 8 20 30 2 Z",
  },
  {
    id: "sprig",
    name: "Sprig",
    vb: [80, 100],
    d: "M39 98 L39 30 C39 20 40 10 41 2 L43 2 C42 10 41 20 41 30 L41 98 Z M40 72 C28 72 16 64 10 50 C24 50 36 58 40 72 Z M40 72 C52 72 64 64 70 50 C56 50 44 58 40 72 Z M40 48 C30 48 20 40 16 28 C28 28 37 36 40 48 Z M40 48 C50 48 60 40 64 28 C52 28 43 36 40 48 Z M40 26 C34 24 30 16 30 8 C37 10 40 18 40 26 Z M40 26 C46 24 50 16 50 8 C43 10 40 18 40 26 Z",
  },
  {
    id: "star",
    name: "Star",
    vb: [100, 100],
    d: "M50 4 L61 38 L97 38 L68 59 L79 94 L50 73 L21 94 L32 59 L3 38 L39 38 Z",
  },
  {
    id: "arch",
    name: "Arch",
    vb: [80, 100],
    d: "M0 100 L0 40 A40 40 0 0 1 80 40 L80 100 Z",
  },
  {
    id: "badge",
    name: "Badge",
    vb: [100, 100],
    d: "M50 2 L60 12 L74 9 L78 23 L92 28 L88 42 L98 52 L88 62 L92 76 L78 80 L74 94 L60 90 L50 100 L40 90 L26 94 L22 80 L8 76 L12 62 L2 52 L12 42 L8 28 L22 23 L26 9 L40 12 Z",
  },
  {
    id: "sun",
    name: "Sun",
    vb: [100, 100],
    d: "M50 28 A22 22 0 1 1 49.99 28 Z M48 2 L52 2 L52 18 L48 18 Z M48 82 L52 82 L52 98 L48 98 Z M2 48 L18 48 L18 52 L2 52 Z M82 48 L98 48 L98 52 L82 52 Z M15 18 L18 15 L29 26 L26 29 Z M71 74 L74 71 L85 82 L82 85 Z M82 15 L85 18 L74 29 L71 26 Z M26 71 L29 74 L18 85 L15 82 Z",
  },
];

export const DEFAULT_BRAND: BrandKit = {
  name: "",
  primary: "#2F3E2C",
  secondary: "#EFE9DC",
  accent: "#68775A",
  headingFont: "Fraunces",
  bodyFont: "Inter",
  logoAssetId: null,
};

export function duplicateObject(o: ArtObject): ArtObject {
  return { ...o, id: uid(), name: `${o.name} copy`, x: o.x + 3, y: o.y + 3, locked: false };
}
