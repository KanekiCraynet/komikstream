import { Link } from "react-router";

interface MangaCardProps {
  slug: string;
  title: string;
  cover?: string;
  latestChapter?: string;
  compact?: boolean;
}

export default function MangaCard({
  slug,
  title,
  cover,
  latestChapter,
  compact = false,
}: MangaCardProps) {
  return (
    <Link
      to={`/manga/${slug}`}
      className={`ks-focus group block overflow-hidden rounded-xl border border-white/10 bg-surface transition hover:-translate-y-1 hover:border-purple/60 hover:shadow-[0_16px_36px_rgb(145_63_226_/_0.16)] ${compact ? "" : ""}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-purple/40 via-elevated to-black/40">
        {cover ? (
          <img
            src={cover}
            alt={`${title} cover`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col justify-end bg-[radial-gradient(circle_at_70%_20%,rgb(167_139_250_/_0.35),transparent_35%),linear-gradient(145deg,#3b1d62,#15121d_70%)] p-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-soft/80">KomikStream</span>
            <span className="mt-2 line-clamp-3 text-2xl font-black leading-tight text-white/90">{title}</span>
            <span className="mt-3 text-[10px] font-medium uppercase tracking-wide text-white/45">Cover belum tersedia</span>
          </div>
        )}
        {latestChapter && (
          <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur">
            {latestChapter}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-white/90 transition group-hover:text-purple-soft">
          {title}
        </h3>
        <p className="mt-1 text-xs text-white/40">Baca chapter terbaru</p>
      </div>
    </Link>
  );
}

export function getCover(chapters: unknown): string | undefined {
  if (!Array.isArray(chapters)) return undefined;
  const cover = chapters.find(
    (item): item is { cover?: unknown } => typeof item === "object" && item !== null,
  )?.cover;
  return typeof cover === "string" && cover.length > 0 ? cover : undefined;
}

export function getLatestChapter(chapters: unknown): string | undefined {
  if (!Array.isArray(chapters)) return undefined;
  const chapter = chapters.find(
    (item): item is { chapterId?: unknown; slug?: unknown; chapter?: unknown } =>
      typeof item === "object" && item !== null,
  );
  const value = chapter?.chapterId ?? chapter?.slug ?? chapter?.chapter;
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value.replace(/^[a-z0-9-]+-chapter-/i, "Ch. ").replace(/^chapter-/i, "Ch. ");
}
