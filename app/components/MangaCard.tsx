import { Link } from "react-router";

interface MangaCardProps {
  slug: string;
  title: string;
  cover?: string;
  latestChapter?: string;
  type?: string;
  compact?: boolean;
}

export default function MangaCard({
  slug,
  title,
  cover,
  latestChapter,
  type,
  compact = false,
}: MangaCardProps) {
  const chapterLabel = latestChapter
    ? latestChapter.replace(/^[a-z0-9-]+-chapter-/i, "Ch. ").replace(/^chapter-/i, "Ch. ")
    : undefined;

  if (compact) {
    return (
      <Link
        to={`/manga/${slug}`}
        className="ks-focus group flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-hover"
      >
        <img
          src={cover ?? "/favicon.svg"}
          alt={`${title} cover`}
          className="h-16 w-12 shrink-0 rounded-lg border border-white/[0.06] object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-white transition group-hover:text-purple-soft">
            {title}
          </h3>
          {chapterLabel && <p className="mt-0.5 text-xs text-white/45">{chapterLabel}</p>}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/manga/${slug}`}
      className="ks-focus group block min-w-0 rounded-xl transition duration-200 hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.08] bg-surface transition duration-200 group-hover:border-purple/70 group-hover:shadow-[0_12px_30px_rgb(145_63_226_/_0.18)]">
        {cover ? (
          <img
            src={cover}
            alt={`${title} cover`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-br from-purple/25 via-surface to-black p-3">
            <span className="line-clamp-3 text-base font-bold leading-tight text-white/80">{title}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
        {type && (
          <span className="absolute left-2 top-2 rounded bg-purple px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            {type}
          </span>
        )}
        {chapterLabel && (
          <span className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            {chapterLabel}
          </span>
        )}
      </div>
      <div className="pt-2.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-white/90 transition group-hover:text-purple-soft">
          {title}
        </h3>
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
