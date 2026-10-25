import { dielineLines, outlinePath } from "../dieline";
import type { MaterialPreset } from "../materials";
import { baselineY, fontStack, PT_TO_MM, textLines } from "../objects";
import type { ArtObject, Dieline, Project } from "../types";
import { formatLen } from "../units";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const n = (v: number) => (Math.round(v * 1000) / 1000).toString();

export function objectTransform(o: ArtObject) {
  return `translate(${n(o.x + o.width / 2)} ${n(o.y + o.height / 2)}) rotate(${n(o.rotation)}) translate(${n(-o.width / 2)} ${n(-o.height / 2)})`;
}

const paint = (fill: string | null, stroke: string | null, sw: number) =>
  `fill="${fill ?? "none"}"${stroke && sw > 0 ? ` stroke="${stroke}" stroke-width="${n(sw)}"` : ""}`;

export function objectSvg(o: ArtObject, imageHref: (id: string) => string | undefined): string {
  if (o.hidden) return "";
  const t = `transform="${objectTransform(o)}" opacity="${n(o.opacity)}"`;
  switch (o.type) {
    case "rect":
      return `<rect ${t} width="${n(o.width)}" height="${n(o.height)}" rx="${n(Math.min(o.cornerRadius, o.width / 2, o.height / 2))}" ${paint(o.fill, o.stroke, o.strokeWidth)}/>`;
    case "ellipse":
      return `<ellipse ${t} cx="${n(o.width / 2)}" cy="${n(o.height / 2)}" rx="${n(o.width / 2)}" ry="${n(o.height / 2)}" ${paint(o.fill, o.stroke, o.strokeWidth)}/>`;
    case "line":
      return `<line ${t} x1="0" y1="${n(o.height / 2)}" x2="${n(o.width)}" y2="${n(o.height / 2)}" stroke="${o.stroke}" stroke-width="${n(o.strokeWidth)}"/>`;
    case "path": {
      const sx = o.width / o.vbWidth;
      const sy = o.height / o.vbHeight;
      return `<g ${t}><path transform="scale(${n(sx)} ${n(sy)})" d="${esc(o.d)}" ${paint(o.fill, o.stroke, o.strokeWidth / ((sx + sy) / 2))}/></g>`;
    }
    case "image": {
      const href = imageHref(o.assetId);
      if (!href) return "";
      const par = o.fit === "contain" ? "xMidYMid meet" : o.fit === "cover" ? "xMidYMid slice" : "none";
      return `<image ${t} width="${n(o.width)}" height="${n(o.height)}" preserveAspectRatio="${par}" href="${href}"/>`;
    }
    case "text": {
      const size = o.fontSize * PT_TO_MM;
      const ax = o.align === "left" ? 0 : o.align === "center" ? o.width / 2 : o.width;
      const anchor = o.align === "left" ? "start" : o.align === "center" ? "middle" : "end";
      const spans = textLines(o)
        .map((line, i) => `<tspan x="${n(ax)}" y="${n(baselineY(o, i))}">${esc(line) || " "}</tspan>`)
        .join("");
      return `<text ${t} font-family="${esc(fontStack(o.fontFamily))}" font-size="${n(size)}" font-weight="${o.fontWeight}"${o.italic ? ' font-style="italic"' : ""} letter-spacing="${n(o.letterSpacing * size)}" text-anchor="${anchor}" fill="${o.color}" xml:space="preserve">${spans}</text>`;
    }
  }
}

export interface SvgExportOptions {
  includeArtwork: boolean;
  includeCut: boolean;
  includeFold: boolean;
  includeDimensions: boolean;
  includeGuides: boolean;
}

