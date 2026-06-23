'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ContactMethod {
  id: string
  method_type: string
  contact_identifier: string
  is_primary: boolean
  is_verified: boolean
}

const METHOD_ICONS: Record<string, string> = {
  email: '📧',
  linkedin: '💼',
  facebook: '📘',
  twitter: '🐦',
  github: '💻',
  phone: '☎️',
  crunchbase: '📊',
  patents: '📜',
}

const METHOD_LABELS: Record<string, string> = {
  email: 'Email',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  twitter: 'Twitter',
  github: 'GitHub',
  phone: 'Phone',
  crunchbase: 'Crunchbase',
  patents: 'Patents',
}

export default function ExecutiveContactMethods({
  executiveId,
}: {
  executiveId: string
}) {
  const [methods, setMethods] = useState<ContactMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContactMethods()
  }, [executiveId])

  const fetchContactMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_methods')
        .select('*')
        .eq('executive_id', executiveId)
        .order('is_primary', { ascending: false })
        .order('method_type', { ascending: true })

      if (error) throw error
      setMethods(data || [])
    } catch (error) {
      console.error('Error fetching contact methods:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-xs text-gray-500">Loading...</p>

  if (methods.length === 0) {
    return null
  }

  const getContactLink = (method: ContactMethod): string | null => {
    switch (method.method_type) {
      case 'email':
        return `mailto:${method.contact_identifier}`
      case 'linkedin':
        return method.contact_identifier.startsWith('http')
          ? method.contact_identifier
          : `https://linkedin.com/in/${method.contact_identifier}`
      case 'facebook':
        return method.contact_identifier.startsWith('http')
          ? method.contact_identifier
          : `https://facebook.com/${method.contact_identifier}`
      case 'twitter':
        return method.contact_identifier.startsWith('http')
          ? method.contact_identifier
          : `https://twitter.com/${method.contact_identifier}`
      case 'github':
        return method.contact_identifier.startsWith('http')
          ? method.contact_identifier
          : `https://github.com/${method.contact_identifier}`
      case 'phone':
        return `tel:${method.contact_identifier}`
      case 'crunchbase':
        return method.contact_identifier.startsWith('http')
          ? method.contact_identifier
          : `https://crunchbase.com/${method.contact_identifier}`
      default:
        return null
    }
  }

  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {methods.map((method) => {
        const link = getContactLink(method)
        const icon = METHOD_ICONS[method.method_type] || '🔗'
        const label = METHOD_LABELS[method.method_type] || method.method_type

        if (!link) {
          return (
            <span
              key={method.id}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1"
              title={method.contact_identifier}
            >
              {icon} {label}
            </span>
          )
        }

        return (
          
            <a key={method.id}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition flex items-center gap-1"
            title={method.contact_identifier}
          >
            {icon} {label}
          </a>
        )
      })}
    </div>
  )
}
