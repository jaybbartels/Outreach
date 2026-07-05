'use client'

import { useState } from 'react'
import CompanyInput from '@/components/CompanyInput'
import ExecutiveSearch from '@/components/ExecutiveSearch'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'companies' | 'executives'>('companies')

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2">🎯 Outreach 1 MVP</h1>
        <p className="text-gray-600 mb-8">Executive Research & Outreach Ranking Platform</p>

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