export function exportDielineSvg(
  project: Project,
  dl: Dieline,
  material: MaterialPreset,
  imageHref: (id: string) => string | undefined,
  opt: SvgExportOptions,
): string {
  const pad = opt.includeDimensions ? 22 : 6;
  const W = dl.width + pad * 2;
  const H = dl.height + pad * 2 + 10;
  const { cuts, folds } = dielineLines(dl);
  const parts: string[] = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(W)}mm" height="${n(H)}mm" viewBox="${n(-pad)} ${n(-pad)} ${n(W)} ${n(H)}">`,
  );
  parts.push(`<title>${esc(project.name)} — dieline</title>`);
  parts.push(
    `<desc>Fold Studio export. Units: millimetres, 1 user unit = 1 mm (scale 1:1). Template: ${esc(project.templateId)}. Box ${n(project.dimensions.width)} × ${n(project.dimensions.height)} × ${n(project.dimensions.depth)} mm (W × H × D). Visual guide only — confirm the dieline with your printer before production.</desc>`,
  );
  parts.push("<defs>");
  for (const p of dl.panels) parts.push(`<clipPath id="clip-${esc(p.id)}"><path d="${outlinePath(p.outline)}"/></clipPath>`);
  parts.push("</defs>");

  if (opt.includeArtwork) {
    parts.push(`<g id="artwork">`);
    for (const p of dl.panels) {
      const bg = project.panels[p.id]?.background ?? material.color;
      const objs = project.objects.filter((o) => o.panelId === p.id);
      parts.push(`<g id="panel-${esc(p.id)}" transform="translate(${n(p.x)} ${n(p.y)})" clip-path="url(#clip-${esc(p.id)})">`);
      parts.push(`<path d="${outlinePath(p.outline)}" fill="${bg}"/>`);
      for (const o of objs) parts.push(objectSvg(o, imageHref));
      parts.push(`</g>`);
    }
    parts.push(`</g>`);
  }
  if (opt.includeGuides) {
    parts.push(`<g id="guides" fill="none" stroke="#00A3E0" stroke-width="0.2" stroke-dasharray="1 1">`);
    for (const p of dl.panels.filter((q) => q.kind === "face")) {
      const s = 3;
      if (p.width > s * 2 && p.height > s * 2)
        parts.push(`<rect x="${n(p.x + s)}" y="${n(p.y + s)}" width="${n(p.width - 2 * s)}" height="${n(p.height - 2 * s)}"/>`);
    }
    parts.push(`</g>`);
  }
  if (opt.includeCut) {
    parts.push(`<g id="cut" fill="none" stroke="#E4007C" stroke-width="0.25">`);
    for (const [a, b, c, d] of cuts) parts.push(`<line x1="${n(a)}" y1="${n(b)}" x2="${n(c)}" y2="${n(d)}"/>`);
    parts.push(`</g>`);
  }
  if (opt.includeFold) {
    parts.push(`<g id="fold" fill="none" stroke="#00A651" stroke-width="0.25" stroke-dasharray="2 1.2">`);
    for (const [a, b, c, d] of folds) parts.push(`<line x1="${n(a)}" y1="${n(b)}" x2="${n(c)}" y2="${n(d)}"/>`);
    parts.push(`</g>`);
  }
  if (opt.includeDimensions) {
    const u = project.units;
    const y = -10;
    const x = -10;
    parts.push(`<g id="dimensions" font-family="Arial, sans-serif" font-size="3" fill="#555" stroke="#555" stroke-width="0.15">`);
    parts.push(`<line x1="0" y1="${y}" x2="${n(dl.width)}" y2="${y}"/><line x1="0" y1="${y - 2}" x2="0" y2="${y + 2}"/><line x1="${n(dl.width)}" y1="${y - 2}" x2="${n(dl.width)}" y2="${y + 2}"/>`);
    parts.push(`<text stroke="none" x="${n(dl.width / 2)}" y="${y - 2}" text-anchor="middle">${esc(formatLen(dl.width, u))} sheet width</text>`);
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${n(dl.height)}"/><line x1="${x - 2}" y1="0" x2="${x + 2}" y2="0"/><line x1="${x - 2}" y1="${n(dl.height)}" x2="${x + 2}" y2="${n(dl.height)}"/>`);
    parts.push(`<text stroke="none" transform="translate(${x - 2} ${n(dl.height / 2)}) rotate(-90)" text-anchor="middle">${esc(formatLen(dl.height, u))} sheet height</text>`);
    for (const p of dl.panels.filter((q) => q.kind === "face")) {
      parts.push(
        `<text stroke="none" x="${n(p.x + p.width / 2)}" y="${n(p.y + p.height - 1.5)}" text-anchor="middle" font-size="2.2" fill="#00A651">${esc(p.name)} ${esc(formatLen(p.width, u))} × ${esc(formatLen(p.height, u))}</text>`,
      );
    }
    parts.push(`</g>`);
  }
  parts.push(
    `<text x="0" y="${n(dl.height + pad + 2)}" font-family="Arial, sans-serif" font-size="2.6" fill="#777">${esc(project.name)} · scale 1:1, units mm · magenta = cut, green dashed = fold · not a printer-approved dieline</text>`,
  );
  parts.push(`</svg>`);
  return parts.join("\n");
}
