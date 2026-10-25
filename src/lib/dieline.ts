import type { Dieline, Hinge } from "./types";

export type Seg = [number, number, number, number];

const EPS = 0.01;

export function hingeSegment(dl: Dieline, h: Hinge): Seg {
  const parent = dl.panels.find((p) => p.id === h.parentId)!;
  const child = dl.panels.find((p) => p.id === h.childId)!;
  switch (h.edge) {
    case "right":
      return [parent.x + parent.width, child.y, parent.x + parent.width, child.y + child.height];
    case "left":
      return [parent.x, child.y, parent.x, child.y + child.height];
    case "top":
      return [child.x, parent.y, child.x + child.width, parent.y];
    case "bottom":
      return [child.x, parent.y + parent.height, child.x + child.width, parent.y + parent.height];
  }
}

function subtractIntervals(a: number, b: number, cuts: [number, number][]): [number, number][] {
  let parts: [number, number][] = [[Math.min(a, b), Math.max(a, b)]];
  for (const [c0, c1] of cuts) {
    const lo = Math.min(c0, c1);
    const hi = Math.max(c0, c1);
    const next: [number, number][] = [];
    for (const [s, e] of parts) {
      if (hi <= s + EPS || lo >= e - EPS) {
        next.push([s, e]);
        continue;
      }
      if (lo > s + EPS) next.push([s, lo]);
      if (hi < e - EPS) next.push([hi, e]);
    }
    parts = next;
  }
  return parts;
}

/** Cut lines (outer outline) and fold lines for a dieline, in layout mm. */
export function dielineLines(dl: Dieline): { cuts: Seg[]; folds: Seg[] } {
  const folds = dl.hinges.map((h) => hingeSegment(dl, h));
  const cuts: Seg[] = [];
  for (const p of dl.panels) {
    const pts = p.outline.map(([x, y]) => [p.x + x, p.y + y] as [number, number]);
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if (Math.abs(x0 - x1) < EPS) {
        const covering = folds
          .filter((f) => Math.abs(f[0] - f[2]) < EPS && Math.abs(f[0] - x0) < EPS)
          .map((f) => [f[1], f[3]] as [number, number]);
        for (const [s, e] of subtractIntervals(y0, y1, covering)) cuts.push([x0, s, x0, e]);
      } else if (Math.abs(y0 - y1) < EPS) {
        const covering = folds
          .filter((f) => Math.abs(f[1] - f[3]) < EPS && Math.abs(f[1] - y0) < EPS)
          .map((f) => [f[0], f[2]] as [number, number]);
        for (const [s, e] of subtractIntervals(x0, x1, covering)) cuts.push([s, y0, e, y0]);
      } else {
        cuts.push([x0, y0, x1, y1]);
      }
    }
  }
  // de-duplicate identical cut segments shared by touching panels
  const seen = new Set<string>();
  const unique = cuts.filter((s) => {
    const k = [Math.min(s[0], s[2]), Math.min(s[1], s[3]), Math.max(s[0], s[2]), Math.max(s[1], s[3])]
      .map((n) => n.toFixed(2))
      .join(",");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { cuts: unique, folds };
}

export function outlinePath(points: [number, number][], ox = 0, oy = 0): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${(x + ox).toFixed(3)} ${(y + oy).toFixed(3)}`).join(" ") + " Z";
}
