'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, Fellow, AIAnalysis } from '@prisma/client'
import { format } from 'date-fns'

type SessionDetailProps = {
  session: Session & {
    fellow: Fellow
    aiAnalysis: AIAnalysis | null
  }
}

export function SessionDetail({ session }: SessionDetailProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(session.aiAnalysis)
  const [validationNote, setValidationNote] = useState('')
  const [validatedStatus, setValidatedStatus] = useState<'SAFE' | 'FLAGGED' | null>(null)
  const router = useRouter()

  // Use the initial analysis from the session
  const displayAnalysis = analysis || session.aiAnalysis

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      })
      if (!res.ok) throw new Error('Failed to analyze')
      const data = await res.json()
      
      // The API returns the raw AI response, we need to transform it
      setAnalysis({
        id: '',
        sessionId: session.id,
        summary: data.summary || 'No summary available',
        contentScore: data.metrics?.contentCoverage?.score || data.contentScore || 0,
        facilitationScore: data.metrics?.facilitationQuality?.score || data.facilitationScore || 0,
        protocolScore: data.metrics?.protocolSafety?.score || data.safetyScore || 0,
        justification: `Content: ${data.metrics?.contentCoverage?.score || data.contentScore || 0}/3, Facilitation: ${data.metrics?.facilitationQuality?.score || data.facilitationScore || 0}/3, Protocol: ${data.metrics?.protocolSafety?.score || data.safetyScore || 0}/3`,
        riskFlag: data.riskDetection?.status || data.riskFlag || 'SAFE',
        riskQuote: data.riskDetection?.quote || data.riskQuote || null,
        validated: false,
        supervisorNote: null,
      })
      router.refresh() // to reflect status change on dashboard
    } catch (error) {
      console.error(error)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleValidate = async (status: 'SAFE' | 'FLAGGED') => {
    // Send validation to API
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          validatedStatus: status,
          note: validationNote,
        }),
      })
      if (!res.ok) throw new Error('Validation failed')
      setValidatedStatus(status)
      router.refresh()
    } catch (error) {
      alert('Failed to save validation')
    }
  }

  return (
    <div className="container mx-auto p-4">
      {/* Metadata */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Session Details</h1>
        <p>Fellow: {session.fellow.name}</p>
        <p>Date: {format(new Date(session.date), 'PPP')}</p>
        <p>Group: {session.groupId}</p>
        <p>Status: <span className="font-semibold">{session.status}</span></p>
      </div>

      {/* Transcript */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Transcript</h2>
        <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-sm">
          {session.transcript}
        </div>
      </div>

      {/* AI Analysis Card */}
      {displayAnalysis ? (
        <div className="mb-8 border rounded-lg p-6 bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">AI Analysis</h2>
          <p className="mb-2"><span className="font-medium">Summary:</span> {displayAnalysis.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <ScoreCard
              title="Content Coverage"
              score={displayAnalysis.contentScore}
              justification={displayAnalysis.justification}
            />
            <ScoreCard
              title="Facilitation Quality"
              score={displayAnalysis.facilitationScore}
              justification={displayAnalysis.justification}
            />
            <ScoreCard
              title="Protocol Safety"
              score={displayAnalysis.protocolScore}
              justification={displayAnalysis.justification}
            />
          </div>

          {displayAnalysis.riskFlag === 'RISK' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="font-bold text-red-700">⚠️ RISK DETECTED</p>
              <p className="text-red-600">Quote: "{displayAnalysis.riskQuote}"</p>
            </div>
          )}

          {/* Supervisor Validation */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold mb-2">Supervisor Validation</h3>
            <textarea
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Add a note (optional)"
              value={validationNote}
              onChange={(e) => setValidationNote(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleValidate('SAFE')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ✓ Validate as Safe
              </button>
              <button
                onClick={() => handleValidate('FLAGGED')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ⚠️ Confirm Risk
              </button>
            </div>
            {displayAnalysis.supervisorNote && (
              <p className="mt-2 text-sm text-gray-600">
                Supervisor note: {displayAnalysis.supervisorNote}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-6 border rounded bg-gray-50 text-center">
          <p className="mb-4">No AI analysis yet. Generate one to see insights.</p>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </div>
      )}
    </div>
  )
}

function ScoreCard({ title, score, justification }: { title: string; score: number; justification: string }) {
  const scoreLabels = ['', 'Missed/Poor', 'Partial/Adequate', 'Complete/Excellent']
  return (
    <div className="p-3 border rounded">
      <h4 className="font-medium">{title}</h4>
      <div className="flex items-center gap-1 my-1">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              s <= score ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {s}
          </span>
        ))}
        <span className="ml-2 text-sm">{scoreLabels[score]}</span>
      </div>
      <p className="text-sm text-gray-600">{justification}</p>
    </div>
  )
}