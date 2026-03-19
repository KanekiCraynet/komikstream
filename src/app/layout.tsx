import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, QueryProvider, AuthProvider } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { isClerkConfigured } from "@/lib/auth-config";
import { siteConfig } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = `${siteConfig.name} - Baca Komik Manga, Manhwa, Manhua Sub Indo Gratis`;
const defaultDescription = siteConfig.description;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: defaultDescription,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author, url: siteConfig.url }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Baca Komik Online Gratis`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [siteConfig.ogImage],
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
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

// Polyfill for esbuild's __name() keepNames helper.
//
// OpenNext's Cloudflare build uses esbuild with keepNames:true to preserve
// function names in the worker bundle. This causes __name() calls to be
// injected into SSR-rendered inline scripts (e.g. the next-themes theme
// detection script that runs in <body> before any JS chunk loads).
// Since __name is only defined inside the worker bundle — not globally —
// the inline script crashes with "ReferenceError: __name is not defined"
// at (index):10, which kills React hydration and causes cascading failures
// including the Clerk "Missing publishableKey" error.
//
// This polyfill defines __name globally in <head> before any other script
// runs, matching the exact signature esbuild expects:
//   __name(fn, name) -> sets fn.name and returns fn
const esbuildNamePolyfill =
  'var __name=(fn,name)=>(Object.defineProperty(fn,"name",{value:name,configurable:true}),fn);';

// Static structured data for SEO - safe to inline as it contains no user input
const structuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: {
        "@id": `${siteConfig.url}/#organization`,
      },
      potentialAction: [
        {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/komik/search?query={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/anime/search?query={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      ],
      inLanguage: "id-ID",
    },
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.svg`,
      },
    },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkEnabled = isClerkConfigured();

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Must be the very first script in <head> — defines __name() before
            the next-themes inline script (injected by Next.js SSR into <body>)
            has a chance to call it. See esbuildNamePolyfill constant above. */}
        <script dangerouslySetInnerHTML={{ __html: esbuildNamePolyfill }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <ThemeProvider>
          <AuthProvider clerkEnabled={clerkEnabled}>
            <QueryProvider>
              <a
                href="#main-content"
                className="bg-primary text-primary-foreground sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100]"
              >
                Langsung ke konten
              </a>
              <Navbar clerkEnabled={clerkEnabled} />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
