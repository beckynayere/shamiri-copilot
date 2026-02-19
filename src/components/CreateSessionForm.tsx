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
  email: string
}

const PREDEFINED_GROUPS = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F']

export function CreateSessionForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fellows, setFellows] = useState<Fellow[]>([])
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [groups] = useState(PREDEFINED_GROUPS)
  
  // New entity states
  const [showNewFellow, setShowNewFellow] = useState(false)
  const [showNewSupervisor, setShowNewSupervisor] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newFellowName, setNewFellowName] = useState('')
  const [newSupervisorName, setNewSupervisorName] = useState('')
  const [newSupervisorEmail, setNewSupervisorEmail] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  
  const [formData, setFormData] = useState({
    fellowId: '',
    supervisorId: '',
    date: '',
    groupId: '',
    transcript: '',
  })

  // Fetch fellows and supervisors when form opens
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/fellows').then(r => r.json()),
        fetch('/api/supervisors').then(r => r.json())
      ]).then(([fellowsData, supervisorsData]) => {
        setFellows(fellowsData)
        setSupervisors(supervisorsData)
        // Set defaults
        if (fellowsData.length > 0) {
          setFormData(prev => ({ ...prev, fellowId: fellowsData[0].id }))
        }
        if (supervisorsData.length > 0) {
          setFormData(prev => ({ ...prev, supervisorId: supervisorsData[0].id }))
        }
      })
    }
  }, [isOpen])

  const handleCreateFellow = async () => {
    if (!newFellowName.trim()) return
    const res = await fetch('/api/fellows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFellowName })
    })
    if (res.ok) {
      const fellow = await res.json()
      setFellows([...fellows, fellow])
      setFormData({ ...formData, fellowId: fellow.id })
      setNewFellowName('')
      setShowNewFellow(false)
    }
  }

  const handleCreateSupervisor = async () => {
    if (!newSupervisorName.trim() || !newSupervisorEmail.trim()) return
    const res = await fetch('/api/supervisors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSupervisorName, email: newSupervisorEmail })
    })
    if (res.ok) {
      const supervisor = await res.json()
      setSupervisors([...supervisors, supervisor])
      setFormData({ ...formData, supervisorId: supervisor.id })
      setNewSupervisorName('')
      setNewSupervisorEmail('')
      setShowNewSupervisor(false)
    }
  }

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return
    if (!groups.includes(newGroupName)) {
      // Just use the new group name directly in the form
      setFormData({ ...formData, groupId: newGroupName })
    }
    setNewGroupName('')
    setShowNewGroup(false)
  }

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

      // Success
      router.refresh()
      setIsOpen(false)
      setFormData({
        fellowId: fellows[0]?.id || '',
        supervisorId: supervisors[0]?.id || '',
        date: '',
        groupId: '',
        transcript: '',
      })
      window.location.reload()
    } catch (error) {
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
            {/* Fellow Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fellow
              </label>
              <div className="flex gap-2">
                <select
                  required
                  value={formData.fellowId}
                  onChange={e => setFormData({ ...formData, fellowId: e.target.value })}
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Fellow</option>
                  {fellows.map(fellow => (
                    <option key={fellow.id} value={fellow.id}>
                      {fellow.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewFellow(!showNewFellow)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  + New
                </button>
              </div>
              {showNewFellow && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="New Fellow name"
                    value={newFellowName}
                    onChange={e => setNewFellowName(e.target.value)}
                    className="flex-1 p-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFellow}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Supervisor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor
              </label>
              <div className="flex gap-2">
                <select
                  required
                  value={formData.supervisorId}
                  onChange={e => setFormData({ ...formData, supervisorId: e.target.value })}
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map(supervisor => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewSupervisor(!showNewSupervisor)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  + New
                </button>
              </div>
              {showNewSupervisor && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Supervisor name"
                    value={newSupervisorName}
                    onChange={e => setNewSupervisorName(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Supervisor email"
                    value={newSupervisorEmail}
                    onChange={e => setNewSupervisorEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSupervisor}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Add Supervisor
                  </button>
                </div>
              )}
            </div>

            {/* Date and Group */}
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
                  Group
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.groupId}
                    onChange={e => setFormData({ ...formData, groupId: e.target.value })}
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewGroup(!showNewGroup)}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    + New
                  </button>
                </div>
                {showNewGroup && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="New Group name"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      className="flex-1 p-2 border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleAddGroup}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transcript
              </label>
              <textarea
                required
                rows={10}
                placeholder="Paste the session transcript here..."
                value={formData.transcript}
                onChange={e => setFormData({ ...formData, transcript: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste the full session transcript. The AI will analyze it automatically.
              </p>
            </div>

            {/* Submit Buttons */}
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
