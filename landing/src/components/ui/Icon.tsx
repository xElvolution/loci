/** Small line icon set (24px grid, 1.8 stroke) so the app has no icon dependency. */
const PATHS: Record<string, string> = {
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  chat: "M4 5h16v11H9l-5 4z",
  key: "M15 9a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM12 12v9m0-4h3m-3 2h2",
  send: "M3 11.5 21 3l-8.5 18-2-7.5z",
  home: "M3 11.5 12 4l9 7.5M5.5 10v9.5h5v-5h3v5h5V10",
  deck: "M4 7h13v13H4zM7 4h13v13",
  review: "M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
  stats: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  team: "M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5m1.5-6.2c2.8-.3 5.2 1.5 6 4.7",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  plus: "M12 5v14M5 12h14",
  flame: "M12 22c4 0 7-2.8 7-6.8 0-3.6-2.4-5.6-4-8.2-.6 2-1.6 3-3 3.6.2-3-1-5.8-3.6-8.6C8.6 6 5 8.6 5 15.2 5 19.2 8 22 12 22z",
  snow: "M12 2v20M4.9 6.5l14.2 11M4.9 17.5l14.2-11M9 4l3 2 3-2M9 20l3-2 3 2",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13",
  pin: "M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21zm0-8.7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  play: "M7 4.5v15l12-7.5z",
  pause: "M7 4h3.5v16H7zM13.5 4H17v16h-3.5z",
  arrowR: "M5 12h14m-6-6 6 6-6 6",
  arrowL: "M19 12H5m6-6-6 6 6 6",
  check: "M4.5 12.5 9.5 17.5 19.5 6.5",
  x: "M6 6l12 12M18 6 6 18",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3-4.5-4.5",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  copy: "M8 8h12v12H8zM4 16V4h12",
  trash: "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  trend: "M3 17l6-6 4 4 8-8m0 0h-5m5 0v5",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-11v6m0-9.5v.5",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  download: "M12 3v12m-5-5 5 5 5-5M4 19h16",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  pill: "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l7 7",
  care: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM9.5 11h5M12 8.5v5",
  walk: "M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM10 21l2-6 3 3v3M8 12l2-5 4 1 2 4M10 7l-3 2",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  phone: "M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.5-4 3.4-6.5 7-6.5s6.5 2.5 7 6.5M16 3.5a4 4 0 0 1 0 7.5M18.5 14.5c1.9.9 3.2 3 3.5 6.5",
  music: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  tv: "M3 7h18v12H3zM8 3l4 4 4-4",
  book: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5V4.5",
  meal: "M6 3v8a2 2 0 0 0 4 0V3M8 11v10M16 3c-1.7 1.3-2.5 3.5-2.5 6.5H18V21M18 9.5V3",
  tree: "M12 22v-6M12 2 6 10h3l-4 6h14l-4-6h3z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  menu: "M4 7h16M4 12h16M4 17h16",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  star: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h2M18 9v6a4 4 0 0 1-4 4h-2",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  alert: "M12 3 2 20h20zM12 10v4m0 3v.5",
  building: "M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h2m4 0h2M8 12h2m4 0h2",
  podcast: "M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 15v6M8.5 16a6 6 0 1 1 7 0M6 19a9 9 0 1 1 12 0",
  shuffle: "M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5", title }: { name: keyof typeof PATHS | string; className?: string; title?: string }) {
  const d = PATHS[name];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}
