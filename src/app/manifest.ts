import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// Force dynamic rendering so start_url can reflect the page the manifest was requested from.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const referer = headersList.get("referer");

  // Android builds the home-screen shortcut's launch URL from start_url, so it must
  // match the page the user was on when they added it, not a fixed root path.
  let startUrl = "/";
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      startUrl = `${refererUrl.pathname}${refererUrl.search}`;
    } catch {
      startUrl = "/";
    }
  }

  return {
    name: "Source Sheets",
    short_name: "Source Sheets",
    description: "A simplified Sefaria source sheet reader",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
