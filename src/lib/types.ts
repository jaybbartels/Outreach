export interface Company {
  id?: string
  created_at?: string
  updated_at?: string
  name: string
  industry?: string
  hq_state?: string
  hq_location?: string
  priority?: 'high' | 'medium' | 'low'
  research_depth?: 'full' | 'partial' | 'summary'
  status?: 'pending' | 'in_progress' | 'completed'
  notes?: string
}

export interface Executive {
  id?: string
  company_id: string
  name: string
  title: string
  email?: string
  phone?: string
  linkedin_url?: string
  linkedin_engagement_score?: number
  email_engagement_score?: number
  phone_engagement_score?: number
  messaging_engagement_score?: number
  publications_engagement_score?: number
  social_media_engagement_score?: number
  event_visibility_score?: number
  response_history_score?: number
  overall_accessibility?: string
  research_status?: string
}
