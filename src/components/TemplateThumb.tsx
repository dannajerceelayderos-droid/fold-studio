import { dielineLines, outlinePath } from "@/lib/dieline";
import { getDieline, TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";

/** Line drawing of a template's dieline at its default size. */
export function TemplateThumb({ templateId, className = "", tint = "#EFE9DC" }: { templateId: TemplateId; className?: string; tint?: string }) {
  const dl = getDieline(templateId, TEMPLATES[templateId].defaults);
  const { cuts, folds } = dielineLines(dl);
  const pad = Math.max(dl.width, dl.height) * 0.06;
  const sw = Math.max(dl.width, dl.height) / 260;
  return (
    <svg viewBox={`${-pad} ${-pad} ${dl.width + pad * 2} ${dl.height + pad * 2}`} className={`rounded-md bg-workspace ${className}`} aria-hidden="true">
      {dl.panels.map((p) => (
        <path key={p.id} d={outlinePath(p.outline, p.x, p.y)} fill={p.kind === "face" ? tint : "#F7F4EC"} />
      ))}
      {cuts.map(([a, b, c, d], i) => (
        <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#20211F" strokeOpacity={0.6} strokeWidth={sw} />
      ))}
      {folds.map(([a, b, c, d], i) => (
        <line key={`f${i}`} x1={a} y1={b} x2={c} y2={d} stroke="#68775A" strokeWidth={sw} strokeDasharray={`${sw * 4} ${sw * 3}`} />
      ))}
    </svg>
  );
}
