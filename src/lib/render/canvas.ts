import { baselineY, fontStack, PT_TO_MM, textLines } from "../objects";
import type { MaterialPreset } from "../materials";
import type { ArtObject, DielinePanel, ImageFit } from "../types";

export function fitRect(fit: ImageFit, bw: number, bh: number, iw: number, ih: number) {
  if (fit === "stretch") return { x: 0, y: 0, w: bw, h: bh };
  const r = iw / ih;
  const contain = fit === "contain";
  let w = bw;
  let h = bw / r;
  if (contain ? h > bh : h < bh) {
    h = bh;
    w = bh * r;
  }
  return { x: (bw - w) / 2, y: (bh - h) / 2, w, h };
}

let fibrePattern: HTMLCanvasElement | null = null;
function fibre(): HTMLCanvasElement {
  if (fibrePattern) return fibrePattern;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const len = 1 + rnd() * 5;
    const a = rnd() * Math.PI;
    ctx.strokeStyle = rnd() > 0.5 ? "rgba(60,40,20,0.22)" : "rgba(255,250,240,0.25)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  fibrePattern = c;
  return c;
}

export interface DrawPanelOptions {
  panel: DielinePanel;
  objects: ArtObject[];
  background: string | null;
  material: MaterialPreset;
  pxPerMm: number;
  getImage: (assetId: string) => CanvasImageSource | undefined;
  /** Draw the stock fibre texture (3D preview only) */
  withFibre?: boolean;
}

export function drawPanel(ctx: CanvasRenderingContext2D, o: DrawPanelOptions) {
  const { panel, pxPerMm: k } = o;
  ctx.save();
  ctx.scale(k, k);
  ctx.fillStyle = o.background ?? o.material.color;
  ctx.fillRect(0, 0, panel.width, panel.height);
  if (o.withFibre && o.material.fibre > 0) {
    ctx.save();
    ctx.globalAlpha = o.material.fibre * (o.background ? 0.35 : 1);
    const pat = ctx.createPattern(fibre(), "repeat");
    if (pat) {
      pat.setTransform(new DOMMatrix().scale(1 / k * 1.5));
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, panel.width, panel.height);
    }
    ctx.restore();
  }
  for (const obj of o.objects) {
    if (obj.hidden) continue;
    drawObject(ctx, obj, o.getImage, k);
  }
  ctx.restore();
}

export function drawObject(
  ctx: CanvasRenderingContext2D,
  obj: ArtObject,
  getImage: (assetId: string) => CanvasImageSource | undefined,
  k: number,
) {
  ctx.save();
  ctx.globalAlpha = obj.opacity;
  ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  ctx.rotate((obj.rotation * Math.PI) / 180);
  ctx.translate(-obj.width / 2, -obj.height / 2);
  const { width: w, height: h } = obj;
  switch (obj.type) {
    case "rect": {
      ctx.beginPath();
      const r = Math.min(obj.cornerRadius, w / 2, h / 2);
      ctx.roundRect(0, 0, w, h, r);
      if (obj.fill) {
        ctx.fillStyle = obj.fill;
        ctx.fill();
      }
      if (obj.stroke && obj.strokeWidth > 0) {
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth;
        ctx.stroke();
      }
      break;
    }
    case "ellipse": {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      if (obj.fill) {
        ctx.fillStyle = obj.fill;
        ctx.fill();
      }
      if (obj.stroke && obj.strokeWidth > 0) {
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth;
        ctx.stroke();
      }
      break;
    }
    case "line": {
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.strokeStyle = obj.stroke;
      ctx.lineWidth = obj.strokeWidth;
      ctx.stroke();
      break;
    }
    case "path": {
      const p = new Path2D(obj.d);
      ctx.scale(w / obj.vbWidth, h / obj.vbHeight);
      if (obj.fill) {
        ctx.fillStyle = obj.fill;
        ctx.fill(p);
      }
      if (obj.stroke && obj.strokeWidth > 0) {
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth / ((w / obj.vbWidth + h / obj.vbHeight) / 2);
        ctx.stroke(p);
      }
      break;
    }
    case "image": {
      const img = getImage(obj.assetId);
      if (img) {
        const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width;
        const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height;
        const r = fitRect(obj.fit, w, h, iw, ih);
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.clip();
        ctx.drawImage(img, r.x, r.y, r.w, r.h);
      }
      break;
    }
    case "text": {
      // Draw in pixel space for crisp font hinting
      ctx.scale(1 / k, 1 / k);
      const size = obj.fontSize * PT_TO_MM * k;
      ctx.font = `${obj.italic ? "italic " : ""}${obj.fontWeight} ${size}px ${fontStack(obj.fontFamily)}`;
      ctx.fillStyle = obj.color;
      ctx.textAlign = obj.align;
      ctx.textBaseline = "alphabetic";
      if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${obj.letterSpacing * size}px`;
      const ax = obj.align === "left" ? 0 : obj.align === "center" ? (w * k) / 2 : w * k;
      textLines(obj).forEach((line, i) => {
        ctx.fillText(line, ax, baselineY(obj, i) * k);
      });
      break;
    }
  }
  ctx.restore();
}

export function panelPxPerMm(p: DielinePanel, quality = 1) {
  return Math.min(12 * quality, (2048 * quality) / Math.max(p.width, p.height));
}
