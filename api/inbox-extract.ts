import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const client = new Anthropic()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { emailBody, subject, fromAddress } = req.body
  if (!emailBody) return res.status(400).json({ error: 'emailBody is required' })

  const prompt = `You are a booking data extractor for a honeymoon travel agency called ITTravelers based in Cairo, Egypt.

Analyze this email and extract any booking or tour information.

Email subject: ${subject || '(no subject)'}
From: ${fromAddress || '(unknown)'}
Email body:
---
${emailBody}
---

Extract ALL available information and return a JSON object with this exact structure:
{
  "type": "reservation" | "tour" | "unknown",
  "client_name": string | null,
  "hotel_name": string | null,
  "room_type": string | null,
  "checkin_date": "YYYY-MM-DD" | null,
  "checkout_date": "YYYY-MM-DD" | null,
  "nights": number | null,
  "rate_per_night": number | null,
  "currency": "USD" | "IDR" | "THB" | "EGP" | null,
  "meal_plan": string | null,
  "confirmation_number": string | null,
  "cutoff_date": "YYYY-MM-DD" | null,
  "status": "Availability pending" | "Confirmed" | "Paid" | null,
  "notes": string | null,
  "tour_destination": string | null,
  "tour_days": [
    {
      "day_number": number,
      "title": string,
      "description": string | null,
      "date": "YYYY-MM-DD" | null,
      "booking_link": string | null
    }
  ] | null,
  "warnings": string[]
}

For warnings, include any of these if they apply:
- "Missing check-in date"
- "Missing check-out date"
- "Missing hotel name"
- "Missing confirmation number"
- "Missing cutoff/payment deadline date"
- "Missing rate per night"
- "Missing client name"

Return ONLY the raw JSON object. No explanation, no markdown, no code blocks.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let extracted
    try {
      extracted = JSON.parse(text)
    } catch {
      return res.status(422).json({ error: 'Could not parse AI response', raw: text })
    }

    return res.status(200).json({ extracted })
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'AI extraction failed' })
  }
}
