import { useEffect, useState } from "react";
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
import { clerkEnabled, clerkMiddleware, rootAuthLoader } from "~/lib/auth.server";
import { listGenres } from "~/lib/genres.server";
import type { GenreItem } from "~/lib/manga-types";
import "./app.css";

// ponytail: cast — @clerk/react-router bundles its own react-router type copy,
// structurally identical to 7.18.1 but nominally different. Remove when Clerk
// peer-deps on react-router >= 7.18.
export const middleware: Route.MiddlewareFunction[] = clerkEnabled
  ? [clerkMiddleware() as unknown as Route.MiddlewareFunction]
  : [];

export async function loader(args: Route.LoaderArgs) {
  const genres = await listGenres();
  if (!clerkEnabled) return { genres, auth: null };
  const auth = await rootAuthLoader(args);
  return { genres, auth };
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
  const { genres, auth } = loaderData;
  // auth null ⇒ Clerk disabled (see loader) — decided server-side so the
  // client bundle never imports auth.server.
  if (!auth) return <SiteFrame genres={genres}><Outlet /></SiteFrame>;
  return (
    <ClerkProvider loaderData={auth}>
      <SiteFrame genres={genres}><Outlet /></SiteFrame>
    </ClerkProvider>
  );
}

function SiteFrame({ genres, children }: { genres: GenreItem[]; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="sticky top-0 z-50 h-14 bg-[#913FE2] font-medium shadow-sm">
        <div className="mx-auto flex h-full w-full max-w-[1285px] items-center px-3">
          <div className="flex h-full items-center gap-4">
            <details className="group relative md:hidden">
              <summary className="ks-focus flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-2xl text-white transition hover:bg-white/15 [&::-webkit-details-marker]:hidden" aria-label="Buka menu navigasi">
                <span aria-hidden="true">☰</span>
              </summary>
              <nav className="absolute left-0 top-full mt-1 max-h-[80vh] w-56 overflow-y-auto rounded-xl border border-white/10 bg-[#1c1924] p-2 shadow-2xl" aria-label="Mobile navigation">
                <MobileNavLink to="/">Home</MobileNavLink>
                <MobileNavLink to="/manga">Browse</MobileNavLink>
                <div className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-wider text-white/40">Genre</div>
                {genres.map((genre) => (
                  <MobileNavLink key={genre.slug} to={`/manga?genre=${genre.slug}`}>{genre.name}</MobileNavLink>
                ))}
              </nav>
            </details>

            <Link to="/" className="ks-focus flex shrink-0 items-center gap-2 rounded-md" aria-label="KomikStream home">
              <img src="/favicon.svg" alt="" width="40" height="40" className="h-10 w-10 rounded-full bg-white/10 p-1" />
              <span className="hidden bg-gradient-to-r from-white to-purple-200 bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:inline">KomikStream</span>
            </Link>

            <nav className="hidden h-full items-center text-sm md:flex" aria-label="Primary navigation">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/manga">Browse</NavLink>
              <details className="group relative h-full">
                <summary className="ks-focus flex h-full cursor-pointer list-none items-center gap-1 px-3 text-sm text-white/85 transition hover:bg-white/15 hover:text-white [&::-webkit-details-marker]:hidden" aria-label="Daftar genre">
                  Genre
                  <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
                </summary>
                <div className="absolute right-0 top-full z-50 mt-1 grid max-h-[70vh] w-64 grid-cols-2 gap-0.5 overflow-y-auto rounded-xl border border-white/10 bg-[#1c1924] p-2 shadow-2xl">
                  {genres.map((genre) => (
                    <Link
                      key={genre.slug}
                      to={`/manga?genre=${genre.slug}`}
                      className="ks-focus rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-purple/20 hover:text-white"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </details>
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <SearchOverlay />
            <Link to="/bookmark" aria-label="Bookmark" className="ks-focus flex h-11 w-11 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z" /></svg>
            </Link>
            <Link to="/account" aria-label="Akun" className="ks-focus flex h-11 w-11 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
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

function SearchOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Buka pencarian"
        onClick={() => setOpen(true)}
        className="ks-focus flex h-12 w-12 items-center gap-2 rounded-lg bg-[#1C1924] px-3 text-left text-sm text-white/60 transition-colors hover:bg-[#24212B] hover:text-white/80 sm:w-44"
      >
        <span aria-hidden="true" className="text-xl">⌕</span>
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-auto hidden text-xs text-white/40 sm:inline">Ctrl K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Cari manga"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <form action="/search" method="get" className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-[#1C1924] p-3 shadow-2xl">
            <input
              autoFocus
              required
              type="search"
              name="q"
              placeholder="Cari manga…"
              className="ks-focus min-h-11 min-w-0 flex-1 rounded-lg bg-[#13111A] px-4 text-sm text-white placeholder:text-white/40"
            />
            <button type="submit" aria-label="Cari" className="ks-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#913FE2] text-xl text-white transition hover:bg-[#7c35c2]">
              <span aria-hidden="true">⌕</span>
            </button>
            <button type="button" aria-label="Tutup pencarian" onClick={() => setOpen(false)} className="ks-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl text-white/60 hover:bg-white/10 hover:text-white">
              <span aria-hidden="true">×</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="ks-focus relative flex h-full items-center px-3 text-sm text-white/85 transition hover:bg-white/15 hover:text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-white after:transition-transform hover:after:scale-x-100">{children}</Link>;
}

function MobileNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="ks-focus block rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-purple/20 hover:text-white">{children}</Link>;
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
