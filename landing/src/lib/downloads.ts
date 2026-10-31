/** Where loci can be used today. Only mark a platform available when it really ships. */
export const ANDROID_RELEASE = {
  version: "1.0.0",
  tag: "mobile-v1.0.0",
  file: "loci-mobile-1.0.0.apk",
  url: "https://github.com/xElvolution/loci/releases/download/mobile-v1.0.0/loci-mobile-1.0.0.apk",
  releasePage: "https://github.com/xElvolution/loci/releases/tag/mobile-v1.0.0",
  sha256: "810bf3e2abcaae82f3ae2dabd33c49099716cc31c7d660b96153c88d2f911c08",
  bytes: 62_598_232,
  minAndroid: "Android 7.0 (API 24) or newer",
  abis: ["arm64-v8a", "x86_64"],
} as const;

export type PlatformStatus = "available" | "test-build" | "soon";

export function formatMegabytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
