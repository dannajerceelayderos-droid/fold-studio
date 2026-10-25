import type { Dieline, DielinePanel, Dimensions, Hinge } from "../types";
import { dustOutline, flipY, glueOutline, rectOutline, tuckOutline } from "./shapes";

/**
 * Simplified reverse-tuck-end folding carton.
 * Faces: front, right, back, left, top (tuck lid on front), bottom (tuck lid on back).
 */
export function buildCarton({ width: W, height: H, depth: D }: Dimensions): Dieline {
  const g = Math.min(15, Math.max(8, W * 0.25));
  const T = Math.min(20, Math.max(8, D * 0.45));
  const dustH = Math.max(6, Math.min(W * 0.45, D * 0.85));
  const top = Math.max(D + T, dustH);
  const y0 = top;
  const xFront = g;
  const xRight = g + W;
  const xBack = g + W + D;
  const xLeft = g + 2 * W + D;

  const p = (
    id: string,
    name: string,
    kind: DielinePanel["kind"],
    x: number,
    y: number,
    w: number,
    h: number,
    outline = rectOutline(w, h),
  ): DielinePanel => ({ id, name, kind, x, y, width: w, height: h, outline });

  const panels: DielinePanel[] = [
    p("front", "Front", "face", xFront, y0, W, H),
    p("right", "Right side", "face", xRight, y0, D, H),
    p("back", "Back", "face", xBack, y0, W, H),
    p("left", "Left side", "face", xLeft, y0, D, H),
    p("top", "Top", "face", xFront, y0 - D, W, D),
    p("bottom", "Bottom", "face", xBack, y0 + H, W, D),
    p("glue", "Glue flap", "flap", 0, y0, g, H, glueOutline(g, H)),
    p("top-tuck", "Top tuck", "flap", xFront, y0 - D - T, W, T, tuckOutline(W, T)),
    p("bottom-tuck", "Bottom tuck", "flap", xBack, y0 + H + D, W, T, flipY(tuckOutline(W, T), T)),
    p("dust-tr", "Dust flap", "flap", xRight, y0 - dustH, D, dustH, dustOutline(D, dustH)),
    p("dust-tl", "Dust flap", "flap", xLeft, y0 - dustH, D, dustH, dustOutline(D, dustH)),
    p("dust-br", "Dust flap", "flap", xRight, y0 + H, D, dustH, flipY(dustOutline(D, dustH), dustH)),
    p("dust-bl", "Dust flap", "flap", xLeft, y0 + H, D, dustH, flipY(dustOutline(D, dustH), dustH)),
  ];

  const hinges: Hinge[] = [
    { childId: "right", parentId: "front", edge: "right", angle: 90, stage: 0 },
    { childId: "back", parentId: "right", edge: "right", angle: 90, stage: 0 },
    { childId: "left", parentId: "back", edge: "right", angle: 90, stage: 0 },
    { childId: "glue", parentId: "front", edge: "left", angle: 91.5, stage: 0 },
    { childId: "dust-tr", parentId: "right", edge: "top", angle: 92, stage: 1 },
    { childId: "dust-tl", parentId: "left", edge: "top", angle: 92, stage: 1 },
    { childId: "dust-br", parentId: "right", edge: "bottom", angle: 92, stage: 1 },
    { childId: "dust-bl", parentId: "left", edge: "bottom", angle: 92, stage: 1 },
    { childId: "top", parentId: "front", edge: "top", angle: 90, stage: 2, openAngle: 110 },
    { childId: "bottom", parentId: "back", edge: "bottom", angle: 90, stage: 2 },
    { childId: "top-tuck", parentId: "top", edge: "top", angle: 92, stage: 3, openAngle: 70 },
    { childId: "bottom-tuck", parentId: "bottom", edge: "bottom", angle: 92, stage: 3 },
  ];

  return {
    templateId: "carton",
    panels,
    hinges,
    rootId: "front",
    width: g + 2 * W + 2 * D,
    height: top * 2 + H,
    foldedCenter: [0, 0, -D / 2],
    rootTilt: 0,
    stages: 4,
  };
}
