import { Anthropic } from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { companyName, discipline } = await request.json()

    if (!companyName) {
      return Response.json({ error: 'Company name required' }, { status: 400 })
    }

    // Get company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .single()

    if (companyError || !company) {
      return Response.json({ error: `Company not found: ${companyError?.message}` }, { status: 404 })
    }

    const disciplineGuide = discipline
      ? `Focus primarily on ${discipline} executives`
      : 'Start with C-Suite executives'

    const prompt = `Find the top 5 executives at ${companyName}. ${disciplineGuide}

Return ONLY this JSON format with no other text:
[{"name":"John Smith","title":"CEO","email":"john@company.com","linkedin":"https://linkedin.com/in/johnsmith"}]`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1000,
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
      return Response.json({ error: 'Failed to parse response', response: responseText }, { status: 500 })
    }

    // Simple insert with only required fields
    const data = executives.map((e: any) => ({
      company_id: company.id,
      name: e.name || 'Unknown',
      title: e.title || 'Unknown'
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('executives')
      .insert(data)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return Response.json({ 
        error: 'Failed to store executives', 
        details: insertError.message,
        code: insertError.code
      }, { status: 500 })
    }

    return Response.json({ success: true, count: inserted?.length || 0, executives: inserted })
  } catch (error) {
    return Response.json({ 
      error: 'Error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
