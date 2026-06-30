'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company, Executive } from '@/lib/types'

export default function ExecutiveSearch() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('')
  const [discipline, setDiscipline] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [executives, setExecutives] = useState<Executive[]>([])
  const [manualEmailEntry, setManualEmailEntry] = useState<{ [key: string]: string }>({})
  const [editingExecId, setEditingExecId] = useState<string | null>(null)

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
    const company = companies.find(c => c.id === companyId)
    setSelectedCompanyName(company?.name || '')
    loadExecutivesForCompany(companyId)
  }

  const handleFindExecutives = async () => {
    if (!selectedCompany) {
      setMessage('❌ Please select a company')
      return
    }

    setLoading(true)
    setMessage('🔍 Researching executives...')

    try {
      const response = await fetch('/api/research/executives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: selectedCompanyName,
          discipline: discipline || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`❌ Error: ${data.error}`)
        return
      }

      setMessage(`✅ Found ${data.count} executives!`)
      loadExecutivesForCompany(selectedCompany)
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFindEmails = async () => {
    if (!selectedCompany) {
      setMessage('❌ Please select a company')
      return
    }

    setLoading(true)
    setMessage('📧 Searching for emails (Hunter.io → Web Search → Manual)...')

    try {
      const response = await fetch('/api/research/find-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany,
          companyName: selectedCompanyName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`❌ Error: ${data.error}`)
        return
      }

      // Show detailed results
      const results = data.results || []
      const hunterCount = results.filter((r: any) => r.source === 'hunter.io' && r.email).length
      const webCount = results.filter((r: any) => r.source === 'web-search' && r.email).length
      const manualCount = results.filter((r: any) => r.source === 'manual' && !r.email).length

      setMessage(`✅ Email search complete: ${hunterCount} via Hunter.io, ${webCount} via Web Search, ${manualCount} need manual entry`)
      
      loadExecutivesForCompany(selectedCompany)
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveManualEmail = async (execId: string) => {
    const email = manualEmailEntry[execId]
    if (!email) {
      alert('Please enter an email')
      return
    }

    const { error } = await supabase
      .from('executives')
      .update({ email: email, confidence_level: 'low' })
      .eq('id', execId)

    if (!error) {
      setMessage(`✅ Email saved for ${execId}`)
      setManualEmailEntry({ ...manualEmailEntry, [execId]: '' })
      setEditingExecId(null)
      loadExecutivesForCompany(selectedCompany)
    } else {
      setMessage(`❌ Error saving email: ${error.message}`)
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

  const missingEmailCount = executives.filter(e => !e.email).length

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

            {executives.length > 0 && (
              <button
                onClick={handleFindEmails}
                disabled={loading || !selectedCompany}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? '⏳ Finding emails...' : `📧 Find Missing Emails (${missingEmailCount})`}
              </button>
            )}

            {message && (
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 text-sm">
                {message}
              </div>
            )}

            <div className="text-xs text-gray-400 text-center pt-4 border-t">
              v1.3.0 - Email Discovery with Fallbacks
            </div>
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
                    
                    {exec.email ? (
                      <p className="text-sm text-green-600">✅ {exec.email}</p>
                    ) : editingExecId === exec.id ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="email"
                          placeholder="Enter email..."
                          value={manualEmailEntry[exec.id] || ''}
                          onChange={(e) => setManualEmailEntry({ ...manualEmailEntry, [exec.id]: e.target.value })}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <button
                          onClick={() => handleSaveManualEmail(exec.id)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingExecId(exec.id)}
                        className="text-sm text-gray-400 hover:text-blue-600 mt-1"
                      >
                        ✏️ Add email manually
                      </button>
                    )}

                    <div className="mt-2">
                      <span className="text-xs font-semibold">
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
    </div>
  )
}
