import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

/**
 * Horizontal drag rail for compact cover cards.
 * Options mirror the reference implementation: start-aligned, no loop,
 * trimSnaps so the last card never parks in dead space, dragFree for momentum.
 */
export default function TrendingRail({ children }: { children: ReactNode }) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
  }, [embla, onSelect]);

  return (
    <div className="group/rail relative">
      <div className="ks-rail overflow-hidden px-4 md:px-6" ref={emblaRef}>
        <div className="ks-rail__container flex gap-3">{children}</div>
      </div>

      {canPrev && (
        <button
          type="button"
          aria-label="Geser trending ke kiri"
          onClick={() => embla?.scrollPrev()}
          className="ks-focus absolute -left-2 top-[38%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/80 text-xl text-white/85 opacity-0 backdrop-blur transition hover:border-purple/70 hover:bg-purple hover:text-white focus-visible:opacity-100 group-hover/rail:opacity-100 sm:flex"
        >
          ‹
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label="Geser trending ke kanan"
          onClick={() => embla?.scrollNext()}
          className="ks-focus absolute -right-2 top-[38%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/80 text-xl text-white/85 opacity-0 backdrop-blur transition hover:border-purple/70 hover:bg-purple hover:text-white focus-visible:opacity-100 group-hover/rail:opacity-100 sm:flex"
        >
          ›
        </button>
      )}
    </div>
  );
}
