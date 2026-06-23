'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company, Executive } from '@/lib/types'
import ExecutiveContactMethods from './ExecutiveContactMethods'

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
    setCompanies(data || [])
  }

  const searchExecutives = async () => {
    if (!selectedCompany) {
      setMessage('Please select a company')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('executives')
        .select('*')
        .eq('company_id', selectedCompany)

      if (error) throw error
      setExecutives(data || [])
      setMessage(data?.length === 0 ? 'No executives found' : '')
    } catch (error) {
      setMessage('Error loading executives')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high':
        return '✅ High'
      case 'medium':
        return '⚠️ Medium'
      case 'low':
        return '❌ Low'
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Executive Search</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border rounded"
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
              <label className="block text-sm font-semibold mb-2">Discipline</label>
              <input
                type="text"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="e.g., Executive, Manager"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <button
              onClick={searchExecutives}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>

            {message && (
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                {message}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">
              Results ({executives.length})
            </h3>

            {executives.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {executives.map((exec) => (
                  <div key={exec.id} className="p-3 border rounded bg-gray-50">
                    <h3 className="font-semibold">{exec.name}</h3>
                    <p className="text-sm text-gray-700">{exec.title}</p>
                    
                    {/* Contact Methods Display */}
                    <ExecutiveContactMethods executiveId={exec.id} />
                    
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
            ) : (
              <p className="text-gray-500">Select a company and search</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
