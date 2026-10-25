import { Box, Download, HardDrive, Layers, Palette, Ruler, Undo2 } from "lucide-react";
import Link from "next/link";
import { ExampleGallery, HeroStage, LiveDemo } from "@/components/site/Landing";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { TemplateThumb } from "@/components/TemplateThumb";
import { COMING_SOON, TEMPLATE_LIST } from "@/lib/templates";

const FEATURES = [
  { icon: Box, title: "A live 3D package", body: "Every panel you design is folded onto real geometry as you work. Turn it, open the lid, or scrub the fold to check how panels meet." },
  { icon: Ruler, title: "Real dielines, your sizes", body: "Set width, height and depth in millimetres or inches. Panels, flaps and fold lines recalculate, and your artwork keeps its place." },
  { icon: Layers, title: "Text, images and shapes", body: "Place type, logos, photos and vector shapes on any panel. Move, resize, rotate, lock and reorder them in layers." },
  { icon: Palette, title: "A brand kit per project", body: "Keep your colours, fonts and logo in one place, and apply them to the panels you choose." },
  { icon: Download, title: "Mockups and flat artwork", body: "Download high-resolution PNG mockups, a 1:1 SVG of the dieline with artwork, or the whole project as a file." },
  { icon: HardDrive, title: "Works without an account", body: "Projects save automatically in your browser, so you can start right away. Nothing is uploaded." },
];

const PLANS = [
  {
    name: "Free",
    status: "Available now",
    items: ["Folding carton and mailer box templates", "Live 3D preview and all materials", "PNG, SVG and project file exports", "Projects stored in your browser"],
    cta: true,
  },
  {
    name: "Studio",
    status: "Planned",
    items: ["Projects synced to your account", "More templates as they're released", "Higher-resolution mockup exports", "Brand kits shared across projects"],
  },
  {
    name: "Team",
    status: "Planned",
    items: ["Shared projects and brand assets", "Review links for clients", "Comments and approvals"],
  },
];

const FAQ = [
  {
    q: "Can I send the exported SVG straight to a printer?",
    a: "Treat it as a starting point. The SVG is drawn at 1:1 in millimetres with cut and fold lines, but Fold Studio doesn't yet add bleed, convert to CMYK, outline fonts or account for board thickness. Ask your printer for their approved dieline and place your artwork on it.",
  },
  {
    q: "Where are my projects stored?",
    a: "In your browser's storage on this device. Download a project file from the editor or dashboard to back it up or open it on another computer.",
  },
  {
    q: "Do I need to know 3D or CAD software?",
    a: "No. You design on the flat panels like any layout tool; the folding happens for you.",
  },
  {
    q: "Which box styles are supported?",
    a: "A reverse tuck-end folding carton and a one-piece mailer box with a hinged lid, both in custom sizes. Sleeves, labels and inserts are on the way.",
  },
  {
    q: "How accurate is the material preview?",
    a: "It's a visual approximation of each board to help you judge colour and contrast. It isn't a print proof or a material specification.",
  },
];

