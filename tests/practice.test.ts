import { describe, expect, it } from "vitest";
import { makeRect } from "@/lib/objects";
import { PRACTICE_TASKS, practiceProject } from "@/lib/practice";
import { projectSchema } from "@/lib/schema";
import { getDieline } from "@/lib/templates";
import type { TextObject } from "@/lib/types";

const done = (id: string, p = practiceProject(), flags = new Set<never>()) => PRACTICE_TASKS.find((t) => t.id === id)!.done(p, flags);

describe("practice project", () => {
  it("is a valid project with every object on a real panel", () => {
    const p = practiceProject();
    expect(projectSchema.safeParse(p).success).toBe(true);
    const ids = new Set(getDieline(p.templateId, p.dimensions).panels.map((x) => x.id));
    for (const o of p.objects) expect(ids.has(o.panelId)).toBe(true);
  });

  it("starts with no tasks done", () => {
    const p = practiceProject();
    for (const t of PRACTICE_TASKS) expect(t.done(p, new Set()), t.id).toBe(false);
  });

  it("ticks tasks as the design changes", () => {
    const p = practiceProject();
    (p.objects.find((o) => o.name === "Brand name") as TextObject).text = "Mira's";
    (p.objects.find((o) => o.name === "Story") as TextObject).text = "Since 2020.";
    p.panels.front = { background: "#FFFFFF" };
    p.objects.push(makeRect("top", 70, 45));
    p.dimensions.width = 80;
    for (const id of ["brand", "story", "colour", "top", "size"]) expect(done(id, p), id).toBe(true);
    const f = new Set(["folded", "exported"] as const);
    expect(PRACTICE_TASKS.find((t) => t.id === "fold")!.done(p, f as never)).toBe(true);
  });

  it("doesn't count an empty brand name", () => {
    const p = practiceProject();
    (p.objects.find((o) => o.name === "Brand name") as TextObject).text = "  ";
    expect(done("brand", p)).toBe(false);
  });
});
