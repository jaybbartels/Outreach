import { supabase } from './supabase'
import { Collection, Company, Executive } from './types'

// ============================================================================
// COLLECTIONS QUERIES
// ============================================================================

export async function getCollections(): Promise<Collection[]> {
  const { data } = await supabase
    .from('collections')
    .select('*')
    .order('name')
  return data || []
}

export async function getCollection(id: string): Promise<Collection | null> {
  const { data } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single()
  return data || null
}

export async function createCollection(
  name: string,
  slug: string,
  icon: string,
  description?: string
): Promise<Collection | null> {
  const { data } = await supabase
    .from('collections')
    .insert([{ name, slug, icon, description, is_public: true }])
    .select()
    .single()
  return data || null
}

export async function updateCollection(
  id: string,
  updates: Partial<Collection>
): Promise<Collection | null> {
  const { data } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return data || null
}

export async function deleteCollection(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
  return !error
}

// ============================================================================
// COLLECTION-COMPANY QUERIES
// ============================================================================

export async function getCompaniesByCollection(
  collectionId: string
): Promise<Company[]> {
  const { data } = await supabase
    .from('collection_companies')
    .select('company_id, companies(*)')
    .eq('collection_id', collectionId)

  if (!data) return []
  return data
    .map((row: any) => row.companies)
    .filter((c: Company | null) => c !== null)
}

export async function getCollectionsForCompany(
  companyId: string
): Promise<Collection[]> {
  const { data } = await supabase
    .from('collection_companies')
    .select('collection_id, collections(*)')
    .eq('company_id', companyId)

  if (!data) return []
  return data
    .map((row: any) => row.collections)
    .filter((c: Collection | null) => c !== null)
}

export async function addCompanyToCollection(
  collectionId: string,
  companyId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('collection_companies')
    .insert([{ collection_id: collectionId, company_id: companyId }])
  return !error
}

export async function removeCompanyFromCollection(
  collectionId: string,
  companyId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('collection_companies')
    .delete()
    .eq('collection_id', collectionId)
    .eq('company_id', companyId)
  return !error
}

// ============================================================================
// COLLECTION-EXECUTIVE QUERIES
// ============================================================================

export async function getExecutivesByCollection(
  collectionId: string
): Promise<Executive[]> {
  const { data } = await supabase
    .from('collection_executives')
    .select('executive_id, executives(*)')
    .eq('collection_id', collectionId)

  if (!data) return []
  return data
    .map((row: any) => row.executives)
    .filter((e: Executive | null) => e !== null)
}

export async function getCollectionsForExecutive(
  executiveId: string
): Promise<Collection[]> {
  const { data } = await supabase
    .from('collection_executives')
    .select('collection_id, collections(*)')
    .eq('executive_id', executiveId)

  if (!data) return []
  return data
    .map((row: any) => row.collections)
    .filter((c: Collection | null) => c !== null)
}

export async function addExecutiveToCollection(
  collectionId: string,
  executiveId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('collection_executives')
    .insert([{ collection_id: collectionId, executive_id: executiveId }])
  return !error
}

export async function removeExecutiveFromCollection(
  collectionId: string,
  executiveId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('collection_executives')
    .delete()
    .eq('collection_id', collectionId)
    .eq('executive_id', executiveId)
  return !error
}
