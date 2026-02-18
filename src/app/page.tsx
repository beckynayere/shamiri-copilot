import { prisma } from '@/lib/prisma'
import { SessionList } from '@/components/SessionList'
import { CreateSessionForm } from '@/components/CreateSessionForm'
import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  
  // If not logged in, redirect to login
  if (!session) {
    redirect('/login')
  }

  const { page } = await searchParams
  const currentPage = parseInt(page || '1', 10)
  const pageSize = 10

  const [sessions, totalCount] = await Promise.all([
    prisma.session.findMany({
      include: {
        fellow: true,
        aiAnalysis: true,
      },
      orderBy: { date: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.session.count(),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

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
      <SessionList 
        sessions={sessions} 
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </main>
  )
}
