'use client'

import { useState, useEffect } from 'react'
import CompanyInput from '@/components/CompanyInput'
import ExecutiveSearch from '@/components/ExecutiveSearch'

export const dynamic = 'force-dynamic'

interface Domain {
  id: string
  name: string
  slug: string
  icon: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'companies' | 'executives'>('companies')
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>('all')

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains')
      const { data } = await response.json()
      setDomains(data || [])
    } catch (error) {
      console.error('Error fetching domains:', error)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Domain Selector */}
        <div className="mb-8 p-4 bg-white rounded-lg border">
          <p className="text-sm font-semibold text-gray-600 mb-3">Selected Domain:</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDomain('all')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                selectedDomain === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-900 border hover:border-blue-300'
              }`}
            >
              All Domains
            </button>
            {domains.map((domain) => (
              <button
                key={domain.slug}
                onClick={() => setSelectedDomain(domain.slug)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  selectedDomain === domain.slug
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-900 border hover:border-blue-300'
                }`}
              >
                <span className="mr-2">{domain.icon}</span>
                {domain.name}
              </button>
            ))}
          </div>
        </div>

        {/* Existing Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-6 py-2 rounded font-medium ${
              activeTab === 'companies'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setActiveTab('executives')}
            className={`px-6 py-2 rounded font-medium ${
              activeTab === 'executives'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Executives
          </button>
        </div>

        {activeTab === 'companies' && <CompanyInput />}
        {activeTab === 'executives' && <ExecutiveSearch />}
      </div>
    </main>
  )
}
