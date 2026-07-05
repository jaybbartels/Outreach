'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'
import { Company } from '@/lib/types'

interface Props {
  selectedCollection?: string
}

interface CompanyWithStats extends Company {
  executiveCount?: number
}

export default function CompanyInput({ selectedCollection = '' }: Props) {
  const [inputMethod, setInputMethod] = useState<'single' | 'bulk'>('single')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])

  useEffect(() => {
    loadCompanies()
  }, [selectedCollection])

  const loadCompanies = async () => {
    const { data: allCompanies } = await supabase.from('companies').select('*')
    
    if (allCompanies) {
      let filtered = allCompanies
      if (selectedCollection) {
        filtered = allCompanies.filter((company: any) =>
          company.collections && company.collections.includes(selectedCollection.toLowerCase())
        )
      }

      // Get executive counts for each company
      const companiesWithStats = await Promise.all(
        filtered.map(async (company: Company) => {
          const { count } = await supabase
            .from('executives')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

          return { ...company, executiveCount: count || 0 }
        })
      )

      setCompanies(companiesWithStats)
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
              hq_location: row.hq_location || null,
              phone: row.phone || null,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
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
            <>
              <p className="text-xs text-gray-600">CSV should have columns: name, hq_location, phone</p>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => e.target.files && handleBulkUpload(e.target.files[0])}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </>
          )}

          {message && <div className="p-3 bg-gray-100 rounded text-sm">{message}</div>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Companies ({companies.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {companies.map((company) => (
              <div key={company.id} className={`p-3 border rounded-lg ${getStatusColor(company.status || 'pending')}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-sm">{company.name}</p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    👥 {company.executiveCount || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{company.hq_location || 'No location'}</p>
                {company.phone && <p className="text-xs text-gray-600">📞 {company.phone}</p>}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    Status: <span className="font-semibold">{company.status}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Priority: {company.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