export default function Home() {
  return (
    <div className="bg-bg">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-6 px-5 pb-10 pt-10 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:pt-16">
          <div className="max-w-xl">
            <h1 className="text-[clamp(44px,7vw,84px)] font-semibold leading-[0.95] tracking-[-0.045em]">
              Your packaging,
              <br />
              unfolded.
            </h1>
            <p className="mt-6 max-w-md text-[18px] leading-[1.55] text-ink-2">
              Design beautiful packaging in 2D. See it come to life in 3D. Get your ideas ready for production.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex h-11 items-center rounded-[10px] bg-accent px-5 text-[15px] font-medium text-white hover:bg-accent-hover">
                Start designing
              </Link>
              <Link href="/templates" className="inline-flex h-11 items-center rounded-[10px] border border-line-strong bg-surface px-5 text-[15px] font-medium hover:border-ink-3">
                Explore templates
              </Link>
            </div>
            <p className="mt-5 text-[13px] text-ink-3">Free, in your browser, no account needed.</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroStage />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8" aria-labelledby="demo-h">
          <div className="mb-8 max-w-2xl">
            <h2 id="demo-h" className="text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">
              Change the flat. The box follows.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
              The 2D dieline and the 3D package come from one design, so every edit shows up on the right face, the right way up.
            </p>
          </div>
          <LiveDemo />
        </section>

        <section id="templates" className="mx-auto max-w-6xl px-5 py-20 sm:px-8" aria-labelledby="tpl-h">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="tpl-h" className="text-[clamp(28px,3.6vw,40px)] font-semibold tracking-[-0.03em]">
              Templates
            </h2>
            <Link href="/templates" className="text-[14px] font-medium text-accent hover:text-accent-hover">
              Browse templates
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {TEMPLATE_LIST.map((t) => (
              <Link key={t.id} href={`/editor/new?template=${t.id}`} className="group rounded-[20px] border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                <TemplateThumb templateId={t.id} className="h-64 w-full" />
                <div className="mt-4 flex items-start justify-between gap-4 px-1">
                  <div>
                    <h3 className="text-[16px] font-semibold">{t.name}</h3>
                    <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-ink-2">{t.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-[12.5px] font-medium text-accent-hover group-hover:bg-accent group-hover:text-white">Use template</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-[13.5px] text-ink-2">
            Coming later: {COMING_SOON.map((c) => c.name.toLowerCase()).join(", ")}.
          </p>
        </section>

        <section id="features" className="border-y border-line bg-surface" aria-labelledby="feat-h">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <h2 id="feat-h" className="max-w-xl text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">
              Everything between the idea and the dieline
            </h2>
            <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <dt className="flex items-center gap-2.5 text-[15px] font-semibold">
                    <f.icon size={18} strokeWidth={1.75} className="text-accent" />
                    {f.title}
                  </dt>
                  <dd className="mt-2 text-[14px] leading-relaxed text-ink-2">{f.body}</dd>
                </div>
              ))}
              <div>
                <dt className="flex items-center gap-2.5 text-[15px] font-semibold">
                  <Undo2 size={18} strokeWidth={1.75} className="text-accent" />
                  Undo anything
                </dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-ink-2">Step back through moves, edits, colour and size changes with the keyboard shortcuts you already know.</dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-20 sm:px-8" aria-labelledby="how-h">
          <h2 id="how-h" className="text-[clamp(28px,3.6vw,40px)] font-semibold tracking-[-0.03em]">
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { t: "Pick a box and size it", b: "Start from a carton or mailer and enter the dimensions of your product's packaging." },
              { t: "Design on the flat", b: "Add your brand colours, copy, logo and images to each panel of the dieline." },
              { t: "Check it folded, then export", b: "Inspect every side in 3D, then download mockups and the flat artwork for your printer conversations." },
            ].map((s, i) => (
              <li key={s.t} className="border-t border-ink pt-5">
                <span className="text-[14px] font-semibold tabular-nums text-accent">{i + 1}</span>
                <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.015em]">{s.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{s.b}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8" aria-labelledby="ex-h">
          <h2 id="ex-h" className="text-[clamp(28px,3.6vw,40px)] font-semibold tracking-[-0.03em]">
            Example projects
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2">Fictional brands made in Fold Studio. Open any of them to see how the panels are put together.</p>
          <div className="mt-10">
            <ExampleGallery />
          </div>
        </section>

        <section id="pricing" className="border-y border-line bg-surface" aria-labelledby="price-h">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <h2 id="price-h" className="text-[clamp(28px,3.6vw,40px)] font-semibold tracking-[-0.03em]">
              Pricing
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2">
              Fold Studio is free while it grows. Studio and Team are proposed plans: they aren&apos;t on sale and their features aren&apos;t built yet.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PLANS.map((p) => (
                <div key={p.name} className={`flex flex-col rounded-[18px] border p-6 ${p.cta ? "border-accent" : "border-line"}`}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[18px] font-semibold">{p.name}</h3>
                    <span className={`text-[12.5px] font-medium ${p.cta ? "text-accent" : "text-ink-3"}`}>{p.status}</span>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5 text-[14px] text-ink-2">
                    {p.items.map((i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                        {i}
                      </li>
                    ))}
                  </ul>
                  {p.cta ? (
                    <Link href="/dashboard" className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] bg-accent text-[14px] font-medium text-white hover:bg-accent-hover">
                      Start designing
                    </Link>
                  ) : (
                    <p className="mt-6 text-[12.5px] text-ink-3">Not available yet</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-5 py-20 sm:px-8" aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-[clamp(28px,3.6vw,40px)] font-semibold tracking-[-0.03em]">
            Questions
          </h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-[20px] leading-none text-ink-3 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[22px] bg-ink px-8 py-12 text-white md:flex-row md:items-center">
            <h2 className="text-[clamp(26px,3.2vw,36px)] font-semibold leading-tight tracking-[-0.03em]">Design flat. See it folded.</h2>
            <Link href="/dashboard" className="inline-flex h-11 items-center rounded-[10px] bg-white px-5 text-[15px] font-medium text-ink hover:bg-[#eceae4]">
              Start designing
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
