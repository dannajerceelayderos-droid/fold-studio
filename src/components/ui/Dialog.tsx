"use client";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { create } from "zustand";
import { Button } from "./controls";

export function Dialog({
  open,
  onClose,
  title,
  children,
  width = 440,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>("[data-autofocus], input, button")?.focus(), 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(32,33,31,0.28)] p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="toast-in flex max-h-[90vh] w-full flex-col rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-pop)]"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="rounded-md p-1 text-ink-2 hover:bg-black/5 hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-[13.5px] leading-relaxed text-ink">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmState {
  opts: { title: string; message: string; confirm: string; danger?: boolean } | null;
  resolve: ((v: boolean) => void) | null;
}
const useConfirm = create<ConfirmState>(() => ({ opts: null, resolve: null }));

export function confirmDialog(opts: NonNullable<ConfirmState["opts"]>): Promise<boolean> {
  return new Promise((resolve) => useConfirm.setState({ opts, resolve }));
}

export function ConfirmHost() {
  const { opts, resolve } = useConfirm();
  const close = (v: boolean) => {
    resolve?.(v);
    useConfirm.setState({ opts: null, resolve: null });
  };
  return (
    <Dialog
      open={!!opts}
      onClose={() => close(false)}
      title={opts?.title ?? ""}
      width={400}
      footer={
        <>
          <Button onClick={() => close(false)}>Cancel</Button>
          <Button data-autofocus variant={opts?.danger ? "danger" : "primary"} onClick={() => close(true)}>
            {opts?.confirm}
          </Button>
        </>
      }
    >
      <p className="text-ink-2">{opts?.message}</p>
    </Dialog>
  );
}
