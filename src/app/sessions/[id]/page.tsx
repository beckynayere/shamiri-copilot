import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { SessionDetail } from '@/components/SessionDetail'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      fellow: true,
      aiAnalysis: true,
    },
  })

  if (!session) notFound()

  return <SessionDetail session={session} />
}