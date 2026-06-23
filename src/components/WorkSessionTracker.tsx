'use client'

import { useEffect, useState } from 'react'

interface WorkSession {
  id: string
  status: string
  user_email: string
  started_at: string
  ended_at: string | null
}

export default function WorkSessionTracker({
  companyId,
  companyName,
  domainId,
}: {
  companyId: string
  companyName: string
  domainId: string
}) {
  const [session, setSession] = useState<WorkSession | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [userEmail, setUserEmail] = useState('user@example.com')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWorkSession()
  }, [companyId])

  const fetchWorkSession = async () => {
    try {
      const response = await fetch(`/api/work-sessions?company_id=${companyId}`)
      const { data } = await response.json()
      setSession(data)
      setIsWorking(data?.status === 'in_progress')
    } catch (error) {
      console.error('Error fetching work session:', error)
    }
  }

  const handleToggleWork = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/work-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          user_email: userEmail,
          action: isWorking ? 'end' : 'start',
          domain_id: domainId,
        }),
      })

      if (response.ok) {
        await fetchWorkSession()
      }
    } catch (error) {
      console.error('Error toggling work session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="font-bold mb-3">👤 Working On</h3>

      <div className="space-y-2">
        <input
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="Your email"
          className="w-full px-3 py-2 border rounded text-sm"
        />

        <button
          onClick={handleToggleWork}
          disabled={loading}
          className={`w-full px-4 py-2 rounded font-semibold text-white ${
            isWorking
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } disabled:opacity-50`}
        >
          {loading
            ? 'Updating...'
            : isWorking
            ? '✓ Done Working'
            : '▶ Start Working'}
        </button>

        {session && session.status === 'in_progress' && (
          <p className="text-sm text-gray-700">
            <strong>{session.user_email}</strong> is currently working on{' '}
            <strong>{companyName}</strong>
          </p>
        )}
      </div>
    </div>
  )
}
