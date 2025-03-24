import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  // it's hosted on mridul.sh, and rex.wf, so need to generate metadata dynamically
  const host = headersList.get("host") || "rex.wf";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  return {
    title: "rex's space",
    description: "rex's personal website",
    robots: "index,follow",
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: "rex's space",
      description: "rex's personal website",
      url: baseUrl,
      siteName: "rex's space",
      type: "website",
      images: [
        {
          url: "/image.png",
          width: 192,
          height: 192,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: "rex's space",
      description: "rex's personal website",
      images: ["/image.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#030303",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistMono.className} antialiased`}>{children}</body>
    </html>
  );
}
