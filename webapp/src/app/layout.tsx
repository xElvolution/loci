import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { MotionRoot } from "@/components/ui/MotionRoot";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap" });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN || "http://localhost:3751"),
  title: { default: "loci · The way home after hospital", template: "%s · loci" },
  description:
    "loci turns a hospital discharge plan into a shared recovery journey for patients, families and care teams: daily check-ins, clinician-set warning signs, a care circle, and comfort picks tuned to what the person loves.",
  applicationName: "loci",
  openGraph: { title: "loci · The way home after hospital", description: "A shared recovery journey for every kind of coming home.", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#0b0a1f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-dvh">
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}
