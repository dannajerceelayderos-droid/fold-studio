import Link from "next/link";
import { Logo } from "../ui/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-5 text-[13.5px] text-ink-2 md:flex" aria-label="Main">
          <Link href="/#features" className="hover:text-ink">
            Features
          </Link>
          <Link href="/templates" className="hover:text-ink">
            Templates
          </Link>
          <Link href="/#how" className="hover:text-ink">
            How it works
          </Link>
          <Link href="/#pricing" className="hover:text-ink">
            Pricing
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/signin" className="hidden h-9 items-center rounded-lg px-3 text-[13.5px] font-medium text-ink-2 hover:text-ink sm:inline-flex">
            Sign in
          </Link>
          <Link href="/dashboard" className="inline-flex h-9 items-center rounded-lg bg-ink px-4 text-[13.5px] font-medium text-white hover:bg-black">
            Start designing
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-2">Design flat. See it folded. A packaging studio that runs in your browser.</p>
        </div>
        <nav aria-label="Product" className="space-y-2 text-[13px]">
          <p className="font-semibold">Product</p>
          <Link href="/dashboard" className="block text-ink-2 hover:text-ink">
            Projects
          </Link>
          <Link href="/templates" className="block text-ink-2 hover:text-ink">
            Templates
          </Link>
          <Link href="/#pricing" className="block text-ink-2 hover:text-ink">
            Pricing
          </Link>
          <Link href="/#faq" className="block text-ink-2 hover:text-ink">
            Questions
          </Link>
        </nav>
        <nav aria-label="Legal" className="space-y-2 text-[13px]">
          <p className="font-semibold">Legal</p>
          <Link href="/privacy" className="block text-ink-2 hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="block text-ink-2 hover:text-ink">
            Terms
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-8 text-[12px] text-ink-3 sm:px-8">© {new Date().getFullYear()} Fold Studio</div>
    </footer>
  );
}
