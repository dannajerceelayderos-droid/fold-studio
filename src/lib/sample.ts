import { makeLine, makePath, makeRect, makeText, SHAPE_PRESETS } from "./objects";
import { defaultPreview } from "./project";
import type { ArtObject, Project } from "./types";

const IVORY = "#EFE9DC";
const DEEP = "#2F3E2C";
const SAGE = "#68775A";
const SPRIG = SHAPE_PRESETS.find((s) => s.id === "sprig")!;

export const SAMPLE_ID = "p_sample_moss";

export function sampleProject(): Project {
  const W = 50;
  const H = 120;
  const D = 40;
  const objects: ArtObject[] = [];
  const add = (o: ArtObject) => objects.push(o);

  // Front
  add(makePath("front", W, H, SPRIG, { name: "Sprig emblem", x: W / 2 - 7, y: 14, width: 14, height: 17.5, fill: DEEP }));
  add(makeText("front", W, H, { name: "Wordmark", text: "Moss\nBotanicals", fontFamily: "Fraunces", fontSize: 14, fontWeight: 420, lineHeight: 1.02, color: DEEP, x: 3, y: 37, width: W - 6 }));
  add(makeLine("front", W, H, { name: "Rule", x: W / 2 - 6, y: 58, width: 12, height: 1, stroke: SAGE, strokeWidth: 0.35 }));
  add(makeText("front", W, H, { name: "Product name", text: "Botanical renewal\nserum", fontSize: 7, fontWeight: 500, lineHeight: 1.3, letterSpacing: 0.02, color: DEEP, x: 3, y: 62, width: W - 6 }));
  add(makeText("front", W, H, { name: "Descriptor", text: "Rosehip, bakuchiol\n& green tea", fontSize: 5.2, fontWeight: 400, lineHeight: 1.35, color: SAGE, x: 3, y: 76, width: W - 6 }));
  add(makeRect("front", W, H, { name: "Base band", x: 0, y: 100, width: W, height: 20, fill: SAGE }));
  add(makeText("front", W, H, { name: "Volume", text: "30 ml / 1 fl oz", fontSize: 5.5, fontWeight: 500, letterSpacing: 0.06, color: IVORY, x: 3, y: 107.5, width: W - 6 }));

  // Back
  add(makeText("back", W, H, { name: "Back heading", text: "How to use", fontFamily: "Fraunces", fontSize: 9, fontWeight: 450, align: "left", color: DEEP, x: 5, y: 12, width: W - 10 }));
  add(
    makeText("back", W, H, {
      name: "Directions",
      text: "Warm two drops between\nyour fingertips and press\ninto clean skin, morning\nand night. Follow with\nmoisturiser.",
      fontSize: 5.2,
      fontWeight: 400,
      lineHeight: 1.45,
      align: "left",
      color: DEEP,
      x: 5,
      y: 20,
      width: W - 10,
    }),
  );
  add(makeLine("back", W, H, { name: "Rule", x: 5, y: 44, width: W - 10, height: 1, stroke: SAGE, strokeWidth: 0.25 }));
  add(makeText("back", W, H, { name: "Ingredients heading", text: "Ingredients", fontFamily: "Fraunces", fontSize: 7, fontWeight: 450, align: "left", color: DEEP, x: 5, y: 48, width: W - 10 }));
  add(
    makeText("back", W, H, {
      name: "Ingredients",
      text: "Squalane, rosa canina\nseed oil, bakuchiol,\ncamellia sinensis leaf\nextract, tocopherol.",
      fontSize: 4.6,
      fontWeight: 400,
      lineHeight: 1.45,
      align: "left",
      color: SAGE,
      x: 5,
      y: 54,
      width: W - 10,
    }),
  );
  add(makeRect("back", W, H, { name: "Base band", x: 0, y: 100, width: W, height: 20, fill: SAGE }));
  add(makePath("back", W, H, SPRIG, { name: "Sprig", x: W / 2 - 3.2, y: 104, width: 6.4, height: 8, fill: IVORY }));
  add(makeText("back", W, H, { name: "Origin", text: "Small batch, plant based", fontSize: 4.2, fontWeight: 500, color: IVORY, x: 3, y: 113, width: W - 6 }));

  // Sides (rotated wordmarks)
  add(makeText("left", D, H, { name: "Side wordmark", text: "Moss Botanicals", fontFamily: "Fraunces", fontSize: 11, fontWeight: 420, color: IVORY, x: D / 2 - 45, y: H / 2 - 3.5, width: 90, rotation: -90 }));
  add(makeText("right", D, H, { name: "Side tagline", text: "Plant-powered skincare", fontSize: 6.5, fontWeight: 500, letterSpacing: 0.08, color: IVORY, x: D / 2 - 45, y: H / 2 - 2.5, width: 90, rotation: 90 }));

  // Top & bottom
  add(makePath("top", W, D, SPRIG, { name: "Top sprig", x: W / 2 - 6, y: D / 2 - 7.5, width: 12, height: 15, fill: IVORY }));
  add(makeText("bottom", W, D, { name: "Batch", text: "Batch 01\nBest before: see base", fontSize: 4.6, fontWeight: 400, lineHeight: 1.5, color: DEEP, x: 3, y: D / 2 - 4.5, width: W - 6 }));

  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: SAMPLE_ID,
    name: "Moss Botanicals — Serum Box",
    templateId: "carton",
    dimensions: { width: W, height: H, depth: D },
    units: "mm",
    panels: {
      front: { background: IVORY },
      back: { background: IVORY },
      left: { background: SAGE },
      right: { background: SAGE },
      top: { background: DEEP },
      bottom: { background: IVORY },
      "top-tuck": { background: DEEP },
      "bottom-tuck": { background: IVORY },
      glue: { background: IVORY },
      "dust-tr": { background: SAGE },
      "dust-tl": { background: SAGE },
      "dust-br": { background: SAGE },
      "dust-bl": { background: SAGE },
    },
    objects,
    material: "ivory",
    preview: { ...defaultPreview(), background: "warm" },
    brandKit: {
      name: "Moss Botanicals",
      primary: DEEP,
      secondary: IVORY,
      accent: SAGE,
      headingFont: "Fraunces",
      bodyFont: "Inter",
      logoAssetId: null,
    },
    assets: [],
    isSample: true,
    createdAt: now,
    updatedAt: now,
  };
}
