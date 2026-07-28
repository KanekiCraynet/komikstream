import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { setChapterPage, getChapterPage } from "~/lib/progress";
import { clampPage } from "~/lib/progress-utils";
import { upsertHistory } from "~/lib/actions/history";

type Mode = "vertical" | "horizontal" | "ltr" | "rtl";

interface Props {
  chapterId: string;
  images: string[];
  tier: "free" | "premium";
  initialPage: number | null;
  authenticated: boolean;
}

function useStoredPage(chapterId: string, totalImages: number, initialPage: number | null, authenticated: boolean) {
  const [page, setPage] = useState(0);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPage(clampPage(initialPage ?? getChapterPage(chapterId), totalImages));
  }, [chapterId, initialPage, totalImages]);

  const goTo = useCallback((value: number) => {
    const next = clampPage(value, totalImages);
    if (!authenticated) setChapterPage(chapterId, next);
    setPage(next);
    if (authenticated) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => void upsertHistory(chapterId, next), 500);
    }
  }, [authenticated, chapterId, totalImages]);

  useEffect(() => () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
  }, []);

  return [page, goTo] as const;
}

export default function MangaReader({ chapterId, images, tier, initialPage, authenticated }: Props) {
  const [page, setPage] = useStoredPage(chapterId, images.length, initialPage, authenticated);
  const [mode, setMode] = useState<Mode>("vertical");
  const scrollRef = useRef<HTMLDivElement>(null);
  const resumed = useRef(false);
  const isPremium = tier === "premium";

  const advance = useCallback((direction: 1 | -1) => {
    const next = page + direction;
    if (next < 0 || next >= images.length) return;
    setPage(next);
    if (mode === "vertical") {
      scrollRef.current?.querySelector<HTMLElement>(`[data-idx="${next}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [images.length, mode, page, setPage]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") advance(mode === "rtl" ? 1 : -1);
      if (event.key === "ArrowRight") advance(mode === "rtl" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, mode]);

  useEffect(() => {
    if (!resumed.current && page > 0 && scrollRef.current) {
      const element = scrollRef.current.querySelector<HTMLElement>(`[data-idx="${page}"]`);
      if (element) {
        element.scrollIntoView({ block: "start" });
        resumed.current = true;
      }
    }
  }, [page]);

  useEffect(() => {
    if (mode !== "vertical" || !scrollRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setPage(Number((visible.target as HTMLElement).dataset.idx));
    }, { threshold: [0.6] });
    scrollRef.current.querySelectorAll<HTMLElement>("[data-idx]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [mode, setPage]);

  const wrapper = useMemo(() => mode === "vertical" ? "flex flex-col" : "flex snap-x snap-mandatory overflow-x-auto", [mode]);
  const imageClass = useMemo(() => {
    if (mode === "vertical") return "w-full";
    return mode === "horizontal" ? "max-h-[calc(100vh-9rem)] w-auto shrink-0 snap-center" : "max-h-[80vh] w-auto shrink-0 snap-center";
  }, [mode]);

  const items = useMemo(() => {
    if (isPremium) return images.map((url, index) => ({ kind: "image" as const, url, index }));
    const result: ({ kind: "image"; url: string; index: number } | { kind: "ad"; key: string })[] = [];
    images.forEach((url, index) => {
      result.push({ kind: "image", url, index });
      if ((index + 1) % 5 === 0 && index < images.length - 1) result.push({ kind: "ad", key: `ad-${index}` });
    });
    return result;
  }, [images, isPremium]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black/20 pb-12">
      <div className="sticky top-16 z-40 border-y border-white/10 bg-ink/90 px-3 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <Link to="/manga" className="ks-focus rounded-lg px-2 py-1 text-xs font-semibold text-white/50 hover:bg-white/10 hover:text-white">← Katalog</Link>
          <span className="hidden text-white/20 sm:inline">/</span>
          <span className="max-w-[12rem] truncate text-sm font-bold text-white/90">{chapterId.replaceAll("-", " ")}</span>
          <span className="ml-auto text-xs font-semibold tabular-nums text-white/50">{images.length ? `${page + 1} / ${images.length}` : "Tidak ada halaman"}</span>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1" aria-label="Reading mode">
            {(["vertical", "horizontal", "ltr", "rtl"] satisfies Mode[]).map((value) => (
              <button key={value} type="button" aria-label={`Reading mode ${value}`} onClick={() => setMode(value)} className={`ks-focus rounded px-2 py-1 text-[11px] font-bold ${mode === value ? "bg-purple text-white" : "text-white/50 hover:bg-white/10 hover:text-white"}`}>
                {value === "vertical" ? "V" : value === "horizontal" ? "H" : value === "ltr" ? "→" : "←"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => advance(-1)} aria-label="Previous page" disabled={page === 0} className="ks-focus rounded-lg border border-white/10 px-3 py-1 text-sm text-white/80 disabled:opacity-25">‹</button>
          <button type="button" onClick={() => advance(1)} aria-label="Next page" disabled={!images.length || page === images.length - 1} className="ks-focus rounded-lg bg-purple px-3 py-1 text-sm text-white disabled:opacity-25">›</button>
        </div>
      </div>

      {images.length ? (
        <div ref={scrollRef} className={`mx-auto max-w-4xl ${wrapper}`}>
          {items.map((item) => item.kind === "ad" ? (
            <div key={item.key} className="my-5 flex h-20 items-center justify-center border border-dashed border-white/10 text-[10px] uppercase tracking-widest text-white/25" data-ad-unit>Advertisement</div>
          ) : (
            <img key={item.index} src={item.url} alt={`Halaman ${item.index + 1} dari ${chapterId}`} className={`${imageClass} bg-elevated object-contain`} data-idx={item.index} loading={item.index < 3 ? "eager" : "lazy"} onError={(event) => { const image = event.currentTarget; image.style.minHeight = "240px"; image.alt = `Halaman ${item.index + 1} gagal dimuat`; }} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-xl px-4 py-24 text-center"><p className="text-lg font-bold text-white/80">Chapter belum memiliki gambar</p><p className="mt-2 text-sm text-white/45">Coba chapter lain dari halaman manga.</p></div>
      )}
    </main>
  );
}
