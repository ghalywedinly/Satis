import { LOGO_MAX_LENGTH } from "../definition";

export type LogoError = "type" | "size" | "read";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
/** Largest file accepted before resizing. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;
/** Twice the largest size the logo is shown at, for sharp screens. */
const MAX_WIDTH = 640;
const MAX_HEIGHT = 256;

/**
 * Turns an uploaded logo into a small PNG (or WebP) data URL that can be stored with the survey.
 * SVGs are rasterised too, so nothing executable is ever stored or shown.
 */
export async function prepareLogo(file: File): Promise<{ src: string } | { error: LogoError }> {
  if (!ACCEPTED.includes(file.type)) return { error: "type" };
  if (file.size > MAX_FILE_BYTES) return { error: "size" };

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    // SVGs without a width/height report 0: draw them at a sensible default size.
    const width = image.naturalWidth || 480;
    const height = image.naturalHeight || 192;

    for (const factor of [1, 0.75, 0.5]) {
      const scale = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height) * factor;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d");
      if (!context) return { error: "read" };
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const [type, quality] of [["image/png", undefined], ["image/webp", 0.9]] as const) {
        const src = canvas.toDataURL(type, quality);
        if (src.startsWith(`data:${type};base64,`) && src.length <= LOGO_MAX_LENGTH) return { src };
      }
    }
    return { error: "size" };
  } catch {
    return { error: "read" };
  } finally {
    URL.revokeObjectURL(url);
  }
}
