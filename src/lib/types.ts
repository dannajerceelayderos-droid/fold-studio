export type TemplateId = "carton" | "mailer";
export type Units = "mm" | "in";

export interface Dimensions {
  /** Width along the x axis, in mm */
  width: number;
  /** Height along the vertical axis, in mm */
  height: number;
  /** Depth front-to-back, in mm */
  depth: number;
}

interface BaseObject {
  id: string;
  name: string;
  panelId: string;
  /** Top-left of the unrotated box, in mm, relative to the panel's top-left */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise, around the box centre */
  rotation: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
}

export type TextAlign = "left" | "center" | "right";

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  fontFamily: string;
  /** Points */
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  align: TextAlign;
  lineHeight: number;
  /** Em units */
  letterSpacing: number;
  color: string;
}

export type ImageFit = "contain" | "cover" | "stretch";

export interface ImageObject extends BaseObject {
  type: "image";
  assetId: string;
  fit: ImageFit;
  role: "image" | "logo";
}

export interface RectObject extends BaseObject {
  type: "rect";
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  cornerRadius: number;
}

export interface EllipseObject extends BaseObject {
  type: "ellipse";
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
}

export interface LineObject extends BaseObject {
  type: "line";
  stroke: string;
  strokeWidth: number;
}

export interface PathObject extends BaseObject {
  type: "path";
  /** SVG path data drawn inside viewBox [0,0,vbWidth,vbHeight], scaled to the box */
  d: string;
  vbWidth: number;
  vbHeight: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
}

export type ArtObject =
  | TextObject
  | ImageObject
  | RectObject
  | EllipseObject
  | LineObject
  | PathObject;

export type ArtObjectType = ArtObject["type"];

export interface PanelStyle {
  background: string | null;
}

export type MaterialPresetId =
  | "kraft"
  | "matte-white"
  | "ivory"
  | "matte-black"
  | "sage"
  | "coated";

export type BackgroundPresetId = "studio" | "warm" | "dark" | "transparent";
export type LightingPresetId = "soft" | "bright" | "dramatic";

export interface PreviewSettings {
  background: BackgroundPresetId;
  lighting: LightingPresetId;
  shadow: number; // 0..1
  autoRotate: boolean;
  /** 0 flat .. 1 folded */
  fold: number;
  /** 0 closed .. 1 open (lids) */
  open: number;
}

export interface BrandKit {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  logoAssetId: string | null;
}

export interface AssetRef {
  id: string;
  name: string;
  mime: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
  size: number;
}

export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  templateId: TemplateId;
  dimensions: Dimensions;
  units: Units;
  panels: Record<string, PanelStyle>;
  objects: ArtObject[];
  material: MaterialPresetId;
  preview: PreviewSettings;
  brandKit: BrandKit;
  assets: AssetRef[];
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  templateId: TemplateId;
  updatedAt: string;
  createdAt: string;
  isSample: boolean;
  thumbnail: string | null;
}

/* ---------- Derived dieline geometry (never stored) ---------- */

export type Edge = "left" | "right" | "top" | "bottom";

export interface DielinePanel {
  id: string;
  name: string;
  kind: "face" | "flap";
  /** Layout position (top-left) and size in mm; layout y grows downward */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Outline polygon in panel-local mm (y down). Rect when omitted. */
  outline: [number, number][];
}

export interface Hinge {
  childId: string;
  parentId: string;
  /** Edge of the parent the child is attached to */
  edge: Edge;
  /** Folded angle in degrees (positive folds away from the printed side) */
  angle: number;
  /** Stage in the fold animation (0 first) */
  stage: number;
  /** When set, the hinge opens by this many degrees as preview.open → 1 */
  openAngle?: number;
}

export interface Dieline {
  templateId: TemplateId;
  panels: DielinePanel[];
  hinges: Hinge[];
  rootId: string;
  width: number;
  height: number;
  /** Box centre when folded, in root-panel local coords (mm, y up, z out of print side) */
  foldedCenter: [number, number, number];
  /** Rotation around x (degrees) applied to the root as it folds, to stand the box upright */
  rootTilt: number;
  stages: number;
}
