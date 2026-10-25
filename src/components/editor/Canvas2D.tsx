"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assetVersion, onAssetsChanged } from "@/lib/assets";
import { dielineLines, outlinePath } from "@/lib/dieline";
import { MATERIALS } from "@/lib/materials";
import { getDieline, panelAt } from "@/lib/templates";
import type { ArtObject, Dieline, TextObject } from "@/lib/types";
import { formatLen } from "@/lib/units";
import { useEditor } from "@/store/editor";
import { ObjectSvg } from "./ObjectSvg";

type Drag =
  | { kind: "move"; start: [number, number]; origin: Record<string, [number, number]>; moved: boolean }
  | { kind: "resize"; id: string; sx: number; sy: number; start: ArtObject; anchor: [number, number] }
  | { kind: "rotate"; id: string; center: [number, number] }
  | { kind: "pan"; start: [number, number]; pan: [number, number] }
  | { kind: "pinch"; dist: number; mid: [number, number]; zoom: number; pan: [number, number] };

const rad = (d: number) => (d * Math.PI) / 180;
const rot = (x: number, y: number, deg: number): [number, number] => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [x * c - y * s, x * s + y * c];
};

export function Canvas2D() {
  const project = useEditor((s) => s.project!);
  const selection = useEditor((s) => s.selection);
  const selectedPanel = useEditor((s) => s.selectedPanel);
  const zoom = useEditor((s) => s.zoom);
  const fitSignal = useEditor((s) => s.fitSignal);
  const showGuides = useEditor((s) => s.showGuides);
  const showDimensions = useEditor((s) => s.showDimensions);
  const showGrid = useEditor((s) => s.showGrid);
  const ed = useEditor.getState;

  const dl = getDieline(project.templateId, project.dimensions);
  const { cuts, folds } = useMemo(() => dielineLines(dl), [dl]);
  const material = MATERIALS[project.material];

  const wrap = useRef<HTMLDivElement>(null);
  const world = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [snap, setSnap] = useState<{ x?: number; y?: number } | null>(null);
  const [assetsTick, setAssetsTick] = useState(assetVersion());
  const spaceDown = useRef(false);
  const pointers = useRef(new Map<number, [number, number]>());
  const lastTap = useRef<{ id: string; t: number } | null>(null);
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches), []);
  useEffect(() => onAssetsChanged(() => setAssetsTick(assetVersion())), []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = 56;
  const fitScale = Math.max(0.1, Math.min((size.w - pad * 2) / dl.width, (size.h - pad * 2) / dl.height));
  const scale = fitScale * zoom;
  const ox = (size.w - dl.width * scale) / 2 + pan[0];
  const oy = (size.h - dl.height * scale) / 2 + pan[1];
  const px = 1 / scale; // one screen pixel in mm

  useEffect(() => setPan([0, 0]), [fitSignal, project.templateId]);

  const toMm = useCallback((clientX: number, clientY: number): [number, number] => {
    const g = world.current;
    if (!g) return [0, 0];
    const m = g.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }, []);

  // wheel: pinch / ctrl+wheel zooms around the cursor, otherwise pans
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom: z, setZoom } = useEditor.getState();
      if (e.ctrlKey || e.metaKey) {
        const nz = Math.min(8, Math.max(0.2, z * Math.exp(-e.deltaY * 0.01)));
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setPan(([pxx, pyy]) => {
          // keep the point under the cursor fixed
          const k = nz / z;
          const cxc = size.w / 2 + pxx;
          const cyc = size.h / 2 + pyy;
          return [pxx + (cx - cxc) * (1 - k), pyy + (cy - cyc) * (1 - k)];
        });
        setZoom(nz);
      } else {
        setPan(([a, b]) => [a - e.deltaX, b - e.deltaY]);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [size]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target as HTMLElement).closest("input,textarea,select")) spaceDown.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceDown.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const panelOf = (id: string) => dl.panels.find((p) => p.id === id)!;

  const startPan = (e: React.PointerEvent) => {
    setDrag({ kind: "pan", start: [e.clientX, e.clientY], pan });
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onBackgroundDown = (e: React.PointerEvent) => {
    if (e.button === 1 || spaceDown.current || e.target === e.currentTarget || (e.target as Element).getAttribute("data-bg") === "1") {
      if (e.button === 0 && !spaceDown.current) ed().selectPanel(null);
      startPan(e);
    }
  };

  const onPanelDown = (e: React.PointerEvent, panelId: string) => {
    if (e.button !== 0 || spaceDown.current) return startPan(e);
    e.stopPropagation();
    ed().selectPanel(panelId);
  };

  const onObjectDown = (e: React.PointerEvent, o: ArtObject) => {
    if (e.button === 1 || spaceDown.current || pointers.current.size > 1) return;
    e.stopPropagation();
    if (e.pointerType !== "mouse") {
      const now = Date.now();
      if (lastTap.current?.id === o.id && now - lastTap.current.t < 350) {
        lastTap.current = null;
        onDouble(o);
        return;
      }
      lastTap.current = { id: o.id, t: now };
    }
    const s = ed();
    let sel = s.selection;
    if (e.shiftKey) {
      sel = sel.includes(o.id) ? sel.filter((x) => x !== o.id) : [...sel, o.id];
      s.setSelection(sel, o.panelId);
      return;
    }
    if (!sel.includes(o.id)) {
      sel = [o.id];
      s.setSelection(sel, o.panelId);
    }
    const objs = s.project!.objects.filter((x) => sel.includes(x.id) && !x.locked);
    if (!objs.length) return;
    s.beginTransient();
    setDrag({
      kind: "move",
      start: toMm(e.clientX, e.clientY),
      origin: Object.fromEntries(objs.map((x) => [x.id, [x.x, x.y]])),
      moved: false,
    });
    (e.currentTarget as SVGElement).ownerSVGElement?.setPointerCapture(e.pointerId);
  };

  const onHandleDown = (e: React.PointerEvent, o: ArtObject, sx: number, sy: number) => {
    e.stopPropagation();
    const p = panelOf(o.panelId);
    const c: [number, number] = [p.x + o.x + o.width / 2, p.y + o.y + o.height / 2];
    const [ax, ay] = rot((-sx * o.width) / 2, (-sy * o.height) / 2, o.rotation);
    ed().beginTransient();
    setDrag({ kind: "resize", id: o.id, sx, sy, start: o, anchor: [c[0] + ax, c[1] + ay] });
    (e.currentTarget as SVGElement).ownerSVGElement?.setPointerCapture(e.pointerId);
  };

  const onRotateDown = (e: React.PointerEvent, o: ArtObject) => {
    e.stopPropagation();
    const p = panelOf(o.panelId);
    ed().beginTransient();
    setDrag({ kind: "rotate", id: o.id, center: [p.x + o.x + o.width / 2, p.y + o.y + o.height / 2] });
    (e.currentTarget as SVGElement).ownerSVGElement?.setPointerCapture(e.pointerId);
  };

  const pinchInfo = () => {
    const pts = [...pointers.current.values()];
    const rect = wrap.current!.getBoundingClientRect();
    const dist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
    const mid: [number, number] = [(pts[0][0] + pts[1][0]) / 2 - rect.left, (pts[0][1] + pts[1][1]) / 2 - rect.top];
    return { dist, mid };
  };

  const onDownCapture = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.current.size === 2) {
      // second finger: abandon any object drag and start a pinch
      const s = ed();
      if (s.transientBase) {
        useEditor.setState({ project: s.transientBase, transientBase: null });
      }
      const { dist, mid } = pinchInfo();
      setDrag({ kind: "pinch", dist: Math.max(1, dist), mid, zoom: s.zoom, pan });
      setSnap(null);
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const onMoveCapture = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
  };

  const onUpCapture = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    if (drag.kind === "pinch") {
      if (pointers.current.size < 2) return;
      const { dist, mid } = pinchInfo();
      const nz = Math.min(8, Math.max(0.2, drag.zoom * (dist / drag.dist)));
      const k = nz / drag.zoom;
      const cx = size.w / 2 + drag.pan[0];
      const cy = size.h / 2 + drag.pan[1];
      setPan([drag.pan[0] + (drag.mid[0] - cx) * (1 - k) + (mid[0] - drag.mid[0]), drag.pan[1] + (drag.mid[1] - cy) * (1 - k) + (mid[1] - drag.mid[1])]);
      ed().setZoom(nz);
      return;
    }
    if (drag.kind === "pan") {
      setPan([drag.pan[0] + e.clientX - drag.start[0], drag.pan[1] + e.clientY - drag.start[1]]);
      return;
    }
    const [mx, my] = toMm(e.clientX, e.clientY);
    const s = ed();
    if (drag.kind === "move") {
      let dx = mx - drag.start[0];
      let dy = my - drag.start[1];
      if (!drag.moved && Math.hypot(dx, dy) < 2 * px) return;
      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) dy = 0;
        else dx = 0;
      }
      // snap a single object's centre to its panel's centre lines
      const ids = Object.keys(drag.origin);
      let guide: { x?: number; y?: number } | null = null;
      if (ids.length === 1 && !e.altKey) {
        const o = s.project!.objects.find((x) => x.id === ids[0])!;
        const p = panelOf(o.panelId);
        const [x0, y0] = drag.origin[ids[0]];
        const cx = x0 + dx + o.width / 2;
        const cy = y0 + dy + o.height / 2;
        const tol = 6 * px;
        if (Math.abs(cx - p.width / 2) < tol) {
          dx += p.width / 2 - cx;
          guide = { ...(guide ?? {}), x: p.x + p.width / 2 };
        }
        if (Math.abs(cy - p.height / 2) < tol) {
          dy += p.height / 2 - cy;
          guide = { ...(guide ?? {}), y: p.y + p.height / 2 };
        }
      }
      setSnap(guide);
      if (!drag.moved) setDrag({ ...drag, moved: true });
      s.updateTransient((d) => {
        for (const o of d.objects) {
          const org = drag.origin[o.id];
          if (org) {
            o.x = org[0] + dx;
            o.y = org[1] + dy;
          }
        }
      });
    } else if (drag.kind === "resize") {
      const o0 = drag.start;
      const [vx, vy] = rot(mx - drag.anchor[0], my - drag.anchor[1], -o0.rotation);
      const min = 1;
      let w = Math.max(min, drag.sx * vx);
      let h = Math.max(min, drag.sy * vy);
      const lock = o0.type === "image" || o0.type === "path" || o0.type === "text" ? !e.shiftKey : e.shiftKey;
      let k = 1;
      if (lock) {
        k = Math.max(w / o0.width, h / o0.height);
        w = Math.max(min, o0.width * k);
        h = Math.max(min, o0.height * k);
      }
      const [cx, cy] = rot((drag.sx * w) / 2, (drag.sy * h) / 2, o0.rotation);
      const p = panelOf(o0.panelId);
      const center = [drag.anchor[0] + cx - p.x, drag.anchor[1] + cy - p.y];
      s.updateTransient((d) => {
        const o = d.objects.find((x) => x.id === drag.id);
        if (!o) return;
        o.width = w;
        o.height = h;
        o.x = center[0] - w / 2;
        o.y = center[1] - h / 2;
        if (o.type === "text" && lock) (o as TextObject).fontSize = Math.max(1, Math.round((o0 as TextObject).fontSize * k * 10) / 10);
      });
    } else if (drag.kind === "rotate") {
      let a = (Math.atan2(my - drag.center[1], mx - drag.center[0]) * 180) / Math.PI + 90;
      if (e.shiftKey) a = Math.round(a / 15) * 15;
      else {
        const near = Math.round(a / 90) * 90;
        if (Math.abs(a - near) < 3) a = near;
      }
      a = ((((a + 180) % 360) + 360) % 360) - 180;
      s.updateTransient((d) => {
        const o = d.objects.find((x) => x.id === drag.id);
        if (o) o.rotation = Math.round(a * 10) / 10;
      });
    }
  };

  const onUp = () => {
    if (!drag) return;
    if (drag.kind === "pinch") {
      if (pointers.current.size === 0) setDrag(null);
      return;
    }
    const s = ed();
    if (drag.kind === "move" && drag.moved) {
      // hand an object over to the panel it was dropped on
      const ids = Object.keys(drag.origin);
      if (ids.length === 1) {
        const o = s.project!.objects.find((x) => x.id === ids[0])!;
        const from = panelOf(o.panelId);
        const gx = from.x + o.x + o.width / 2;
        const gy = from.y + o.y + o.height / 2;
        const to = panelAt(dl, gx, gy);
        if (to && to.id !== from.id) {
          s.updateTransient((d) => {
            const t = d.objects.find((x) => x.id === o.id)!;
            t.panelId = to.id;
            t.x += from.x - to.x;
            t.y += from.y - to.y;
          });
          useEditor.setState({ selectedPanel: to.id });
        }
      }
    }
    if (drag.kind !== "pan") s.endTransient();
    setDrag(null);
    setSnap(null);
  };

  const onDouble = (o: ArtObject) => {
    if (o.type === "text" && !o.locked) {
      ed().setSelection([o.id], o.panelId);
      ed().setEditingText(o.id);
    }
  };

  const selected = project.objects.filter((o) => selection.includes(o.id));
  const single = selected.length === 1 ? selected[0] : null;
  const gridId = "grid-5mm";

  return (
    <div
      ref={wrap}
      className={`relative h-full w-full touch-none select-none overflow-hidden bg-workspace ${drag?.kind === "pan" ? "cursor-grabbing" : ""}`}
      aria-label="Flat dieline editor"
    >
      <svg
        width={size.w}
        height={size.h}
        className="block"
        onPointerDownCapture={onDownCapture}
        onPointerMoveCapture={onMoveCapture}
        onPointerUpCapture={onUpCapture}
        onPointerCancelCapture={onUpCapture}
        onPointerDown={onBackgroundDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <rect data-bg="1" width={size.w} height={size.h} fill="transparent" />
        <g ref={world} transform={`translate(${ox} ${oy}) scale(${scale})`}>
          <defs>
            {dl.panels.map((p) => (
              <clipPath key={p.id} id={`clip2d-${p.id}`}>
                <path d={outlinePath(p.outline)} />
              </clipPath>
            ))}
            <pattern id={gridId} width={5} height={5} patternUnits="userSpaceOnUse">
              <path d="M5 0H0V5" fill="none" stroke="rgba(32,33,31,0.12)" strokeWidth={px * 0.8} />
            </pattern>
          </defs>

          {/* sheet shadow */}
          {dl.panels.map((p) => (
            <path key={`sh-${p.id}`} d={outlinePath(p.outline, p.x, p.y + px * 2)} fill="rgba(32,33,31,0.06)" />
          ))}

          {dl.panels.map((p) => {
            const objs = project.objects.filter((o) => o.panelId === p.id && !o.hidden);
            const bg = project.panels[p.id]?.background ?? material.color;
            return (
              <g key={p.id} transform={`translate(${p.x} ${p.y})`}>
                <g clipPath={`url(#clip2d-${p.id})`}>
                  <path d={outlinePath(p.outline)} fill={bg} onPointerDown={(e) => onPanelDown(e, p.id)} />
                  {objs.map((o) => (
                    <g
                      key={o.id}
                      onPointerDown={(e) => onObjectDown(e, o)}
                      onDoubleClick={() => onDouble(o)}
                      style={{ cursor: o.locked ? "default" : "move" }}
                    >
                      <ObjectSvg o={o} assetsTick={assetsTick} />
                    </g>
                  ))}
                  {showGrid && <rect width={p.width} height={p.height} fill={`url(#${gridId})`} pointerEvents="none" />}
                </g>
                {showGuides && p.kind === "face" && p.width > 8 && p.height > 8 && (
                  <rect x={3} y={3} width={p.width - 6} height={p.height - 6} fill="none" stroke="#3E8FC7" strokeOpacity={0.55} strokeWidth={px} strokeDasharray={`${4 * px} ${3 * px}`} pointerEvents="none" />
                )}
                {(showGuides || showDimensions) && p.kind === "face" && (
                  <text
                    x={p.width / 2}
                    y={p.height - Math.min(4, p.height * 0.06)}
                    textAnchor="middle"
                    fontSize={Math.max(10 * px, Math.min(2.6, p.width / 14))}
                    fill="rgba(32,33,31,0.38)"
                    fontFamily="var(--font-ui)"
                    pointerEvents="none"
                  >
                    {p.name}
                    {showDimensions ? `  ${formatLen(p.width, project.units)} × ${formatLen(p.height, project.units)}` : ""}
                  </text>
                )}
              </g>
            );
          })}

          {/* dieline */}
          <g pointerEvents="none" fill="none">
            {cuts.map(([a, b, c, d], i) => (
              <line key={`c${i}`} x1={a} y1={b} x2={c} y2={d} stroke="#20211F" strokeOpacity={0.55} strokeWidth={px} />
            ))}
            {folds.map(([a, b, c, d], i) => (
              <line key={`f${i}`} x1={a} y1={b} x2={c} y2={d} stroke="#68775A" strokeWidth={px * 1.2} strokeDasharray={`${5 * px} ${3.5 * px}`} />
            ))}
          </g>

          {/* selected panel */}
          {selectedPanel && !selection.length && (() => {
            const p = dl.panels.find((q) => q.id === selectedPanel);
            return p ? <path d={outlinePath(p.outline, p.x, p.y)} fill="none" stroke="#68775A" strokeWidth={px * 2} pointerEvents="none" /> : null;
          })()}

          {showDimensions && <DimensionMarks dl={dl} px={px} units={project.units} />}

          {snap?.x !== undefined && <line x1={snap.x} x2={snap.x} y1={-1000} y2={2000} stroke="#D94A8C" strokeWidth={px} pointerEvents="none" />}
          {snap?.y !== undefined && <line y1={snap.y} y2={snap.y} x1={-1000} x2={3000} stroke="#D94A8C" strokeWidth={px} pointerEvents="none" />}

          {/* selection overlay */}
          {selected.map((o) => {
            const p = panelOf(o.panelId);
            const t = `translate(${p.x + o.x + o.width / 2} ${p.y + o.y + o.height / 2}) rotate(${o.rotation})`;
            const hw = o.width / 2;
            const hh = o.height / 2;
            const hs = (coarse ? 18 : 8) * px;
            const rOff = (coarse ? 34 : 22) * px;
            return (
              <g key={`sel-${o.id}`} transform={t}>
                <rect x={-hw} y={-hh} width={o.width} height={o.height} fill="none" stroke={o.locked ? "#a3a59e" : "#3E8FC7"} strokeWidth={px * 1.5} pointerEvents="none" />
                {single && !o.locked && (
                  <>
                    <line x1={0} y1={-hh} x2={0} y2={-hh - rOff} stroke="#3E8FC7" strokeWidth={px * 1.5} pointerEvents="none" />
                    <circle
                      cx={0}
                      cy={-hh - rOff}
                      r={(coarse ? 11 : 5) * px}
                      fill="#fff"
                      stroke="#3E8FC7"
                      strokeWidth={px * 1.5}
                      style={{ cursor: "grab" }}
                      onPointerDown={(e) => onRotateDown(e, o)}
                    >
                      <title>Rotate (Shift snaps to 15°)</title>
                    </circle>
                    {[
                      [-1, -1],
                      [1, -1],
                      [1, 1],
                      [-1, 1],
                    ].map(([sx, sy]) => (
                      <rect
                        key={`${sx}${sy}`}
                        x={sx * hw - hs / 2}
                        y={sy * hh - hs / 2}
                        width={hs}
                        height={hs}
                        rx={1.5 * px}
                        fill="#fff"
                        stroke="#3E8FC7"
                        strokeWidth={px * 1.5}
                        style={{ cursor: sx === sy ? "nwse-resize" : "nesw-resize" }}
                        onPointerDown={(e) => onHandleDown(e, o, sx, sy)}
                      />
                    ))}
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-md max-sm:hidden bg-surface/85 px-2.5 py-1.5 text-[11px] text-ink-2 backdrop-blur">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" aria-hidden>
            <line x1="0" y1="2" x2="16" y2="2" stroke="#20211F" strokeOpacity="0.55" />
          </svg>
          Cut
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" aria-hidden>
            <line x1="0" y1="2" x2="16" y2="2" stroke="#68775A" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          Fold
        </span>
        {showGuides && (
          <span className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden>
              <line x1="0" y1="2" x2="16" y2="2" stroke="#3E8FC7" strokeDasharray="3 2" />
            </svg>
            3 mm safe area
          </span>
        )}
      </div>
    </div>
  );
}

function DimensionMarks({ dl, px, units }: { dl: Dieline; px: number; units: "mm" | "in" }) {
  const y = -10 * px - 4;
  const x = -10 * px - 4;
  const fs = 11 * px;
  return (
    <g pointerEvents="none" stroke="#777972" strokeWidth={px} fill="#777972" fontSize={fs} fontFamily="var(--font-ui)">
      <line x1={0} y1={y} x2={dl.width} y2={y} />
      <line x1={0} y1={y - 4 * px} x2={0} y2={y + 4 * px} />
      <line x1={dl.width} y1={y - 4 * px} x2={dl.width} y2={y + 4 * px} />
      <text stroke="none" x={dl.width / 2} y={y - 5 * px} textAnchor="middle">
        {formatLen(dl.width, units)}
      </text>
      <line x1={x} y1={0} x2={x} y2={dl.height} />
      <line x1={x - 4 * px} y1={0} x2={x + 4 * px} y2={0} />
      <line x1={x - 4 * px} y1={dl.height} x2={x + 4 * px} y2={dl.height} />
      <text stroke="none" transform={`translate(${x - 5 * px} ${dl.height / 2}) rotate(-90)`} textAnchor="middle">
        {formatLen(dl.height, units)}
      </text>
    </g>
  );
}
