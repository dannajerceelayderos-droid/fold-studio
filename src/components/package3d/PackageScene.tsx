"use client";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import { BACKGROUNDS, LIGHTING } from "@/lib/materials";
import type { Dieline, Project } from "@/lib/types";
import { PackageModel, SCENE_SCALE } from "./PackageModel";

export type ViewPreset = "front" | "three-quarter" | "side" | "back" | "top";

export interface SceneApi {
  capture: (o: { scale: number; transparent: boolean; view?: ViewPreset }) => Promise<string>;
  setView: (v: ViewPreset) => void;
  zoom: (factor: number) => void;
  reset: () => void;
}

const FOV = 30;

function viewVector(v: ViewPreset): THREE.Vector3 {
  switch (v) {
    case "front":
      return new THREE.Vector3(0, 0.12, 1).normalize();
    case "side":
      return new THREE.Vector3(1, 0.12, 0).normalize();
    case "back":
      return new THREE.Vector3(0, 0.12, -1).normalize();
    case "top":
      return new THREE.Vector3(0, 1, 0.35).normalize();
    default:
      return new THREE.Vector3(0.72, 0.42, 0.95).normalize();
  }
}

function useFrameDistance(project: Project, dl: Dieline, animated: boolean) {
  const { width: W, height: H, depth: D } = project.dimensions;
  const fold = animated ? 0.45 : project.preview.fold;
  const folded = Math.sqrt(W * W + H * H + D * D) * SCENE_SCALE;
  const flat = Math.max(dl.width, dl.height) * SCENE_SCALE * 1.05;
  const size = folded + (flat - folded) * (1 - fold);
  return (size / (2 * Math.tan((FOV * Math.PI) / 360))) * 1.15;
}

