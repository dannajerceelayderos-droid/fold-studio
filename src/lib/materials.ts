import type { BackgroundPresetId, LightingPresetId, MaterialPresetId } from "./types";

export interface MaterialPreset {
  id: MaterialPresetId;
  name: string;
  /** Unprinted stock colour (shown where a panel has no background) */
  color: string;
  /** Inside of the box */
  inside: string;
  roughness: number;
  clearcoat: number;
  /** Adds paper fibre speckle to the texture */
  fibre: number;
  note: string;
}

export const MATERIALS: Record<MaterialPresetId, MaterialPreset> = {
  kraft: { id: "kraft", name: "Natural kraft", color: "#C9A57A", inside: "#BE9A6E", roughness: 0.95, clearcoat: 0, fibre: 0.5, note: "Uncoated brown board" },
  "matte-white": { id: "matte-white", name: "Soft matte white", color: "#F4F4F1", inside: "#EDEDE8", roughness: 0.9, clearcoat: 0, fibre: 0.12, note: "Uncoated white board" },
  ivory: { id: "ivory", name: "Warm ivory", color: "#F2EBDD", inside: "#EAE2D2", roughness: 0.88, clearcoat: 0, fibre: 0.15, note: "Uncoated cream board" },
  "matte-black": { id: "matte-black", name: "Matte black", color: "#262725", inside: "#2E2F2C", roughness: 0.85, clearcoat: 0, fibre: 0.08, note: "Dyed black board" },
  sage: { id: "sage", name: "Sage green", color: "#A9B49A", inside: "#E8E6DC", roughness: 0.9, clearcoat: 0, fibre: 0.12, note: "Coloured board, white inside" },
  coated: { id: "coated", name: "Glossy coated", color: "#FAFAF8", inside: "#EFEFEA", roughness: 0.32, clearcoat: 0.8, fibre: 0, note: "Gloss-coated white board" },
};

export const MATERIAL_LIST = Object.values(MATERIALS);

export const BACKGROUNDS: Record<BackgroundPresetId, { name: string; color: string | null; floor: string }> = {
  studio: { name: "Neutral studio", color: "#ECECE8", floor: "#ECECE8" },
  warm: { name: "Warm white", color: "#F7F5EF", floor: "#F7F5EF" },
  dark: { name: "Charcoal", color: "#2A2B29", floor: "#2A2B29" },
  transparent: { name: "Transparent", color: null, floor: "#000000" },
};

export const LIGHTING: Record<LightingPresetId, { name: string; ambient: number; key: number; fill: number; env: number }> = {
  soft: { name: "Soft studio", ambient: 0.55, key: 1.6, fill: 0.6, env: 0.6 },
  bright: { name: "Bright", ambient: 0.8, key: 2.1, fill: 0.9, env: 0.9 },
  dramatic: { name: "Dramatic", ambient: 0.2, key: 2.6, fill: 0.15, env: 0.3 },
};
