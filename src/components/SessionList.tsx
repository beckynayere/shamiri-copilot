'use client'

import { Session, Fellow, AIAnalysis } from '@prisma/client'
import Link from 'next/link'
import { format } from 'date-fns'

type SessionWithDetails = Session & {
  fellow: Fellow
  aiAnalysis: AIAnalysis | null
}

export function SessionList({ sessions }: { sessions: SessionWithDetails[] }) {
  return (
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
          {sessions.map((session) => (
            <tr key={session.id} className="border-t">
              <td className="px-4 py-2">{session.fellow.name}</td>
              <td className="px-4 py-2">{format(new Date(session.date), 'PP')}</td>
              <td className="px-4 py-2">{session.groupId}</td>
              <td className="px-4 py-2">
                <StatusBadge status={session.status} />
              </td>
              <td className="px-4 py-2">
                {session.aiAnalysis ? (
                  <RiskBadge risk={session.aiAnalysis.riskFlag} />
                ) : (
                  <span className="text-gray-400">No analysis</span>
                )}
              </td>
              <td className="px-4 py-2">
                <Link
                  href={`/sessions/${session.id}`}
                  className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
