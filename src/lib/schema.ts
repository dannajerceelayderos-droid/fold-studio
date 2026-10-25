import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a #RRGGBB hex value");
const num = z.number().finite();

const base = {
  id: z.string().min(1).max(64),
  name: z.string().max(120),
  panelId: z.string().min(1).max(64),
  x: num,
  y: num,
  width: num.positive().max(5000),
  height: num.positive().max(5000),
  rotation: num,
  opacity: num.min(0).max(1),
  locked: z.boolean(),
  hidden: z.boolean(),
};

const text = z.object({
  ...base,
  type: z.literal("text"),
  text: z.string().max(5000),
  fontFamily: z.string().max(80),
  fontSize: num.positive().max(1000),
  fontWeight: num.min(100).max(900),
  italic: z.boolean(),
  align: z.enum(["left", "center", "right"]),
  lineHeight: num.min(0.5).max(4),
  letterSpacing: num.min(-0.5).max(2),
  color,
});
const image = z.object({
  ...base,
  type: z.literal("image"),
  assetId: z.string().min(1).max(64),
  fit: z.enum(["contain", "cover", "stretch"]),
  role: z.enum(["image", "logo"]),
});
const rect = z.object({ ...base, type: z.literal("rect"), fill: color.nullable(), stroke: color.nullable(), strokeWidth: num.min(0).max(50), cornerRadius: num.min(0).max(500) });
const ellipse = z.object({ ...base, type: z.literal("ellipse"), fill: color.nullable(), stroke: color.nullable(), strokeWidth: num.min(0).max(50) });
const line = z.object({ ...base, type: z.literal("line"), stroke: color, strokeWidth: num.min(0).max(50) });
const path = z.object({
  ...base,
  type: z.literal("path"),
  d: z.string().max(20000).regex(/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]*$/, "Invalid path data"),
  vbWidth: num.positive(),
  vbHeight: num.positive(),
  fill: color.nullable(),
  stroke: color.nullable(),
  strokeWidth: num.min(0).max(50),
});

export const artObjectSchema = z.discriminatedUnion("type", [text, image, rect, ellipse, line, path]);

export const projectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  templateId: z.enum(["carton", "mailer"]),
  dimensions: z.object({ width: num.positive(), height: num.positive(), depth: num.positive() }),
  units: z.enum(["mm", "in"]),
  panels: z.record(z.string(), z.object({ background: color.nullable() })),
  objects: z.array(artObjectSchema).max(2000),
  material: z.enum(["kraft", "matte-white", "ivory", "matte-black", "sage", "coated"]),
  preview: z.object({
    background: z.enum(["studio", "warm", "dark", "transparent"]),
    lighting: z.enum(["soft", "bright", "dramatic"]),
    shadow: num.min(0).max(1),
    autoRotate: z.boolean(),
    fold: num.min(0).max(1),
    open: num.min(0).max(1),
  }),
  brandKit: z.object({
    name: z.string().max(120),
    primary: color,
    secondary: color,
    accent: color,
    headingFont: z.string().max(80),
    bodyFont: z.string().max(80),
    logoAssetId: z.string().max(64).nullable(),
  }),
  assets: z.array(
    z.object({
      id: z.string().min(1).max(64),
      name: z.string().max(200),
      mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
      width: num.positive(),
      height: num.positive(),
      size: num.min(0),
    }),
  ),
  isSample: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const exportFileSchema = z.object({
  format: z.literal("fold-studio-project"),
  version: z.literal(1),
  exportedAt: z.string(),
  project: projectSchema,
  assets: z.record(
    z.string(),
    z.string().regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Asset must be an embedded PNG, JPEG or WebP"),
  ),
});

export type ExportFile = z.infer<typeof exportFileSchema>;

/** Bring older saved projects up to the current schema. Only v1 exists today. */
export function migrateProject(raw: unknown): unknown {
  if (raw && typeof raw === "object" && !("schemaVersion" in raw)) {
    return { ...(raw as object), schemaVersion: 1 };
  }
  return raw;
}

export function formatZodError(e: z.ZodError): string {
  const first = e.issues[0];
  if (!first) return "The file isn't a valid Fold Studio project.";
  return `${first.path.join(".") || "file"}: ${first.message}`;
}
