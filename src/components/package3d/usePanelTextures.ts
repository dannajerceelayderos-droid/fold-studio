"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { assetImage, assetVersion, onAssetsChanged } from "@/lib/assets";
import { MATERIALS } from "@/lib/materials";
import { drawPanel, panelPxPerMm } from "@/lib/render/canvas";
import type { Dieline, Project } from "@/lib/types";

interface Slot {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  hash: string;
}

/**
 * One canvas texture per dieline panel, drawn from the same project data the
 * 2D editor renders. Only panels whose content changed are redrawn.
 */
export function usePanelTextures(project: Project, dl: Dieline, quality = 1) {
  const slots = useRef(new Map<string, Slot>());
  const [assetsTick, setAssetsTick] = useState(assetVersion());
  const [fontsTick, setFontsTick] = useState(0);

  useEffect(() => onAssetsChanged(() => setAssetsTick(assetVersion())), []);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontsTick((t) => t + 1));
    const onLoad = () => setFontsTick((t) => t + 1);
    document.fonts?.addEventListener?.("loadingdone", onLoad);
    return () => {
      alive = false;
      document.fonts?.removeEventListener?.("loadingdone", onLoad);
    };
  }, []);

  const material = MATERIALS[project.material];

  const textures = useMemo(() => {
    const map = new Map<string, THREE.CanvasTexture>();
    const live = new Set<string>();
    for (const panel of dl.panels) {
      live.add(panel.id);
      const objects = project.objects.filter((o) => o.panelId === panel.id);
      const bg = project.panels[panel.id]?.background ?? null;
      const hash = JSON.stringify([panel.width, panel.height, bg, material.id, objects, assetsTick, fontsTick, quality]);
      let slot = slots.current.get(panel.id);
      const k = panelPxPerMm(panel, quality);
      const w = Math.max(2, Math.round(panel.width * k));
      const h = Math.max(2, Math.round(panel.height * k));
      if (!slot) {
        const canvas = document.createElement("canvas");
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        slot = { canvas, texture, hash: "" };
        slots.current.set(panel.id, slot);
      }
      if (slot.hash !== hash) {
        if (slot.canvas.width !== w || slot.canvas.height !== h) {
          slot.canvas.width = w;
          slot.canvas.height = h;
          // a resized canvas needs a fresh GPU texture
          slot.texture.dispose();
          slot.texture = new THREE.CanvasTexture(slot.canvas);
          slot.texture.colorSpace = THREE.SRGBColorSpace;
          slot.texture.anisotropy = 8;
        }
        const ctx = slot.canvas.getContext("2d")!;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        drawPanel(ctx, {
          panel,
          objects,
          background: bg,
          material,
          pxPerMm: w / panel.width,
          getImage: assetImage,
          withFibre: true,
        });
        slot.texture.needsUpdate = true;
        slot.hash = hash;
      }
      map.set(panel.id, slot.texture);
    }
    for (const [id, slot] of slots.current) {
      if (!live.has(id)) {
        slot.texture.dispose();
        slots.current.delete(id);
      }
    }
    return map;
  }, [project.objects, project.panels, dl, material, assetsTick, fontsTick, quality]);

  useEffect(() => {
    const s = slots.current;
    return () => {
      s.forEach((slot) => slot.texture.dispose());
      s.clear();
    };
  }, []);

  return textures;
}
