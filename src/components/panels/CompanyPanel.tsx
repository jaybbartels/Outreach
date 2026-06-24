'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company, Executive } from '@/lib/types'
import CompanyComments from '../CompanyComments'

export default function CompanyPanel({
  collectionId,
  selectedCompanyId,
  onSelectCompany,
}: {
  collectionId: string
  selectedCompanyId: string
  onSelectCompany: (id: string) => void
}) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(false)
  const [findingExecs, setFindingExecs] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [discipline, setDiscipline] = useState('')

  useEffect(() => {
    fetchCompanies()
  }, [collectionId])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('collection_companies')
        .select('company_id, companies(*)')
        .eq('collection_id', collectionId)

      if (!error && data) {
        const companiesData = data
          .map((row: any) => row.companies)
          .filter((c: Company | null) => c !== null)
        setCompanies(companiesData)
        console.log('Fetched companies:', companiesData.length)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return

    setLoading(true)
    try {
      // Check if company already exists
      console.log('Checking if company exists:', newCompanyName)
      const { data: existingCompanies, error: searchError } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', newCompanyName)

      if (searchError) throw searchError

      let companyId: string

      if (existingCompanies && existingCompanies.length > 0) {
        // Company exists - use it
        console.log('Company already exists:', existingCompanies[0].id)
        companyId = existingCompanies[0].id

        // Check if it's already in this collection
        const { data: alreadyInCollection, error: checkError } = await supabase
          .from('collection_companies')
          .select('id')
          .eq('collection_id', collectionId)
          .eq('company_id', companyId)

        if (checkError) throw checkError

        if (alreadyInCollection && alreadyInCollection.length > 0) {
          alert('This company is already in this collection')
          setLoading(false)
          return
        }
      } else {
        // Company doesn't exist - create it
        console.log('Creating new company:', newCompanyName)
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert([
            {
              name: newCompanyName,
              status: 'pending',
            },
          ])
          .select()

        if (createError) {
          console.error('Error creating company:', createError)
          alert('Failed to create company: ' + createError.message)
          setLoading(false)
          return
        }

        if (!newCompany || newCompany.length === 0) {
          alert('Company created but no data returned')
          setLoading(false)
          return
        }

        companyId = newCompany[0].id
        console.log('Created new company:', companyId)
      }

      // Add company to collection
      console.log('Adding company to collection:', collectionId, companyId)
      const { error: collectionError } = await supabase
        .from('collection_companies')
        .insert([
          {
            collection_id: collectionId,
            company_id: companyId,
          },
        ])

      if (collectionError) {
        console.error('Error adding to collection:', collectionError)
        alert('Failed to add company to collection: ' + collectionError.message)
        setLoading(false)
        return
      }

      console.log('Success! Added company to collection')
      onSelectCompany(companyId)
      setNewCompanyName('')
      setShowAddForm(false)
      await fetchCompanies()
      alert('Company added successfully!')
    } catch (error) {
      console.error('Error adding company:', error)
      alert('Unexpected error: ' + error)
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

  // FIND EXECUTIVES - Uses Claude API + Hunter.io
  const handleFindExecutives = async (company: Company) => {
    if (!company || !company.name) {
      alert('Invalid company')
      return
    }

    setFindingExecs(true)
    setSearchResults([])

    try {
      console.log('Discovering executives for:', company.name)

      // Call the research/executives API
      const response = await fetch('/api/research/executives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          discipline: discipline || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('API error:', result)
        alert('Error discovering executives: ' + (result.error || 'Unknown error'))
        setFindingExecs(false)
        return
      }

      console.log('Discovery result:', result)

      if (result.executives && result.executives.length > 0) {
        setSearchResults(result.executives)
        alert(`Found ${result.count} executives! (${result.incomplete} need more research)`)
      } else {
        alert('No executives found. Try adding them manually.')
      }
    } catch (error) {
      console.error('Error discovering executives:', error)
      alert('Error: ' + error)
    } finally {
      setFindingExecs(false)
    }
  }

  // Quick add from search results
  const handleAddExecutiveToCompany = async (executive: any) => {
    if (!selectedCompanyId) {
      alert('Please select a company first')
      return
    }

    try {
      const selectedCompanyName = companies.find((c) => c.id === selectedCompanyId)?.name

      // Check if already exists
      const { data: existing, error: checkError } = await supabase
        .from('executives')
        .select('id')
        .eq('company_id', selectedCompanyId)
        .eq('name', executive.name)

      if (checkError) throw checkError

      if (existing && existing.length > 0) {
        alert('This executive already exists for this company')
        return
      }

      // Create new executive for this company
      const { data, error } = await supabase
        .from('executives')
        .insert([
          {
            name: executive.name,
            title: executive.title || 'Unknown Title',
            company_id: selectedCompanyId,
            email: executive.email,
            linkedin_url: executive.linkedin_url,
            phone: executive.phone,
          },
        ])
        .select()

      if (error) throw error

      alert(`Added ${executive.name} to ${selectedCompanyName}`)
      setSearchResults([])
      window.location.reload()
    } catch (error) {
      console.error('Error adding executive:', error)
      alert('Failed to add executive: ' + error)
    }
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)
  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high':
        return '✅'
      case 'medium':
        return '⚠️'
      case 'low':
        return '❌'
      default:
        return '⚪'
    }
  }

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
                console.log('Selected company:', e.target.value)
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
              placeholder="Company name (e.g., Formic)"
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
        <div className="p-4 border-b-2 border-blue-200 bg-blue-100 overflow-y-auto flex-1">
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

          {/* Discipline Filter */}
          <input
            type="text"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            placeholder="e.g., CEO, CTO (optional)"
            className="w-full px-3 py-1 border-2 border-blue-300 rounded text-sm mb-2"
          />

          {/* Find Executives Button */}
          <button
            onClick={() => handleFindExecutives(selectedCompany)}
            disabled={findingExecs}
            className="w-full px-4 py-2 bg-green-600 text-white rounded font-semibold mb-3 hover:bg-green-700 disabled:opacity-50"
          >
            {findingExecs ? '🔍 Researching (using Claude + Hunter.io)...' : '🔍 Discover Executives'}
          </button>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-3 p-2 bg-white rounded border border-green-300">
              <h4 className="font-semibold text-sm mb-2">Found {searchResults.length} executives:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {searchResults.map((exec: any) => (
                  <button
                    key={exec.id}
                    onClick={() => handleAddExecutiveToCompany(exec)}
                    className="w-full text-left text-xs p-2 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{exec.name}</p>
                        <p className="text-gray-600">{exec.title}</p>
                        {exec.email && <p className="text-blue-600">{exec.email}</p>}
                      </div>
                      <span className="text-lg">{getConfidenceBadge(exec.confidence_level)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <CompanyComments companyId={selectedCompany.id} collectionId={collectionId} />
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
                onClick={() => {
                  console.log('Clicking company:', company.id)
                  onSelectCompany(company.id || '')
                }}
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
