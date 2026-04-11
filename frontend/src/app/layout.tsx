import "../../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CINEVERSE — Discover Your Next Favorite Movie",
  description:
    "A Netflix-style content discovery platform with AI-powered movie recommendations. Browse thousands of movies, get personalized suggestions, and build your watchlist.",
  keywords: ["movies", "recommendations", "AI", "streaming", "watchlist"],
  authors: [{ name: "Cineverse Team" }],
  openGraph: {
    title: "CINEVERSE — AI-Powered Movie Discovery",
    description: "Personalized movie recommendations powered by advanced ML.",
    type: "website",
    siteName: "Cineverse",
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
