import type { MetadataRoute } from "next";
import { sv } from "@/lib/i18n/sv";

/** Lets designers add Plantvision to the home screen of a phone or tablet. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: sv.app.name,
    short_name: sv.app.name,
    description: sv.app.tagline,
    start_url: "/projects",
    display: "standalone",
    background_color: "#f5f0e6",
    theme_color: "#f5f0e6",
    lang: "sv",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
