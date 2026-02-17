import { prisma } from '@/lib/prisma'
import { SessionList } from '@/components/SessionList'
import { CreateSessionForm } from '@/components/CreateSessionForm'

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Supervisor Copilot</h1>
        <CreateSessionForm />
      </div>
      <SessionList sessions={sessions} />
    </main>
  )
}