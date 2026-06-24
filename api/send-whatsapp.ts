import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const instanceId = process.env.GREEN_API_INSTANCE_ID
  const apiToken = process.env.GREEN_API_TOKEN

  if (!instanceId || !apiToken) {
    return res.status(500).json({ error: 'GREEN_API_INSTANCE_ID or GREEN_API_TOKEN not set' })
  }

  const { phone, message } = req.body
  if (!phone || !message) return res.status(400).json({ error: 'phone and message are required' })

  // Normalize Egyptian phone → WhatsApp chat ID
  const cleaned = phone.replace(/\D/g, '')
  let withCode = cleaned
  if (cleaned.startsWith('00')) withCode = cleaned.slice(2)
  else if (cleaned.startsWith('0')) withCode = `20${cleaned.slice(1)}`
  else if (!cleaned.startsWith('20')) withCode = `20${cleaned}`
  const chatId = `${withCode}@c.us`

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(500).json({ error: data?.message ?? 'Green API error', details: data })
    }

    return res.status(200).json({ success: true, chatId, idMessage: data.idMessage })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Failed to send WhatsApp' })
  }
}
