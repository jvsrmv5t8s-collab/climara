import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Climara — Weather & Local Time Around the World",
    short_name: "Climara",
    description:
      "See the weather and local time for your favorite cities at a glance.",
    start_url: "/",
    display: "standalone",
    background_color: "#c6dff0",
    theme_color: "#c6dff0",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
