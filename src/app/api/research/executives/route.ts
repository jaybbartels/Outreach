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
      ? `Focus on ${discipline} executives`
      : 'Focus on C-Suite executives'

    const prompt = `IMPORTANT: Return ONLY a JSON array with no other text, no markdown, no code blocks.

Research executives at ${companyName}. ${disciplineGuide}

For each executive, return: name, title, email (or null), linkedin (or null), phone (or null), discipline (or null)

RESPOND WITH ONLY THIS FORMAT - NO OTHER TEXT:
[{"name":"John Smith","title":"CEO","email":"john@company.com","linkedin":"https://linkedin.com/in/johnsmith","phone":"+1-555-0123","discipline":"Executive"}]`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    let responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let executives = []
    try {
      // Try direct parse first
      try {
        executives = JSON.parse(responseText)
      } catch {
        // If that fails, try to extract JSON array
        const jsonMatch = responseText.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          executives = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON array found')
        }
      }
    } catch (e) {
      console.error('Parse error. Response was:', responseText)
      return Response.json({ 
        error: 'Failed to parse response',
        response: responseText.substring(0, 200)
      }, { status: 500 })
    }

    // Calculate research status
    const calculateResearchStatus = (exec: any) => {
      const hasEmail = !!exec.email
      const hasPhone = !!exec.phone
      const hasLinkedIn = !!exec.linkedin
      const contactMethods = (hasEmail ? 1 : 0) + (hasPhone ? 1 : 0) + (hasLinkedIn ? 1 : 0)
      return contactMethods >= 2 ? 'completed' : 'in_progress'
    }

    const calculateConfidence = (exec: any) => {
      let score = 0
      if (exec.email) score += 30
      if (exec.linkedin) score += 30
      if (exec.phone) score += 20
      if (exec.discipline) score += 20
      
      if (score >= 70) return 'high'
      if (score >= 40) return 'medium'
      return 'low'
    }

    // Prepare data for upsert
    const data = executives.map((e: any) => ({
      company_id: company.id,
      name: e.name || 'Unknown',
      title: e.title || 'Unknown',
      email: e.email || null,
      phone: e.phone || null,
      linkedin_url: e.linkedin || null,
      confidence_level: calculateConfidence(e),
      research_status: calculateResearchStatus(e),
      research_completed_date: calculateResearchStatus(e) === 'completed' ? new Date().toISOString() : null,
      notes: e.discipline ? `Discipline: ${e.discipline}` : null
    }))

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
      incomplete: inserted?.filter((e: any) => e.research_status === 'in_progress').length || 0,
      executives: inserted 
    })
  } catch (error) {
    return Response.json({ 
      error: 'Error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
