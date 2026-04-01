import { getAnimeSchedule } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ImageOff } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 900; // 15 minutes

export const metadata: Metadata = {
  title: "Jadwal Rilis Anime Terbaru Hari Ini",
  description:
    "Jadwal rilis anime sub Indo terbaru per hari. Cek anime ongoing yang tayang hari ini, update otomatis setiap minggu. Jangan ketinggalan episode terbaru!",
  alternates: { canonical: "/anime/schedule" },
};

const DAY_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu", "Random"];

const INDONESIAN_DAY_MAP: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 0,
};

function getTodayIndonesian(): string {
  const jsDay = new Date().getDay(); // 0=Sunday
  const entry = Object.entries(INDONESIAN_DAY_MAP).find(([, v]) => v === jsDay);
  return entry?.[0] || "";
}

function ScheduleCard({ title, slug, poster }: { title: string; slug: string; poster: string }) {
  return (
    <Link
      href={`/anime/${slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl",
        "bg-card/80 border-border/50 border backdrop-blur-sm transition-all duration-300",
        "hover:border-primary/50 hover:shadow-primary/20 hover:shadow-2xl"
      )}
    >
      <div className="bg-muted relative aspect-[2/3] overflow-hidden">
        {poster ? (
          <Image
            src={getImageUrl(poster)}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff className="text-muted-foreground h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="group-hover:text-primary line-clamp-2 text-sm leading-tight font-medium transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  );
}

export default async function AnimeSchedulePage() {
  let schedule: Awaited<ReturnType<typeof getAnimeSchedule>>;
  try {
    schedule = await getAnimeSchedule();
  } catch (err) {
    // During build, return empty so the build succeeds — ISR will populate on first request.
    // At runtime, re-throw so the error boundary shows a retry UI instead of caching empty state.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      schedule = [];
    } else {
      throw err;
    }
  }
  const today = getTodayIndonesian();

  // Sort days by DAY_ORDER
  const sorted = [...schedule].sort((a, b) => {
    const ia = DAY_ORDER.indexOf(a.day);
    const ib = DAY_ORDER.indexOf(b.day);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Calendar className="text-primary h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Jadwal Rilis Anime</h1>
          <p className="text-muted-foreground">Jadwal tayang anime setiap hari</p>
        </div>
      </div>

      <div className="space-y-10">
        {sorted.map((daySchedule) => {
          const isToday = daySchedule.day === today;
          return (
            <section key={daySchedule.day}>
              <div className="mb-4 flex items-center gap-2">
                <h2 className={cn("text-xl font-bold", isToday && "text-primary")}>
                  {daySchedule.day}
                </h2>
                {isToday && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                    Hari Ini
                  </span>
                )}
                <span className="text-muted-foreground text-sm">
                  ({daySchedule.animeList.length} anime)
                </span>
              </div>
              {daySchedule.animeList.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {daySchedule.animeList.map((anime) => (
                    <ScheduleCard
                      key={anime.slug}
                      title={anime.title}
                      slug={anime.slug}
                      poster={anime.poster}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Tidak ada anime untuk hari ini</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
