import type { Dieline, DielinePanel, Dimensions, Hinge } from "../types";
import { dustOutline, rectOutline, sideHinged, tuckOutline } from "./shapes";

/**
 * Simplified one-piece mailer box with a hinged lid.
 * Faces: bottom (base), front wall, back wall, left/right walls, top (lid).
 * The lid tuck folds inside the front wall; lid side flaps fold inside the side walls.
 */
export function buildMailer({ width: W, height: H, depth: D }: Dimensions): Dieline {
  const T = Math.max(8, H * 0.75);
  const Hd = Math.max(6, H * 0.8);
  const x0 = H;

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
    p("front", "Front wall", "face", x0, 0, W, H),
    p("bottom", "Base", "face", x0, H, W, D),
    p("back", "Back wall", "face", x0, H + D, W, H),
    p("top", "Lid", "face", x0, 2 * H + D, W, D),
    p("left", "Left wall", "face", 0, H, H, D),
    p("right", "Right wall", "face", x0 + W, H, H, D),
    p("lid-tuck", "Lid tuck", "flap", x0, 2 * H + 2 * D, W, T, tuckOutline(W, T).map(([x, y]) => [x, T - y])),
    p("lid-flap-l", "Lid side flap", "flap", x0 - Hd, 2 * H + D, Hd, D, sideHinged(dustOutline(D, Hd), D, Hd, "right")),
    p("lid-flap-r", "Lid side flap", "flap", x0 + W, 2 * H + D, Hd, D, sideHinged(dustOutline(D, Hd), D, Hd, "left")),
  ];

  const hinges: Hinge[] = [
    { childId: "front", parentId: "bottom", edge: "top", angle: 90, stage: 0 },
    { childId: "back", parentId: "bottom", edge: "bottom", angle: 90, stage: 0 },
    { childId: "left", parentId: "bottom", edge: "left", angle: 90, stage: 0 },
    { childId: "right", parentId: "bottom", edge: "right", angle: 90, stage: 0 },
    { childId: "lid-flap-l", parentId: "top", edge: "left", angle: 92, stage: 1, openAngle: 30 },
    { childId: "lid-flap-r", parentId: "top", edge: "right", angle: 92, stage: 1, openAngle: 30 },
    { childId: "top", parentId: "back", edge: "bottom", angle: 90, stage: 2, openAngle: 105 },
    { childId: "lid-tuck", parentId: "top", edge: "bottom", angle: 92, stage: 2, openAngle: 55 },
  ];

  return {
    templateId: "mailer",
    panels,
    hinges,
    rootId: "bottom",
    width: 2 * H + W,
    height: 2 * H + 2 * D + T,
    foldedCenter: [0, 0, -H / 2],
    rootTilt: 90,
    stages: 3,
  };
}
