import { beforeEach, describe, expect, it } from "vitest";
import { makeText } from "@/lib/objects";
import { newProject, refitObjects } from "@/lib/project";
import { sampleProject } from "@/lib/sample";
import { exportFileSchema, projectSchema } from "@/lib/schema";
import { getDieline } from "@/lib/templates";
import { useEditor } from "@/store/editor";

describe("project schema", () => {
  it("accepts the sample and new projects", () => {
    expect(projectSchema.safeParse(sampleProject()).success).toBe(true);
    expect(projectSchema.safeParse(newProject("mailer")).success).toBe(true);
  });

  it("round-trips through JSON", () => {
    const p = sampleProject();
    const file = { format: "fold-studio-project", version: 1, exportedAt: new Date().toISOString(), project: p, assets: {} };
    const back = exportFileSchema.parse(JSON.parse(JSON.stringify(file)));
    expect(back.project).toEqual(p);
  });

  it("rejects invalid files", () => {
    const p = sampleProject();
    expect(exportFileSchema.safeParse({ format: "other" }).success).toBe(false);
    expect(projectSchema.safeParse({ ...p, templateId: "pyramid" }).success).toBe(false);
    expect(projectSchema.safeParse({ ...p, panels: { front: { background: "red" } } }).success).toBe(false);
    const bad = { ...p, objects: [{ ...p.objects[0], type: "path", d: "M0 0 <script>", vbWidth: 1, vbHeight: 1, fill: null, stroke: null, strokeWidth: 0 }] };
    expect(projectSchema.safeParse(bad).success).toBe(false);
    const badAsset = { format: "fold-studio-project", version: 1, exportedAt: "x", project: p, assets: { a: "data:text/html;base64,PGgxPg==" } };
    expect(exportFileSchema.safeParse(badAsset).success).toBe(false);
  });

  it("every sample object sits on a real panel", () => {
    const p = sampleProject();
    const ids = new Set(getDieline(p.templateId, p.dimensions).panels.map((x) => x.id));
    for (const o of p.objects) expect(ids.has(o.panelId)).toBe(true);
  });
});

describe("refitting artwork", () => {
  it("keeps relative position when dimensions change", () => {
    const t = makeText("front", 50, 120, { x: 20, y: 50, width: 10, height: 20 });
    const [o] = refitObjects([t], "carton", { width: 50, height: 120, depth: 40 }, "carton", { width: 100, height: 240, depth: 40 });
    expect(o.x + o.width / 2).toBeCloseTo(50);
    expect(o.y + o.height / 2).toBeCloseTo(120);
  });

  it("maps faces across templates", () => {
    const t = makeText("top", 50, 40);
    const [o] = refitObjects([t], "carton", { width: 50, height: 120, depth: 40 }, "mailer", { width: 220, height: 80, depth: 160 });
    expect(o.panelId).toBe("top");
    const g = makeText("glue", 15, 120);
    const [o2] = refitObjects([g], "carton", { width: 50, height: 120, depth: 40 }, "mailer", { width: 220, height: 80, depth: 160 });
    expect(o2.panelId).toBe("front");
  });
});

describe("editor history", () => {
  beforeEach(() => useEditor.getState().load(newProject("carton")));

  it("undoes and redoes an added object", () => {
    const s = useEditor.getState();
    s.addObject(makeText("front", 50, 120));
    expect(useEditor.getState().project!.objects).toHaveLength(1);
    useEditor.getState().undo();
    expect(useEditor.getState().project!.objects).toHaveLength(0);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.objects).toHaveLength(1);
  });

  it("records a whole drag as one step", () => {
    const o = makeText("front", 50, 120);
    useEditor.getState().addObject(o);
    const before = useEditor.getState().past.length;
    const s = useEditor.getState();
    s.beginTransient();
    for (let i = 0; i < 30; i++) useEditor.getState().updateTransient((d) => void (d.objects[0].x = i));
    useEditor.getState().endTransient();
    expect(useEditor.getState().past.length).toBe(before + 1);
    expect(useEditor.getState().project!.objects[0].x).toBe(29);
    useEditor.getState().undo();
    expect(useEditor.getState().project!.objects[0].x).toBe(o.x);
  });

  it("coalesces rapid typing into one step", () => {
    const o = makeText("front", 50, 120);
    useEditor.getState().addObject(o);
    const before = useEditor.getState().past.length;
    for (const t of ["H", "He", "Hel", "Hell", "Hello"]) useEditor.getState().updateObject(o.id, { text: t }, "text");
    expect(useEditor.getState().past.length).toBe(before + 1);
  });

  it("refits artwork and undoes dimension changes", () => {
    useEditor.getState().setDimensions({ width: 80, height: 120, depth: 40 });
    expect(useEditor.getState().project!.dimensions.width).toBe(80);
    useEditor.getState().setDimensions({ width: 9999, height: 120, depth: 40 }, "other");
    expect(useEditor.getState().project!.dimensions.width).toBe(400);
    useEditor.getState().undo();
    useEditor.getState().undo();
    expect(useEditor.getState().project!.dimensions.width).toBe(50);
  });

  it("does not delete locked objects", () => {
    const o = { ...makeText("front", 50, 120), locked: true };
    useEditor.getState().addObject(o);
    useEditor.getState().deleteSelection();
    expect(useEditor.getState().project!.objects).toHaveLength(1);
  });

  it("bounds the history stack", () => {
    for (let i = 0; i < 150; i++) useEditor.getState().commit((d) => void (d.name = `n${i}`));
    expect(useEditor.getState().past.length).toBeLessThanOrEqual(100);
  });
});
