"use client";
import { Check, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { PRACTICE_ID, PRACTICE_TASKS, type PracticeFlag } from "@/lib/practice";
import { useEditor } from "@/store/editor";

const FLAG_KEY = "fold-studio:practice-flags";
const OPEN_KEY = "fold-studio:practice-open";

function readFlags(): Set<PracticeFlag> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FLAG_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function resetPracticeFlags() {
  try {
    localStorage.removeItem(FLAG_KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event("foldstudio:practice-reset"));
}

export function addPracticeFlag(f: PracticeFlag) {
  const s = readFlags();
  if (s.has(f)) return;
  s.add(f);
  try {
    localStorage.setItem(FLAG_KEY, JSON.stringify([...s]));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event("foldstudio:practice-flag"));
}

/** Checklist shown only on the practice project; each task ticks itself off from the project state. */
export function PracticeCard({ mobile }: { mobile: boolean }) {
  const project = useEditor((s) => s.project);
  const [flags, setFlags] = useState<Set<PracticeFlag>>(new Set());
  const [open, setOpen] = useState(!mobile);
  const isPractice = project?.id === PRACTICE_ID;
  const fold = project?.preview.fold ?? 1;

  useEffect(() => {
    setFlags(readFlags());
    try {
      const o = localStorage.getItem(OPEN_KEY);
      if (o !== null) setOpen(o === "1" && !mobile);
    } catch {
      /* ignore */
    }
    const on = () => setFlags(readFlags());
    window.addEventListener("foldstudio:practice-flag", on);
    window.addEventListener("foldstudio:practice-reset", on);
    return () => {
      window.removeEventListener("foldstudio:practice-flag", on);
      window.removeEventListener("foldstudio:practice-reset", on);
    };
  }, [mobile]);

  useEffect(() => {
    if (isPractice && fold < 0.6) addPracticeFlag("folded");
  }, [fold, isPractice]);

  if (!project || !isPractice) return null;

  const status = PRACTICE_TASKS.map((t) => t.done(project, flags));
  const doneCount = status.filter(Boolean).length;
  const next = status.indexOf(false);
  const all = next === -1;

  const toggle = () => {
    setOpen((v) => {
      try {
        localStorage.setItem(OPEN_KEY, v ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !v;
    });
  };

  return (
    <div
      className={`absolute z-20 w-[min(300px,calc(100%-16px))] rounded-[14px] border border-line bg-surface/97 shadow-[var(--shadow-pop)] backdrop-blur ${
        mobile ? "left-2 top-14" : "bottom-14 left-3"
      }`}
      role="region"
      aria-label="Practice checklist"
    >
      <button onClick={toggle} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left" aria-expanded={open}>
        <GraduationCap size={17} className="shrink-0 text-accent" />
        <span className="flex-1">
          <span className="block text-[13px] font-semibold">{all ? "Practice complete" : "Practice"}</span>
          <span className="block text-[11.5px] text-ink-2">
            {doneCount} of {PRACTICE_TASKS.length} done
          </span>
        </span>
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.07]" aria-hidden>
          <span className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(doneCount / PRACTICE_TASKS.length) * 100}%` }} />
        </span>
        {open ? <ChevronDown size={15} className="text-ink-3" /> : <ChevronUp size={15} className="text-ink-3" />}
      </button>
      {open && (
        <div className="border-t border-line px-3.5 pb-3 pt-2">
          {all ? (
            <p className="py-1 text-[12.5px] leading-relaxed text-ink-2">
              You&apos;ve used every main tool. Keep playing with this box, or go back to Projects and start a new one from a template.
            </p>
          ) : null}
          <ol className="space-y-1.5">
            {PRACTICE_TASKS.map((t, i) => {
              const done = status[i];
              const current = i === next;
              return (
                <li key={t.id} className="flex gap-2.5">
                  <span
                    className={`mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${
                      done ? "border-accent bg-accent text-white" : current ? "border-accent text-accent" : "border-line-strong text-ink-3"
                    }`}
                  >
                    {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[12.5px] leading-snug ${done ? "text-ink-3 line-through" : current ? "font-medium text-ink" : "text-ink-2"}`}>{t.title}</span>
                    {current && <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-2">{mobile ? (t.hintMobile ?? t.hint) : t.hint}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
