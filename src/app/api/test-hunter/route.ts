export async function POST(request: Request) {
  try {
    const { name, domain } = await request.json()

    const searchParams = new URLSearchParams({
      domain: domain,
      first_name: name.split(' ')[0],
      last_name: name.split(' ')[1] || '',
      api_key: process.env.HUNTER_IO_API_KEY || ''
    })

    const response = await fetch(
      `https://api.hunter.io/v2/email-finder?${searchParams}`
    )

    const data = await response.json()

    return Response.json({
      status: response.status,
      api_key_set: !!process.env.HUNTER_IO_API_KEY,
      response: data
    })
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
