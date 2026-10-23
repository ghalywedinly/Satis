import type { MetadataRoute } from "next";

/** Home-screen install: name and icons (iOS uses app/apple-icon.png). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Satis",
    short_name: "Satis",
    start_url: "/dashboard",
    display: "browser",
    background_color: "#FAF8F4",
    theme_color: "#2B3AF3",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
