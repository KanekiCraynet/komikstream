"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type ScrollDirection = "up" | "down" | null;

interface UseScrollDirectionOptions {
  threshold?: number; // Minimum scroll distance to trigger direction change
  initialDirection?: ScrollDirection;
}

/**
 * Hook to detect scroll direction.
 * Returns 'up' when scrolling up, 'down' when scrolling down.
 * Used for sticky elements that hide on scroll down, show on scroll up.
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, initialDirection = null } = options;

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);
  const [isAtTop, setIsAtTop] = useState(true);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.scrollY;

    // Check if at top
    setIsAtTop(scrollY < 10);

    // Only update direction if scroll exceeds threshold
    const diff = scrollY - lastScrollY.current;

    if (Math.abs(diff) >= threshold) {
      const newDirection = diff > 0 ? "down" : "up";
      setScrollDirection(newDirection);
      lastScrollY.current = scrollY;
    }

    ticking.current = false;
  }, [threshold]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [updateScrollDirection]);

  return { scrollDirection, isAtTop };
}
