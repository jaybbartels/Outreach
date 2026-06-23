import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET comments for a company or executive
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const executiveId = searchParams.get('executive_id')

    let query = supabase.from('comments').select('*')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    if (executiveId) {
      query = query.eq('executive_id', executiveId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_id, executive_id, user_email, comment_text, domain_id } = body

    const { data, error } = await supabase.from('comments').insert([
      {
        company_id,
        executive_id,
        user_email,
        comment_text,
        domain_id,
      },
    ])

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
