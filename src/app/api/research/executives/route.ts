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
      ? `Focus on ${discipline} executives (VPs, Directors, Heads)`
      : 'Focus on C-Suite executives (CEO, CFO, CTO, COO, CMO, CHRO, General Counsel)'

    const prompt = `Research executives at ${companyName}. ${disciplineGuide}

For EACH executive, find and provide:
1. Full Name
2. Current Title/Position
3. Email address (search company website, LinkedIn, press releases)
4. LinkedIn profile URL
5. Phone number (if publicly available)
6. Department/Discipline (Sales, Engineering, Operations, Finance, Legal, etc.)

Search the company website leadership page, LinkedIn, recent news, and press releases.

Return ONLY valid JSON array with no other text:
[
  {
    "name": "John Smith",
    "title": "Chief Executive Officer",
    "email": "john.smith@company.com",
    "linkedin": "https://linkedin.com/in/johnsmith",
    "phone": "+1-555-0123",
    "discipline": "Executive"
  }
]

If you cannot find a value, use null (not "unknown").
Return ONLY the JSON array.`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
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

    // Calculate confidence based on data found
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
      research_status: 'completed',
      research_completed_date: new Date().toISOString(),
      notes: e.discipline ? `Discipline: ${e.discipline}` : null
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
