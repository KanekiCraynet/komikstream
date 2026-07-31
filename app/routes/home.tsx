import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { getCover } from "~/components/MangaCard";
import HeroCarousel from "~/components/HeroCarousel";
import TrendingRail from "~/components/TrendingRail";
import { prisma } from "~/lib/db.server";
import { listGenres } from "~/lib/genres.server";
import { parseMangaMetadata } from "~/lib/manga-types";

export const meta: Route.MetaFunction = () => [{ title: "KomikStream — Baca Manga" }];

const LATEST_PAGE_SIZE = 20;

export async function loader({ context }: Route.LoaderArgs) {
  const manga = await prisma.komik.findMany({
    include: { komikChapters: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });
  const total = await prisma.komik.count();
  const genres = await listGenres();
  return { manga, total, genres };
}

function labelChapter(id: string) {
  return "Ch. " + id.replace(/^[a-z0-9-]+-chapter-/i, "").replace(/^chapter-/i, "");
}
function chSlug(item: { komikChapters: { chapterId: string }[] }): string | undefined {
  return item.komikChapters[0]?.chapterId;
}
/** Five-star row used by the trending cards. Generic star glyph, no external asset. */
function Stars() {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3-1.11-6.47L.38 9.35l6.5-.95z" />
        </svg>
      ))}
    </>
  );
}
export default function Home({ loaderData }: Route.ComponentProps) {
  const { manga, total, genres } = loaderData;
  const hero = manga.slice(0, 9);
  const trending = manga.slice(9, 24);
  const popular = manga.slice(0, 10);
  const [rankingPeriod, setRankingPeriod] = useState(0);
  const [latestPage, setLatestPage] = useState(1);
  // Reference paginates Latest Updates 20-per-page and caps the strip at 5 pages.
  const latestPageCount = Math.min(5, Math.ceil(manga.length / LATEST_PAGE_SIZE));
  const latestFeed = manga.slice((latestPage - 1) * LATEST_PAGE_SIZE, latestPage * LATEST_PAGE_SIZE);

  return (
    <div className="pb-16">
      {/* ── PROMO BANNER: full-width ~98px ── */}
      <section className="h-[98px] w-full border-b border-purple/20 bg-[radial-gradient(circle_at_18%_0%,rgb(109_40_217_/_0.24),transparent_34%),linear-gradient(90deg,#181329,#121019_58%,#171123)] shadow-[inset_0_-1px_0_rgb(168_85_247_/_0.12)]">
        <div className="mx-auto flex h-full w-full max-w-[1288px] items-center gap-4 px-4 sm:px-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-purple/35 bg-gradient-to-br from-purple/45 to-purple/10 text-2xl text-purple-soft shadow-[0_8px_24px_rgb(109_40_217_/_0.25)]" aria-hidden="true">✦</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-white sm:text-base">KomikStream Beta</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-white/55">Baca manga favoritmu gratis, tanpa iklan.</p>
            <div className="mt-2 hidden items-center gap-4 text-[11px] font-medium text-white/55 sm:flex">
              <span>✓ Gratis</span>
              <span>✓ Bookmark</span>
              <span>✓ Riwayat baca</span>
            </div>
          </div>
          <Link to="/manga" className="ks-focus inline-flex min-h-12 shrink-0 items-center rounded-lg border border-purple/70 bg-gradient-to-b from-[#a855f7] to-[#7e22ce] px-4 text-xs font-extrabold text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.22),0_8px_24px_rgb(109_40_217_/_0.30)] transition hover:brightness-110 sm:px-6 sm:text-sm">
            Mulai Baca →
          </Link>
        </div>
      </section>

      {/* ── HERO: EMBLA COVER CAROUSEL (center-active, drag + hover) ── */}
      <HeroCarousel
        slides={hero.map((item) => {
          const slug = chSlug(item);
          const meta = parseMangaMetadata(item.chapters);
          return {
            id: item.id,
            href: slug ? `/${slug}` : `/manga/${item.slug}`,
            title: item.title,
            cover: getCover(item.chapters),
            rating: meta.rating ? String(meta.rating) : undefined,
            chapterLabel: slug ? labelChapter(slug) : undefined,
          };
        })}
      />

      {/* ── BODY: TRENDING+LATEST (left) + RANKING (right) ── */}
      <div className="mx-auto mb-6 mt-3 w-full max-w-[1285px] px-3 md:w-[95%] md:px-0">
        <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-stretch">
          {/* ── LEFT: TRENDING + LATEST ── */}
          <div className="flex min-w-0 flex-col gap-3 md:gap-4 lg:w-2/3">
            {/* TRENDING HEADER */}
            <section className="relative shrink-0 overflow-hidden bg-[#1D1B22] py-3 md:rounded-md md:py-6">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#A855F7]/[0.14] via-transparent to-transparent" />
              <div className="relative mb-3 flex items-center justify-between px-4 md:mb-5 md:px-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#913FE2]/15 text-[#913FE2]" aria-hidden="true">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  </span>
                  <h2 className="text-lg font-medium text-white md:text-xl md:font-bold">Trending Comics</h2>
                </div>
                <Link to="/manga" className="ks-focus rounded-md bg-[#913FE2] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#7c35c2] md:text-[13px]">All Comics</Link>
              </div>
              {/* TRENDING CARD RAIL */}
              <TrendingRail>
                {trending.map((item) => {
                  const m = parseMangaMetadata(item.genres);
                  const slug = chSlug(item);
                  return (
                    <div key={item.id} className="w-[144px] flex-shrink-0 md:w-[150px]">
                      <Link
                        to={slug ? `/${slug}` : `/manga/${item.slug}`}
                        className="ks-focus group block cursor-pointer"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-surface transition-opacity group-hover:opacity-60">
                          {getCover(item.chapters) ? (
                            <img
                              src={getCover(item.chapters)!}
                              alt={item.title}
                              className="h-full w-full object-cover object-top"
                              loading="lazy"
                              draggable={false}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple/20 via-surface to-black p-2 text-center text-xs text-white/50">
                              {item.title}
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className="block truncate text-[13px] font-bold text-white transition-colors group-hover:text-[#913FE2]">
                            {item.title}
                          </span>
                          {slug && (
                            <span className="block text-[13px] font-medium text-[#999]">{labelChapter(slug)}</span>
                          )}
                          {m.rating && (
                            <div className="mt-0.5 flex text-[12px] font-bold text-[#999]">
                              <div className="flex items-center gap-0.5">
                                <Stars />
                                <span className="ml-1 text-xs text-[#999]">{m.rating}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </TrendingRail>
            </section>

            {/* LATEST UPDATES */}
            <section className="mt-0 bg-[#1D1B22] py-3 md:rounded-md md:py-6">
              <div className="flex items-center justify-between px-4 md:px-8">
                <h2 className="text-lg font-medium text-white md:text-xl md:font-bold">Latest Updates</h2>
              </div>
              <div className="mt-2 h-px w-full bg-[linear-gradient(to_right,transparent,#312f40_5%,#312f40_95%,transparent)] md:hidden" />
              {latestFeed.length ? (
                <div className="grid grid-cols-1 content-start px-4 md:grid-cols-2 md:px-8">
                  {latestFeed.map((item) => {
                    const slug = chSlug(item);
                    return (
                      <article key={item.id} className="grid grid-cols-12 gap-2 border-b border-[#312f40] px-2 py-4">
                        <Link
                          to={slug ? `/${slug}` : `/manga/${item.slug}`}
                          className="ks-focus group col-span-4 overflow-hidden rounded-md sm:col-span-3 md:col-span-4 lg:col-span-3"
                        >
                          {getCover(item.chapters) ? (
                            <img
                              src={getCover(item.chapters)!}
                              alt={`${item.title} cover`}
                              className="aspect-[3/4] w-[90%] rounded-md object-cover object-top transition-opacity group-hover:opacity-60 sm:w-full"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/images/default-cover.webp";
                              }}
                            />
                          ) : (
                            <div className="aspect-[3/4] w-[90%] rounded-md bg-surface sm:w-full" />
                          )}
                        </Link>
                        <div className="col-span-8 flex min-w-0 flex-col sm:col-span-9 md:col-span-8 lg:col-span-9">
                          <Link to={slug ? `/${slug}` : `/manga/${item.slug}`} className="ks-focus rounded-sm">
                            <h3 className="mb-2 line-clamp-1 text-base font-bold transition-colors hover:text-[#913FE2]">{item.title}</h3>
                          </Link>
                          {item.komikChapters.length > 0 ? (
                            <div className="flex flex-col gap-1.5 sm:pl-2">
                              {item.komikChapters.slice(0, 3).map((chapter) => (
                                <Link
                                  key={chapter.chapterId}
                                  to={`/${chapter.chapterId}`}
                                  className="ks-focus grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 transition-colors hover:text-[#913FE2]"
                                >
                                  <span className="flex min-w-0 items-center gap-1.5">
                                    <span className="shrink-0 text-[14px] font-medium text-white/90 transition-colors group-hover:text-[#913FE2]">
                                      {labelChapter(chapter.chapterId)}
                                    </span>
                                  </span>
                                  <time className="shrink-0 text-[11px] tabular-nums text-white/60" dateTime={new Date(chapter.createdAt).toISOString()}>
                                    {new Date(chapter.createdAt).toLocaleDateString("id", { day: "numeric", month: "short" })}
                                  </time>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-white/60">No chapters yet</div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm text-white/50 md:px-8">Belum ada data.</div>
              )}

              {latestPageCount > 1 && (
                <div className="flex items-center justify-center mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous page"
                      className={`w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-md bg-white/10 transition-all cursor-pointer ${latestPage===1 ? "opacity-25 pointer-events-none" : "hover:bg-white/20"}`}
                      onClick={() => setLatestPage(Math.max(1, latestPage - 1))}
                      disabled={latestPage === 1}
                    >
                      <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 18-6-6 6-6" /></svg>
                    </button>
                    {Array.from({ length: latestPageCount }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        aria-label={`Page ${pageNum}`}
                        className={`w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-md text-xs lg:text-sm font-bold transition-all cursor-pointer ${latestPage===pageNum ? "bg-[#913FE2] text-white" : "bg-white/10 hover:bg-white/20"}`}
                        onClick={() => setLatestPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Next page"
                      className={`w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-md bg-white/10 transition-all cursor-pointer ${latestPage===latestPageCount ? "opacity-25 pointer-events-none" : "hover:bg-white/20"}`}
                      onClick={() => setLatestPage(Math.min(latestPageCount, latestPage + 1))}
                      disabled={latestPage === latestPageCount}
                    >
                      <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT: POPULAR SIDEBAR ── */}
          <aside className="relative w-full overflow-hidden bg-[#1D1B22] px-4 pb-2 pt-3 md:rounded-md md:px-5 md:pb-3 md:pt-5 lg:w-1/3">
            <div className="mb-3 md:mb-5">
              <div className="hidden items-center justify-between min-[470px]:flex">
                <h2 className="text-xl font-bold text-white">Popular</h2>
                <div className="flex gap-1 rounded-lg bg-[#13111A] p-1" role="tablist" aria-label="Periode popular">
                  {(["Weekly", "Monthly", "All Time"] as const).map((period, index) => (
                    <button
                      key={period}
                      type="button"
                      role="tab"
                      aria-selected={rankingPeriod === index}
                      onClick={() => setRankingPeriod(index)}
                      className={`ks-focus cursor-pointer rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200 ${rankingPeriod === index ? "bg-[#913FE2] text-white" : "text-white/60 hover:bg-[#1B1820]/50 hover:text-white"}`}
                    >
                      <span className="min-[1200px]:hidden">{period === "All Time" ? "All" : period}</span>
                      <span className="hidden min-[1200px]:inline">{period}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-[470px]:hidden">
                <h2 className="mb-3 text-lg font-medium text-white">Popular</h2>
                <div className="grid h-8 w-full grid-cols-3 rounded-lg bg-[#13111A] p-1" role="tablist" aria-label="Periode popular">
                  {(["Weekly", "Monthly", "All"] as const).map((period, index) => (
                    <button
                      key={period}
                      type="button"
                      role="tab"
                      aria-selected={rankingPeriod === index}
                      onClick={() => setRankingPeriod(index)}
                      className={`ks-focus inline-flex h-[22px] cursor-pointer items-center justify-center rounded-lg text-[12px] font-bold transition-all ${rankingPeriod === index ? "bg-[#913FE2] text-white shadow-sm" : "text-white/60 hover:text-white"}`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 h-px w-full bg-[linear-gradient(to_right,transparent,#312f40_5%,#312f40_95%,transparent)] md:hidden" />
            </div>
            {popular.length ? (
              <ol className="flex min-h-[540px] flex-col gap-3 md:min-h-[620px]">
                {popular.map((item, index) => {
                  const meta = parseMangaMetadata(item.chapters);
                  return (
                    <li key={item.id}>
                      <Link
                        to={chSlug(item) ? `/${chSlug(item)}` : `/manga/${item.slug}`}
                        className="ks-focus group relative flex cursor-pointer gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="overflow-hidden rounded-lg">
                            {getCover(item.chapters) ? (
                              <img
                                src={getCover(item.chapters)!}
                                alt={item.title}
                                className="h-16 w-12 object-cover transition-transform duration-300 group-hover:scale-105 md:h-[72px] md:w-14"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-16 w-12 bg-surface md:h-[72px] md:w-14" />
                            )}
                          </div>
                          <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#913FE2] text-xs font-bold text-white">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <span className="line-clamp-2 block text-[14px] font-medium leading-tight text-white transition-colors group-hover:text-[#913FE2]">
                            {item.title}
                          </span>
                          {meta.genres && meta.genres.length > 0 && (
                            <p className="mt-1 line-clamp-1 text-[12px] leading-tight text-[#888]">
                              <span>Genres: </span>
                              <span className="font-semibold text-white/80">
                                {meta.genres.slice(0, 3).map((g) => g.title ?? g.name).join(", ")}
                              </span>
                            </p>
                          )}
                          {meta.rating && (
                            <div className="mt-1 flex items-center">
                              <div className="flex items-center gap-0.5"><Stars /></div>
                              <span className="ml-1.5 text-[12px] italic text-[#999]">{meta.rating}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="py-4 text-center text-xs text-white/40">Belum ada data.</p>
            )}

            {genres.length > 0 && (
              <section className="mt-6 border-t border-white/10 pt-5" aria-labelledby="genre-heading">
                <h2 id="genre-heading" className="mb-3 text-lg font-bold text-white">Genres</h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {genres.map((genre) => (
                    <Link
                      key={genre.slug}
                      to={`/manga?genre=${genre.slug}`}
                      className="ks-focus rounded-md bg-[#13111A] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-[#913FE2] hover:text-white"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* ── CATALOG CTA ── */}
        <section className="mt-8">
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-r from-surface via-[#1a1730] to-surface p-5 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="text-sm font-bold text-white/80">Ada {total} judul untuk dijelajahi</p>
              <p className="text-xs text-white/40">Dari rilis terbaru sampai seri legendaris.</p>
            </div>
            <Link to="/manga" className="ks-focus mt-3 inline-flex min-h-11 items-center rounded-lg bg-purple px-5 text-sm font-bold text-white transition hover:bg-purple-hover sm:mt-0">
              Jelajahi semua
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}