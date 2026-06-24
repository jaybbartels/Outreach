import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return Response.json({ error: 'user_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('bd_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return Response.json({ data, success: true })
  } catch (error) {
    console.error('Error fetching BD profile:', error)
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('bd_profiles')
      .insert([body])
      .select()

    if (error) throw error

    return Response.json({ data: data?.[0], success: true })
  } catch (error) {
    console.error('Error creating BD profile:', error)
    return Response.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return Response.json({ error: 'id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('bd_profiles')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()

    if (error) throw error

    return Response.json({ data: data?.[0], success: true })
  } catch (error) {
    console.error('Error updating BD profile:', error)
    return Response.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
