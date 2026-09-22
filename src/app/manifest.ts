import type { MetadataRoute } from "next";
import { site } from "@/config/site";

// The manifest is fixed content; marking it static lets the GitHub Pages
// export emit it as a file (and costs the server build nothing).
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} ${site.product}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
