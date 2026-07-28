import { Link } from "react-router";
import type { Route } from "./+types/home";
import MangaCard, { getCover, getLatestChapter } from "~/components/MangaCard";
import { prisma } from "~/lib/db.server";

export function meta() {
  return [
    { title: "KomikStream — Baca manga tanpa ribet" },
    {
      name: "description",
      content:
        "Temukan manga, simpan bookmark, dan lanjutkan chapter terakhir.",
    },
  ];
}

export async function loader(_args: Route.LoaderArgs) {
  const manga = await prisma.komik.findMany({
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: {
      komikChapters: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { chapterId: true },
      },
    },
  });
  return { manga };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { manga } = loaderData;
  const featured = manga[0];

  return (
    <div>
      <section className="ks-container relative overflow-hidden py-12 sm:py-20">
        <div className="pointer-events-none absolute -right-24 -top-20 h-96 w-96 rounded-full bg-purple/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_360px]">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-purple-soft">
              KomikStream / Manga reader
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Cerita baru. <span className="text-purple-soft">Setiap hari.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
              Temukan manga favoritmu, baca chapter terbaru, dan lanjutkan dari halaman terakhir tanpa ribet.
            </p>
            <form action="/search" className="mt-8 flex max-w-xl gap-2">
              <label className="sr-only" htmlFor="home-search">Cari manga</label>
              <input
                id="home-search"
                name="q"
                placeholder="Cari judul manga..."
                className="ks-focus min-w-0 flex-1 rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35"
              />
              <button className="ks-focus rounded-xl bg-purple px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-hover" type="submit">
                Cari
              </button>
            </form>
          </div>
          {featured ? (
            <Link to={`/manga/${featured.slug}`} className="ks-focus group relative hidden overflow-hidden rounded-2xl border border-purple/30 bg-surface shadow-[0_20px_60px_rgb(145_63_226_/_0.18)] lg:block">
              <div className="aspect-[4/5] bg-gradient-to-br from-purple/50 to-black/60">
                {getCover(featured.chapters) ? <img src={getCover(featured.chapters)} alt={`${featured.title} cover`} className="h-full w-full object-cover opacity-80 transition group-hover:scale-105" /> : <div className="flex h-full flex-col justify-end bg-[radial-gradient(circle_at_70%_20%,rgb(167_139_250_/_0.35),transparent_35%),linear-gradient(145deg,#3b1d62,#15121d_70%)] p-6"><span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-soft/80">Featured manga</span><span className="mt-3 text-xs text-white/45">Cover belum tersedia</span></div>}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pt-16">
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-soft">Featured</p>
                <h2 className="mt-1 text-xl font-extrabold text-white">{featured.title}</h2>
                <p className="mt-1 text-xs text-white/50">Baca chapter terbaru →</p>
              </div>
            </Link>
          ) : (
            <div className="hidden aspect-[4/5] rounded-2xl border border-white/10 bg-surface lg:block" />
          )}
        </div>
      </section>

      <section className="ks-container pb-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-purple-soft">Update terbaru</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight">Baca sekarang</h2></div>
          <Link to="/manga" className="ks-focus rounded text-sm font-semibold text-white/50 hover:text-white">Lihat semua →</Link>
        </div>
        {manga.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {manga.map((item) => <MangaCard key={item.id} slug={item.slug} title={item.title} cover={getCover(item.chapters)} latestChapter={getLatestChapter(item.chapters) ?? item.komikChapters[0]?.chapterId} />)}
          </div>
        ) : (
          <div className="ks-surface rounded-2xl p-10 text-center text-sm text-white/50">Belum ada manga. Konten baru akan muncul di sini.</div>
        )}
      </section>
    </div>
  );
}

/* ponytail: category shortcuts wait until genre data has a stable UI contract. */
