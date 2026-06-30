import { supabase } from '@/lib/supabase'
import { Anthropic } from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface EmailResult {
  email: string | null
  source: 'hunter.io' | 'web-search' | 'manual'
  confidence: 'high' | 'medium' | 'low'
  error?: string
}

async function findEmailViaHunter(name: string, domain: string): Promise<EmailResult> {
  try {
    if (!process.env.HUNTER_IO_API_KEY) {
      return { email: null, source: 'hunter.io', confidence: 'low', error: 'No API key' }
    }

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

    // Check for rate limit error (429)
    if (data.errors && data.errors[0]?.id === 'too_many_requests') {
      return { email: null, source: 'hunter.io', confidence: 'low', error: 'Rate limit exceeded' }
    }

    if (data.data?.email) {
      return { email: data.data.email, source: 'hunter.io', confidence: 'high' }
    }

    return { email: null, source: 'hunter.io', confidence: 'low', error: 'Not found' }
  } catch (error) {
    console.error('Hunter.io error:', error)
    return { email: null, source: 'hunter.io', confidence: 'low', error: 'API error' }
  }
}

async function findEmailViaWebSearch(name: string, companyName: string): Promise<EmailResult> {
  try {
    const prompt = `Find the business email address for ${name} who works at ${companyName}.

Search for:
1. Company website contact/leadership page
2. LinkedIn profile
3. Email signature in news articles or press releases
4. Company directory

Return ONLY the email address if found, or "NOT_FOUND" if you cannot find it.
Format: name@company.com`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const email = responseText.trim()

    if (email && email !== 'NOT_FOUND' && email.includes('@')) {
      return { email: email, source: 'web-search', confidence: 'medium' }
    }

    return { email: null, source: 'web-search', confidence: 'low', error: 'Not found via web search' }
  } catch (error) {
    console.error('Web search error:', error)
    return { email: null, source: 'web-search', confidence: 'low', error: 'Search error' }
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, companyName } = await request.json()

    if (!companyId) {
      return Response.json({ error: 'Company ID required' }, { status: 400 })
    }

    // Get all executives without emails
    const { data: executives, error: fetchError } = await supabase
      .from('executives')
      .select('*')
      .eq('company_id', companyId)
      .is('email', null)

    if (fetchError || !executives) {
      return Response.json({ error: 'Failed to fetch executives' }, { status: 500 })
    }

    if (executives.length === 0) {
      return Response.json({
        success: true,
        message: 'All executives already have emails',
        updated: 0,
        results: []
      })
    }

    // Try to find emails with fallback strategy
    const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com'
    let updated = 0
    const results = []

    for (const exec of executives) {
      let emailResult: EmailResult | null = null

      // Step 1: Try Hunter.io
      console.log(`Trying Hunter.io for ${exec.name}...`)
      emailResult = await findEmailViaHunter(exec.name, domain)

      // Step 2: If Hunter.io failed, try web search
      if (!emailResult.email) {
        console.log(`Hunter.io failed (${emailResult.error}) for ${exec.name}, trying web search...`)
        emailResult = await findEmailViaWebSearch(exec.name, companyName)
      }

      // Step 3: If both failed, mark for manual entry
      if (!emailResult.email) {
        console.log(`Web search also failed for ${exec.name}, marking for manual entry`)
        emailResult = { email: null, source: 'manual', confidence: 'low', error: 'Requires manual entry' }
      }

      // Update database if email found
      if (emailResult.email) {
        const { error: updateError } = await supabase
          .from('executives')
          .update({
            email: emailResult.email,
            confidence_level: emailResult.confidence
          })
          .eq('id', exec.id)

        if (!updateError) {
          updated++
        }
      }

      results.push({
        name: exec.name,
        email: emailResult.email,
        source: emailResult.source,
        confidence: emailResult.confidence,
        error: emailResult.error
      })
    }

    return Response.json({
      success: true,
      message: `Found emails for ${updated}/${executives.length} executives`,
      updated: updated,
      total: executives.length,
      results: results
    })
  } catch (error) {
    return Response.json({
      error: 'Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
