'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company, Executive } from '@/lib/types'
import ExecutiveContactMethods from './ExecutiveContactMethods'
import WorkSessionTracker from './WorkSessionTracker'

export default function ExecutiveSearch({
  domainId,
  domainName,
}: {
  domainId: string
  domainName: string
}) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [executives, setExecutives] = useState<Executive[]>([])
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCompanies()
  }, [domainId])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('domain_id', domainId)
        .order('name')

      if (!error && data) {
        setCompanies(data)
        if (data.length > 0) {
          setSelectedCompany(data[0].id!)
          searchExecutives(data[0].id!)
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const searchExecutives = async (companyId: string) => {
    if (!companyId) {
      setMessage('Please select a company')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('executives')
        .select('*')
        .eq('company_id', companyId)
        .order('name')

      if (error) throw error
      setExecutives(data || [])
      if (data && data.length > 0) {
        setSelectedExecutiveId(data[0].id)
      }
    } catch (error) {
      setMessage('Error loading executives')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId)
    setSelectedExecutiveId(null)
    searchExecutives(companyId)
  }

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)
  const selectedExecutive = executives.find((e) => e.id === selectedExecutiveId)

  return (
    <div className="space-y-6">
      {/* Company Selector */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold mb-4">🏢 Select Company</h3>
        <select
          value={selectedCompany}
          onChange={(e) => handleCompanyChange(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        >
          <option value="">Select a company...</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {message && <p className="p-4 rounded bg-yellow-100">{message}</p>}

      {/* Three-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Executives List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">👔 Executives ({executives.length})</h3>
          {executives.length === 0 ? (
            <p className="text-sm text-gray-500">No executives found</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {executives.map((exec) => (
                <button
                  key={exec.id}
                  onClick={() => setSelectedExecutiveId(exec.id)}
                  className={`w-full text-left p-2 border rounded text-sm ${
                    selectedExecutiveId === exec.id
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-semibold">{exec.name}</p>
                  <p className="text-xs text-gray-600">{exec.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Executive Details */}
        {selectedExecutive && selectedCompanyData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-4">{selectedExecutive.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{selectedExecutive.title}</p>

            <ExecutiveContactMethods executiveId={selectedExecutive.id} />

            <WorkSessionTracker
              companyId={selectedCompanyData.id!}
              companyName={selectedCompanyData.name}
              domainId={domainId}
            />
          </div>
        )}

        {/* Executive Info Placeholder */}
        {!selectedExecutive && (
          <div className="bg-gray-50 p-6 rounded-lg border border-dashed">
            <p className="text-gray-500">Select an executive to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
