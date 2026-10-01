import "server-only";
import QRCode from "qrcode";

// QR modules must be high-contrast and solid: brand Ink on white, never tinted.
const COLORS = { dark: "#0B0D12", light: "#FFFFFF" };
const OPTIONS = { errorCorrectionLevel: "M" as const, margin: 2, color: COLORS };

export const qrSvg = (text: string) => QRCode.toString(text, { ...OPTIONS, type: "svg" });

/** 1024px PNG: sharp when printed at up to roughly 8.5 cm (3.3 in). */
export const qrPng = (text: string) => QRCode.toBuffer(text, { ...OPTIONS, type: "png", width: 1024 });
