"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

const KIND_ICON: Record<string, string> = { artist: "music", tv_show: "tv", movie: "tv", book: "book", podcast: "podcast", video_game: "play", meal: "meal", outing: "tree" };
const HUES = ["#ffc15e", "#ff6b5a", "#7cf5d3", "#b48cff", "#8fd3ff"];

/** Remote Qloo artwork with a warm generated fallback. */
export function PickArt({ name, image, kind, className = "h-14 w-14" }: { name: string; image: string | null | undefined; kind: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  const hue = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl ${className}`} style={{ background: `linear-gradient(135deg, ${hue}33, #1b1640)`, color: hue }} aria-hidden="true">
      <Icon name={KIND_ICON[kind] ?? "star"} className="h-1/2 w-1/2 opacity-70" />
      {image && !broken && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Qloo images on arbitrary hosts
        <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover" />
      )}
    </span>
  );
}
