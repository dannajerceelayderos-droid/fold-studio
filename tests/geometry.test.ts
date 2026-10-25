import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { dielineLines } from "@/lib/dieline";
import { panelWorldMatrices, SCENE_SCALE } from "@/lib/fold";
import { clampDimensions, getDieline, TEMPLATES } from "@/lib/templates";
import type { Dimensions, TemplateId } from "@/lib/types";

const S = SCENE_SCALE;

function frame(t: TemplateId, d: Dimensions, id: string, fold = 1, open = 0) {
  const m = panelWorldMatrices(getDieline(t, d), fold, open).get(id)!;
  const center = new THREE.Vector3().setFromMatrixPosition(m);
  const rot = new THREE.Matrix3().setFromMatrix4(m);
  const normal = new THREE.Vector3(0, 0, 1).applyMatrix3(rot).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyMatrix3(rot).normalize();
  const right = new THREE.Vector3(1, 0, 0).applyMatrix3(rot).normalize();
  return { center, normal, up, right };
}

const near = (v: THREE.Vector3, x: number, y: number, z: number, tol = 1e-4) => {
  expect(v.x).toBeCloseTo(x, 3);
  expect(v.y).toBeCloseTo(y, 3);
  expect(v.z).toBeCloseTo(z, 3);
  void tol;
};

describe.each([
  ["carton", { width: 50, height: 120, depth: 40 }],
  ["carton", { width: 90, height: 60, depth: 140 }],
  ["mailer", { width: 220, height: 80, depth: 160 }],
  ["mailer", { width: 120, height: 40, depth: 300 }],
] as [TemplateId, Dimensions][])("%s %o folded", (t, d) => {
  const W = d.width * S;
  const H = d.height * S;
  const D = d.depth * S;

  it("puts every printable face on the outside of a box centred at the origin", () => {
    const f = (id: string) => frame(t, d, id);
    near(f("front").center, 0, 0, D / 2);
    near(f("front").normal, 0, 0, 1);
    near(f("back").center, 0, 0, -D / 2);
    near(f("back").normal, 0, 0, -1);
    near(f("right").center, W / 2, 0, 0);
    near(f("right").normal, 1, 0, 0);
    near(f("left").center, -W / 2, 0, 0);
    near(f("left").normal, -1, 0, 0);
    near(f("top").center, 0, H / 2, 0);
    near(f("top").normal, 0, 1, 0);
    near(f("bottom").center, 0, -H / 2, 0);
    near(f("bottom").normal, 0, -1, 0);
  });

  it("keeps the front artwork upright and unmirrored", () => {
    const f = frame(t, d, "front");
    near(f.up, 0, 1, 0);
    near(f.right, 1, 0, 0);
  });

  it("orients the lid so its top edge points to the back", () => {
    near(frame(t, d, "top").up, 0, 0, -1);
  });

  it("keeps faces right-handed (no mirrored textures)", () => {
    for (const p of getDieline(t, d).panels) {
      const f = frame(t, d, p.id);
      const cross = new THREE.Vector3().crossVectors(f.right, f.up);
      expect(cross.dot(f.normal)).toBeCloseTo(1, 5);
    }
  });

  it("tucks every flap inside the box", () => {
    for (const p of getDieline(t, d).panels.filter((x) => x.kind === "flap")) {
      const c = frame(t, d, p.id).center;
      expect(Math.abs(c.x)).toBeLessThanOrEqual(W / 2 + 1e-3);
      expect(Math.abs(c.y)).toBeLessThanOrEqual(H / 2 + 1e-3);
      expect(Math.abs(c.z)).toBeLessThanOrEqual(D / 2 + 1e-3);
    }
  });
});

describe("flat state", () => {
  it.each(["carton", "mailer"] as TemplateId[])("%s lies flat facing the viewer", (t) => {
    const d = TEMPLATES[t].defaults;
    for (const p of getDieline(t, d).panels) {
      const f = frame(t, d, p.id, 0);
      near(f.normal, 0, 0, 1);
      expect(f.center.z).toBeCloseTo(0, 5);
    }
  });

  it("opening the lid lifts it", () => {
    const d = TEMPLATES.mailer.defaults;
    const closed = frame("mailer", d, "top", 1, 0).center;
    const open = frame("mailer", d, "top", 1, 1).center;
    expect(open.y).toBeGreaterThan(closed.y);
  });
});

describe("dieline layout", () => {
  it.each(["carton", "mailer"] as TemplateId[])("%s panels don't overlap and stay inside the sheet", (t) => {
    const dl = getDieline(t, TEMPLATES[t].defaults);
    for (const a of dl.panels) {
      expect(a.x).toBeGreaterThanOrEqual(-1e-6);
      expect(a.y).toBeGreaterThanOrEqual(-1e-6);
      expect(a.x + a.width).toBeLessThanOrEqual(dl.width + 1e-6);
      expect(a.y + a.height).toBeLessThanOrEqual(dl.height + 1e-6);
      for (const b of dl.panels) {
        if (a === b) continue;
        const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        expect(ox > 0.01 && oy > 0.01, `${a.id} overlaps ${b.id}`).toBe(false);
      }
    }
  });

  it("has one fold line per hinge and no cut along a fold", () => {
    const dl = getDieline("carton", TEMPLATES.carton.defaults);
    const { cuts, folds } = dielineLines(dl);
    expect(folds).toHaveLength(dl.hinges.length);
    for (const f of folds) {
      const mid = [(f[0] + f[2]) / 2, (f[1] + f[3]) / 2];
      const onCut = cuts.some((c) => {
        const minx = Math.min(c[0], c[2]) - 0.01;
        const maxx = Math.max(c[0], c[2]) + 0.01;
        const miny = Math.min(c[1], c[3]) - 0.01;
        const maxy = Math.max(c[1], c[3]) + 0.01;
        const col = Math.abs((c[2] - c[0]) * (mid[1] - c[1]) - (c[3] - c[1]) * (mid[0] - c[0])) < 0.01;
        return col && mid[0] >= minx && mid[0] <= maxx && mid[1] >= miny && mid[1] <= maxy;
      });
      expect(onCut).toBe(false);
    }
  });

  it("face sizes follow the dimensions", () => {
    const d = { width: 70, height: 110, depth: 30 };
    const dl = getDieline("carton", d);
    const p = (id: string) => dl.panels.find((x) => x.id === id)!;
    expect([p("front").width, p("front").height]).toEqual([70, 110]);
    expect([p("left").width, p("left").height]).toEqual([30, 110]);
    expect([p("top").width, p("top").height]).toEqual([70, 30]);
  });

  it("clamps dimensions to template limits", () => {
    expect(clampDimensions("carton", { width: 1, height: 9999, depth: 40 })).toEqual({ width: 20, height: 500, depth: 40 });
  });
});
