import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import MangaReader from '@/components/MangaReader'
import { getUserTier } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function ChapterPage({ params }: Props) {
  const { id } = await params
  const chapter = await prisma.komikChapter.findUnique({ where: { chapterId: id } })
  if (!chapter) notFound()

  const images = (chapter.images as string[]) ?? []
  const manga = await prisma.komik.findUnique({ where: { id: chapter.komikId } })
  const tier = await getUserTier()

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      {manga && (
        <Link
          href={`/manga/${manga.slug}`}
          className="mb-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Kembali ke {manga.title}
        </Link>
      )}

      {images.length > 0 ? (
        <MangaReader chapterId={chapter.chapterId} images={images} tier={tier} />
      ) : (
        <p className="py-12 text-center text-gray-500">Chapter kosong.</p>
      )}
    </div>
  )
}
