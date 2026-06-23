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

      setCompanyName('')
      setMessage('Company added successfully!')
      await loadCompanies()
    } catch (error) {
      setMessage('Error adding company')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      complete: async (results) => {
        setLoading(true)
        const rows = results.data as string[][]
        const companiesData = rows.slice(1).map((row) => ({
          name: row[0],
          industry: row[1] || undefined,
          hq_state: row[2] || undefined,
          hq_location: row[3] || undefined,
        }))

        try {
          const { error } = await supabase.from('companies').insert(companiesData)
          if (error) throw error
          setMessage(`Added ${companiesData.length} companies`)
          await loadCompanies()
        } catch (error) {
          setMessage('Error uploading companies')
          console.error(error)
        } finally {
          setLoading(false)
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setInputMethod('single')}
          className={`px-4 py-2 rounded ${
            inputMethod === 'single'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          Single Entry
        </button>
        <button
          onClick={() => setInputMethod('bulk')}
          className={`px-4 py-2 rounded ${
            inputMethod === 'bulk'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          Bulk Upload
        </button>
      </div>

      {inputMethod === 'single' && (
        <form onSubmit={handleAddCompany} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold">Add Single Company</h2>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Mayo Clinic, HCA Healthcare"
            className="w-full px-4 py-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? '⏳ Adding...' : '✅ Add Company'}
          </button>
        </form>
      )}

      {inputMethod === 'bulk' && (
        <div className="space-y-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold">Bulk Upload</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleBulkUpload}
            className="block"
          />
          <p className="text-sm text-gray-600">CSV format: name, industry, state, location</p>
        </div>
      )}

      {message && (
        <p className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
          {message}
        </p>
      )}

      <div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Companies in Database ({companies.length})</h2>
          {companies.length === 0 ? (
            <p className="text-gray-500">No companies yet. Add one to get started!</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="w-full text-left p-3 border rounded transition bg-gray-50 hover:bg-gray-100"
                >
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
  )
}
