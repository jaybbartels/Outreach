import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, slug, icon, description, is_public } = body

    if (!name || !slug) {
      return Response.json({ error: 'Name and slug required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('collections')
      .insert([{ name, slug, icon: icon || '📁', description, is_public: is_public ?? true }])
      .select()

    if (error) throw error

    return Response.json({ data: data?.[0], success: true })
  } catch (error) {
    console.error('Error creating collection:', error)
    return Response.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}
