import { prisma } from '@/lib/prisma'
import { SessionList } from '@/components/SessionList'

export default async function HomePage() {
  const sessions = await prisma.session.findMany({
    include: {
      fellow: true,
      aiAnalysis: true, // to show AI risk flag if available
    },
    orderBy: { date: 'desc' },
  })

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Supervisor Copilot</h1>
      <SessionList sessions={sessions} />
    </main>
  )
}