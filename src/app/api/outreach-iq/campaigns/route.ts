import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const bdPersonId = url.searchParams.get('bd_person_id')

    if (!bdPersonId) {
      return Response.json({ error: 'bd_person_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('bd_person_id', bdPersonId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ data, success: true })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return Response.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('outreach_campaigns')
      .insert([body])
      .select()

    if (error) throw error

    return Response.json({ data: data?.[0], success: true })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return Response.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
