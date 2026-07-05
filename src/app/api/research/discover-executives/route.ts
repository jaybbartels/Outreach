import { Anthropic } from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const client = new Anthropic()

async function findEmailViaHunter(name: string, domain: string): Promise<string | null> {
  try {
    if (!process.env.HUNTER_IO_API_KEY) return null

    const nameParts = name.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts[nameParts.length - 1] || ''

    const searchParams = new URLSearchParams({
      domain: domain,
      first_name: firstName,
      last_name: lastName,
      api_key: process.env.HUNTER_IO_API_KEY
    })

    const response = await fetch(`https://api.hunter.io/v2/email-finder?${searchParams}`)
    const data = await response.json()

    if (data.errors && data.errors[0]?.id === 'too_many_requests') {
      return null
    }

    return data.data?.email || null
  } catch (error) {
    return null
  }
}

async function findEmailViaWebSearch(name: string, companyName: string): Promise<string | null> {
  try {
    const prompt = `Find the business email for ${name} at ${companyName}. Return ONLY the email or NOT_FOUND.`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const email = responseText.trim()

    if (email && email !== 'NOT_FOUND' && email.includes('@')) {
      return email
    }

    return null
  } catch (error) {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, companyName, limit = 10 } = await request.json()

    if (!companyId) {
      return Response.json({ error: 'Company ID required' }, { status: 400 })
    }

    // Check if executives already exist
    const { data: existingExecs } = await supabase
      .from('executives')
      .select('*')
      .eq('company_id', companyId)

    const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com'
    let executives = existingExecs || []
    let newExecutivesFound = 0
    let emailsEnriched = 0

    // If no executives exist, research them
    if (executives.length === 0) {
      const prompt = `Research ${limit} executives at ${companyName}. Return ONLY this JSON array format with no markdown or extra text:
[{"name":"John Doe","title":"CEO","email":null,"linkedin":null}]`

      const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })

      let responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      
      // Remove markdown code blocks
      responseText = responseText
        .replace(/^```json\n/i, '')
        .replace(/^```\n/i, '')
        .replace(/\n```$/i, '')
        .replace(/```$/i, '')
        .trim()

      let researched = []
      try {
        researched = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse Claude response:', responseText.substring(0, 500))
        return Response.json({ 
          error: 'Failed to parse executives', 
          details: 'Invalid JSON from Claude'
        }, { status: 500 })
      }

      // Enrich with emails
      for (const exec of researched) {
        let email = exec.email || null

        if (!email) {
          email = await findEmailViaHunter(exec.name, domain)
        }

        if (!email) {
          email = await findEmailViaWebSearch(exec.name, companyName)
        }

        executives.push({
          company_id: companyId,
          name: exec.name || 'Unknown',
          title: exec.title || 'Unknown',
          email: email,
          linkedin_url: exec.linkedin || null,
          phone: null,
          confidence_level: email ? 'high' : 'medium',
          research_status: 'completed',
          research_completed_date: new Date().toISOString()
        })

        if (email) emailsEnriched++
        newExecutivesFound++
      }

      if (executives.length > 0) {
        const { error: insertError } = await supabase
          .from('executives')
          .insert(executives)

        if (insertError) {
          return Response.json({ error: 'Failed to store executives' }, { status: 500 })
        }
      }
    } else {
      // Enrich existing executives
      const execsNeedingEmails = executives.filter(e => !e.email).slice(0, limit)

      for (const exec of execsNeedingEmails) {
        let email = null

        email = await findEmailViaHunter(exec.name, domain)

        if (!email) {
          email = await findEmailViaWebSearch(exec.name, companyName)
        }

        if (email) {
          await supabase
            .from('executives')
            .update({ email: email, confidence_level: 'high' })
            .eq('id', exec.id)

          emailsEnriched++
        }
      }
    }

    return Response.json({
      success: true,
      newExecutivesFound: newExecutivesFound,
      emailsEnriched: emailsEnriched,
      totalExecutives: executives.length,
      message: newExecutivesFound > 0 
        ? `Found ${newExecutivesFound} executives with ${emailsEnriched} emails`
        : `Enriched ${emailsEnriched} existing executives with emails`
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({
      error: 'Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
