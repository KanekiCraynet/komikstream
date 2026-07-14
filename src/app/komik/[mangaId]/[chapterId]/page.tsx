import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

type Props = {
  params: Promise<{ mangaId: string; chapterId: string }>
}

export default async function KomikRedirect({ params }: Props) {
  const { mangaId, chapterId } = await params
  const manga = await prisma.komik.findUnique({ where: { id: mangaId } })
  if (!manga) return redirect('/manga')

  const chapter = await prisma.komikChapter.findUnique({ where: { chapterId } })
  if (!chapter) return redirect(`/manga/${manga.slug}`)

  redirect(`/chapter/${chapter.chapterId}`)
}