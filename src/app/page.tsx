'use client'

import { useState, useEffect } from 'react'
import CollectionPanel from '@/components/panels/CollectionPanel'
import CompanyPanel from '@/components/panels/CompanyPanel'
import ExecutivePanel from '@/components/panels/ExecutivePanel'
import { Collection } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('')

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections')
      const { data } = await response.json()
      setCollections(data || [])
      if (data && data.length > 0) {
        setSelectedCollectionId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  // When collection changes, auto-select first company
  useEffect(() => {
    if (selectedCollectionId) {
      fetchFirstCompany(selectedCollectionId)
    }
  }, [selectedCollectionId])

  const fetchFirstCompany = async (collectionId: string) => {
    try {
      const { data, error } = await fetch(
        `/api/collection-companies?collection_id=${collectionId}`
      ).then((r) => r.json())

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
      const { data } = await fetch(
        `/api/company-executives?company_id=${companyId}`
      ).then((r) => r.json())

      if (data && data.length > 0) {
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
          {/* Panel 1: Collections */}
          <CollectionPanel
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={setSelectedCollectionId}
          />

          {/* Panel 2: Companies */}
          {selectedCollectionId && (
            <CompanyPanel
              collectionId={selectedCollectionId}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={setSelectedCompanyId}
            />
          )}

          {/* Panel 3: Executives */}
          {selectedCompanyId && (
            <ExecutivePanel
              companyId={selectedCompanyId}
              collectionId={selectedCollectionId}
              selectedExecutiveId={selectedExecutiveId}
              onSelectExecutive={setSelectedExecutiveId}
            />
          )}
        </div>
      </div>
    </main>
  )
}
