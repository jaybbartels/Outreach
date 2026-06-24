import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const companyId = url.searchParams.get('company_id')

    if (!companyId) {
      return Response.json({ error: 'company_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('executives')
      .select('*')
      .eq('company_id', companyId)
      .order('name')

    if (error) throw error

    return Response.json({ data, success: true })
  } catch (error) {
    console.error('Error fetching company executives:', error)
    return Response.json({ error: 'Failed to fetch executives' }, { status: 500 })
  }
}