const Inner = forwardRef<SceneApi, { project: Project; dl: Dieline; interactive: boolean; foldRef?: React.MutableRefObject<number>; quality: number; initialView: ViewPreset }>(
  function Inner({ project, dl, interactive, foldRef, quality, initialView }, ref) {
    const { gl, scene, camera } = useThree();
    const controls = useRef<OrbitImpl>(null);
    const dist = useFrameDistance(project, dl, !!foldRef);
    const distRef = useRef(dist);
    const lastView = useRef<ViewPreset>(initialView);
    const bg = BACKGROUNDS[project.preview.background];
    const light = LIGHTING[project.preview.lighting];

    const place = (v: ViewPreset, d = distRef.current) => {
      camera.position.copy(viewVector(v).multiplyScalar(d));
      camera.lookAt(0, 0, 0);
      controls.current?.target.set(0, 0, 0);
      controls.current?.update();
    };

    useEffect(() => {
      // re-frame when the package size changes noticeably
      const prev = distRef.current;
      distRef.current = dist;
      if (Math.abs(prev - dist) / dist > 0.08 || camera.position.length() < 0.01) {
        const dir = camera.position.length() > 0.01 ? camera.position.clone().normalize() : viewVector(lastView.current);
        camera.position.copy(dir.multiplyScalar(dist));
        controls.current?.update();
      }
    }, [dist, camera]);

    useEffect(() => {
      place(initialView, dist);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      setView: (v) => {
        lastView.current = v;
        place(v);
      },
      reset: () => place(lastView.current = "three-quarter"),
      zoom: (f) => {
        const len = camera.position.length();
        const next = Math.min(distRef.current * 3, Math.max(distRef.current * 0.3, len / f));
        camera.position.setLength(next);
        controls.current?.update();
      },
      capture: async ({ scale, transparent, view }) => {
        const savedPos = camera.position.clone();
        const savedBg = scene.background;
        const savedRatio = gl.getPixelRatio();
        const savedClear = new THREE.Color();
        gl.getClearColor(savedClear);
        const savedAlpha = gl.getClearAlpha();
        try {
          if (view) {
            camera.position.copy(viewVector(view).multiplyScalar(distRef.current));
            camera.lookAt(0, 0, 0);
          }
          if (transparent) {
            scene.background = null;
            gl.setClearColor(0x000000, 0);
          }
          gl.setPixelRatio(Math.min(4, savedRatio * scale));
          gl.render(scene, camera);
          return gl.domElement.toDataURL("image/png");
        } finally {
          gl.setPixelRatio(savedRatio);
          scene.background = savedBg;
          gl.setClearColor(savedClear, savedAlpha);
          camera.position.copy(savedPos);
          camera.lookAt(controls.current?.target ?? new THREE.Vector3());
          gl.render(scene, camera);
        }
      },
    }));

    const W = project.dimensions.width * SCENE_SCALE;
    const Hh = project.dimensions.height * SCENE_SCALE;
    const D = project.dimensions.depth * SCENE_SCALE;
    const fold = project.preview.fold;
    const floorY = -((dl.height * SCENE_SCALE) / 2) * (1 - fold) - (Hh / 2) * fold - 0.004;
    const shadowSize = Math.max(W, D, Hh) * 3 + (1 - fold) * Math.max(dl.width, dl.height) * SCENE_SCALE;

    return (
      <>
        {bg.color && <color attach="background" args={[bg.color]} />}
        <ambientLight intensity={light.ambient} />
        <directionalLight position={[2.5, 4, 3]} intensity={light.key} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 1.5, -2]} intensity={light.fill} />
        <Environment resolution={128} environmentIntensity={light.env}>
          <Lightformer intensity={2} position={[0, 4, 3]} scale={[6, 3, 1]} />
          <Lightformer intensity={1} position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
          <Lightformer intensity={0.6} position={[4, 1, -1]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
        </Environment>
        <PackageModel project={project} dl={dl} foldRef={foldRef} quality={quality} />
        {project.preview.shadow > 0 && (
          <ContactShadows
            position={[0, floorY, 0]}
            opacity={project.preview.shadow * (bg.color === BACKGROUNDS.dark.color ? 0.9 : 0.55)}
            scale={shadowSize}
            blur={2.4}
            far={Math.max(Hh, 0.5) * 1.2}
            resolution={512}
            frames={fold < 1 || foldRef ? Infinity : 40}
          />
        )}
        <OrbitControls
          ref={controls as never}
          makeDefault
          enabled={interactive}
          enableDamping
          enablePan={false}
          autoRotate={project.preview.autoRotate}
          autoRotateSpeed={1.2}
          minDistance={dist * 0.3}
          maxDistance={dist * 3}
        />
      </>
    );
  },
);

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export interface PackageSceneProps {
  project: Project;
  dl: Dieline;
  interactive?: boolean;
  foldRef?: React.MutableRefObject<number>;
  className?: string;
  quality?: number;
  initialView?: ViewPreset;
  label?: string;
  /** Receives the scene API (works through next/dynamic, which doesn't forward refs) */
  onApi?: (api: SceneApi | null) => void;
}

export const PackageScene = forwardRef<SceneApi, PackageSceneProps>(function PackageScene(
  { project, dl, interactive = true, foldRef, className, quality = 1, initialView = "three-quarter", label, onApi },
  ref,
) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(hasWebGL()), []);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  if (ok === false)
    return (
      <div className={`grid place-items-center text-center text-sm text-[var(--text-2)] ${className ?? ""}`}>
        <p className="max-w-xs px-6">
          3D preview needs WebGL, which this browser or device has turned off. You can keep designing in 2D, and exports of the flat dieline still work.
        </p>
      </div>
    );
  if (ok === null) return <div className={className} />;
  return (
    <div className={className} role="img" aria-label={label ?? `3D preview of ${project.name}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        camera={{ fov: FOV, near: 0.01, far: 100, position: [2, 1.5, 3] }}
        frameloop={reduced && !interactive ? "demand" : "always"}
      >
        <Inner ref={onApi ?? ref} project={project} dl={dl} interactive={interactive} foldRef={foldRef} quality={quality} initialView={initialView} />
      </Canvas>
    </div>
  );
});
