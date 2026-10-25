"use client";
import { create } from "zustand";
import { duplicateObject } from "@/lib/objects";
import { refitObjects } from "@/lib/project";
import { clampDimensions, getDieline, TEMPLATES } from "@/lib/templates";
import type { ArtObject, Dimensions, MaterialPresetId, PreviewSettings, Project, TemplateId } from "@/lib/types";

export type ViewMode = "2d" | "3d" | "split";
export type SaveStatus = "saved" | "saving" | "unsaved" | "error";
export type LeftTab = "templates" | "layers" | "text" | "images" | "shapes" | "brand";

const HISTORY_LIMIT = 100;
const COALESCE_MS = 1200;

interface EditorState {
  project: Project | null;
  past: Project[];
  future: Project[];
  transientBase: Project | null;
  lastKey: { key: string; t: number } | null;
  /** increments whenever the saved document changes */
  revision: number;
  savedRevision: number;
  saveStatus: SaveStatus;

  selection: string[];
  selectedPanel: string | null;
  view: ViewMode;
  leftTab: LeftTab;
  zoom: number;
  fitSignal: number;
  showGuides: boolean;
  showDimensions: boolean;
  showGrid: boolean;
  editingText: string | null;

  load: (p: Project) => void;
  commit: (fn: (draft: Project) => void, key?: string) => void;
  beginTransient: () => void;
  updateTransient: (fn: (draft: Project) => void) => void;
  endTransient: () => void;
  undo: () => void;
  redo: () => void;

  setSelection: (ids: string[], panelId?: string | null) => void;
  selectPanel: (id: string | null) => void;
  setView: (v: ViewMode) => void;
  setLeftTab: (t: LeftTab) => void;
  setZoom: (z: number) => void;
  fit: () => void;
  toggle: (k: "showGuides" | "showDimensions" | "showGrid") => void;
  setEditingText: (id: string | null) => void;

  addObject: (o: ArtObject) => void;
  updateObject: (id: string, patch: Partial<ArtObject>, key?: string) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  reorder: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  moveObject: (id: string, toIndex: number) => void;
  setPanelBackground: (ids: string[], color: string | null) => void;
  setDimensions: (d: Dimensions, key?: string) => void;
  setTemplate: (t: TemplateId) => void;
  setMaterial: (m: MaterialPresetId) => void;
  setPreview: (p: Partial<PreviewSettings>) => void;
  setSaveStatus: (s: SaveStatus, savedRevision?: number) => void;
}

const clone = <T,>(v: T): T => structuredClone(v);

