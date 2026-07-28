import { Link } from "react-router";
import type { Route } from "./+types/manga.$slug";
import { prisma } from "~/lib/db.server";
import { getCover } from "~/components/MangaCard";
import { parseMangaMetadata } from "~/lib/manga-types";

export async function loader({ params }: Route.LoaderArgs) {
  const manga = await prisma.komik.findUnique({ where: { slug: params.slug } });
  if (!manga) throw new Response("Not found", { status: 404 });
  const chapters = await prisma.komikChapter.findMany({
    where: { komikId: manga.id },
    orderBy: { createdAt: "desc" },
  });
  return { manga, chapters };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data ? `${data.manga.title} | Komikstream` : "Not found" }];
}

export default function MangaPage({ loaderData }: Route.ComponentProps) {
  const { manga, chapters } = loaderData;
  const metadata = parseMangaMetadata(manga.chapters);
  const cover = getCover(manga.chapters);
  const apiChapters = new Map((metadata.chapters ?? []).map((chapter) => [chapter.slug, chapter]));
  const latestChapter = chapters[0]?.chapterId;
  return (
    <main className="ks-container py-8 sm:py-12">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[220px_1fr]">
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-elevated">
            {cover ? <img src={cover} alt={`${manga.title} cover`} className="h-full w-full object-cover" /> : <div className="flex h-full items-end bg-gradient-to-br from-purple/50 to-black p-5 text-3xl font-black text-white/80">{manga.title}</div>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-soft">{metadata.type ?? "Manga"} · {metadata.status ?? "Berjalan"}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{manga.title}</h1>
            {metadata.otherTitle && <p className="mt-2 max-w-3xl text-xs leading-5 text-white/40">{metadata.otherTitle}</p>}
            <div className="mt-5 grid max-w-2xl grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {metadata.rating && <div className="rounded-lg bg-white/5 p-3"><span className="block text-white/40">Rating</span><strong className="mt-1 block text-yellow-300">★ {metadata.rating}</strong></div>}
              {metadata.release && <div className="rounded-lg bg-white/5 p-3"><span className="block text-white/40">Rilis</span><strong className="mt-1 block text-white/85">{metadata.release}</strong></div>}
              {metadata.reader && <div className="rounded-lg bg-white/5 p-3"><span className="block text-white/40">Pembaca</span><strong className="mt-1 block text-white/85">{metadata.reader}</strong></div>}
              <div className="rounded-lg bg-white/5 p-3"><span className="block text-white/40">Chapter</span><strong className="mt-1 block text-white/85">{chapters.length}</strong></div>
            </div>
            <dl className="mt-5 grid gap-x-8 gap-y-2 text-xs text-white/60 sm:grid-cols-2"><div><dt className="inline text-white/35">Author: </dt><dd className="inline">{metadata.author ?? "-"}</dd></div><div><dt className="inline text-white/35">Artist: </dt><dd className="inline">{metadata.artist ?? "-"}</dd></div>{metadata.series && <div className="sm:col-span-2"><dt className="inline text-white/35">Series: </dt><dd className="inline">{metadata.series}</dd></div>}</dl>
            {metadata.synopsis && <p className="mt-6 max-w-3xl text-sm leading-7 text-white/60">{metadata.synopsis}</p>}
            {metadata.genres?.length ? <div className="mt-5 flex flex-wrap gap-2">{metadata.genres.map((genre) => <span key={genre.title} className="rounded-full border border-purple/30 bg-purple/10 px-3 py-1 text-xs text-purple-soft">{genre.title}</span>)}</div> : null}
            {latestChapter && <Link to={`/${latestChapter}`} className="mt-7 inline-flex rounded-lg bg-purple px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-hover">Baca chapter terbaru →</Link>}
          </div>
        </div>
      </section>
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-purple-soft">Reading list</p><h2 className="mt-1 text-2xl font-black">Chapter</h2></div><span className="text-sm text-white/40">{chapters.length} chapter</span></div>
        {chapters.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{chapters.map((chapter) => { const apiChapter = apiChapters.get(chapter.chapterId); return <Link key={chapter.id} className="ks-focus flex items-center justify-between rounded-xl border border-white/10 bg-surface px-4 py-3 transition hover:border-purple/60 hover:bg-purple/10" to={`/${chapter.chapterId}`}><span><strong className="block text-sm font-semibold capitalize text-white/85">{chapter.chapterId.replace(`${manga.slug}-`, "").replaceAll("-", " ")}</strong>{apiChapter?.date && <small className="mt-1 block text-xs text-white/35">{apiChapter.date}</small>}</span><span className="text-xs font-semibold text-purple-soft">Baca →</span></Link>; })}</div> : <p className="rounded-xl border border-white/10 bg-surface p-8 text-center text-white/50">Belum ada chapter.</p>}
      </section>
    </main>
  );
}
