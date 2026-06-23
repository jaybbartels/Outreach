'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company } from '@/lib/types'
import CompanyComments from '../CompanyComments'

export default function CompanyPanel({
  domainId,
  selectedCompanyId,
  onSelectCompany,
}: {
  domainId: string
  selectedCompanyId: string
  onSelectCompany: (id: string) => void
}) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(false)
  const [findingExecs, setFindingExecs] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [domainId])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('domain_id', domainId)
        .order('name')

      if (!error && data) {
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.from('companies').insert([
        {
          name: newCompanyName,
          status: 'pending',
          domain_id: domainId,
        },
      ]).select()

      if (!error && data && data.length > 0) {
        onSelectCompany(data[0].id)
        setNewCompanyName('')
        setShowAddForm(false)
        await fetchCompanies()
      }
    } catch (error) {
      console.error('Error adding company:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    if (!window.confirm('Delete this company and all associated executives?')) return

    try {
      await supabase.from('executives').delete().eq('company_id', companyId)
      await supabase.from('companies').delete().eq('id', companyId)
      onSelectCompany('')
      await fetchCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  const handleFindExecutives = async (companyId: string) => {
    setFindingExecs(true)
    try {
      const company = companies.find((c) => c.id === companyId)
      if (!company) return

      // In a real scenario, this would call an external API (Hunter.io, LinkedIn, etc)
      // For now, we'll just show a placeholder
      alert(`Find Executives feature for ${company.name} would integrate with discovery services`)
      
      // Example: You could add executives manually or via API
      // const { data } = await supabase.from('executives').insert([...]).select()
    } finally {
      setFindingExecs(false)
    }
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-bold text-lg mb-3">🏢 Companies</h2>

        {!showAddForm ? (
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              if (e.target.value === 'add-new') {
                setShowAddForm(true)
              } else {
                onSelectCompany(e.target.value)
              }
            }}
            className="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="">Select a company...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
            <option value="add-new">➕ Add New Company</option>
          </select>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Company name"
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCompany}
                disabled={loading || !newCompanyName.trim()}
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

      {selectedCompany && !showAddForm && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-base">{selectedCompany.name}</h3>
              {selectedCompany.hq_location && (
                <p className="text-sm text-gray-600">📍 {selectedCompany.hq_location}</p>
              )}
            </div>
            <button
              onClick={() => handleDeleteCompany(selectedCompany.id!)}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              🗑️ Delete
            </button>
          </div>

          <button
            onClick={() => handleFindExecutives(selectedCompany.id!)}
            disabled={findingExecs}
            className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm mb-3 disabled:opacity-50"
          >
            {findingExecs ? '🔍 Searching...' : '🔍 Find Executives'}
          </button>

          <CompanyComments companyId={selectedCompany.id!} domainId={domainId} />
        </div>
      )}

      <div className="p-4 flex-1 overflow-y-auto">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left font-semibold text-sm mb-2 hover:text-blue-600"
        >
          {expanded ? '▼' : '▶'} All Companies ({companies.length})
        </button>
        {expanded && (
          <div className="space-y-1">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company.id!)}
                className={`w-full text-left text-sm p-2 rounded transition ${
                  selectedCompanyId === company.id
                    ? 'bg-blue-100 border border-blue-300 font-semibold'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
