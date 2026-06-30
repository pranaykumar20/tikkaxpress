import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import type { ReactNode } from "react";

type ContentPageShellProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
};

export default function ContentPageShell({ eyebrow, title, lead, children }: ContentPageShellProps) {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {eyebrow && (
          <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h1>
        {lead && <p className="mt-4 text-lg leading-8 text-charcoal/72">{lead}</p>}
        <div className="mt-8 space-y-6 text-base leading-7 text-charcoal/78">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h2 className="text-xl font-black text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-charcoal/75 sm:text-base">{children}</div>
    </section>
  );
}

ContentPageShell.Section = Section;
