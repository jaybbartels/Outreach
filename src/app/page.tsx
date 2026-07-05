'use client'

import { useState } from 'react'
import CompanyInput from '@/components/CompanyInput'
import ExecutiveSearch from '@/components/ExecutiveSearch'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'companies' | 'executives'>('companies')
  const [selectedCollection, setSelectedCollection] = useState<string>('healthcare') // Default to healthcare

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">🎯 Outreach 1 MVP</h1>
          <p className="text-gray-600">Executive Research & Outreach Ranking Platform</p>
        </div>
      </header>

      {/* Collection Selector */}
      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <label className="text-sm font-semibold mr-3">Collection:</label>
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="">All Collections</option>
            <option value="healthcare">Healthcare</option>
            <option value="robotics">Robotics</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex gap-4">
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'companies'
                ? 'bg-blue-600 text-white rounded'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setActiveTab('executives')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'executives'
                ? 'bg-blue-600 text-white rounded'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Executives
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'companies' && (
          <CompanyInput selectedCollection={selectedCollection} />
        )}
        {activeTab === 'executives' && (
          <ExecutiveSearch selectedCollection={selectedCollection} />
        )}
      </div>
    </main>
  )
}
