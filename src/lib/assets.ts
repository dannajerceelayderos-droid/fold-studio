"use client";
import { localRepo } from "./storage/db";
import type { AssetRef } from "./types";
import { uid } from "./objects";

export const ACCEPTED = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 3000;

interface Entry {
  url: string;
  img: HTMLImageElement;
  ready: boolean;
}

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
let version = 0;

export const assetVersion = () => version;
export function onAssetsChanged(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function bump() {
  version++;
  listeners.forEach((l) => l());
}

export function registerBlob(id: string, blob: Blob) {
  if (cache.has(id)) return;
  const url = URL.createObjectURL(blob);
  const img = new Image();
  const entry: Entry = { url, img, ready: false };
  img.onload = () => {
    entry.ready = true;
    bump();
  };
  img.src = url;
  cache.set(id, entry);
}

export async function ensureAssets(ids: string[]) {
  await Promise.all(
    ids
      .filter((id) => !cache.has(id))
      .map(async (id) => {
        const blob = await localRepo.getAsset(id);
        if (blob) registerBlob(id, blob);
      }),
  );
  bump();
}

export const assetUrl = (id: string) => cache.get(id)?.url;
export const assetImage = (id: string) => {
  const e = cache.get(id);
  return e?.ready ? e.img : undefined;
};

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

export async function assetDataUrl(id: string): Promise<string | undefined> {
  const blob = await localRepo.getAsset(id);
  return blob ? blobToDataUrl(blob) : undefined;
}

export async function dataUrlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("The image couldn't be read. Try exporting it again as PNG or JPEG."));
    img.src = url;
  });
}

/** Validate, downscale very large images, store in IndexedDB and return an AssetRef. */
export async function importImageFile(file: File): Promise<AssetRef> {
  if (!(ACCEPTED as readonly string[]).includes(file.type)) {
    throw new Error(`${file.name} isn't supported. Upload a PNG, JPEG or WebP image.`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name} is larger than 10 MB. Resize it and try again.`);
  }
  const srcUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(srcUrl);
    let blob: Blob = file;
    let { naturalWidth: w, naturalHeight: h } = img;
    if (Math.max(w, h) > MAX_EDGE) {
      const k = MAX_EDGE / Math.max(w, h);
      w = Math.round(w * k);
      h = Math.round(h * k);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const type = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
      blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Resize failed"))), type, 0.92));
    }
    const id = uid("a");
    await localRepo.putAsset(id, blob);
    registerBlob(id, blob);
    return { id, name: file.name.slice(0, 200), mime: (blob.type || file.type) as AssetRef["mime"], width: w, height: h, size: blob.size };
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}
