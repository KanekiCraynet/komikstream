import { prisma } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const results = q
    ? await prisma.komik.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })
    : []

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <form className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari manga…"
          className="flex-1 rounded border px-4 py-2"
        />
        <button type="submit" className="rounded bg-blue-600 px-6 py-2 text-white">
          Cari
        </button>
      </form>

      {q && results.length === 0 && (
        <p className="py-12 text-center text-gray-500">Tidak ditemukan &quot;{q}&quot;.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {results.map((m) => (
          <Link
            key={m.id}
            href={`/manga/${m.slug}`}
            className="rounded-lg border p-3 transition hover:shadow-lg"
          >
            <h2 className="line-clamp-2 text-sm font-medium">{m.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}