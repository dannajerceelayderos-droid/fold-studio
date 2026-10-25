import Link from "next/link";

/** Mark: a square folding along its diagonal — a flat sheet becoming a box. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5.5 12 2l9 3.5v13L12 22l-9-3.5z" fill="#68775A" />
      <path d="M12 2v20l9-3.5v-13z" fill="#536247" />
      <path d="M3 5.5 12 9l9-3.5" fill="none" stroke="#F7F7F5" strokeWidth="1.2" strokeDasharray="1.6 1.4" />
      <path d="M12 9v13" stroke="#F7F7F5" strokeWidth="1.2" strokeDasharray="1.6 1.4" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-ink">
      <LogoMark />
      Fold Studio
    </Link>
  );
}
