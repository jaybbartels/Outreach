import { Anthropic } from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { companyName, discipline } = await request.json()

    if (!companyName) {
      return Response.json({ error: 'Company name required' }, { status: 400 })
    }

    // Check if we already have executives for this company
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .single()

    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 })
    }

    // Build research prompt
    const disciplineGuide = discipline
      ? `Focus primarily on ${discipline} executives (VPs, Directors, etc.)`
      : 'Start with C-Suite (CEO, CFO, CTO, COO, CMO, CHRO, General Counsel)'

    const prompt = `Research the executive team of ${companyName}. ${disciplineGuide}

For each executive, provide:
1. Full Name
2. Current Title
3. Email (if publicly available, otherwise "unknown")
4. LinkedIn profile URL (if available, otherwise "unknown")

Format ONLY as valid JSON array:
[
  {
    "name": "John Smith",
    "title": "Chief Executive Officer",
    "email": "john@company.com",
    "linkedin": "https://linkedin.com/in/johnsmith"
  }
]

Return only the JSON array, nothing else.`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    let executives = []
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        executives = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      return Response.json({ error: 'Failed to parse executives' }, { status: 500 })
    }

    const executivesWithConfidence = executives.map((exec: any) => ({
      name: exec.name,
      title: exec.title,
      email: exec.email || null,
      linkedin_url: exec.linkedin || null,
      company_id: company.id,
      research_status: 'completed',
      research_completed_date: new Date().toISOString(),
      confidence_level: exec.email && exec.email !== 'unknown' ? 'high' : 'medium',
      overall_accessibility: 'unknown',
      linkedin_engagement_score: 0,
      email_engagement_score: 0,
      phone_engagement_score: 0,
      messaging_engagement_score: 0,
      publications_engagement_score: 0,
      social_media_engagement_score: 0,
      event_visibility_score: 0,
      response_history_score: 0
    }))

    const { data, error } = await supabase
      .from('executives')
      .insert(executivesWithConfidence)
      .select()

    if (error) {
      return Response.json({ error: 'Failed to store executives' }, { status: 500 })
    }

    return Response.json({
      success: true,
      count: data?.length || 0,
      executives: data || executivesWithConfidence
    })
  } catch (error) {
    console.error('Research error:', error)
    return Response.json({ error: 'Research failed' }, { status: 500 })
  }
}
