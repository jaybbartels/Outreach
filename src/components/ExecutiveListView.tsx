'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Executive {
  id: string
  name: string
  title: string
  company_id: string
}

export default function ExecutiveListView({ domainId }: { domainId: string }) {
  const [executives, setExecutives] = useState<Executive[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExecutives()
  }, [domainId])

  const fetchExecutives = async () => {
    try {
      const { data, error } = await supabase
        .from('executives')
        .select(`
          id, name, title, company_id,
          companies!inner(domain_id)
        `)
        .eq('companies.domain_id', domainId)
        .order('name')

      if (!error && data) {
        setExecutives(data as any)
      }
    } catch (error) {
      console.error('Error fetching executives:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading executives...</p>

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">👔 All Executives ({executives.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {executives.map((exec) => (
          <div key={exec.id} className="p-4 border rounded-lg hover:shadow-md transition">
            <h3 className="font-bold text-lg">{exec.name}</h3>
            <p className="text-sm text-gray-600">{exec.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
