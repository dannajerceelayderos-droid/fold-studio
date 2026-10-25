import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const metadata = { title: "Terms — Fold Studio" };

export default function Terms() {
  return (
    <div className="bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 text-[15px] leading-relaxed text-ink-2 sm:px-8">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-ink">Terms</h1>
        <p className="mt-6">Fold Studio is offered free of charge, as is, while it is in early development.</p>
        <h2 className="mt-8 text-[17px] font-semibold text-ink">Your work</h2>
        <p className="mt-2">You own the designs you make and the files you upload. Only upload images you have the right to use.</p>
        <h2 className="mt-8 text-[17px] font-semibold text-ink">Production files</h2>
        <p className="mt-2">
          Dielines, previews and exports are visual guides. They are not printer-approved dielines or proofs, and colours and materials are approximations. Confirm every file with your printer before production. Fold Studio is not responsible for print or manufacturing results.
        </p>
        <h2 className="mt-8 text-[17px] font-semibold text-ink">Storage</h2>
        <p className="mt-2">Projects are kept in your browser. Keep your own backups by downloading project files; data in browser storage can be lost.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
