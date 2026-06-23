'use client'

import { useState, useEffect } from 'react'
import DomainPanel from '@/components/panels/DomainPanel'
import CompanyPanel from '@/components/panels/CompanyPanel'
import ExecutivePanel from '@/components/panels/ExecutivePanel'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Domain {
  id: string
  name: string
  slug: string
  icon: string
}

interface Company {
  id: string
  name: string
}

interface Executive {
  id: string
  name: string
}

export default function Home() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomainId, setSelectedDomainId] = useState<string>('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('')

  // Fetch domains on mount
  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains')
      const { data } = await response.json()
      setDomains(data || [])
      if (data && data.length > 0) {
        setSelectedDomainId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching domains:', error)
    }
  }

  // When domain changes, auto-select first company
  useEffect(() => {
    if (selectedDomainId) {
      fetchFirstCompany(selectedDomainId)
    }
  }, [selectedDomainId])

  const fetchFirstCompany = async (domainId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('domain_id', domainId)
        .order('name')
        .limit(1)

      if (!error && data && data.length > 0) {
        setSelectedCompanyId(data[0].id)
      } else {
        setSelectedCompanyId('')
        setSelectedExecutiveId('')
      }
    } catch (error) {
      console.error('Error fetching first company:', error)
    }
  }

  // When company changes, auto-select first executive
  useEffect(() => {
    if (selectedCompanyId) {
      fetchFirstExecutive(selectedCompanyId)
    }
  }, [selectedCompanyId])

  const fetchFirstExecutive = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('executives')
        .select('id')
        .eq('company_id', companyId)
        .order('name')
        .limit(1)

      if (!error && data && data.length > 0) {
        setSelectedExecutiveId(data[0].id)
      } else {
        setSelectedExecutiveId('')
      }
    } catch (error) {
      console.error('Error fetching first executive:', error)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">🎯 System 1 - Executive Research</h1>
        </div>
      </header>

      {/* Three-Panel Layout */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-screen">
          {/* Panel 1: Domains */}
          <DomainPanel
            domains={domains}
            selectedDomainId={selectedDomainId}
            onSelectDomain={setSelectedDomainId}
          />

          {/* Panel 2: Companies */}
          {selectedDomainId && (
            <CompanyPanel
              domainId={selectedDomainId}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={setSelectedCompanyId}
            />
          )}

          {/* Panel 3: Executives */}
          {selectedCompanyId && (
            <ExecutivePanel
              companyId={selectedCompanyId}
              domainId={selectedDomainId}
              selectedExecutiveId={selectedExecutiveId}
              onSelectExecutive={setSelectedExecutiveId}
            />
          )}
        </div>
      </div>
    </main>
  )
}
