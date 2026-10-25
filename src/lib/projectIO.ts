"use client";
import { assetDataUrl, dataUrlToBlob, registerBlob } from "./assets";
import { uid } from "./objects";
import { cloneProject } from "./project";
import { sampleProject } from "./sample";
import { exportFileSchema, formatZodError, migrateProject, type ExportFile } from "./schema";
import { localRepo, markSampleSeeded, sampleSeeded } from "./storage/db";
import type { Project } from "./types";

export function download(filename: string, data: Blob | string) {
  const url = typeof data === "string" ? data : URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof data !== "string") setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const safeName = (s: string) => s.replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "fold-studio";

export async function buildExportFile(p: Project): Promise<ExportFile> {
  const assets: Record<string, string> = {};
  for (const a of p.assets) {
    const url = await assetDataUrl(a.id);
    if (url) assets[a.id] = url;
  }
  return { format: "fold-studio-project", version: 1, exportedAt: new Date().toISOString(), project: p, assets };
}

/** Parse and validate an exported project. Throws an Error with a readable message. */
export function parseExportFile(text: string): ExportFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON. Choose a .json file exported from Fold Studio.");
  }
  if (raw && typeof raw === "object" && "project" in raw) {
    (raw as { project: unknown }).project = migrateProject((raw as { project: unknown }).project);
  }
  const r = exportFileSchema.safeParse(raw);
  if (!r.success) throw new Error(`This isn't a Fold Studio project file (${formatZodError(r.error)}).`);
  const missing = r.data.project.objects.find((o) => o.type === "image" && !r.data.assets[o.assetId] && !r.data.project.assets.some((a) => a.id === o.assetId));
  if (missing) throw new Error("The project references an image that isn't included in the file.");
  return r.data;
}

/** Store an imported project as a new local project (fresh ids so it never overwrites). */
export async function importProject(file: ExportFile): Promise<Project> {
  const idMap = new Map<string, string>();
  for (const id of Object.keys(file.assets)) {
    const newId = uid("a");
    idMap.set(id, newId);
    const blob = await dataUrlToBlob(file.assets[id]);
    await localRepo.putAsset(newId, blob);
    registerBlob(newId, blob);
  }
  const p = cloneProject(file.project, file.project.name);
  p.assets = p.assets.filter((a) => idMap.has(a.id)).map((a) => ({ ...a, id: idMap.get(a.id)! }));
  p.objects = p.objects
    .filter((o) => o.type !== "image" || idMap.has(o.assetId))
    .map((o) => (o.type === "image" ? { ...o, assetId: idMap.get(o.assetId)! } : o));
  if (p.brandKit.logoAssetId) p.brandKit.logoAssetId = idMap.get(p.brandKit.logoAssetId) ?? null;
  await localRepo.save(p, null);
  return p;
}

/** Put the sample project in the library the first time someone visits. */
export async function ensureSample(): Promise<void> {
  if (sampleSeeded()) return;
  const existing = await localRepo.get(sampleProject().id);
  if (!existing) await localRepo.save(sampleProject(), null);
  markSampleSeeded();
}

export async function restoreSample(): Promise<Project> {
  const s = sampleProject();
  await localRepo.save(s, null);
  return s;
}
