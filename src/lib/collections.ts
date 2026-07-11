import { api } from '../../lib/api'
import { Collection, Company, Executive } from './types'

// ============================================================================
// COLLECTIONS QUERIES (via API)
// ============================================================================

export async function getCollections(): Promise<Collection[]> {
  try {
    const response = await api.getCollections()
    return response.data?.collections || []
  } catch (error) {
    console.error('Error fetching collections:', error)
    return []
  }
}

export async function getCollection(id: string): Promise<Collection | null> {
  try {
    const response = await api.getCollections()
    const collections = response.data?.collections || []
    return collections.find((c: Collection) => c.id === id) || null
  } catch (error) {
    console.error('Error fetching collection:', error)
    return null
  }
}

// ============================================================================
// EXECUTIVES QUERIES (via API)
// ============================================================================

export async function getExecutivesByCollection(
  collectionId: string
): Promise<Executive[]> {
  try {
    const response = await api.getExecutives(collectionId, 500, 0)
    return response.data?.executives || []
  } catch (error) {
    console.error('Error fetching executives:', error)
    return []
  }
}

export async function getExecutives(limit = 50, offset = 0): Promise<Executive[]> {
  try {
    const response = await api.getExecutives(undefined, limit, offset)
    return response.data?.executives || []
  } catch (error) {
    console.error('Error fetching executives:', error)
    return []
  }
}

// ============================================================================
// COMPANIES QUERIES (kept for now - can be updated to API later)
// ============================================================================

export async function getCompanies(): Promise<Company[]> {
  // This would need to be added to your API
  // For now, keeping as-is
  return []
}

export async function getCompaniesByCollection(
  collectionId: string
): Promise<Company[]> {
  return []
}

export async function getCollectionHealth(collectionId: string) {
  try {
    const response = await api.getCollectionHealth(collectionId)
    return response.data || null
  } catch (error) {
    console.error('Error fetching collection health:', error)
    return null
  }
}
