import { makeLine, makePath, makeRect, makeText, SHAPE_PRESETS } from "./objects";
import { defaultPreview, newProject } from "./project";
import { sampleProject } from "./sample";
import type { Project } from "./types";

const shape = (id: string) => SHAPE_PRESETS.find((s) => s.id === id)!;

function emberAndWick(): Project {
  const p = newProject("carton", "Ember & Wick — Candle Box");
  const W = 80;
  const H = 85;
  const D = 80;
  const INK = "#26272A";
  const BRASS = "#C8A86B";
  const CREAM = "#EFE6D2";
  p.id = "ex_ember";
  p.dimensions = { width: W, height: H, depth: D };
  p.material = "matte-black";
  p.panels = Object.fromEntries(["front", "back", "left", "right", "top", "bottom"].map((k) => [k, { background: INK }]));
  p.objects = [
    makePath("front", W, H, shape("sun"), { name: "Sun mark", x: W / 2 - 9, y: 12, width: 18, height: 18, fill: BRASS }),
    makeText("front", W, H, { name: "Wordmark", text: "Ember & Wick", fontFamily: "Fraunces", fontSize: 17, fontWeight: 400, color: CREAM, x: 4, y: 38, width: W - 8 }),
    makeLine("front", W, H, { x: W / 2 - 8, y: 52, width: 16, height: 1, stroke: BRASS, strokeWidth: 0.4 }),
    makeText("front", W, H, { name: "Scent", text: "Cedar, smoke & fig", fontSize: 7.5, fontWeight: 400, letterSpacing: 0.04, color: CREAM, x: 4, y: 57, width: W - 8 }),
    makeText("front", W, H, { name: "Size", text: "Soy wax candle  ·  220 g", fontSize: 5.5, fontWeight: 500, letterSpacing: 0.06, color: BRASS, x: 4, y: 72, width: W - 8 }),
    makeText("right", D, H, { name: "Side", text: "Hand-poured\nin small batches", fontFamily: "Fraunces", fontSize: 9, fontWeight: 400, lineHeight: 1.25, color: CREAM, x: 6, y: H / 2 - 6, width: D - 12 }),
    makePath("top", W, D, shape("sun"), { name: "Top mark", x: W / 2 - 10, y: D / 2 - 10, width: 20, height: 20, fill: BRASS }),
  ];
  p.brandKit = { ...p.brandKit, name: "Ember & Wick", primary: INK, secondary: CREAM, accent: BRASS };
  p.preview = { ...defaultPreview(), background: "warm" };
  return p;
}

function hollowPine(): Project {
  const p = newProject("carton", "Hollow Pine — Loose Leaf Tea");
  const W = 65;
  const H = 110;
  const D = 65;
  const PALE = "#DCE3D3";
  const PINE = "#24402F";
  const MOSS = "#7C9263";
  p.id = "ex_pine";
  p.dimensions = { width: W, height: H, depth: D };
  p.material = "matte-white";
  p.panels = { front: { background: PALE }, back: { background: PALE }, left: { background: PINE }, right: { background: PINE }, top: { background: PINE }, bottom: { background: PALE } };
  p.objects = [
    makeRect("front", W, H, { name: "Arch", x: 8, y: 10, width: W - 16, height: 62, cornerRadius: (W - 16) / 2, fill: "#F4F6EF" }),
    makePath("front", W, H, shape("leaf"), { name: "Leaf", x: W / 2 - 9, y: 18, width: 7, height: 12, fill: MOSS, rotation: -24 }),
    makePath("front", W, H, shape("leaf"), { name: "Leaf", x: W / 2 + 2, y: 18, width: 7, height: 12, fill: PINE, rotation: 24 }),
    makeText("front", W, H, { name: "Wordmark", text: "Hollow\nPine", fontFamily: "Fraunces", fontSize: 17, fontWeight: 500, lineHeight: 0.98, color: PINE, x: 4, y: 38, width: W - 8 }),
    makeText("front", W, H, { name: "Blend", text: "Smoked oolong", fontSize: 7, fontWeight: 600, letterSpacing: 0.03, color: PINE, x: 4, y: 82, width: W - 8 }),
    makeText("front", W, H, { name: "Weight", text: "Loose leaf · 80 g", fontSize: 5.5, fontWeight: 400, color: MOSS, x: 4, y: 92, width: W - 8 }),
    makeText("right", D, H, { name: "Side", text: "Steep 3 min at 90°C", fontSize: 7, fontWeight: 500, color: PALE, x: D / 2 - 45, y: H / 2 - 3, width: 90, rotation: 90 }),
    makePath("top", W, D, shape("leaf"), { name: "Top leaf", x: W / 2 - 6, y: D / 2 - 10, width: 12, height: 20, fill: MOSS }),
  ];
  p.brandKit = { ...p.brandKit, name: "Hollow Pine", primary: PINE, secondary: PALE, accent: MOSS };
  return p;
}

function tidepool(): Project {
  const p = newProject("mailer", "Tidepool — Sock Mailer");
  const W = 220;
  const H = 80;
  const D = 160;
  const INK = "#1F3A4D";
  const CORAL = "#E07A5F";
  p.id = "ex_tide";
  p.dimensions = { width: W, height: H, depth: D };
  p.material = "kraft";
  p.panels = {};
  p.objects = [
    makePath("top", W, D, shape("badge"), { name: "Badge", x: W / 2 - 28, y: 28, width: 56, height: 56, fill: CORAL }),
    makeText("top", W, D, { name: "Badge text", text: "Fresh\nsocks", fontFamily: "Fraunces", fontSize: 18, fontWeight: 500, lineHeight: 1, color: "#FFF8EE", x: W / 2 - 28, y: 45, width: 56 }),
    makeText("top", W, D, { name: "Wordmark", text: "Tidepool", fontFamily: "Fraunces", fontSize: 40, fontWeight: 450, color: INK, x: 10, y: 98, width: W - 20 }),
    makeText("top", W, D, { name: "Line", text: "Knitted for long walks on cold sand", fontSize: 11, fontWeight: 500, color: INK, x: 10, y: 120, width: W - 20 }),
    makeText("front", W, H, { name: "Front", text: "Open here, gently", fontSize: 14, fontWeight: 500, letterSpacing: 0.04, color: INK, x: 10, y: H / 2 - 4, width: W - 20 }),
    makeText("right", H, D, { name: "Side", text: "tidepool socks", fontFamily: "Fraunces", fontSize: 16, fontWeight: 450, color: INK, x: H / 2 - 50, y: D / 2 - 4, width: 100, rotation: 90 }),
  ];
  p.brandKit = { ...p.brandKit, name: "Tidepool", primary: INK, secondary: "#FFF8EE", accent: CORAL };
  p.preview = { ...defaultPreview(), background: "warm" };
  return p;
}

export function exampleProjects(): Project[] {
  return [sampleProject(), emberAndWick(), hollowPine(), tidepool()];
}
