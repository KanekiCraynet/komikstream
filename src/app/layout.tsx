import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OptionalClerkProvider } from "@/components/providers/ClerkProvider";
import { clerkEnabled } from "@/lib/clerk-flags";
import GdprBanner from "@/components/GdprBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "KomikStream - Baca Komik Manga, Manhwa, Manhua Sub Indo Gratis";
const DESC = "Baca komik manga, manhwa, manhua online bahasa Indonesia gratis. Update setiap hari dengan koleksi ribuan judul komik terpopuler.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export const metadata: Metadata = {
  title: { default: TITLE, template: `%s | KomikStream` },
  description: DESC,
  applicationName: "KomikStream",
  keywords: [
    "komik manga", "baca manga online", "manhwa sub indo", "manhua",
    "komik online gratis", "manga bahasa indonesia",
  ],
  authors: [{ name: "KomikStream", url: "https://komikstream.space" }],
  creator: "KomikStream",
  publisher: "KomikStream",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://komikstream.space",
    siteName: "KomikStream",
    title: TITLE,
    description: DESC,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};

const SEARCH_ACTIONS = [
  { target: "komik", param: "search_term_string" },
  { target: "anime", param: "search_term_string" },
].map(
  (a) => `{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://komikstream.space/komik/search?q={${a.param}}"},"query-input":"required name=${a.param}"}`,
);

const structuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://komikstream.space/#website",
      url: "https://komikstream.space",
      name: "KomikStream",
      description: DESC,
      publisher: { "@id": "https://komikstream.space/#organization" },
      potentialAction: JSON.parse(`[${SEARCH_ACTIONS.join(",")}]`),
      inLanguage: "id-ID",
    },
    {
      "@type": "Organization",
      "@id": "https://komikstream.space/#organization",
      name: "KomikStream",
      url: "https://komikstream.space",
      logo: { "@type": "ImageObject", url: "https://komikstream.space/logo.svg" },
    },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})})}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <OptionalClerkProvider enabled={clerkEnabled}>
          <a
            href="#main-content"
            className="bg-primary text-primary-foreground sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100]"
          >
            Langsung ke konten
          </a>
          <main id="main-content" className="flex-1">{children}</main>
          <GdprBanner />
        </OptionalClerkProvider>
      </body>
    </html>
  );
}
