import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

type Props = { params: Promise<{ mangaId: string }> }

export default async function KomikDetailRedirect({ params }: Props) {
  const { mangaId } = await params
  const manga = await prisma.komik.findFirst({
    where: { OR: [{ id: mangaId }, { slug: mangaId }] },
    select: { slug: true },
  })
  redirect(manga ? `/manga/${manga.slug}` : '/manga')
}