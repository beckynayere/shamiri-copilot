'use client'

import { Session, Fellow, AIAnalysis } from '@prisma/client'
import Link from 'next/link'
import { format } from 'date-fns'

type SessionWithDetails = Session & {
  fellow: Fellow
  aiAnalysis: AIAnalysis | null
}

type SessionListProps = {
  sessions: SessionWithDetails[]
  currentPage?: number
  totalPages?: number
  totalCount?: number
}

export function SessionList({ sessions, currentPage = 1, totalPages = 1, totalCount }: SessionListProps) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Fellow</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Group</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">AI Risk</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No sessions found. Create a new session to get started.
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{session.fellow.name}</td>
                  <td className="px-4 py-3">{format(new Date(session.date), 'PP')}</td>
                  <td className="px-4 py-3">{session.groupId}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-4 py-3">
                    {session.aiAnalysis ? (
                      <RiskBadge risk={session.aiAnalysis.riskFlag} />
                    ) : (
                      <span className="text-gray-400">No analysis</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/sessions/${session.id}`}
                      className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-gray-600">
            {totalCount !== undefined && (
              <span>Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} sessions</span>
            )}
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/?page=${currentPage - 1}`}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/?page=${currentPage + 1}`}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSED: 'bg-blue-100 text-blue-800',
    FLAGGED: 'bg-red-100 text-red-800',
    SAFE: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}

function RiskBadge({ risk }: { risk: 'SAFE' | 'RISK' }) {
  return risk === 'RISK' ? (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
      RISK
    </span>
  ) : (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      SAFE
    </span>
  )
}
