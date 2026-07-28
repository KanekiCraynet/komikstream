import {
  isRouteErrorResponse,
  Links,
  Link,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ClerkProvider } from "@clerk/react-router";

import type { Route } from "./+types/root";
import {
  clerkEnabled,
  clerkMiddleware,
  rootAuthLoader,
} from "~/lib/auth.server";
import "./app.css";

// ponytail: cast — @clerk/react-router bundles its own react-router type copy,
// structurally identical to 7.18.1 but nominally different. Remove when Clerk
// peer-deps on react-router >= 7.18.
export const middleware: Route.MiddlewareFunction[] = clerkEnabled
  ? [clerkMiddleware() as unknown as Route.MiddlewareFunction]
  : [];

export async function loader(args: Route.LoaderArgs) {
  if (!clerkEnabled) return null;
  return rootAuthLoader(args);
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  // loaderData null ⇒ Clerk disabled (see loader) — decided server-side so the
  // client bundle never imports auth.server.
  if (!loaderData) return <SiteFrame><Outlet /></SiteFrame>;
  return (
    <ClerkProvider loaderData={loaderData}>
      <SiteFrame><Outlet /></SiteFrame>
    </ClerkProvider>
  );
}

function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur-xl">
        <div className="ks-container flex h-16 items-center gap-5">
          <Link to="/" className="ks-focus flex shrink-0 items-center gap-2 rounded-md" aria-label="KomikStream home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple text-sm font-black text-white shadow-[0_0_22px_rgb(145_63_226_/_0.35)]">K</span>
            <span className="hidden text-lg font-extrabold tracking-tight sm:inline">Komik<span className="text-purple-soft">Stream</span></span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex" aria-label="Primary navigation">
            <NavLink to="/manga">Jelajahi</NavLink>
            <NavLink to="/search">Pencarian</NavLink>
            <NavLink to="/bookmark">Bookmark</NavLink>
            <NavLink to="/history">Riwayat</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/search" aria-label="Search manga" className="ks-focus rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white md:hidden">
              <span aria-hidden="true" className="text-lg">⌕</span>
            </Link>
            <Link to="/account" className="ks-focus rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-purple/60 hover:bg-purple/15 hover:text-white">
              Akun
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-20 border-t border-white/10 bg-black/15">
        <div className="ks-container flex flex-col gap-4 py-8 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <div><strong className="text-white/80">KomikStream</strong><br /><span>Baca manga tanpa ribet.</span></div>
          <div className="flex gap-4"><Link className="ks-focus rounded hover:text-white" to="/contact">Kontak</Link><Link className="ks-focus rounded hover:text-white" to="/privacy">Privasi</Link><Link className="ks-focus rounded hover:text-white" to="/terms">Ketentuan</Link></div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="ks-focus rounded-lg px-3 py-2 text-white/60 transition hover:bg-white/10 hover:text-white">{children}</Link>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
