import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET active/last work session for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    const { data, error } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    return NextResponse.json({ success: true, data: data?.[0] || null })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST start or end work session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_id, user_email, action, domain_id } = body

    if (action === 'start') {
      // Start new work session
      const { data, error } = await supabase.from('work_sessions').insert([
        {
          company_id,
          user_email,
          domain_id,
          status: 'in_progress',
        },
      ])

      if (error) throw error
      return NextResponse.json({ success: true, data })
    } else if (action === 'end') {
      // End current work session
      const { data, error } = await supabase
        .from('work_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('company_id', company_id)
        .eq('status', 'in_progress')
        .select()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
