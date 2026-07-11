'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Executive } from '@/lib/types'

interface Props {
  selectedCollection?: string
}

export default function ExecutiveSearch({ selectedCollection = '' }: Props) {
  const [executives, setExecutives] = useState<Executive[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadExecutives()
  }, [selectedCollection])

  const loadExecutives = async () => {
    setLoading(true)
    try {
      if (selectedCollection) {
        const response = await api.getExecutives(selectedCollection)
        setExecutives(response.data?.executives || [])
      } else {
        const response = await api.getExecutives()
        setExecutives(response.data?.executives || [])
      }
      setMessage('')
    } catch (error) {
      console.error('Error loading executives:', error)
      setMessage('Failed to load executives')
      setExecutives([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Executive Search</h2>
        {selectedCollection && (
          <p className="text-gray-600">Collection: {selectedCollection}</p>
        )}
      </div>

      {loading && <div className="text-center py-8">Loading executives...</div>}

      {message && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {message}
        </div>
      )}

      {executives.length > 0 ? (
        <div className="space-y-4">
          {executives.map((exec) => (
            <div key={exec.id} className="p-4 border rounded-lg hover:shadow-md transition">
              <h3 className="font-semibold text-lg">{exec.name}</h3>
              <p className="text-gray-600">{exec.title}</p>
              <p className="text-sm text-gray-500">Email: {exec.email || 'N/A'}</p>
              <p className="text-sm text-gray-500">Phone: {exec.phone || 'N/A'}</p>
            </div>
          ))}
        </div>
      ) : (
        !loading && <div className="text-center text-gray-500 py-8">No executives found</div>
      )}
    </div>
  )
}
