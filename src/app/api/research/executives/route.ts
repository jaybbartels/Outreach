import { Anthropic } from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { companyName, discipline } = await request.json()

    if (!companyName) {
      return Response.json({ error: 'Company name required' }, { status: 400 })
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .single()

    if (companyError || !company) {
      return Response.json({ error: 'Company not found' }, { status: 404 })
    }

    const disciplineGuide = discipline
      ? `Focus primarily on ${discipline} executives`
      : 'Start with C-Suite executives (CEO, CFO, CTO, COO, CMO, CHRO, General Counsel)'

    const prompt = `Find the top executives at ${companyName}. ${disciplineGuide}

Return ONLY this exact JSON format with no other text:
[{"name":"John Smith","title":"CEO","email":"john@company.com","linkedin":"https://linkedin.com/in/johnsmith"}]`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    let executives = []
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        executives = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      return Response.json({ error: 'Failed to parse response' }, { status: 500 })
    }

    // Prepare data for upsert
    const data = executives.map((e: any) => ({
      company_id: company.id,
      name: e.name || 'Unknown',
      title: e.title || 'Unknown',
      email: e.email && e.email !== 'unknown' ? e.email : null,
      linkedin_url: e.linkedin && e.linkedin !== 'unknown' ? e.linkedin : null,
      confidence_level: (e.email && e.email !== 'unknown') ? 'high' : 'medium',
      research_status: 'completed',
      research_completed_date: new Date().toISOString()
    }))

    // Use upsert to avoid duplicates
    const { data: inserted, error: insertError } = await supabase
      .from('executives')
      .upsert(data, { onConflict: 'company_id,name' })
      .select()

    if (insertError) {
      return Response.json({ 
        error: 'Failed to store executives', 
        details: insertError.message
      }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      count: inserted?.length || 0, 
      executives: inserted 
    })
  } catch (error) {
    return Response.json({ 
      error: 'Error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
