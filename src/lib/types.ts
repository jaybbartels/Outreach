export interface Company {
  id: string
  name: string
  status: string
  hq_location?: string
  phone?: string
  priority?: string
  research_depth?: string
  collections?: string[]
  industry?: string
  hq_state?: string
  created_at: Date
  // Deprecated (will remove after cleanup)
  domain_id?: string
}

export interface Executive {
  id: string
  name: string
  title: string
  company_id: string
  email?: string
  linkedin_url?: string
  phone?: string
  confidence_level?: string
  research_status?: string
  research_completed_date?: string
  status?: string
}

export interface Collection {
  id: string
  name: string
  slug: string
  icon?: string
  created_at: Date
}
