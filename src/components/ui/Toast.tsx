"use client";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { create } from "zustand";

type Kind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

const useToasts = create<{ items: ToastItem[]; push: (k: Kind, m: string) => void; dismiss: (id: number) => void }>((set, get) => ({
  items: [],
  push: (kind, message) => {
    const id = Date.now() + Math.random();
    set({ items: [...get().items.slice(-3), { id, kind, message }] });
    setTimeout(() => get().dismiss(id), kind === "error" ? 7000 : 3500);
  },
  dismiss: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (m: string) => useToasts.getState().push("success", m),
  error: (m: string) => useToasts.getState().push("error", m),
  info: (m: string) => useToasts.getState().push("info", m),
};

export function Toaster() {
  const { items, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
      {items.map((t) => {
        const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? AlertCircle : Info;
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="toast-in pointer-events-auto flex max-w-md items-start gap-2.5 rounded-[10px] bg-ink px-3.5 py-2.5 text-[13px] text-white shadow-[var(--shadow-pop)]"
          >
            <Icon size={16} className={`mt-px shrink-0 ${t.kind === "error" ? "text-[#f0a49d]" : t.kind === "success" ? "text-[#b9c9a9]" : "text-white/70"}`} />
            <span className="leading-snug">{t.message}</span>
            <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="ml-1 shrink-0 text-white/50 hover:text-white">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
