'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Executive } from '@/lib/types'
import ExecutiveContactMethods from '../ExecutiveContactMethods'
import ExecutiveComments from '../ExecutiveComments'

export default function ExecutivePanel({
  companyId,
  domainId,
  selectedExecutiveId,
  onSelectExecutive,
}: {
  companyId: string
  domainId: string
  selectedExecutiveId: string
  onSelectExecutive: (id: string) => void
}) {
  const [executives, setExecutives] = useState<Executive[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExecName, setNewExecName] = useState('')
  const [newExecTitle, setNewExecTitle] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchExecutives()
  }, [companyId])

  const fetchExecutives = async () => {
    try {
      const { data, error } = await supabase
        .from('executives')
        .select('*')
        .eq('company_id', companyId)
        .order('name')

      if (!error && data) {
        setExecutives(data)
      }
    } catch (error) {
      console.error('Error fetching executives:', error)
    }
  }

  const handleAddExecutive = async () => {
    if (!newExecName.trim() || !newExecTitle.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.from('executives').insert([
        {
          name: newExecName,
          title: newExecTitle,
          company_id: companyId,
          domain_id: domainId,
          status: 'pending',
        },
      ]).select()

      if (!error && data && data.length > 0) {
        onSelectExecutive(data[0].id || '')
        setNewExecName('')
        setNewExecTitle('')
        setShowAddForm(false)
        await fetchExecutives()
      }
    } catch (error) {
      console.error('Error adding executive:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExecutive = async (executiveId: string) => {
    if (!executiveId) return
    if (!window.confirm('Delete this executive?')) return

    try {
      await supabase.from('executives').delete().eq('id', executiveId)
      onSelectExecutive('')
      await fetchExecutives()
    } catch (error) {
      console.error('Error deleting executive:', error)
    }
  }

  const selectedExecutive = executives.find((e) => e.id === selectedExecutiveId)
  const execId = selectedExecutive?.id

  return (
    <div className="bg-green-50 rounded-lg shadow-lg border-4 border-green-300 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-green-500 border-b-4 border-green-600">
        <h2 className="font-bold text-2xl text-white">👔 EXECUTIVES</h2>
      </div>

      <div className="p-4 border-b-2 border-green-200 bg-green-100">
        {!showAddForm ? (
          <select
            value={selectedExecutiveId}
            onChange={(e) => {
              if (e.target.value === 'add-new') {
                setShowAddForm(true)
              } else {
                onSelectExecutive(e.target.value)
              }
            }}
            className="w-full px-3 py-2 border-2 border-green-400 rounded font-semibold"
          >
            <option value="">Select an executive...</option>
            {executives.map((exec) => (
              <option key={exec.id} value={exec.id || ''}>
                {exec.name}
              </option>
            ))}
            <option value="add-new">➕ Add New Executive</option>
          </select>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={newExecName}
              onChange={(e) => setNewExecName(e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-2 border-2 border-green-400 rounded text-sm"
            />
            <input
              type="text"
              value={newExecTitle}
              onChange={(e) => setNewExecTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-3 py-2 border-2 border-green-400 rounded text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddExecutive}
                disabled={loading || !newExecName.trim()}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded font-semibold disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-3 py-2 bg-gray-400 text-white rounded font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Executive Details */}
      {selectedExecutive && !showAddForm && execId && (
        <div className="p-4 border-b-2 border-green-200 bg-green-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-green-900">{selectedExecutive.name}</h3>
              <p className="text-sm text-green-700">{selectedExecutive.title}</p>
            </div>
            <button
              onClick={() => handleDeleteExecutive(execId)}
              className="px-3 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
            >
              🗑️ Delete
            </button>
          </div>

          <ExecutiveContactMethods executiveId={execId} />
          <ExecutiveComments executiveId={execId} domainId={domainId} />
        </div>
      )}

      {/* Executives List */}
      <div className="p-4 flex-1 overflow-y-auto">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left font-semibold text-sm mb-2 text-green-900 hover:text-green-700"
        >
          {expanded ? '▼' : '▶'} All Executives ({executives.length})
        </button>
        {expanded && (
          <div className="space-y-1">
            {executives.map((exec) => (
              <button
                key={exec.id}
                onClick={() => onSelectExecutive(exec.id || '')}
                className={`w-full text-left text-sm p-2 rounded transition font-semibold ${
                  selectedExecutiveId === exec.id
                    ? 'bg-green-500 text-white border-2 border-green-700'
                    : 'bg-green-50 text-green-900 hover:bg-green-100'
                }`}
              >
                <p>{exec.name}</p>
                <p className="text-xs font-normal">{exec.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedExecutive && !showAddForm && (
        <div className="p-4 flex-1 flex items-center justify-center text-green-700">
          <p className="text-center font-semibold">Select or create an executive</p>
        </div>
      )}
    </div>
  )
}
