import { Anthropic } from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const client = new Anthropic()

async function getCompanyInfoViaHunter(companyName: string): Promise<{ hq_location?: string; phone?: string }> {
  try {
    const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com'
    
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_IO_API_KEY}`
    )
    const data = await response.json()

    if (data.data) {
      return {
        hq_location: data.data.organization?.country ? `${data.data.organization.country}` : undefined,
        phone: data.data.phone_number || undefined
      }
    }
    return {}
  } catch (error) {
    console.error('Hunter.io error:', error)
    return {}
  }
}

async function getCompanyInfoViaClaude(companyName: string): Promise<{ hq_location?: string; phone?: string }> {
  try {
    const prompt = `What is the headquarters city/state and main phone number for ${companyName}? 
Return ONLY: "City, State" and phone number separated by | or "unknown" if not found.
Example: Rochester, Minnesota | 1-904-953-2000`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    })

    let responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    responseText = responseText.trim()

    if (responseText.includes('unknown')) {
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

    // Try Hunter.io first
    let details = await getCompanyInfoViaHunter(companyName)
    console.log('Hunter.io result:', details)

    // If Hunter didn't find location, try Claude
    if (!details.hq_location) {
      const claudeDetails = await getCompanyInfoViaClaude(companyName)
      console.log('Claude result:', claudeDetails)
      details = { ...details, ...claudeDetails }
    }

    console.log('Final details to update:', details)

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
