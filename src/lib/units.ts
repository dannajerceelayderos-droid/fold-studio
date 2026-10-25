import type { Units } from "./types";

export const MM_PER_IN = 25.4;

export const toDisplay = (mm: number, u: Units) => (u === "mm" ? Math.round(mm * 10) / 10 : Math.round((mm / MM_PER_IN) * 100) / 100);
export const fromDisplay = (v: number, u: Units) => (u === "mm" ? v : v * MM_PER_IN);
export const formatLen = (mm: number, u: Units) => `${toDisplay(mm, u)} ${u}`;
