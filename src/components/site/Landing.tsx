"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { exampleProjects } from "@/lib/examples";
import { MATERIAL_LIST } from "@/lib/materials";
import { cloneProject } from "@/lib/project";
import { sampleProject } from "@/lib/sample";
import { localRepo } from "@/lib/storage/db";
import { getDieline } from "@/lib/templates";
import type { MaterialPresetId, Project, TextObject } from "@/lib/types";
import { CssBox } from "../CssBox";
import { toast } from "../ui/Toast";

const PackageScene = dynamic(() => import("../package3d/PackageScene").then((m) => m.PackageScene), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

function useInView<T extends Element>(margin = "200px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}

/** The hero: the sample carton folding up from its flat dieline, with a scrubber the visitor can take over. */
export function HeroStage() {
  const project = useMemo(() => {
    const p = sampleProject();
    p.preview = { ...p.preview, shadow: 0, background: "transparent" };
    return p;
  }, []);
  const dl = getDieline(project.templateId, project.dimensions);
  const fold = useRef(0);
  const slider = useRef<HTMLInputElement>(null);
  const manual = useRef(false);
  const [label, setLabel] = useState("Folding");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      fold.current = 1;
      if (slider.current) slider.current.value = "1";
      setLabel("Folded");
      return;
    }
    // flat 1s → fold 2.8s → hold 4.5s → unfold 1.8s
    const seq = [1, 2.8, 4.5, 1.8];
    const total = seq.reduce((a, b) => a + b);
    let raf = 0;
    const t0 = performance.now();
    let last = "";
    const tick = (now: number) => {
      if (!manual.current) {
        const t = ((now - t0) / 1000) % total;
        let v = 0;
        let l = "Flat";
        if (t < seq[0]) v = 0;
        else if (t < seq[0] + seq[1]) {
          v = (t - seq[0]) / seq[1];
          l = "Folding";
        } else if (t < seq[0] + seq[1] + seq[2]) {
          v = 1;
          l = "Folded";
        } else {
          v = 1 - (t - seq[0] - seq[1] - seq[2]) / seq[3];
          l = "Unfolding";
        }
        fold.current = v;
        if (slider.current) slider.current.value = String(v);
        if (l !== last) {
          last = l;
          setLabel(l);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[620px] lg:aspect-[5/5.4]">
      <div className="absolute inset-x-[18%] bottom-[9%] h-[7%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(32,33,31,0.16),transparent)]" aria-hidden />
      <PackageScene project={project} dl={dl} foldRef={fold} className="absolute inset-0" label="The Moss Botanicals serum box folding from a flat dieline into a carton" />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-[min(360px,100%)] items-center gap-3 rounded-full border border-line bg-surface/90 px-4 py-2 backdrop-blur">
        <span className="w-[68px] text-[12px] font-medium text-ink-2" aria-live="polite">
          {label}
        </span>
        <input
          ref={slider}
          type="range"
          min={0}
          max={1}
          step={0.005}
          defaultValue={0}
          aria-label="Fold the box"
          className="h-1 flex-1 cursor-grab accent-[var(--accent)] active:cursor-grabbing"
          onPointerDown={() => (manual.current = true)}
          onKeyDown={() => (manual.current = true)}
          onChange={(e) => {
            manual.current = true;
            fold.current = parseFloat(e.target.value);
            setLabel(fold.current >= 1 ? "Folded" : fold.current <= 0 ? "Flat" : "Folding");
          }}
        />
      </div>
    </div>
  );
}

const SWATCHES = ["#EFE9DC", "#2F3E2C", "#68775A", "#D9C3B0", "#1F3A4D", "#F4F4F1"];

/** A small live editor: change the copy, colour and board, and the 3D box updates from the same data. */
export function LiveDemo() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [name, setName] = useState("Moss\nBotanicals");
  const [bg, setBg] = useState("#EFE9DC");
  const [material, setMaterial] = useState<MaterialPresetId>("ivory");
  const project = useMemo<Project>(() => {
    const p = sampleProject();
    const dark = ["#2F3E2C", "#68775A", "#1F3A4D"].includes(bg);
    p.panels = { ...p.panels, front: { background: bg }, back: { background: bg } };
    p.material = material;
    p.objects = p.objects.map((o) => {
      if (o.panelId !== "front" || o.type !== "text") return o;
      const t = o as TextObject;
      if (t.name === "Wordmark") return { ...t, text: name || " ", color: dark ? "#EFE9DC" : "#2F3E2C" };
      if (t.name === "Product name") return { ...t, color: dark ? "#EFE9DC" : "#2F3E2C" };
      if (t.name === "Descriptor") return { ...t, color: dark ? "#C9D3BC" : "#68775A" };
      return t;
    });
    p.objects = p.objects.map((o) => (o.panelId === "front" && o.type === "path" ? { ...o, fill: dark ? "#EFE9DC" : "#2F3E2C" } : o));
    p.preview = { ...p.preview, background: "transparent", shadow: 0.5 };
    return p;
  }, [name, bg, material]);
  const dl = getDieline(project.templateId, project.dimensions);

  return (
    <div className="grid overflow-hidden rounded-[22px] border border-line bg-surface lg:grid-cols-[340px_1fr]">
      <div className="space-y-6 border-b border-line p-6 lg:border-b-0 lg:border-r">
        <div>
          <label htmlFor="demo-name" className="text-[12.5px] font-medium text-ink-2">
            Brand name on the front panel
          </label>
          <textarea id="demo-name" rows={2} maxLength={40} className="field mt-1.5 !text-[14px]" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-ink-2">Front and back colour</p>
          <div className="mt-2 flex gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                aria-label={`Use ${c}`}
                aria-pressed={bg === c}
                onClick={() => setBg(c)}
                className={`h-8 w-8 rounded-full border border-black/10 transition-transform ${bg === c ? "ring-2 ring-accent ring-offset-2" : "hover:scale-105"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-ink-2">Board</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MATERIAL_LIST.map((m) => (
              <button
                key={m.id}
                aria-pressed={material === m.id}
                onClick={() => setMaterial(m.id)}
                className={`rounded-full border px-3 py-1 text-[12.5px] ${material === m.id ? "border-accent bg-accent-soft text-accent-hover" : "border-line text-ink-2 hover:border-line-strong"}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-3">Drag the box to turn it. The sides, top and back carry their own artwork, mapped panel by panel from the dieline.</p>
      </div>
      <div ref={ref} className="relative h-[420px] bg-[linear-gradient(180deg,#F7F7F5,#ECECE8)] lg:h-[520px]">
        {seen && <PackageScene project={project} dl={dl} className="absolute inset-0" label="Live preview of the demo box" />}
      </div>
    </div>
  );
}

export function ExampleGallery() {
  const router = useRouter();
  const examples = useMemo(() => exampleProjects(), []);
  const open = async (p: Project) => {
    try {
      const copy = cloneProject(p, p.name);
      await localRepo.save(copy, null);
      router.push(`/editor/${copy.id}`);
    } catch {
      toast.error("Browser storage is unavailable, so the example couldn't be opened. Allow site data and try again.");
    }
  };
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
      {examples.map((p) => (
        <figure key={p.id} className="group">
          <button onClick={() => open(p)} className="block w-full rounded-[18px] bg-workspace py-8 transition-colors hover:bg-[#e9e9e5]" aria-label={`Open ${p.name} in the editor`}>
            <div className="flex justify-center">
              <CssBox project={p} size={170} />
            </div>
          </button>
          <figcaption className="mt-3">
            <p className="text-[13.5px] font-medium">{p.name.split(" — ")[0]}</p>
            <p className="text-[12.5px] text-ink-2">
              {p.name.split(" — ")[1]}, {p.dimensions.width} × {p.dimensions.height} × {p.dimensions.depth} mm
            </p>
            <button onClick={() => open(p)} className="mt-1 text-[12.5px] font-medium text-accent hover:text-accent-hover">
              Open a copy in the editor
            </button>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function StartLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Link href="/dashboard" className={className}>
      {children}
    </Link>
  );
}
