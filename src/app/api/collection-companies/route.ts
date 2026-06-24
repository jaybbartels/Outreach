import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const collectionId = url.searchParams.get('collection_id')

    if (!collectionId) {
      return Response.json({ error: 'collection_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('collection_companies')
      .select('company_id, companies(*)')
      .eq('collection_id', collectionId)

    if (error) throw error

    const companies = data?.map((row: any) => row.companies).filter((c: any) => c !== null) || []

    return Response.json({ data: companies, success: true })
  } catch (error) {
    console.error('Error fetching collection companies:', error)
    return Response.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}
