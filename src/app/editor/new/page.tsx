"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { newProject } from "@/lib/project";
import { localRepo } from "@/lib/storage/db";
import type { TemplateId } from "@/lib/types";

function Create() {
  const router = useRouter();
  const params = useSearchParams();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const t = (params.get("template") === "mailer" ? "mailer" : "carton") as TemplateId;
    const p = newProject(t);
    localRepo
      .save(p, null)
      .then(() => router.replace(`/editor/${p.id}`))
      .catch(() => router.replace("/dashboard?error=storage"));
  }, [params, router]);
  return <div className="grid h-dvh place-items-center text-[13px] text-ink-3">Creating your project…</div>;
}

export default function NewProjectPage() {
  return (
    <Suspense>
      <Create />
    </Suspense>
  );
}
