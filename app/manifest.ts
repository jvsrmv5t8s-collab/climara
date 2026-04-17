import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Somewher",
    short_name: "Somewher",
    description:
      "Always know the time and weather for the people you care about.",
    start_url: "/",
    display: "standalone",
    background_color: "#F1EDE5",
    theme_color: "#F1EDE5",
    icons: [
      {
        src: "/Somewher_MacOS.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/Somewher_MacOS.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/Somewher_MacOS.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
