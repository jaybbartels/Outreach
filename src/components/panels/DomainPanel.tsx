'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import DomainComments from '../DomainComments'

interface Domain {
  id: string
  name: string
  slug: string
  icon: string
}

export default function DomainPanel({
  domains,
  selectedDomainId,
  onSelectDomain,
}: {
  domains: Domain[]
  selectedDomainId: string
  onSelectDomain: (id: string) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDomainName, setNewDomainName] = useState('')
  const [newDomainSlug, setNewDomainSlug] = useState('')
  const [newDomainIcon, setNewDomainIcon] = useState('🏢')
  const [loading, setLoading] = useState(false)
  const selectedDomain = domains.find((d) => d.id === selectedDomainId)

  const handleAddDomain = async () => {
    if (!newDomainName.trim() || !newDomainSlug.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('domains')
        .insert([
          {
            name: newDomainName,
            slug: newDomainSlug,
            icon: newDomainIcon,
            status: 'active',
          },
        ])
        .select()

      if (!error && data && data.length > 0) {
        onSelectDomain(data[0].id)
        setNewDomainName('')
        setNewDomainSlug('')
        setNewDomainIcon('🏢')
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding domain:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-bold text-lg mb-3">📍 Domain</h2>

        {!showAddForm ? (
          <>
            <select
              value={selectedDomainId}
              onChange={(e) => {
                if (e.target.value === 'add-new') {
                  setShowAddForm(true)
                } else {
                  onSelectDomain(e.target.value)
                }
              }}
              className="w-full px-3 py-2 border rounded"
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.icon} {domain.name}
                </option>
              ))}
              <option value="add-new">➕ Add New Domain</option>
            </select>
          </>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              placeholder="Domain name"
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              value={newDomainSlug}
              onChange={(e) => setNewDomainSlug(e.target.value)}
              placeholder="Slug"
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              value={newDomainIcon}
              onChange={(e) => setNewDomainIcon(e.target.value)}
              placeholder="Icon"
              className="w-full px-3 py-2 border rounded text-sm"
              maxLength={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddDomain}
                disabled={loading || !newDomainName.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-3 py-2 bg-gray-300 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedDomain && !showAddForm && (
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-600">Slug: <strong>{selectedDomain.slug}</strong></p>
          </div>
          <DomainComments domainId={selectedDomain.id} />
        </div>
      )}
    </div>
  )
}
