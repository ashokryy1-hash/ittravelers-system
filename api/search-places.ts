import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query, apiKey } = req.body
  if (!query || !apiKey) {
    return res.status(400).json({ error: 'query and apiKey are required' })
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
  const response = await fetch(url)

  if (!response.ok) {
    return res.status(response.status).json({ error: 'Google Places API error' })
  }

  const data = await response.json()
  return res.status(200).json(data)
}
