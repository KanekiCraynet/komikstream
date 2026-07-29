import { Link } from "react-router";
import type { Route } from "./+types/home";
import MangaCard, { getCover, getLatestChapter } from "~/components/MangaCard";
import { prisma } from "~/lib/db.server";
import { parseMangaMetadata } from "~/lib/manga-types";

export const meta: Route.MetaFunction = () => [{ title: "KomikStream — Baca Manga" }];

export async function loader({ context }: Route.LoaderArgs) {
  const manga = await prisma.komik.findMany({
    include: { komikChapters: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });
  const total = await prisma.komik.count();
  return { manga, total };
}

function labelChapter(id: string) {
  return "Ch. " + id.replace(/^[a-z0-9-]+-chapter-/i, "").replace(/^chapter-/i, "");
}
function chSlug(item: { komikChapters: { chapterId: string }[] }): string | undefined {
  return item.komikChapters[0]?.chapterId;
}
function typeOf(item: { genres: unknown }): string | undefined {
  const meta = parseMangaMetadata(item.genres);
  return meta.type;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { manga, total } = loaderData;
  const hero = manga.slice(0, 9);
  const trending = manga.slice(9, 24);
  const latestFeed = manga.slice(0, 12);
  const popular = manga.slice(0, 9);

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

      {/* ── HERO: HORIZONTAL SCROLL COVER RAIL (full-width) ── */}
      <section className="w-full">
        <div className="flex snap-x snap-mandatory items-end gap-4 overflow-x-auto px-5 pb-10 pt-10" style={{ maskImage: "linear-gradient(to right, transparent 1%, black 4%, black 96%, transparent 99%)", WebkitMaskImage: "linear-gradient(to right, transparent 1%, black 4%, black 96%, transparent 99%)" }}>
          {hero.map((item, i) => {
            const cover = getCover(item.chapters);
            const meta = parseMangaMetadata(item.chapters);
            const slug = chSlug(item);
            const isMobileCenter = i === 1;
            const isDesktopCenter = i === 2;
            return (
              <Link
                key={item.id}
                to={slug ? `/${slug}` : `/manga/${item.slug}`}
                className={`group shrink-0 snap-start transition duration-200 ${isMobileCenter ? "relative z-20 w-[150px] scale-[1.14] snap-center shadow-[0_12px_30px_-16px_rgb(0_0_0_/_0.80)] sm:w-[175px] lg:z-auto lg:w-[171px] lg:scale-100 lg:snap-start lg:shadow-none lg:ring-0" : isDesktopCenter ? "w-[130px] scale-100 sm:w-[150px] lg:relative lg:z-20 lg:w-[190px] lg:scale-[1.14] lg:snap-center lg:shadow-[0_8px_40px_-12px_rgb(145_63_226_/_0.20)] lg:ring-1 lg:ring-purple/60" : "w-[130px] scale-100 sm:w-[150px] lg:w-[171px]"}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.10] shadow-[0_16px_46px_-14px_rgb(0_0_0_/_0.70)]">
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="eager" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple/20 via-surface to-black text-xs text-white/50">{item.title.slice(0, 3)}</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 to-transparent" />
                  {slug && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-px text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                      {labelChapter(slug!)}
                    </span>
                  )}
                  {meta.rating && (
                    <span className="absolute bottom-3.5 left-1.5 rounded bg-black/60 px-1.5 py-1 text-[9px] font-semibold text-yellow-300 backdrop-blur-sm">
                      ★ {meta.rating}
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 line-clamp-1 text-xs font-semibold text-white/80 transition group-hover:text-purple-soft">
                  {item.title}
                </h3>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── BODY: TRENDING+LATEST (left) + RANKING (right) ── */}
      <div className="mx-auto w-full max-w-[1332px] px-6">
        <div className="-mt-[3px] flex flex-col lg:flex-row lg:gap-[18px]">
          {/* ── LEFT: TRENDING + LATEST ── */}
          <div className="w-full min-w-0 flex-1">
            {/* TRENDING HEADER + FILTER PILLS */}
            <section className="rounded-lg border border-white/[0.06] bg-elevated px-6 pb-[19px] pt-3 shadow-[0_18px_45px_-28px_rgb(0_0_0_/_0.85)]">
              <div className="mb-[10px] flex flex-col gap-3 sm:flex-row sm:items-center">
                <h2 className="mr-auto text-xl font-bold tracking-tight">Trending Comics</h2>
                <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1" aria-label="Trending period">
                  {["Weekly", "Monthly", "All Time"].map((label, index) => (
                    <Link
                      key={label}
                      to={`/manga${index === 0 ? "" : `?sort=${encodeURIComponent(label)}`}`}
                      aria-current={index === 0 ? "page" : undefined}
                      className={`ks-focus inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-xs transition-all duration-200 ${
                        index === 0
                          ? "border-purple bg-gradient-to-b from-[#a855f7] to-[#7e22ce] font-extrabold text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.25),inset_0_-2px_5px_rgb(59_7_100_/_0.45),0_5px_16px_rgb(145_63_226_/_0.28)]"
                          : "border-white/10 bg-white/[0.025] font-semibold text-white/55 hover:border-purple/65 hover:bg-purple/10 hover:text-white"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                  <Link to="/manga" className="ks-focus inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-md border border-purple bg-purple px-3.5 text-xs font-extrabold text-white shadow-[0_5px_16px_rgb(145_63_226_/_0.24)] hover:bg-purple-hover">All Comics →</Link>
                </div>
              </div>
              {/* TRENDING CARD RAIL */}
              <div className="-mr-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-0 pr-6">
                {trending.map((item) => (
                  <div key={item.id} className="w-[90px] shrink-0 snap-start sm:w-[110px] lg:w-[151px]">
                    <MangaCard
                      slug={item.slug}
                      title={item.title}
                      cover={getCover(item.chapters)}
                      latestChapter={chSlug(item)}
                      type={typeOf(item)}
                    />
                    <div className="mt-0.5 flex min-h-4 items-center gap-1 px-1">
                      {(() => {
                        const m = parseMangaMetadata(item.genres);
                        return (
                          <>
                            {m.rating && <span className="text-[10px] text-gold">★ {m.rating}</span>}
                            {chSlug(item) && <span className="text-[9px] text-white/40">{labelChapter(chSlug(item)!)}</span>}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* LATEST UPDATES */}
            <section className="mt-3 rounded-lg border border-white/[0.06] bg-elevated px-6 pb-5 pt-4 shadow-[0_18px_45px_-28px_rgb(0_0_0_/_0.85)]">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-xl font-bold tracking-tight">Latest Updates</h2>
                <Link to="/manga" className="ks-focus inline-flex min-h-11 items-center rounded-md border border-purple bg-purple px-3.5 text-xs font-extrabold text-white shadow-[0_5px_16px_rgb(145_63_226_/_0.24)] hover:bg-purple-hover">All Comics →</Link>
              </div>
              {latestFeed.length ? (
                <div className="grid gap-x-[14px] gap-y-0 sm:grid-cols-2">
                  {latestFeed.map((item) => {
                    const slug = chSlug(item);
                    return (
                      <Link
                        key={item.id}
                        to={slug ? `/${slug}` : `/manga/${item.slug}`}
                        className={`group flex items-start gap-3 border-b border-white/[0.06] py-3.5 transition hover:bg-white/[0.015]${item === latestFeed[latestFeed.length-1] ? ' border-b-0' : ''}`}
                      >
                        <img
                          src={getCover(item.chapters) ?? ""}
                          alt=""
                          className="h-[119px] w-[88px] shrink-0 rounded-md border border-white/[0.06] object-cover"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="min-w-0 flex-1 pt-0.5">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white/90 transition group-hover:text-purple-soft">
                            {item.title}
                          </h3>
                          <div className="mt-1.5 space-y-1">
                            {item.komikChapters.map((ch) => (
                              <div key={ch.chapterId} className="flex items-center justify-between text-[13px] font-semibold">
                                <span className="text-white/80 transition group-hover:text-purple-soft">
                                  {labelChapter(ch.chapterId)}
                                </span>
                                <span className="text-[12px] font-medium text-white/80">
                                  {new Date(ch.createdAt).toLocaleDateString("id", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-white/50">Belum ada data.</div>
              )}
            </section>
          </div>

          {/* ── RIGHT: RANKING SIDEBAR ~410px ── */}
          <aside className="mt-6 w-full lg:mt-0 lg:w-[410px] lg:shrink-0">
            <div className="h-full rounded-2xl border border-border bg-elevated p-4">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-base font-extrabold">Ranking</h2>
                <div className="flex gap-2 text-[11px]">
                  <span className="text-gold font-semibold">Weekly</span>
                  <span className="text-white/35">Monthly</span>
                  <span className="text-white/35">All Time</span>
                </div>
              </div>
              {popular.length ? (
                <ol className="space-y-1 pr-1">
                  {popular.map((item, index) => {
                    const meta = parseMangaMetadata(item.chapters);
                    const isTop3 = index < 3;
                    return (
                      <li key={item.id} className="min-h-[98px] border-b border-white/[0.06] last:border-b-0">
                        <Link
                          to={chSlug(item) ? `/${chSlug(item)}` : `/manga/${item.slug}`}
                          className="group flex min-h-[98px] items-center gap-3 rounded-lg p-2 transition hover:bg-hover hover:text-white"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={getCover(item.chapters) ?? ""}
                              alt=""
                              className="h-[72px] w-[55px] rounded-md border border-white/[0.06] object-cover"
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                            <span className={`absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black leading-none transition-all duration-200 ${isTop3 ? "bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-white shadow-[0_2px_6px_rgb(251_191_36_/_0.45)]" : "bg-elevated text-white/60 border border-white/15 group-hover:border-gold/50 group-hover:text-gold"}`}>
                              {index + 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white/85 transition group-hover:text-purple-soft">
                              {item.title}
                            </h3>
                            {meta.genres && meta.genres.length > 0 && (
                              <p className="mt-px text-[10px] text-white/40 line-clamp-1">
                                {meta.genres.slice(0, 3).map((g) => g.title ?? g.name).join(", ")}
                              </p>
                            )}
                            <div className="mt-px flex items-center gap-2 text-[10px]">
                              {chSlug(item) && <span className="text-white/45">{labelChapter(chSlug(item)!)}</span>}
                              {meta.rating && <span className="text-gold">★ {meta.rating}</span>}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="py-4 text-center text-xs text-white/40">Belum ada data.</p>
              )}
            </div>
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
