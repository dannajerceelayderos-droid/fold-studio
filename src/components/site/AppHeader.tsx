"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDrive } from "lucide-react";
import { Logo } from "../ui/Logo";

export function AppHeader() {
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={path === href ? "page" : undefined}
      className={`rounded-md px-2.5 py-1.5 text-[13.5px] font-medium ${path === href ? "text-ink" : "text-ink-2 hover:text-ink"}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
        <Logo href="/" />
        <nav className="flex items-center gap-1" aria-label="App">
          {link("/dashboard", "Projects")}
          {link("/templates", "Templates")}
        </nav>
        <Link href="/signin" className="ml-auto flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] text-ink-2 hover:text-ink" title="Guest mode: projects are stored in this browser">
          <HardDrive size={13} /> Guest · this browser
        </Link>
      </div>
    </header>
  );
}