export const useEditor = create<EditorState>((set, get) => ({
  project: null,
  past: [],
  future: [],
  transientBase: null,
  lastKey: null,
  revision: 0,
  savedRevision: 0,
  saveStatus: "saved",
  selection: [],
  selectedPanel: null,
  view: "split",
  leftTab: "layers",
  zoom: 1,
  fitSignal: 0,
  showGuides: true,
  showDimensions: false,
  showGrid: false,
  editingText: null,

  load: (p) =>
    set({
      project: p,
      past: [],
      future: [],
      transientBase: null,
      lastKey: null,
      revision: 0,
      savedRevision: 0,
      saveStatus: "saved",
      selection: [],
      selectedPanel: "front",
      editingText: null,
    }),

  commit: (fn, key) => {
    const { project, past, lastKey, revision } = get();
    if (!project) return;
    const next = clone(project);
    fn(next);
    const now = Date.now();
    const coalesce = key && lastKey && lastKey.key === key && now - lastKey.t < COALESCE_MS;
    set({
      project: next,
      past: coalesce ? past : [...past, project].slice(-HISTORY_LIMIT),
      future: [],
      lastKey: key ? { key, t: now } : null,
      revision: revision + 1,
      saveStatus: "unsaved",
    });
  },

  beginTransient: () => {
    const { project } = get();
    if (project) set({ transientBase: project });
  },
  updateTransient: (fn) => {
    const { project } = get();
    if (!project) return;
    const next = clone(project);
    fn(next);
    set({ project: next });
  },
  endTransient: () => {
    const { transientBase, project, past, revision } = get();
    if (!transientBase || !project) return set({ transientBase: null });
    if (transientBase === project) return set({ transientBase: null });
    set({
      transientBase: null,
      past: [...past, transientBase].slice(-HISTORY_LIMIT),
      future: [],
      lastKey: null,
      revision: revision + 1,
      saveStatus: "unsaved",
    });
  },

  undo: () => {
    const { past, project, future, revision } = get();
    if (!past.length || !project) return;
    const prev = past[past.length - 1];
    set({
      project: prev,
      past: past.slice(0, -1),
      future: [project, ...future],
      lastKey: null,
      revision: revision + 1,
      saveStatus: "unsaved",
      selection: get().selection.filter((id) => prev.objects.some((o) => o.id === id)),
    });
  },
  redo: () => {
    const { past, project, future, revision } = get();
    if (!future.length || !project) return;
    const next = future[0];
    set({
      project: next,
      past: [...past, project],
      future: future.slice(1),
      lastKey: null,
      revision: revision + 1,
      saveStatus: "unsaved",
      selection: get().selection.filter((id) => next.objects.some((o) => o.id === id)),
    });
  },

  setSelection: (ids, panelId) => {
    const p = get().project;
    const first = p?.objects.find((o) => o.id === ids[0]);
    set({
      selection: ids,
      selectedPanel: panelId !== undefined ? panelId : (first?.panelId ?? get().selectedPanel),
      editingText: null,
    });
  },
  selectPanel: (id) => set({ selectedPanel: id, selection: [], editingText: null }),
  setView: (v) => set({ view: v }),
  setLeftTab: (t) => set({ leftTab: t }),
  setZoom: (z) => set({ zoom: Math.min(8, Math.max(0.2, z)) }),
  fit: () => set({ zoom: 1, fitSignal: get().fitSignal + 1 }),
  toggle: (k) => set({ [k]: !get()[k] } as Partial<EditorState>),
  setEditingText: (id) => set({ editingText: id }),

  addObject: (o) => {
    get().commit((d) => {
      d.objects.push(o);
    });
    set({ selection: [o.id], selectedPanel: o.panelId });
  },
  updateObject: (id, patch, key) =>
    get().commit((d) => {
      const i = d.objects.findIndex((o) => o.id === id);
      if (i >= 0) d.objects[i] = { ...d.objects[i], ...patch } as ArtObject;
    }, key ?? `obj:${id}:${Object.keys(patch).join(",")}`),
  deleteSelection: () => {
    const { selection, project } = get();
    if (!selection.length || !project) return;
    const deletable = selection.filter((id) => !project.objects.find((o) => o.id === id)?.locked);
    if (!deletable.length) return;
    get().commit((d) => {
      d.objects = d.objects.filter((o) => !deletable.includes(o.id));
    });
    set({ selection: [] });
  },
  duplicateSelection: () => {
    const { selection, project } = get();
    if (!selection.length || !project) return;
    const copies = project.objects.filter((o) => selection.includes(o.id)).map(duplicateObject);
    get().commit((d) => {
      d.objects.push(...copies);
    });
    set({ selection: copies.map((c) => c.id) });
  },
  reorder: (id, dir) =>
    get().commit((d) => {
      const i = d.objects.findIndex((o) => o.id === id);
      if (i < 0) return;
      const o = d.objects[i];
      const same = d.objects.map((x, idx) => (x.panelId === o.panelId ? idx : -1)).filter((x) => x >= 0);
      const pos = same.indexOf(i);
      const targetPos =
        dir === "top" ? same.length - 1 : dir === "bottom" ? 0 : dir === "up" ? Math.min(same.length - 1, pos + 1) : Math.max(0, pos - 1);
      if (targetPos === pos) return;
      const target = same[targetPos];
      d.objects.splice(i, 1);
      d.objects.splice(target, 0, o);
    }),
  moveObject: (id, toIndex) =>
    get().commit((d) => {
      const i = d.objects.findIndex((o) => o.id === id);
      if (i < 0) return;
      const [o] = d.objects.splice(i, 1);
      d.objects.splice(Math.max(0, Math.min(d.objects.length, toIndex)), 0, o);
    }),
  setPanelBackground: (ids, color) =>
    get().commit((d) => {
      for (const id of ids) d.panels[id] = { ...d.panels[id], background: color };
    }, `bg:${ids.join(",")}`),
  setDimensions: (dims, key) => {
    const p = get().project;
    if (!p) return;
    const next = clampDimensions(p.templateId, dims);
    get().commit((d) => {
      d.objects = refitObjects(d.objects, d.templateId, d.dimensions, d.templateId, next);
      d.dimensions = next;
    }, key ?? "dims");
  },
  setTemplate: (t) => {
    const p = get().project;
    if (!p || p.templateId === t) return;
    get().commit((d) => {
      const dims = { ...TEMPLATES[t].defaults };
      d.objects = refitObjects(d.objects, d.templateId, d.dimensions, t, dims);
      const dl = getDieline(t, dims);
      const ids = new Set(dl.panels.map((x) => x.id));
      d.panels = Object.fromEntries(Object.entries(d.panels).filter(([k]) => ids.has(k)));
      d.templateId = t;
      d.dimensions = dims;
      if (t === "mailer" && d.material === "ivory") d.material = "kraft";
    });
    set({ selectedPanel: "front", selection: [] });
  },
  setMaterial: (m) =>
    get().commit((d) => {
      d.material = m;
    }),
  setPreview: (patch) => {
    const { project, revision } = get();
    if (!project) return;
    set({ project: { ...project, preview: { ...project.preview, ...patch } }, revision: revision + 1, saveStatus: "unsaved" });
  },
  setSaveStatus: (s, savedRevision) => set({ saveStatus: s, ...(savedRevision !== undefined ? { savedRevision } : {}) }),
}));

export function useProject() {
  return useEditor((s) => s.project!);
}
