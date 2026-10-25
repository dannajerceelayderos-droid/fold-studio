import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const metadata = { title: "Privacy — Fold Studio" };

export default function Privacy() {
  return (
    <div className="bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 text-[15px] leading-relaxed text-ink-2 sm:px-8">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-ink">Privacy</h1>
        <p className="mt-6">Fold Studio currently runs entirely in your browser. There are no accounts.</p>
        <h2 className="mt-8 text-[17px] font-semibold text-ink">What is stored</h2>
        <p className="mt-2">
          Your projects and the images you upload are saved in your browser&apos;s own storage (IndexedDB) on your device. They are not sent to Fold Studio or anyone else. Clearing your browser&apos;s site data deletes them, so download project files you want to keep.
        </p>
        <h2 className="mt-8 text-[17px] font-semibold text-ink">Hosting</h2>
        <p className="mt-2">The site is served by a hosting provider that may keep standard request logs, such as IP addresses and pages requested, for security and reliability.</p>
        <h2 className="mt-8 text-[17px] font-semibold text-ink">Changes</h2>
        <p className="mt-2">If accounts or cloud sync are added, this page will be updated before they go live to explain what is collected and why.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
