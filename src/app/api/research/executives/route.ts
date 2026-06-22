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

    const prompt = `Research executives at ${companyName}. ${disciplineGuide}

For EACH executive, find:
1. Full Name
2. Title
3. Email address (search company website, LinkedIn, press releases, industry directories)
4. LinkedIn profile URL
5. Phone number (if publicly available)
6. Department/Discipline

Return ONLY JSON array:
[
  {
    "name": "John Smith",
    "title": "CEO",
    "email": "john@company.com",
    "linkedin": "https://linkedin.com/in/johnsmith",
    "phone": "+1-555-0123",
    "discipline": "Executive"
  }
]

Use null for missing values.`

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
      return Response.json({ error: 'Failed to parse response' }, { status: 500 })
    }

    // Calculate completion and confidence
    const calculateResearchStatus = (exec: any) => {
      const hasEmail = !!exec.email
      const hasPhone = !!exec.phone
      const hasLinkedIn = !!exec.linkedin
      
      const completenessScore = (hasEmail ? 1 : 0) + (hasPhone ? 1 : 0) + (hasLinkedIn ? 1 : 0)
      
      // Mark as completed only if we have at least 2 contact methods
      const status = completenessScore >= 2 ? 'completed' : 'in_progress'
      
      return status
    }

    const calculateConfidence = (exec: any, existingExec?: any) => {
      let score = 0
      if (exec.email) score += 30
      if (exec.linkedin) score += 30
      if (exec.phone) score += 20
      if (exec.discipline) score += 20
      
      let level = 'low'
      if (score >= 70) level = 'high'
      else if (score >= 40) level = 'medium'
      
      // If we already have this exec, and found new data, boost confidence
      if (existingExec && existingExec.confidence_level === 'high') {
        return 'high' // Keep high confidence
      }
      
      return level
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
