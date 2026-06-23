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
        onSelectDomain(data[0].id || '')
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

  const handleDeleteDomain = async (domainId: string) => {
    if (!window.confirm('Delete this domain? All associated data will be removed.')) return

    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('domain_id', domainId)

      if (companies) {
        for (const company of companies) {
          if (company.id) {
            await supabase.from('executives').delete().eq('company_id', company.id)
          }
        }
      }

      await supabase.from('companies').delete().eq('domain_id', domainId)
      await supabase.from('domains').delete().eq('id', domainId)

      onSelectDomain('')
      window.location.reload()
    } catch (error) {
      console.error('Error deleting domain:', error)
    }
  }

  return (
    <div className="bg-yellow-50 rounded-lg shadow-lg border-4 border-yellow-300 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-yellow-300 border-b-4 border-yellow-400">
        <h2 className="font-bold text-2xl text-yellow-900">📍 DOMAINS</h2>
      </div>

      <div className="p-4 border-b-2 border-yellow-200 bg-yellow-100">
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
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded font-semibold"
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id || ''}>
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
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded text-sm"
            />
            <input
              type="text"
              value={newDomainSlug}
              onChange={(e) => setNewDomainSlug(e.target.value)}
              placeholder="Slug"
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded text-sm"
            />
            <input
              type="text"
              value={newDomainIcon}
              onChange={(e) => setNewDomainIcon(e.target.value)}
              placeholder="Icon"
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded text-sm"
              maxLength={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddDomain}
                disabled={loading || !newDomainName.trim()}
                className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded font-semibold disabled:opacity-50"
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

      {/* Selected Domain Details */}
      {selectedDomain && !showAddForm && (
        <div className="p-4 border-b-2 border-yellow-200 bg-yellow-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-yellow-900">{selectedDomain.name}</h3>
              <p className="text-sm text-yellow-700">Slug: {selectedDomain.slug}</p>
            </div>
            <button
              onClick={() => handleDeleteDomain(selectedDomain.id || '')}
              className="px-3 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
            >
              🗑️ Delete
            </button>
          </div>

          {selectedDomain.id && <DomainComments domainId={selectedDomain.id} />}
        </div>
      )}

      {/* Empty state */}
      {!selectedDomain && !showAddForm && (
        <div className="p-4 flex-1 flex items-center justify-center text-yellow-700">
          <p className="text-center font-semibold">Select or create a domain</p>
        </div>
      )}
    </div>
  )
}
