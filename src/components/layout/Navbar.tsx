"use client";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { Book, Film, Home, Menu, Search, Bookmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Sidebar } from "./Sidebar";
import { AuthButtons } from "@/components/ui/AuthButtons";
import { useSync } from "@/hooks/useSync";

const navigation = [
  { name: "Beranda", href: "/", icon: Home },
  { name: "Komik", href: "/komik", icon: Book },
  { name: "Anime", href: "/anime", icon: Film },
  { name: "Bookmark", href: "/bookmark", icon: Bookmark },
];

interface NavbarProps {
  clerkEnabled?: boolean;
}

export function Navbar({ clerkEnabled = false }: NavbarProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync local store with server when user is signed in
  useSync();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/95 shadow-lg shadow-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-900/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Book className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-blue-400">{siteConfig.logoParts[0]}</span>
              <span className="text-white">{siteConfig.logoParts[1]}</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <Link href="/komik/search" aria-label="Cari komik">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Auth buttons - conditionally rendered based on Clerk config */}
            <AuthButtons clerkEnabled={clerkEnabled} />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        clerkEnabled={clerkEnabled}
      />
    </>
  );
}
