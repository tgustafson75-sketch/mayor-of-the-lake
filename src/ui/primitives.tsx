// Shared look for the game's screens and panels. One place for colour, spacing and type,
// so every screen matches. Colours come from the brand palette (charcoal, slate, gold, off-white).
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const PANEL = "rounded-xl border border-white/10 bg-[#1b1e24] shadow-lg shadow-black/30";

export function Panel({ children, className = "", label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={`${PANEL} p-5 ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-sm uppercase tracking-[0.2em] text-[#F4C430]">{children}</h2>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  const base = "rounded-md px-4 py-2 font-display text-sm uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const style =
    variant === "primary"
      ? "bg-[#F4C430] text-[#14161A] hover:bg-[#e0b020]"
      : "border border-white/15 text-[#E8E6E1] hover:bg-white/10";
  return <button type="button" {...props} className={`${base} ${style} ${className}`} />;
}

/** A bar that reads the same way for every stat: fuller is better. Labels say what the number is. */
export function Meter({ label, value, tone = "good" }: { label: string; value: number; tone?: "good" | "bad" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill = tone === "bad" ? "bg-[#e0715b]" : "bg-[#F4C430]";
  return (
    <div>
      <div className="flex items-baseline justify-between font-display text-xs uppercase tracking-wider text-stone-300">
        <span>{label}</span>
        <span className="tabular-nums text-[#E8E6E1]">{pct}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className={`h-2 rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
