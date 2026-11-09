import type { MetadataRoute } from "next";
import { party } from "@/config/party";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: party.brandName,
    short_name: party.brandName.slice(0, 12),
    description: party.metaDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#070b18",
    theme_color: "#070b18",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
