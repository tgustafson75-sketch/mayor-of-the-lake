import type { ReactNode } from "react";
import { hrefFor } from "./routes";

/** Shared frame for the non-map screens: brand header, a way back to the menu, and a readable column. */
export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#14161A] font-sans text-[#E8E6E1]">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#14161A]/95 px-4 py-3 backdrop-blur sm:px-8">
        <a href={hrefFor("menu")} className="rounded-md border border-white/15 px-3 py-1.5 font-display text-xs uppercase tracking-wider hover:bg-white/10">← Main menu</a>
        <div className="ml-auto text-right">
          <p className="font-display text-xl uppercase tracking-wider text-[#F4C430]">{title}</p>
          {subtitle && <p className="text-xs text-stone-400">{subtitle}</p>}
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-8">{children}</section>
    </main>
  );
}
