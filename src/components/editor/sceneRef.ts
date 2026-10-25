import type { SceneApi } from "../package3d/PackageScene";

/** The editor's live 3D scene, used for PNG exports and dashboard thumbnails. */
export const editorScene: { current: SceneApi | null } = { current: null };
