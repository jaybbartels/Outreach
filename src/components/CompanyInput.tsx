'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'
import { Company } from '@/lib/types'

export default function CompanyInput() {
  const [inputMethod, setInputMethod] = useState<'single' | 'bulk'>('single')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.from('companies').insert([
        {
          name: companyName,
          status: 'pending',
          priority: 'medium',
        },
      ])

      if (error) throw error

      setMessage(`✅ Added ${companyName}`)
      setCompanyName('')
      loadCompanies()
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const companies = (results.data as any[]).map(c => ({
            name: c.name || c.company_name,
            industry: c.industry,
            hq_state: c.hq_state,
            hq_location: c.hq_location,
            priority: c.priority || 'medium',
            research_depth: c.research_depth || 'full',
            status: 'pending',
          }))

          const { error } = await supabase
            .from('companies')
            .insert(companies)

          if (error) throw error

          setMessage(`✅ Uploaded ${companies.length} companies`)
          loadCompanies()
        } catch (error) {
          setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`)
        } finally {
          setLoading(false)
        }
      },
    })
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-2">Outreach 1 MVP</h1>
      <p className="text-gray-600 mb-8">Executive Research & Outreach Ranking Platform</p>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setInputMethod('single')}
          className={`px-6 py-2 rounded font-medium ${
            inputMethod === 'single'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          + Add Single Company
        </button>
        <button
          onClick={() => setInputMethod('bulk')}
          className={`px-6 py-2 rounded font-medium ${
            inputMethod === 'bulk'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          📤 Bulk Upload
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          {inputMethod === 'single' ? (
            <form onSubmit={handleAddCompany} className="space-y-4 bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold">Add Single Company</h2>
              <input
                type="text"
                placeholder="e.g., Mayo Clinic, HCA Healthcare"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? '⏳ Adding...' : '✅ Add Company'}
              </button>
            </form>
          ) : (
            <div className="space-y-4 bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold">Bulk Upload CSV/Excel</h2>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleBulkUpload}
                disabled={loading}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-sm text-gray-600">
                Required columns: <strong>name</strong>, optional: industry, hq_state, hq_location, priority
              </p>
            </div>
          )}

          {message && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
              {message}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Companies in Database ({companies.length})</h2>
            {companies.length === 0 ? (
              <p className="text-gray-500">No companies yet. Add one to get started!</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {companies.map((company) => (
                  <div key={company.id} className="p-3 border rounded bg-gray-50 hover:bg-gray-100">
                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {company.status || 'pending'}
                      </span>
                      {company.industry && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {company.industry}
                        </span>
                      )}
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
