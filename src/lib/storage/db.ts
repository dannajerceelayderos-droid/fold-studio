"use client";
import { createStore, del, entries, get, set, type UseStore } from "idb-keyval";
import type { Project, ProjectMeta } from "../types";

let stores: { projects: UseStore; meta: UseStore; assets: UseStore } | null = null;

function s() {
  if (typeof indexedDB === "undefined") throw new Error("This browser can't store projects (IndexedDB is unavailable).");
  if (!stores) {
    stores = {
      projects: createStore("fold-studio-projects", "projects"),
      meta: createStore("fold-studio-meta", "meta"),
      assets: createStore("fold-studio-assets", "assets"),
    };
  }
  return stores;
}

export interface StoredAsset {
  id: string;
  blob: Blob;
}

/**
 * Local-first project repository (IndexedDB). A cloud repository can implement
 * the same interface later without the editor changing.
 */
export interface ProjectRepository {
  list(): Promise<ProjectMeta[]>;
  get(id: string): Promise<Project | undefined>;
  save(p: Project, thumbnail?: string | null): Promise<void>;
  remove(id: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  getAsset(id: string): Promise<Blob | undefined>;
  putAsset(id: string, blob: Blob): Promise<void>;
}

export const localRepo: ProjectRepository = {
  async list() {
    const all = await entries<string, ProjectMeta>(s().meta);
    return all.map(([, m]) => m).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id) {
    return get<Project>(id, s().projects);
  },
  async save(p, thumbnail) {
    const prev = await get<ProjectMeta>(p.id, s().meta);
    await set(p.id, p, s().projects);
    const meta: ProjectMeta = {
      id: p.id,
      name: p.name,
      templateId: p.templateId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      isSample: p.isSample,
      thumbnail: thumbnail === undefined ? (prev?.thumbnail ?? null) : thumbnail,
    };
    await set(p.id, meta, s().meta);
  },
  async remove(id) {
    const p = await get<Project>(id, s().projects);
    await del(id, s().projects);
    await del(id, s().meta);
    // remove assets no other project references
    if (p?.assets.length) {
      const others = await entries<string, Project>(s().projects);
      const used = new Set(others.flatMap(([, o]) => o.assets.map((a) => a.id)));
      await Promise.all(p.assets.filter((a) => !used.has(a.id)).map((a) => del(a.id, s().assets)));
    }
  },
  async rename(id, name) {
    const p = await get<Project>(id, s().projects);
    if (!p) throw new Error("Project not found");
    await this.save({ ...p, name, updatedAt: new Date().toISOString() });
  },
  async getAsset(id) {
    return get<Blob>(id, s().assets);
  },
  async putAsset(id, blob) {
    await set(id, blob, s().assets);
  },
};

const SEED_KEY = "fold-studio:sample-seeded";
export function sampleSeeded(): boolean {
  try {
    return localStorage.getItem(SEED_KEY) === "1";
  } catch {
    return true;
  }
}
export function markSampleSeeded() {
  try {
    localStorage.setItem(SEED_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}
