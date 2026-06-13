import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { pdfBase64 } = req.body
  if (!pdfBase64) {
    return res.status(400).json({ error: 'pdfBase64 is required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server' })
  }

  const prompt = `You are extracting hotel contract data from a PDF. Extract ALL information and return it as valid JSON only — no explanation, no markdown, just the raw JSON object.

Extract this structure:
{
  "name": "hotel name",
  "city": "city or area (e.g. Ubud, Seminyak, Uluwatu)",
  "star_rating": 5,
  "chain": "chain or group name (e.g. Ini Vie Hospitality, Pramana Group) or empty string",
  "contact_name": "contact person name or empty string",
  "contact_email": "sales or reservations email or empty string",
  "surcharge_waiver": "none or 50% or 100%",
  "valid_from": "YYYY-MM-DD or empty string",
  "valid_to": "YYYY-MM-DD or empty string",
  "booking_window_from": "YYYY-MM-DD or empty string",
  "booking_window_to": "YYYY-MM-DD or empty string",
  "photo_link_url": "photo or media link if found or empty string",
  "notes": "any important notes, policies, or conditions",
  "room_types": [
    {
      "name": "room type name",
      "room_category": "room or villa",
      "low_season_rate": 1500000,
      "high_season_rate": 2000000,
      "peak_season_rate": 2500000,
      "currency": "IDR or THB or USD",
      "meal_plan": "RO or BB or HB or FB or AI",
      "notes": "any notes about this room type"
    }
  ]
}

Rules:
- room_category is "villa" if it has a private pool, otherwise "room"
- Use null for any rate not mentioned
- If only one rate is given, put it in low_season_rate
- currency defaults to IDR for Bali contracts
- meal_plan defaults to BB if not specified
- Return ONLY the JSON, nothing else`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()

    if (data.error) {
      return res.status(500).json({ error: data.error.message })
    }

    const rawText = data.content?.[0]?.text ?? ''
    const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const extracted = JSON.parse(jsonText)

    return res.status(200).json(extracted)
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Failed to extract contract data' })
  }
}
