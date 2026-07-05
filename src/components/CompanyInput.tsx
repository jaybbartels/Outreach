'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'
import { Company } from '@/lib/types'

interface Props {
  selectedCollection?: string
}

export default function CompanyInput({ selectedCollection = '' }: Props) {
  const [inputMethod, setInputMethod] = useState<'single' | 'bulk'>('single')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    loadCompanies()
  }, [selectedCollection])

  const loadCompanies = async () => {
    let query = supabase.from('companies').select('*')
    const { data } = await query
    
    if (data) {
      // Filter by collection if selected
      if (selectedCollection) {
        const filtered = data.filter((company: any) => 
          company.collections && company.collections.includes(selectedCollection.toLowerCase())
        )
        setCompanies(filtered)
      } else {
        setCompanies(data)
      }
    }
  }

  const handleAddCompany = async () => {
    if (!companyName.trim()) {
      setMessage('❌ Please enter a company name')
      return
    }

    setLoading(true)
    setMessage('⏳ Adding company...')

    try {
      const collections = selectedCollection ? [selectedCollection.toLowerCase()] : []
      
      const { error } = await supabase.from('companies').insert([
        {
          name: companyName,
          collections: collections,
          priority: 'medium',
          research_depth: 'full',
          status: 'pending'
        }
      ])

      if (error) {
        setMessage(`❌ Error: ${error.message}`)
        return
      }

      setMessage(`✅ Added ${companyName}`)
      setCompanyName('')
      loadCompanies()
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = async (file: File) => {
    setLoading(true)
    setMessage('⏳ Processing bulk upload...')

    Papa.parse(file, {
      header: true,
      complete: async (results: any) => {
        try {
          const companies = (results.data || [])
            .filter((row: any) => row.name)
            .map((row: any) => ({
              name: row.name.trim(),
              collections: selectedCollection ? [selectedCollection.toLowerCase()] : [],
              priority: row.priority || 'medium',
              research_depth: 'full',
              status: 'pending'
            }))

          if (companies.length === 0) {
            setMessage('❌ No valid companies found in file')
            setLoading(false)
            return
          }

          const { error } = await supabase.from('companies').insert(companies)

          if (error) {
            setMessage(`❌ Error: ${error.message}`)
          } else {
            setMessage(`✅ Added ${companies.length} companies`)
            loadCompanies()
          }
        } catch (error) {
          setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
          setLoading(false)
        }
      }
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {selectedCollection ? `${selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} Companies` : 'All Companies'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-semibold">Add Company</h3>

          <div className="flex gap-2">
            <button
              onClick={() => setInputMethod('single')}
              className={`px-4 py-2 rounded ${inputMethod === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Single Entry
            </button>
            <button
              onClick={() => setInputMethod('bulk')}
              className={`px-4 py-2 rounded ${inputMethod === 'bulk' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Bulk Upload
            </button>
          </div>

          {inputMethod === 'single' ? (
            <>
              <input
                type="text"
                placeholder="Company name..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <button
                onClick={handleAddCompany}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                ✅ Add Company
              </button>
            </>
          ) : (
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => e.target.files && handleBulkUpload(e.target.files[0])}
              className="w-full px-4 py-2 border rounded-lg"
            />
          )}

          {message && <div className="p-3 bg-gray-100 rounded text-sm">{message}</div>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Companies ({companies.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {companies.map((company) => (
              <div key={company.id} className="p-3 border rounded bg-gray-50">
                <p className="font-semibold">{company.name}</p>
                <p className="text-xs text-gray-500">Status: {company.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
