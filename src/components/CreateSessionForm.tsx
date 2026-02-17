'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Fellow {
  id: string
  name: string
}

interface Supervisor {
  id: string
  name: string
}

export function CreateSessionForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fellows, setFellows] = useState<Fellow[]>([])
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [formData, setFormData] = useState({
    fellowId: '',
    supervisorId: '',
    date: '',
    groupId: '',
    transcript: '',
  })

  // Fetch fellows and supervisors when form opens
  useEffect(() => {
    if (isOpen && fellows.length === 0) {
      fetch('/api/sessions')
        .then(res => res.json())
        .then(data => {
          setFellows(data.fellows || [])
          setSupervisors(data.supervisors || [])
          // Set default values if available
          if (data.fellows?.length > 0) {
            setFormData(prev => ({ ...prev, fellowId: data.fellows[0].id }))
          }
          if (data.supervisors?.length > 0) {
            setFormData(prev => ({ ...prev, supervisorId: data.supervisors[0].id }))
          }
        })
        .catch(console.error)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to create session')
        return
      }

      // Success - refresh the page and close form
      router.refresh()
      setIsOpen(false)
      setFormData({
        fellowId: fellows[0]?.id || '',
        supervisorId: supervisors[0]?.id || '',
        date: '',
        groupId: '',
        transcript: '',
      })
    } catch (error) {
      console.error(error)
      alert('Failed to create session')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        + New Session
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Create New Session</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fellow
                </label>
                <select
                  required
                  value={formData.fellowId}
                  onChange={e => setFormData({ ...formData, fellowId: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Fellow</option>
                  {fellows.map(fellow => (
                    <option key={fellow.id} value={fellow.id}>
                      {fellow.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor
                </label>
                <select
                  required
                  value={formData.supervisorId}
                  onChange={e => setFormData({ ...formData, supervisorId: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map(supervisor => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Group A"
                  value={formData.groupId}
                  onChange={e => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transcript
              </label>
              <textarea
                required
                rows={12}
                placeholder="Paste the session transcript here..."
                value={formData.transcript}
                onChange={e => setFormData({ ...formData, transcript: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste the full session transcript. The AI will analyze it automatically.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
