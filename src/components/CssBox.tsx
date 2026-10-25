"use client";
import { MATERIALS } from "@/lib/materials";
import { getDieline } from "@/lib/templates";
import type { Project } from "@/lib/types";
import { ObjectSvg } from "./editor/ObjectSvg";

function PanelSvg({ project, panelId, rotate = 0 }: { project: Project; panelId: string; rotate?: number }) {
  const dl = getDieline(project.templateId, project.dimensions);
  const p = dl.panels.find((x) => x.id === panelId)!;
  const bg = project.panels[p.id]?.background ?? MATERIALS[project.material].color;
  const swap = rotate % 180 !== 0;
  const vw = swap ? p.height : p.width;
  const vh = swap ? p.width : p.height;
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      <g transform={rotate ? `translate(${vw / 2} ${vh / 2}) rotate(${rotate}) translate(${-p.width / 2} ${-p.height / 2})` : undefined}>
        <rect width={p.width} height={p.height} fill={bg} />
        {project.objects
          .filter((o) => o.panelId === p.id && !o.hidden)
          .map((o) => (
            <ObjectSvg key={o.id} o={o} assetsTick={0} />
          ))}
      </g>
    </svg>
  );
}

/**
 * Lightweight CSS 3D rendering of a folded package (front, right side and top),
 * drawn from the same project data as the editor. Used where a WebGL canvas would be too heavy.
 */
export function CssBox({ project, size = 200, rx = -24, ry = -34 }: { project: Project; size?: number; rx?: number; ry?: number }) {
  const { width: W, height: H, depth: D } = project.dimensions;
  const k = size / Math.max(W, H, D) / 1.25;
  const w = W * k;
  const h = H * k;
  const d = D * k;
  const mailer = project.templateId === "mailer";
  const face = "absolute left-1/2 top-1/2 overflow-hidden [backface-visibility:hidden]";
  return (
    <div className="relative" style={{ width: size, height: size, perspective: size * 6 }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
        <div className={face} style={{ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, transform: `translateZ(${d / 2}px)` }}>
          <PanelSvg project={project} panelId="front" />
        </div>
        <div className={face} style={{ width: d, height: h, marginLeft: -d / 2, marginTop: -h / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)` }}>
          <PanelSvg project={project} panelId="right" rotate={mailer ? -90 : 0} />
          <div className="absolute inset-0 bg-black/[0.14]" />
        </div>
        <div className={face} style={{ width: w, height: d, marginLeft: -w / 2, marginTop: -d / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)` }}>
          <PanelSvg project={project} panelId="top" />
          <div className="absolute inset-0 bg-white/[0.08]" />
        </div>
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-black/15 blur-md"
        style={{ width: Math.max(w, d) * 1.3, height: Math.max(8, d * 0.3), top: size / 2 + h / 2 + 2 }}
        aria-hidden
      />
    </div>
  );
}
