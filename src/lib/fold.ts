import * as THREE from "three";
import type { Dieline, DielinePanel, Edge, Hinge } from "./types";

export const SCENE_SCALE = 0.01; // 1 scene unit = 100 mm
const S = SCENE_SCALE;

export const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Progress (0..1) of one fold stage for an overall fold amount. Stages overlap slightly. */
export function stageProgress(fold: number, stage: number, stages: number) {
  if (fold >= 1) return 1;
  if (fold <= 0) return 0;
  const span = 1 / stages;
  const start = stage * span * 0.85;
  return smooth(clamp01((fold - start) / (span * 1.15)));
}

/** Where the hinge sits in the parent's local frame, and where the child's centre sits relative to the hinge. */
export function hingeLocal(parent: DielinePanel, child: DielinePanel, edge: Edge) {
  const pcx = parent.x + parent.width / 2;
  const pcy = parent.y + parent.height / 2;
  const ccx = child.x + child.width / 2;
  const ccy = child.y + child.height / 2;
  switch (edge) {
    case "right":
      return { pos: [(parent.width / 2) * S, -(ccy - pcy) * S, 0] as const, offset: [(child.width / 2) * S, 0, 0] as const };
    case "left":
      return { pos: [(-parent.width / 2) * S, -(ccy - pcy) * S, 0] as const, offset: [(-child.width / 2) * S, 0, 0] as const };
    case "top":
      return { pos: [(ccx - pcx) * S, (parent.height / 2) * S, 0] as const, offset: [0, (child.height / 2) * S, 0] as const };
    case "bottom":
      return { pos: [(ccx - pcx) * S, (-parent.height / 2) * S, 0] as const, offset: [0, (-child.height / 2) * S, 0] as const };
  }
}

/** Euler rotation for a hinge folded by `a` radians (positive folds away from the printed side). */
export function hingeEuler(edge: Edge, a: number): [number, number, number] {
  if (edge === "right") return [0, a, 0];
  if (edge === "left") return [0, -a, 0];
  if (edge === "top") return [-a, 0, 0];
  return [a, 0, 0];
}

export function hingeAngle(h: Hinge, fold: number, open: number, stages: number) {
  const p = stageProgress(fold, h.stage, stages);
  return (((h.angle - (h.openAngle ?? 0) * open) * p) * Math.PI) / 180;
}

export function rootTransform(dl: Dieline, fold: number) {
  const root = dl.panels.find((p) => p.id === dl.rootId)!;
  const tilt = ((dl.rootTilt * stageProgress(fold, 0, dl.stages)) * Math.PI) / 180;
  const flat = new THREE.Vector3((dl.width / 2 - (root.x + root.width / 2)) * S, -(dl.height / 2 - (root.y + root.height / 2)) * S, 0);
  const folded = new THREE.Vector3(...dl.foldedCenter).multiplyScalar(S);
  const c = flat.lerp(folded, smooth(fold));
  const pos = c.applyEuler(new THREE.Euler(tilt, 0, 0)).multiplyScalar(-1);
  return { tilt, pos };
}

/** World matrix of every panel's centre frame (x right, y up, z = printed side). Used by tests and exports. */
export function panelWorldMatrices(dl: Dieline, fold: number, open = 0): Map<string, THREE.Matrix4> {
  const out = new Map<string, THREE.Matrix4>();
  const { tilt, pos } = rootTransform(dl, fold);
  const rootM = new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z).multiply(new THREE.Matrix4().makeRotationX(tilt));
  const byId = new Map(dl.panels.map((p) => [p.id, p]));
  const walk = (id: string, m: THREE.Matrix4) => {
    out.set(id, m);
    for (const h of dl.hinges.filter((x) => x.parentId === id)) {
      const parent = byId.get(id)!;
      const child = byId.get(h.childId)!;
      const { pos: hp, offset } = hingeLocal(parent, child, h.edge);
      const e = hingeEuler(h.edge, hingeAngle(h, fold, open, dl.stages));
      const cm = m
        .clone()
        .multiply(new THREE.Matrix4().makeTranslation(hp[0], hp[1], hp[2]))
        .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...e)))
        .multiply(new THREE.Matrix4().makeTranslation(offset[0], offset[1], offset[2]));
      walk(h.childId, cm);
    }
  };
  walk(dl.rootId, rootM);
  return out;
}
