import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Marshall OS",
    short_name: "Marshall",
    description: "Marshall Funeral Home operations system",
    id: "/",
    start_url: "/?installed=1",
    display: "standalone",
    background_color: "#f7f6f7",
    theme_color: "#751d37",
    icons: [
      { src: "/marshall-icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/marshall-icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/marshall-icon-maskable-512-v2.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
