import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Redirect to collections (for backward compatibility)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('name')

    if (error) throw error

    return Response.json({ data, success: true })
  } catch (error) {
    console.error('Error fetching collections:', error)
    return Response.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}
