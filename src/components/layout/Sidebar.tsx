"use client";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { Book, Bookmark, Film, History, Home, LogIn, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

const navigation = [
  { name: "Beranda", href: "/", icon: Home },
  { name: "Komik", href: "/komik", icon: Book },
  { name: "Anime", href: "/anime", icon: Film },
  { name: "Bookmark", href: "/bookmark", icon: Bookmark },
  { name: "History", href: "/history", icon: History },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  clerkEnabled?: boolean;
}

export function Sidebar({ isOpen, onClose, clerkEnabled = false }: SidebarProps) {
  const pathname = usePathname();

  // Close sidebar when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when sidebar is open (iOS Safari compatible)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.dataset.scrollY = String(scrollY);
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      delete document.body.dataset.scrollY;
      if (scrollY) window.scrollTo(0, scrollY);
    }
    return () => {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      delete document.body.dataset.scrollY;
      if (scrollY) window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-background border-border fixed inset-y-0 left-0 z-50 w-72 border-r",
          "transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="border-border flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="bg-primary shadow-primary/25 flex h-9 w-9 items-center justify-center rounded-xl shadow-lg">
              <Book className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-primary">{siteConfig.logoParts[0]}</span>
              <span>{siteConfig.logoParts[1]}</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="hover:bg-accent flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Navigasi mobile" className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Login button for mobile when Clerk is not configured */}
        {!clerkEnabled && (
          <div className="px-4 py-2">
            <Link href="/sign-in">
              <Button variant="outline" className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Masuk
              </Button>
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="border-border absolute right-0 bottom-0 left-0 border-t p-4">
          <p className="text-muted-foreground text-center text-xs">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
      </aside>
    </>
  );
}
