"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** The full checksum, selectable, with a copy button that confirms in place. */
export function CopyHash({ value, label = "SHA-256" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-night/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="label-mono text-[10px] text-haze">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-ember transition hover:bg-ember/10"
          aria-label={copied ? "Checksum copied" : "Copy checksum"}
          data-testid="copy-sha"
        >
          <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <code className="mt-1.5 block font-mono text-[12px] leading-relaxed break-all text-[#ece8ff] select-all" data-testid="apk-sha256">
        {value}
      </code>
    </div>
  );
}
