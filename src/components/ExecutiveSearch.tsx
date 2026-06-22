'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company, Executive } from '@/lib/types'

export default function ExecutiveSearch() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [discipline, setDiscipline] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [executives, setExecutives] = useState<Executive[]>([])

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    const { data } = await supabase.from('companies').select('*')
    if (data) setCompanies(data)
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
    loadExecutivesForCompany(companyId)
  }

  const handleFindExecutives = async () => {
    if (!selectedCompany) {
      setMessage('❌ Please select a company')
      return
    }

    const company = companies.find(c => c.id === selectedCompany)
    if (!company) return

    setLoading(true)
    setMessage('🔍 Researching executives...')

    try {
      const response = await fetch('/api/research/executives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          discipline: discipline || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`❌ Error: ${data.error}`)
        return
      }

      const incompleteCount = data.incomplete || 0
      if (incompleteCount > 0) {
        setMessage(`✅ Found ${data.count} executives (${incompleteCount} records need more data - click "Retry" to find more)`)
      } else {
        setMessage(`✅ Found ${data.count} executives (all records complete!)`)
      }
      
      loadExecutivesForCompany(selectedCompany)
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const disciplines = [
    { value: '', label: 'C-Suite (Default)' },
    { value: 'Sales', label: 'Sales Executives' },
    { value: 'Engineering', label: 'Engineering Executives' },
    { value: 'Operations', label: 'Operations Executives' },
    { value: 'Marketing', label: 'Marketing Executives' },
    { value: 'Finance', label: 'Finance Executives' },
    { value: 'Legal', label: 'Legal Executives' }
  ]

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅ Complete'
      case 'in_progress':
        return '⏳ Needs Data'
      default:
        return '❓ Unknown'
    }
  }

  const incompleteCount = executives.filter(e => e.research_status === 'in_progress').length

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-2">Executive Research</h1>
      <p className="text-gray-600 mb-8">Find and research company executives</p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold">Search Executives</h2>

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
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Discipline (Optional)</label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {disciplines.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleFindExecutives}
              disabled={loading || !selectedCompany}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? '⏳ Searching...' : '🔍 Find Executives'}
            </button>

            {incompleteCount > 0 && (
              <button
                onClick={handleFindExecutives}
                disabled={loading || !selectedCompany}
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? '⏳ Retrying...' : `🔄 Retry Search (${incompleteCount} incomplete)`}
              </button>
            )}

            {message && (
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                {message}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">
              Executives Found ({executives.length})
            </h2>

            {executives.length === 0 ? (
              <p className="text-gray-500">Select a company and search to find executives</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {executives.map((exec) => (
                  <div key={exec.id} className="p-3 border rounded bg-gray-50">
                    <h3 className="font-semibold">{exec.name}</h3>
                    <p className="text-sm text-gray-700">{exec.title}</p>
                    {exec.email && (
                      <p className="text-sm text-blue-600">{exec.email}</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs font-semibold">
                        {getConfidenceBadge(exec.confidence_level || 'unknown')}
                      </span>
                      <span className="text-xs font-semibold">
                        {getStatusBadge(exec.research_status || 'unknown')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
