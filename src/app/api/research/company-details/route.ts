import { Anthropic } from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const client = new Anthropic()

async function getCompanyInfoViaClaude(companyName: string): Promise<{ hq_location?: string; phone?: string }> {
  try {
    const prompt = `You are a business researcher. Find and provide the headquarters location (city, state/country) and main corporate phone number for ${companyName}.

Think carefully about what you know about this company. If it's a well-known company, you likely have information about it.

Return ONLY in this exact format:
City, State | Phone Number

Examples:
Rochester, Minnesota | 1-904-953-2000
Taipei, Taiwan | +886-2-2175-1210
San Jose, California | 1-408-555-1234

If you genuinely cannot find the information, return "unknown" for that part.`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })

    let responseText = ''
    for (const block of message.content) {
      if (block.type === 'text') {
        responseText = block.text
        break
      }
    }

    responseText = responseText.trim()
    console.log('Claude response:', responseText)

    if (responseText.includes('unknown') || !responseText.includes('|')) {
      return {}
    }

    const parts = responseText.split('|')
    return {
      hq_location: parts[0]?.trim() || undefined,
      phone: parts[1]?.trim() || undefined
    }
  } catch (error) {
    console.error('Claude error:', error)
    return {}
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, companyName } = await request.json()

    if (!companyId || !companyName) {
      return Response.json({ error: 'Company ID and name required' }, { status: 400 })
    }

    console.log(`Researching company: ${companyName} (${companyId})`)

    const details = await getCompanyInfoViaClaude(companyName)
    console.log('Research result:', details)

    // Update company with status = completed
    const { data, error: updateError } = await supabase
      .from('companies')
      .update({
        hq_location: details.hq_location || null,
        phone: details.phone || null,
        status: 'completed'
      })
      .eq('id', companyId)
      .select()

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return Response.json({ 
        error: 'Failed to update company',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('Update successful:', data)

    return Response.json({
      success: true,
      message: `✅ Found: ${details.hq_location || 'no location'}, ${details.phone || 'no phone'}`,
      details: details
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({
      error: 'Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
