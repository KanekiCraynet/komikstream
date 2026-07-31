import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

export interface HeroSlide {
  id: number | string;
  href: string;
  title: string;
  cover?: string;
  rating?: string;
  chapterLabel?: string;
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: "center", containScroll: false, loop: slides.length > 3 });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
  }, [embla, onSelect]);

  if (!slides.length) return null;
  const active = slides[selected] ?? slides[0];

  return (
    <section className="relative overflow-hidden bg-[#0D0B0E]">
      {active.cover && (
        <img
          src={active.cover}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-top transition-all duration-500 ease-out"
        />
      )}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink to-transparent" />

      <div className="relative z-10 py-4">
        <div className="ks-hero overflow-hidden" ref={emblaRef}>
          <div className="ks-hero__container flex">
            {slides.map((slide, index) => (
              <div key={slide.id} className={`ks-hero__slide shrink-0${index === selected ? " is-active" : ""}`}>
                <Link
                  to={slide.href}
                  onMouseEnter={() => embla?.scrollTo(index)}
                  aria-current={index === selected ? "true" : undefined}
                  className="ks-hero__link ks-focus group relative block overflow-hidden rounded-lg"
                >
                  {slide.cover ? (
                    <img
                      src={slide.cover}
                      alt={`${slide.title} cover`}
                      draggable="false"
                      loading={index === 0 ? "eager" : "lazy"}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple/25 via-surface to-black px-2 text-center text-xs text-white/60">
                      {slide.title}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                  {slide.rating && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-1 text-xs font-semibold text-white">
                      <span aria-hidden="true" className="text-gold">★</span>
                      <span className="sr-only">Rating</span>
                      {slide.rating}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2.5 pt-12">
                    <h3 className="line-clamp-2 text-xs font-semibold text-white">{slide.title}</h3>
                    {slide.chapterLabel && <p className="mt-0.5 text-[11px] text-white/70">{slide.chapterLabel}</p>}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Geser ke kiri"
          onClick={() => embla?.scrollPrev()}
          className="ks-focus absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-xl text-white/80 backdrop-blur transition hover:border-purple/70 hover:bg-purple hover:text-white sm:flex"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Geser ke kanan"
          onClick={() => embla?.scrollNext()}
          className="ks-focus absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-xl text-white/80 backdrop-blur transition hover:border-purple/70 hover:bg-purple hover:text-white sm:flex"
        >
          ›
        </button>
      </div>
    </section>
  );
}
