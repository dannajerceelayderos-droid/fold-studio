"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MATERIALS } from "@/lib/materials";
import type { Dieline, DielinePanel, Hinge, Project } from "@/lib/types";
import { hingeAngle, hingeEuler, hingeLocal, rootTransform, SCENE_SCALE } from "@/lib/fold";
import { usePanelTextures } from "./usePanelTextures";

export { SCENE_SCALE };
const S = SCENE_SCALE;

function panelGeometry(p: DielinePanel) {
  const shape = new THREE.Shape();
  p.outline.forEach(([x, y], i) => {
    const X = (x - p.width / 2) * S;
    const Y = (p.height / 2 - y) * S;
    if (i === 0) shape.moveTo(X, Y);
    else shape.lineTo(X, Y);
  });
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape);
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / (p.width * S) + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / (p.height * S) + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

interface FoldState {
  fold: number;
  open: number;
}

interface NodeProps {
  panel: DielinePanel;
  dl: Dieline;
  childrenOf: Map<string, Hinge[]>;
  textures: Map<string, THREE.Texture>;
  materials: { inside: THREE.Material; make: (t: THREE.Texture | undefined) => THREE.Material };
  state: React.MutableRefObject<FoldState>;
}

function PanelNode({ panel, dl, childrenOf, textures, materials, state }: NodeProps) {
  const geom = useMemo(() => panelGeometry(panel), [panel]);
  useEffect(() => () => geom.dispose(), [geom]);
  const tex = textures.get(panel.id);
  const front = useMemo(() => materials.make(tex), [materials, tex]);
  useEffect(() => () => front.dispose(), [front]);

  return (
    <>
      <mesh geometry={geom} material={front} castShadow receiveShadow />
      <mesh geometry={geom} material={materials.inside} castShadow />
      {(childrenOf.get(panel.id) ?? []).map((h) => (
        <HingeNode key={h.childId} hinge={h} parent={panel} dl={dl} childrenOf={childrenOf} textures={textures} materials={materials} state={state} />
      ))}
    </>
  );
}

function HingeNode({ hinge, parent, ...rest }: Omit<NodeProps, "panel"> & { hinge: Hinge; parent: DielinePanel }) {
  const child = rest.dl.panels.find((p) => p.id === hinge.childId)!;
  const g = useRef<THREE.Group>(null);
  const { pos: hingePos, offset } = hingeLocal(parent, child, hinge.edge);

  useFrame(() => {
    if (!g.current) return;
    const { fold, open } = rest.state.current;
    g.current.rotation.set(...hingeEuler(hinge.edge, hingeAngle(hinge, fold, open, rest.dl.stages)));
  });

  return (
    <group ref={g} position={[...hingePos]}>
      <group position={[...offset]}>
        <PanelNode panel={child} {...rest} />
      </group>
    </group>
  );
}

export interface PackageModelProps {
  project: Project;
  dl: Dieline;
  /** Drive the fold externally (landing page animation); otherwise eases toward project.preview.fold */
  foldRef?: React.MutableRefObject<number>;
  quality?: number;
}

export function PackageModel({ project, dl, foldRef, quality = 1 }: PackageModelProps) {
  const textures = usePanelTextures(project, dl, quality);
  const mat = MATERIALS[project.material];
  const state = useRef<FoldState>({ fold: project.preview.fold, open: project.preview.open });
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);

  const materials = useMemo(() => {
    const inside = new THREE.MeshStandardMaterial({ color: mat.inside, roughness: 0.95, side: THREE.BackSide });
    const make = (t: THREE.Texture | undefined) =>
      new THREE.MeshPhysicalMaterial({
        map: t ?? null,
        color: t ? "#ffffff" : mat.color,
        roughness: mat.roughness,
        clearcoat: mat.clearcoat,
        clearcoatRoughness: 0.25,
        side: THREE.FrontSide,
      });
    return { inside, make };
  }, [mat]);
  useEffect(() => () => materials.inside.dispose(), [materials]);

  const childrenOf = useMemo(() => {
    const m = new Map<string, Hinge[]>();
    for (const h of dl.hinges) m.set(h.parentId, [...(m.get(h.parentId) ?? []), h]);
    return m;
  }, [dl]);

  const root = dl.panels.find((p) => p.id === dl.rootId)!;

  useFrame((_, delta) => {
    const s = state.current;
    const targetFold = foldRef ? foldRef.current : project.preview.fold;
    if (foldRef) s.fold = targetFold;
    else s.fold += (targetFold - s.fold) * Math.min(1, delta * 6);
    s.open += (project.preview.open - s.open) * Math.min(1, delta * 6);
    if (Math.abs(s.fold - targetFold) < 0.0005) s.fold = targetFold;
    const { tilt, pos } = rootTransform(dl, s.fold);
    inner.current?.rotation.set(tilt, 0, 0);
    outer.current?.position.copy(pos);
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        <PanelNode panel={root} dl={dl} childrenOf={childrenOf} textures={textures} materials={materials} state={state} />
      </group>
    </group>
  );
}
