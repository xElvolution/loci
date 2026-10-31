/** loci visual language, shared with the web app: dusk navy and purple, amber and coral. */
export const colors = {
  night: "#0B0A1F",
  dusk950: "#0F0C29",
  dusk900: "#140F33",
  dusk800: "#1C1546",
  dusk700: "#2A2163",
  dusk600: "#3B2F86",
  haze: "#B9B0E6",
  violet: "#8A6CFF",
  lilac: "#B48CFF",
  ember: "#FFC15E",
  coral: "#FF6B5A",
  mint: "#7CF5D3",
  text: "#ECE8FF",
  soft: "#F4F1FF",
  line: "rgba(255,255,255,0.10)",
  lineStrong: "rgba(255,255,255,0.22)",
  glass: "rgba(28,21,70,0.55)",
} as const;

export const fonts = {
  regular: "Bricolage-Regular",
  medium: "Bricolage-Medium",
  semibold: "Bricolage-SemiBold",
  bold: "Bricolage-Bold",
  serifItalic: "Instrument-Italic",
  mono: "JetBrains-Regular",
} as const;

export const radius = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 } as const;
export const space = (n: number) => n * 4;

/** Brand gradient used on primary buttons and the progress ring. */
export const emberToCoral = [colors.ember, colors.coral] as const;
