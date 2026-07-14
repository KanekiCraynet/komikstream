import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function MangaDetailPage({ params }: Props) {
  const { slug } = await params
  const manga = await prisma.komik.findUnique({ where: { slug } })
  if (!manga) notFound()

  const chapters = manga.chapters as { id: string; title: string }[] | null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">{manga.title}</h1>
      {chapters && chapters.length > 0 ? (
        <ul className="divide-y">
          {chapters.map((ch) => (
            <li key={ch.id}>
              <Link
                href={`/chapter/${ch.id}`}
                className="block px-4 py-3 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {ch.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-gray-500">Belum ada chapter.</p>
      )}
    </div>
  )
}