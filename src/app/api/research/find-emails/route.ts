import { supabase } from '@/lib/supabase'

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

    return data.data?.email || null
  } catch (error) {
    console.error('Hunter.io error:', error)
    return null
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
        updated: 0
      })
    }

    // Try to find emails for each executive
    const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com'
    let updated = 0

    for (const exec of executives) {
      const foundEmail = await findEmailViaHunter(exec.name, domain)
      
      if (foundEmail) {
        const { error: updateError } = await supabase
          .from('executives')
          .update({
            email: foundEmail,
            confidence_level: 'high'
          })
          .eq('id', exec.id)

        if (!updateError) {
          updated++
        }
      }
    }

    return Response.json({
      success: true,
      message: `Found emails for ${updated} executives`,
      updated: updated,
      total: executives.length
    })
  } catch (error) {
    return Response.json({
      error: 'Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
