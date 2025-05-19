import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { GeistMono } from 'geist/font/mono';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getBaseUrl } from '@/app/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  // it's hosted on mridul.sh, and rex.wf, so need to generate metadata dynamically
  const baseUrl = await getBaseUrl();
  const { hostname } = new URL(await getBaseUrl());
  const name = hostname.includes('mridul.sh') ? 'mridul' : 'rex';
  const common = {
    title: `${name}'s space`,
    description: `${name}'s personal website`,
  };

  return {
    ...common,
    robots: 'index,follow',
    metadataBase: new URL(baseUrl),
    openGraph: {
      ...common,
      url: baseUrl,
      siteName: common.title,
      type: 'website',
      images: [
        {
          url: '/image.png',
          width: 192,
          height: 192,
        },
      ],
    },
    twitter: {
      card: 'summary',
      ...common,
      images: ['/image.png'],
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#030303',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistMono.className} antialiased`}>
        {children}
        <Analytics basePath="/monitor" />
        <SpeedInsights basePath="/monitor" />
      </body>
    </html>
  );
}
