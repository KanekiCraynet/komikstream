import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function MangaPage() {
  const manga = await prisma.komik.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Manga</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {manga.map((m) => {
          const cover = (m.chapters as { cover?: string }[] | null)?.[0]?.cover
          return (
            <Link
              key={m.id}
              href={`/manga/${m.slug}`}
              className="group rounded-lg border p-3 transition hover:shadow-lg"
            >
              {cover && (
                <div className="mb-2 aspect-[3/4] overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt={m.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <h2 className="line-clamp-2 text-sm font-medium">{m.title}</h2>
            </Link>
          )
        })}
      </div>
      {manga.length === 0 && (
        <p className="py-12 text-center text-gray-500">Belum ada manga.</p>
      )}
    </div>
  )
}