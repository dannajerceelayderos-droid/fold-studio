import Link from "next/link";
import { HardDrive } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Sign in — Fold Studio" };

export default function SignIn() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-[24px] font-semibold tracking-[-0.025em]">Accounts are on the way</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
          Sign-in and cloud sync aren&apos;t available yet. You can use every editor feature now as a guest.
        </p>
        <div className="mt-6 flex gap-3 rounded-[14px] border border-line bg-surface p-4">
          <HardDrive size={18} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            As a guest, projects are saved in this browser on this device. To keep a copy or switch devices, download the project file from the editor and import it on the dashboard.
          </p>
        </div>
        <Link href="/dashboard" className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-accent text-[14px] font-medium text-white hover:bg-accent-hover">
          Continue as guest
        </Link>
        <Link href="/" className="mt-3 block text-center text-[13px] text-ink-2 hover:text-ink">
          Back to home
        </Link>
      </div>
    </div>
  );
}
