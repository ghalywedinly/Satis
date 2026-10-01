import { Bricolage_Grotesque, Instrument_Sans, Readex_Pro, JetBrains_Mono } from "next/font/google";

export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-bricolage", display: "swap" });
export const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-instrument", display: "swap" });
export const readex = Readex_Pro({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-readex", display: "swap" });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

export const fontVariables = [bricolage.variable, instrument.variable, readex.variable, jetbrains.variable].join(" ");
