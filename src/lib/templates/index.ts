import type { Dieline, DielinePanel, Dimensions, TemplateId } from "../types";
import { buildCarton } from "./carton";
import { buildMailer } from "./mailer";

export interface DimensionLimits {
  width: [number, number];
  height: [number, number];
  depth: [number, number];
}

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  supports: string[];
  defaults: Dimensions;
  limits: DimensionLimits;
  build: (d: Dimensions) => Dieline;
}

export const TEMPLATES: Record<TemplateId, TemplateInfo> = {
  carton: {
    id: "carton",
    name: "Tuck-end carton",
    category: "Folding cartons",
    description:
      "A reverse tuck-end carton for serums, candles, tea and cosmetics. Six printable faces, tuck lids top and bottom.",
    supports: ["Six printable faces", "Top and bottom tuck lids", "Dust flaps and glue flap", "Opening top lid in 3D"],
    defaults: { width: 50, height: 120, depth: 40 },
    limits: { width: [20, 400], height: [20, 500], depth: [10, 300] },
    build: buildCarton,
  },
  mailer: {
    id: "mailer",
    name: "Mailer box",
    category: "Mailer boxes",
    description:
      "A one-piece mailer with a hinged lid and front tuck, for subscription boxes, apparel and gift sets.",
    supports: ["Lid, base and four printable walls", "Hinged lid that opens in 3D", "Lid tuck and side flaps"],
    defaults: { width: 220, height: 80, depth: 160 },
    limits: { width: [50, 600], height: [20, 300], depth: [50, 500] },
    build: buildMailer,
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export const COMING_SOON = [
  { name: "Sleeves", description: "Slide-on sleeves for trays and bars." },
  { name: "Labels", description: "Wrap-around labels for jars and bottles." },
  { name: "Product inserts", description: "Die-cut inserts that hold products in place." },
  { name: "Packaging sets", description: "Design several pieces as one coordinated set." },
];

const cache = new Map<string, Dieline>();

export function getDieline(templateId: TemplateId, d: Dimensions): Dieline {
  const key = `${templateId}:${d.width}:${d.height}:${d.depth}`;
  let dl = cache.get(key);
  if (!dl) {
    dl = TEMPLATES[templateId].build(d);
    if (cache.size > 50) cache.clear();
    cache.set(key, dl);
  }
  return dl;
}

export function clampDimensions(templateId: TemplateId, d: Dimensions): Dimensions {
  const l = TEMPLATES[templateId].limits;
  const c = (v: number, [a, b]: [number, number]) => Math.min(b, Math.max(a, Math.round(v * 10) / 10));
  return { width: c(d.width, l.width), height: c(d.height, l.height), depth: c(d.depth, l.depth) };
}

export function panelById(dl: Dieline, id: string): DielinePanel | undefined {
  return dl.panels.find((p) => p.id === id);
}

/** Which panel (if any) contains a dieline point (mm). Faces win over flaps. */
export function panelAt(dl: Dieline, x: number, y: number): DielinePanel | undefined {
  const hits = dl.panels.filter((p) => x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height);
  return hits.find((p) => p.kind === "face") ?? hits[0];
}
