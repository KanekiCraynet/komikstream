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
      <header className="sticky top-0 z-50 border-b border-black/30 bg-gradient-to-b from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] shadow-[0_14px_40px_-6px_rgb(76_29_149_/_0.60),0_0_0_1px_rgb(255_255_255_/_0.04)_inset]">
        <div className="ks-container flex h-16 items-center gap-5">
          <Link to="/" className="ks-focus flex shrink-0 items-center gap-2 rounded-md" aria-label="KomikStream home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple text-sm font-black text-white shadow-[0_0_22px_rgb(145_63_226_/_0.35)]">K</span>
            <span className="hidden text-lg font-extrabold tracking-tight sm:inline">Komik<span className="text-purple-soft">Stream</span></span>
          </Link>

          <nav className="hidden h-full items-center gap-1 text-sm md:flex" aria-label="Primary navigation">
            <NavLink to="/manga">Jelajahi</NavLink>
            <NavLink to="/bookmark">Bookmark</NavLink>
            <NavLink to="/history">Riwayat</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form action="/search" className="hidden md:block">
              <label className="sr-only" htmlFor="nav-search">Cari manga</label>
              <input
                id="nav-search"
                name="q"
                placeholder="Cari manga..."
                className="ks-focus h-9 w-44 rounded-lg border border-border bg-elevated px-3 text-xs text-white placeholder:text-white/40 transition-[width] focus:w-56 lg:w-52 lg:focus:w-64"
              />
            </form>
            <Link to="/search" aria-label="Cari manga" className="ks-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-white/70 transition hover:border-purple/50 hover:bg-purple/10 hover:text-white md:hidden">
              <span aria-hidden="true" className="text-xl leading-none">⌕</span>
            </Link>
            <Link to="/account" className="ks-focus inline-flex min-h-11 items-center rounded-lg border border-border bg-elevated px-4 text-xs font-semibold text-white/80 transition hover:border-purple/60 hover:bg-purple/15 hover:text-white">
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
  return <Link to={to} className="ks-focus relative flex h-full items-center px-4 text-sm text-white/70 transition hover:bg-white/15 hover:text-white after:absolute after:inset-x-3 after:bottom-1 after:h-[3px] after:origin-left after:scale-x-0 after:rounded-full after:bg-white after:transition-transform hover:after:scale-x-100">{children}</Link>;
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
