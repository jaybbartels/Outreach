import { supabase } from './supabase'
import {
  BDProfile,
  OutreachCampaign,
  ConnectionStrategy,
  OutreachAttempt,
  EmailTemplate,
  SentEmail,
} from './types'

// ============================================================================
// BD PROFILE QUERIES
// ============================================================================

export async function getBDProfile(userId: string): Promise<BDProfile | null> {
  const { data } = await supabase
    .from('bd_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data || null
}

export async function createBDProfile(
  profile: Omit<BDProfile, 'id' | 'created_at' | 'updated_at'>
): Promise<BDProfile | null> {
  const { data } = await supabase
    .from('bd_profiles')
    .insert([profile])
    .select()
    .single()
  return data || null
}

export async function updateBDProfile(
  id: string,
  updates: Partial<BDProfile>
): Promise<BDProfile | null> {
  const { data } = await supabase
    .from('bd_profiles')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()
  return data || null
}

// ============================================================================
// CAMPAIGN QUERIES
// ============================================================================

export async function getCampaigns(
  bdPersonId: string
): Promise<OutreachCampaign[]> {
  const { data } = await supabase
    .from('outreach_campaigns')
    .select('*')
    .eq('bd_person_id', bdPersonId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createCampaign(
  campaign: Omit<OutreachCampaign, 'id' | 'created_at' | 'updated_at'>
): Promise<OutreachCampaign | null> {
  const { data } = await supabase
    .from('outreach_campaigns')
    .insert([campaign])
    .select()
    .single()
  return data || null
}

export async function updateCampaign(
  id: string,
  updates: Partial<OutreachCampaign>
): Promise<OutreachCampaign | null> {
  const { data } = await supabase
    .from('outreach_campaigns')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()
  return data || null
}

// ============================================================================
// CONNECTION STRATEGY QUERIES
// ============================================================================

export async function getStrategies(
  campaignId: string
): Promise<ConnectionStrategy[]> {
  const { data } = await supabase
    .from('connection_strategies')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('success_probability', { ascending: false })
  return data || []
}

export async function createStrategy(
  strategy: Omit<ConnectionStrategy, 'id' | 'created_at' | 'updated_at'>
): Promise<ConnectionStrategy | null> {
  const { data } = await supabase
    .from('connection_strategies')
    .insert([strategy])
    .select()
    .single()
  return data || null
}

export async function updateStrategy(
  id: string,
  updates: Partial<ConnectionStrategy>
): Promise<ConnectionStrategy | null> {
  const { data } = await supabase
    .from('connection_strategies')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()
  return data || null
}

// ============================================================================
// OUTREACH ATTEMPT QUERIES
// ============================================================================

export async function getAttempts(
  strategyId: string
): Promise<OutreachAttempt[]> {
  const { data } = await supabase
    .from('outreach_attempts')
    .select('*')
    .eq('strategy_id', strategyId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createAttempt(
  attempt: Omit<OutreachAttempt, 'id' | 'created_at'>
): Promise<OutreachAttempt | null> {
  const { data } = await supabase
    .from('outreach_attempts')
    .insert([attempt])
    .select()
    .single()
  return data || null
}

// ============================================================================
// EMAIL TEMPLATE QUERIES
// ============================================================================

export async function getEmailTemplates(
  bdPersonId: string
): Promise<EmailTemplate[]> {
  const { data } = await supabase
    .from('outreach_email_templates')
    .select('*')
    .eq('bd_person_id', bdPersonId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createEmailTemplate(
  template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailTemplate | null> {
  const { data } = await supabase
    .from('outreach_email_templates')
    .insert([template])
    .select()
    .single()
  return data || null
}

// ============================================================================
// SENT EMAIL QUERIES
// ============================================================================

export async function getSentEmails(
  attemptId: string
): Promise<SentEmail[]> {
  const { data } = await supabase
    .from('sent_outreach_emails')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createSentEmail(
  email: Omit<SentEmail, 'id' | 'created_at'>
): Promise<SentEmail | null> {
  const { data } = await supabase
    .from('sent_outreach_emails')
    .insert([email])
    .select()
    .single()
  return data || null
}

export async function updateSentEmail(
  id: string,
  updates: Partial<SentEmail>
): Promise<SentEmail | null> {
  const { data } = await supabase
    .from('sent_outreach_emails')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return data || null
}
