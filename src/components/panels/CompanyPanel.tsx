'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company } from '@/lib/types'
import CompanyComments from '../CompanyComments'

interface DiscoveredExecutive {
  name: string
  title: string
  email?: string
  linkedin_url?: string
}

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
        onSelectCompany(data[0].id || '')
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

      const executiveData: DiscoveredExecutive[] = await simulateExecutiveDiscovery(company.name)
      
      if (executiveData && executiveData.length > 0) {
        for (const exec of executiveData) {
          const { data: existing } = await supabase
            .from('executives')
            .select('id')
            .eq('company_id', companyId)
            .eq('name', exec.name)
            .limit(1)

          if (!existing || existing.length === 0) {
            await supabase.from('executives').insert([
              {
                name: exec.name,
                title: exec.title,
                company_id: companyId,
                domain_id: domainId,
                email: exec.email || null,
                linkedin_url: exec.linkedin_url || null,
              },
            ])
          }
        }

        alert(`Found ${executiveData.length} executives. Added new ones to the list.`)
        window.location.reload()
      } else {
        alert('No executives found. Try searching manually.')
      }
    } catch (error) {
      console.error('Error finding executives:', error)
      alert('Error searching for executives')
    } finally {
      setFindingExecs(false)
    }
  }

  const simulateExecutiveDiscovery = async (companyName: string): Promise<DiscoveredExecutive[]> => {
    return []
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  return (
    <div className="bg-blue-50 rounded-lg shadow-lg border-4 border-blue-300 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-blue-400 border-b-4 border-blue-500">
        <h2 className="font-bold text-2xl text-white">🏢 COMPANIES</h2>
      </div>

      <div className="p-4 border-b-2 border-blue-200 bg-blue-100">
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
            className="w-full px-3 py-2 border-2 border-blue-400 rounded font-semibold"
          >
            <option value="">Select a company...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id || ''}>
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
              className="w-full px-3 py-2 border-2 border-blue-400 rounded text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCompany}
                disabled={loading || !newCompanyName.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-50"
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

      {/* Selected Company Details */}
      {selectedCompany && !showAddForm && (
        <div className="p-4 border-b-2 border-blue-200 bg-blue-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-blue-900">{selectedCompany.name}</h3>
              {selectedCompany.hq_location && (
                <p className="text-sm text-blue-700">📍 {selectedCompany.hq_location}</p>
              )}
            </div>
            <button
              onClick={() => handleDeleteCompany(selectedCompany.id || '')}
              className="px-3 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
            >
              🗑️ Delete
            </button>
          </div>

          <button
            onClick={() => handleFindExecutives(selectedCompany.id || '')}
            disabled={findingExecs}
            className="w-full px-4 py-2 bg-green-600 text-white rounded font-semibold mb-3 hover:bg-green-700 disabled:opacity-50"
          >
            {findingExecs ? '🔍 Searching...' : '🔍 Find Executives'}
          </button>

          {selectedCompany.id && <CompanyComments companyId={selectedCompany.id} domainId={domainId} />}
        </div>
      )}

      {/* Companies List */}
      <div className="p-4 flex-1 overflow-y-auto">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left font-semibold text-sm mb-2 text-blue-900 hover:text-blue-700"
        >
          {expanded ? '▼' : '▶'} All Companies ({companies.length})
        </button>
        {expanded && (
          <div className="space-y-1">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company.id || '')}
                className={`w-full text-left text-sm p-2 rounded transition font-semibold ${
                  selectedCompanyId === company.id
                    ? 'bg-blue-400 text-white border-2 border-blue-600'
                    : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedCompany && !showAddForm && (
        <div className="p-4 flex-1 flex items-center justify-center text-blue-700">
          <p className="text-center font-semibold">Select or create a company</p>
        </div>
      )}
    </div>
  )
}
