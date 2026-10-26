import { makeEllipse, makeLine, makeText } from "./objects";
import { defaultPreview } from "./project";
import type { Project, TextObject } from "./types";

export const PRACTICE_ID = "p_practice_bakehouse";

const CREAM = "#F3E6D3";
const BROWN = "#5A3A22";
const RUST = "#C2643A";

export const PRACTICE_TEXT = {
  brand: "Your brand",
  story: "Write two or three lines\nabout your bakery here.",
};

/** A half-finished cookie box for practising the editor. */
export function practiceProject(): Project {
  const W = 70;
  const H = 100;
  const D = 45;
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: PRACTICE_ID,
    name: "Practice — Cookie Box",
    templateId: "carton",
    dimensions: { width: W, height: H, depth: D },
    units: "mm",
    panels: {
      front: { background: CREAM },
      back: { background: CREAM },
      left: { background: RUST },
      right: { background: RUST },
      top: { background: BROWN },
      bottom: { background: CREAM },
      "top-tuck": { background: BROWN },
    },
    objects: [
      makeText("front", W, H, { name: "Brand name", text: PRACTICE_TEXT.brand, fontFamily: "Fraunces", fontSize: 18, fontWeight: 500, color: BROWN, x: 4, y: 24, width: W - 8 }),
      makeLine("front", W, H, { name: "Rule", x: W / 2 - 8, y: 36, width: 16, height: 1, stroke: RUST, strokeWidth: 0.4 }),
      makeText("front", W, H, { name: "Product", text: "Brown butter cookies", fontSize: 7.5, fontWeight: 500, color: BROWN, x: 4, y: 40, width: W - 8 }),
      makeEllipse("front", W, H, { name: "Badge", x: W / 2 - 11, y: 64, width: 22, height: 22, fill: RUST }),
      makeText("front", W, H, { name: "Badge text", text: "6\npieces", fontSize: 6.5, fontWeight: 600, lineHeight: 1.05, color: CREAM, x: W / 2 - 11, y: 69.5, width: 22 }),
      makeText("back", W, H, { name: "Story heading", text: "Our story", fontFamily: "Fraunces", fontSize: 11, fontWeight: 500, align: "left", color: BROWN, x: 7, y: 14, width: W - 14 }),
      makeText("back", W, H, { name: "Story", text: PRACTICE_TEXT.story, fontSize: 6, fontWeight: 400, lineHeight: 1.45, align: "left", color: BROWN, x: 7, y: 24, width: W - 14 }),
      makeText("left", D, H, { name: "Side text", text: "Baked fresh daily", fontFamily: "Fraunces", fontSize: 11, fontWeight: 500, color: CREAM, x: D / 2 - 45, y: H / 2 - 3.5, width: 90, rotation: -90 }),
      makeText("right", D, H, { name: "Side text", text: "Baked fresh daily", fontFamily: "Fraunces", fontSize: 11, fontWeight: 500, color: CREAM, x: D / 2 - 45, y: H / 2 - 3.5, width: 90, rotation: 90 }),
    ],
    material: "ivory",
    preview: { ...defaultPreview(), background: "warm" },
    brandKit: { name: "", primary: BROWN, secondary: CREAM, accent: RUST, headingFont: "Fraunces", bodyFont: "Inter", logoAssetId: null },
    assets: [],
    isSample: true,
    createdAt: now,
    updatedAt: now,
  };
}

export type PracticeFlag = "folded" | "exported" | "viewed3d";

export interface PracticeTask {
  id: string;
  title: string;
  hint: string;
  hintMobile?: string;
  done: (p: Project, flags: Set<PracticeFlag>) => boolean;
}

const text = (p: Project, name: string) => (p.objects.find((o) => o.type === "text" && o.name === name) as TextObject | undefined)?.text;
const orig = practiceProject();

export const PRACTICE_TASKS: PracticeTask[] = [
  {
    id: "brand",
    title: "Put your own brand name on the front",
    hint: "Double-click “Your brand” on the front panel, then type in the Text box on the right.",
    hintMobile: "Double-tap “Your brand” on the front panel, then type your name.",
    done: (p) => {
      const t = text(p, "Brand name");
      return t !== undefined && t.trim() !== "" && t !== PRACTICE_TEXT.brand;
    },
  },
  {
    id: "colour",
    title: "Change the front panel colour",
    hint: "Click an empty part of the front panel, then pick a new Background colour.",
    hintMobile: "Tap an empty part of the front panel, tap Edit, then pick a Background colour.",
    done: (p) => (p.panels.front?.background ?? null) !== orig.panels.front.background,
  },
  {
    id: "top",
    title: "Decorate the top of the box",
    hint: "Click the Top panel, then add a shape from Shapes or your logo from Images.",
    hintMobile: "Tap the Top panel, then add something from Shapes or Images.",
    done: (p) => p.objects.some((o) => o.panelId === "top"),
  },
  {
    id: "story",
    title: "Write the story on the back",
    hint: "Edit the text under “Our story” on the back panel.",
    done: (p) => {
      const t = text(p, "Story");
      return t !== undefined && t.trim() !== "" && t !== PRACTICE_TEXT.story;
    },
  },
  {
    id: "size",
    title: "Resize the box",
    hint: "With nothing selected, change Width, Height or Depth under Package.",
    hintMobile: "Deselect everything, tap Edit, and change Width, Height or Depth.",
    done: (p) => p.dimensions.width !== orig.dimensions.width || p.dimensions.height !== orig.dimensions.height || p.dimensions.depth !== orig.dimensions.depth,
  },
  {
    id: "fold",
    title: "Unfold it and fold it back",
    hint: "In the 3D view, drag the Fold slider down to flat and back up.",
    hintMobile: "Switch to 3D at the top, then drag the Fold slider.",
    done: (_, f) => f.has("folded"),
  },
  {
    id: "export",
    title: "Export a mockup",
    hint: "Click Export and download a PNG of your box.",
    hintMobile: "Tap the green download button and save a PNG.",
    done: (_, f) => f.has("exported"),
  },
];
