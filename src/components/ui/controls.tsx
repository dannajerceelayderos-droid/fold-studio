"use client";
import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover border border-transparent",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-[#fbfbfa]",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-black/[0.04]",
  danger: "bg-danger text-white hover:brightness-95 border border-transparent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }>(
  function Button({ variant = "secondary", size = "md", className = "", ...rest }, ref) {
    const sz = size === "sm" ? "h-7 px-2.5 text-[12.5px] gap-1.5" : size === "lg" ? "h-11 px-5 text-[15px] gap-2" : "h-9 px-3.5 text-[13.5px] gap-2";
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-[var(--radius)] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${sz} ${variants[variant]} ${className}`}
        {...rest}
      />
    );
  },
);

export function Tooltip({ label, shortcut, children, side = "bottom" }: { label: string; shortcut?: string; children: ReactNode; side?: "bottom" | "top" | "right" }) {
  const pos =
    side === "bottom" ? "top-full mt-1.5 left-1/2 -translate-x-1/2" : side === "top" ? "bottom-full mb-1.5 left-1/2 -translate-x-1/2" : "left-full ml-2 top-1/2 -translate-y-1/2";
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11.5px] font-medium text-white opacity-0 shadow-[var(--shadow-pop)] transition-opacity delay-0 group-hover/tt:opacity-100 group-hover/tt:delay-300 group-focus-within/tt:opacity-100 ${pos}`}
      >
        {label}
        {shortcut && <span className="ml-2 text-white/55">{shortcut}</span>}
      </span>
    </span>
  );
}

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; shortcut?: string; active?: boolean; side?: "bottom" | "top" | "right" }
>(function IconButton({ label, shortcut, active, side, className = "", children, ...rest }, ref) {
  return (
    <Tooltip label={label} shortcut={shortcut} side={side}>
      <button
        ref={ref}
        aria-label={label}
        aria-pressed={active}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
          active ? "bg-accent-soft text-accent-hover" : "hover:bg-black/[0.05]"
        } ${className}`}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  );
});

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[8px] bg-black/[0.045] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] font-medium transition-colors ${
            value === o.value ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-3">{hint}</span>}
    </label>
  );
}

/** Number input that only commits valid numbers, on change of a valid value and on blur. */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  ariaLabel,
  precision = 2,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  ariaLabel: string;
  precision?: number;
  disabled?: boolean;
}) {
  const fmt = (v: number) => String(Math.round(v * 10 ** precision) / 10 ** precision);
  const [text, setText] = useState(fmt(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const invalid = (() => {
    const v = parseFloat(text);
    return Number.isNaN(v) || (min !== undefined && v < min) || (max !== undefined && v > max);
  })();
  const commit = (t: string) => {
    const v = parseFloat(t);
    if (Number.isNaN(v)) return;
    const c = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
    onChange(c);
  };
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        aria-label={ariaLabel}
        aria-invalid={invalid}
        disabled={disabled}
        className={`field tabular-nums ${suffix ? "pr-7" : ""} ${invalid ? "!border-danger" : ""}`}
        value={text}
        step={step}
        min={min}
        max={max}
        onFocus={() => (focused.current = true)}
        onChange={(e) => {
          setText(e.target.value);
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v) && (min === undefined || v >= min) && (max === undefined || v <= max)) onChange(v);
        }}
        onBlur={() => {
          focused.current = false;
          commit(text);
          setText(fmt(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parseFloat(text) || value))));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-3">{suffix}</span>}
    </div>
  );
}

export function ColorInput({
  value,
  onChange,
  ariaLabel,
  swatches = [],
  allowNone,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  ariaLabel: string;
  swatches?: string[];
  allowNone?: boolean;
}) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => setText(value ?? ""), [value]);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label
          className="relative h-[30px] w-[30px] shrink-0 cursor-pointer overflow-hidden rounded-md border border-line"
          style={{ background: value ?? "repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 50% / 8px 8px" }}
        >
          <input
            type="color"
            aria-label={ariaLabel}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={value ?? "#ffffff"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
          />
        </label>
        <input
          className="field font-mono uppercase"
          aria-label={`${ariaLabel} hex`}
          value={text}
          placeholder={allowNone ? "None" : "#000000"}
          onChange={(e) => {
            setText(e.target.value);
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toUpperCase());
            if (allowNone && v === "") onChange(null);
          }}
          onBlur={() => setText(value ?? "")}
        />
      </div>
      {(swatches.length > 0 || allowNone) && (
        <div className="flex flex-wrap gap-1">
          {allowNone && (
            <button
              title="None"
              aria-label="No colour"
              onClick={() => onChange(null)}
              className={`h-5 w-5 rounded-full border border-line bg-[linear-gradient(135deg,transparent_45%,#b5483f_45%,#b5483f_55%,transparent_55%)] ${value === null ? "ring-2 ring-accent ring-offset-1" : ""}`}
            />
          )}
          {Array.from(new Set(swatches)).map((s) => (
            <button
              key={s}
              title={s}
              aria-label={`Use ${s}`}
              onClick={() => onChange(s)}
              className={`h-5 w-5 rounded-full border border-black/10 ${value?.toUpperCase() === s.toUpperCase() ? "ring-2 ring-accent ring-offset-1" : ""}`}
              style={{ background: s }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Slider({ value, onChange, min, max, step, ariaLabel }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number; ariaLabel: string }) {
  return (
    <input
      type="range"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="h-1 w-full cursor-pointer accent-[var(--accent)]"
    />
  );
}
