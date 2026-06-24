// Collections (formerly Domains)
export interface Collection {
  id: string
  name: string
  slug: string
  icon: string
  description?: string
  created_by?: string
  created_at: Date
  is_public: boolean
}

export interface Company {
  id: string
  name: string
  status: string
  hq_location?: string
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
  status?: string
  created_at: Date
  // Research fields
  confidence_level?: 'high' | 'medium' | 'low'
  research_status?: 'pending' | 'in_progress' | 'completed'
  research_completed_date?: Date
  notes?: string
  // Deprecated
  domain_id?: string
}

// OutreachIQ - User/Profile
export interface BDProfile {
  id: string
  user_id: string
  email: string
  name: string
  title?: string
  company_name?: string
  linkedin_url?: string
  location_city?: string
  location_state?: string
  location_lat?: number
  location_lng?: number
  expertise_tags: string[]
  goals?: string
  created_at: Date
  updated_at: Date
}

// OutreachIQ - Campaigns
export interface OutreachCampaign {
  id: string
  bd_person_id: string
  collection_id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed'
  target_companies: number
  contacts_made: number
  created_at: Date
  updated_at: Date
}

// OutreachIQ - Connection Strategies
export interface ConnectionStrategy {
  id: string
  campaign_id: string
  company_id: string
  target_executive_id?: string
  strategy_type: 'linkedin' | 'email' | 'conference' | 'geographic' | 'multi_step'
  success_probability: number // 0-100
  connection_strength: number // 0-100
  effort_level: 'low' | 'medium' | 'high'
  recommended_timeline?: string
  action_items: string[]
  reasoning: string
  primary_strategy: string
  secondary_strategy?: string
  tertiary_strategy?: string
  status: 'pending' | 'in_progress' | 'attempted' | 'successful' | 'failed'
  created_at: Date
  updated_at: Date
}

// OutreachIQ - Outreach Attempts
export interface OutreachAttempt {
  id: string
  strategy_id: string
  attempt_type: 'email' | 'linkedin' | 'call' | 'meeting' | 'conference'
  attempted_at?: Date
  result: 'pending' | 'sent' | 'opened' | 'replied' | 'scheduled' | 'no_response' | 'bounced'
  notes?: string
  attachments?: string[]
  created_at: Date
}

// OutreachIQ - Email Templates
export interface EmailTemplate {
  id: string
  bd_person_id: string
  template_name: string
  subject_line: string
  body: string
  variables: string[]
  is_default: boolean
  created_at: Date
  updated_at: Date
}

// OutreachIQ - Sent Emails
export interface SentEmail {
  id: string
  attempt_id: string
  recipient_email: string
  recipient_name?: string
  subject_line: string
  body_sent: string
  opened: boolean
  opened_at?: Date
  replied: boolean
  replied_at?: Date
  reply_text?: string
  created_at: Date
}
