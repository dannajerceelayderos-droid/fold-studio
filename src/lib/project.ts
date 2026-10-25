import { DEFAULT_BRAND, uid } from "./objects";
import { getDieline, TEMPLATES } from "./templates";
import type { ArtObject, Dimensions, Project, TemplateId } from "./types";

export function defaultPreview(): Project["preview"] {
  return { background: "studio", lighting: "soft", shadow: 0.6, autoRotate: false, fold: 1, open: 0 };
}

export function newProject(templateId: TemplateId, name?: string): Project {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: uid("p"),
    name: name ?? `Untitled ${TEMPLATES[templateId].name.toLowerCase()}`,
    templateId,
    dimensions: { ...TEMPLATES[templateId].defaults },
    units: "mm",
    panels: {},
    objects: [],
    material: "matte-white",
    preview: defaultPreview(),
    brandKit: { ...DEFAULT_BRAND },
    assets: [],
    isSample: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Re-fit artwork after the package changes shape (new dimensions or template).
 * Objects keep their panel when it still exists, and keep their position
 * relative to the panel's size. Objects on panels that no longer exist move to the front.
 */
export function refitObjects(
  objects: ArtObject[],
  fromTemplate: TemplateId,
  fromDims: Dimensions,
  toTemplate: TemplateId,
  toDims: Dimensions,
): ArtObject[] {
  const from = getDieline(fromTemplate, fromDims);
  const to = getDieline(toTemplate, toDims);
  return objects.map((o) => {
    const src = from.panels.find((p) => p.id === o.panelId);
    const dst = to.panels.find((p) => p.id === o.panelId) ?? to.panels.find((p) => p.id === "front")!;
    if (!src) return { ...o, panelId: dst.id };
    const cx = (o.x + o.width / 2) / src.width;
    const cy = (o.y + o.height / 2) / src.height;
    return { ...o, panelId: dst.id, x: cx * dst.width - o.width / 2, y: cy * dst.height - o.height / 2 };
  });
}

export function cloneProject(p: Project, name?: string): Project {
  const now = new Date().toISOString();
  return { ...structuredClone(p), id: uid("p"), name: name ?? `${p.name} copy`, isSample: false, createdAt: now, updatedAt: now };
}
