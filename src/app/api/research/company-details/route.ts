import { Anthropic } from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { companyId, companyName } = await request.json()

    if (!companyId || !companyName) {
      return Response.json({ error: 'Company ID and name required' }, { status: 400 })
    }

    const prompt = `Research the headquarters location and corporate phone number for ${companyName}.

Return ONLY this JSON format with no markdown or extra text:
{"hq_location":"City, State","phone":"Phone Number or null"}

If you cannot find the information, use null for that field.`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    })

    let responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    responseText = responseText
      .replace(/^```json\n/i, '')
      .replace(/^```\n/i, '')
      .replace(/\n```$/i, '')
      .replace(/```$/i, '')
      .trim()

    let details = { hq_location: null, phone: null }
    try {
      details = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse response:', responseText)
      return Response.json({ 
        error: 'Failed to parse company details',
        details: responseText.substring(0, 200)
      }, { status: 500 })
    }

    // Update company with found details
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        hq_location: details.hq_location,
        phone: details.phone
      })
      .eq('id', companyId)

    if (updateError) {
      return Response.json({ error: 'Failed to update company' }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: `Found: ${details.hq_location || 'no location'}, ${details.phone || 'no phone'}`,
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
