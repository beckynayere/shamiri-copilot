import { prisma } from '@/lib/prisma'
import { SessionList } from '@/components/SessionList'
import { CreateSessionForm } from '@/components/CreateSessionForm'
import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await auth()
  
  // If not logged in, redirect to login
  if (!session) {
    redirect('/login')
  }

  const sessions = await prisma.session.findMany({
    include: {
      fellow: true,
      aiAnalysis: true,
    },
    orderBy: { date: 'desc' },
  })

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Supervisor Copilot</h1>
          <p className="text-sm text-gray-600">Welcome, {session.user?.name || session.user?.email}</p>
        </div>
        <div className="flex gap-3 items-center">
          <CreateSessionForm />
          <form action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}>
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
      <SessionList sessions={sessions} />
    </main>
  )
}
