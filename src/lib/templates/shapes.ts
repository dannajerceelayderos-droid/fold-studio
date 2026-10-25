type Pt = [number, number];

export const rectOutline = (w: number, h: number): Pt[] => [
  [0, 0],
  [w, 0],
  [w, h],
  [0, h],
];

/** Tuck flap whose hinge is on its bottom edge. */
export const tuckOutline = (w: number, h: number): Pt[] => {
  const c = Math.min(h * 0.9, w * 0.14);
  return [
    [0, h],
    [0, h * 0.45],
    [c * 0.3, h * 0.12],
    [c, 0],
    [w - c, 0],
    [w - c * 0.3, h * 0.12],
    [w, h * 0.45],
    [w, h],
  ];
};

/** Dust flap whose hinge is on its bottom edge. */
export const dustOutline = (w: number, h: number): Pt[] => [
  [0, h],
  [0, h * 0.3],
  [w * 0.22, 0],
  [w * 0.78, 0],
  [w, h * 0.3],
  [w, h],
];

/** Glue flap whose hinge is on its right edge. */
export const glueOutline = (w: number, h: number): Pt[] => {
  const c = Math.min(w * 0.9, h * 0.1);
  return [
    [w, 0],
    [0, c],
    [0, h - c],
    [w, h],
  ];
};

export const flipY = (pts: Pt[], h: number): Pt[] => pts.map(([x, y]) => [x, h - y]);

/** Rotate an outline designed with its hinge on the bottom so the hinge sits on the given edge. */
export const sideHinged = (pts: Pt[], designW: number, designH: number, edge: "left" | "right"): Pt[] =>
  // design: width along hinge = designW, height = designH. Output box is designH x designW.
  edge === "left"
    ? pts.map(([x, y]) => [designH - y, x]) // hinge (y=designH) → x=0
    : pts.map(([x, y]) => [y, designW - x]); // hinge → x=designH
