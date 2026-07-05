'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company, Executive } from '@/lib/types'

interface Props {
  selectedCollection?: string
}

export default function ExecutiveSearch({ selectedCollection = '' }: Props) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('')
  const [execLimit, setExecLimit] = useState('10')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [executives, setExecutives] = useState<Executive[]>([])

  useEffect(() => {
    loadCompanies()
  }, [selectedCollection])

  const loadCompanies = async () => {
    let query = supabase.from('companies').select('*')
    
    if (selectedCollection) {
      query = query.eq('industry', selectedCollection.toLowerCase())
    }
    
    const { data } = await query
    if (data) {
      setCompanies(data)
      setSelectedCompany('')
      setExecutives([])
    }
  }

  const loadExecutivesForCompany = async (companyId: string) => {
    const { data } = await supabase
      .from('executives')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (data) setExecutives(data)
  }

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId)
    const company = companies.find(c => c.id === companyId)
    setSelectedCompanyName(company?.name || '')
    loadExecutivesForCompany(companyId)
  }

  const handleDiscoverExecutives = async () => {
    if (!selectedCompany) {
      setMessage('❌ Please select a company')
      return
    }

    setLoading(true)
    setMessage('🔍 Discovering executives and enriching with contact info...')

    try {
      const response = await fetch('/api/research/discover-executives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany,
          companyName: selectedCompanyName,
          limit: parseInt(execLimit) || 10
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`❌ Error: ${data.error}`)
        return
      }

      setMessage(`✅ ${data.message}`)
      loadExecutivesForCompany(selectedCompany)
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high':
        return '🟢 High'
      case 'medium':
        return '🟡 Medium'
      case 'low':
        return '🔴 Low'
      default:
        return '⚪ Unknown'
    }
  }

  const withEmailCount = executives.filter(e => e.email).length
  const withoutEmailCount = executives.filter(e => !e.email).length

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {selectedCollection ? `${selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} - Executive Discovery` : 'Executive Discovery'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4 h-fit">
          <h3 className="text-lg font-bold">Search Settings</h3>

          <div>
            <label className="block text-sm font-semibold mb-2">Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {companies.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No companies in this collection</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Max Executives to Search</label>
            <input
              type="number"
              min="1"
              max="100"
              value={execLimit}
              onChange={(e) => setExecLimit(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 10</p>
          </div>

          <button
            onClick={handleDiscoverExecutives}
            disabled={loading || !selectedCompany}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? '⏳ Discovering...' : '🔍 Discover & Enrich Executives'}
          </button>

          {executives.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-2">Status</p>
              <div className="space-y-1 text-xs">
                <p>📊 Total: <span className="font-bold">{executives.length}</span></p>
                <p>📧 With Email: <span className="font-bold text-green-600">{withEmailCount}</span></p>
                <p>❓ Need Email: <span className="font-bold text-orange-600">{withoutEmailCount}</span></p>
              </div>
            </div>
          )}

          {message && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              {message}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Executives ({executives.length})</h3>

          {executives.length === 0 ? (
            <p className="text-gray-500">Select a company and click "Discover & Enrich Executives" to start</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {executives.map((exec) => (
                <div key={exec.id} className="p-3 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-sm">{exec.name}</h4>
                  <p className="text-xs text-gray-700 mb-1">{exec.title}</p>
                  
                  {exec.email ? (
                    <p className="text-xs text-green-600 font-medium">✅ {exec.email}</p>
                  ) : (
                    <p className="text-xs text-gray-400">No email found</p>
                  )}

                  {exec.linkedin_url && (
                    <p className="text-xs text-blue-600 truncate">
                      🔗 <a href={exec.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        LinkedIn
                      </a>
                    </p>
                  )}

                  <div className="mt-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-gray-200 rounded">
                      {getConfidenceBadge(exec.confidence_level || 'unknown')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
