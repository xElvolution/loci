import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost" | "paper" | "danger" | "outline";
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-ember to-coral text-night font-semibold shadow-[0_10px_30px_-10px_rgba(255,107,90,0.7)] hover:brightness-110 active:brightness-95",
  ghost: "text-[#ece8ff] hover:bg-white/8",
  outline: "border border-haze/30 text-[#ece8ff] hover:border-ember/70 hover:text-ember",
  paper: "bg-ink text-paper hover:bg-dusk-800",
  danger: "border border-coral/50 text-coral hover:bg-coral/10",
};
const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-[15px] transition-[filter,background-color,color,border-color,transform] duration-200 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function LinkButton({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[#ece8ff]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-coral" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-haze/80">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "h-12 w-full rounded-xl border border-haze/20 bg-night/60 px-4 text-[15px] text-[#f4f1ff] placeholder:text-haze/50 outline-none transition focus:border-ember/80 focus:bg-night/80";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Chip({ children, tone = "haze", className = "", title }: { children: ReactNode; tone?: "haze" | "ember" | "mint" | "coral" | "ink"; className?: string; title?: string }) {
  const tones = {
    haze: "border-haze/25 text-haze bg-white/5",
    ember: "border-ember/40 text-ember bg-ember/10",
    mint: "border-mint/40 text-mint bg-mint/10",
    coral: "border-coral/40 text-coral bg-coral/10",
    ink: "border-ink/20 text-ink bg-ink/5",
  } as const;
  return (
    <span title={title} className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "", ...rest }: ComponentProps<"div">) {
  return (
    <div className={`glass rounded-3xl ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action, art }: { title: string; body: string; action?: ReactNode; art?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-haze/25 px-6 py-12 text-center">
      {art}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-haze text-pretty">{body}</p>
      {action}
    </div>
  );
}

export function PageTitle({ eyebrow, title, accent, children }: { eyebrow?: string; title: string; accent?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="label-mono mb-2 text-ember">{eyebrow}</p>}
        <h1 className="text-[34px] leading-[1.05] font-bold tracking-tight text-balance md:text-5xl">
          {title} {accent && <span className="font-serif-i font-normal text-ember">{accent}</span>}
        </h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="label-mono text-haze">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-haze/80">{sub}</div>}
    </div>
  );
}
