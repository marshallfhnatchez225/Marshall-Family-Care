import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Marshall OS",
    short_name: "Marshall",
    description: "Marshall Funeral Home operations system",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f7",
    theme_color: "#751d37",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
