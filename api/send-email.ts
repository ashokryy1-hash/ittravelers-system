import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const tenantId = process.env.OUTLOOK_TENANT_ID
  const clientId = process.env.OUTLOOK_CLIENT_ID
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET
  const senderEmail = process.env.OUTLOOK_SENDER_EMAIL

  if (!tenantId || !clientId || !clientSecret || !senderEmail) {
    return res.status(500).json({ error: 'Outlook credentials not configured on server' })
  }

  const { to, subject, body, senderName } = req.body
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required' })
  }

  // 1. Get access token via client credentials flow
  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return res.status(500).json({ error: `Failed to get access token: ${err}` })
  }

  const { access_token } = await tokenRes.json()

  // 2. Send email via Microsoft Graph
  const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject,
        body: {
          contentType: 'Text',
          content: body,
        },
        toRecipients: [
          { emailAddress: { address: to } },
        ],
        from: {
          emailAddress: {
            address: senderEmail,
            name: senderName ?? 'ITTravelers',
          },
        },
      },
      saveToSentItems: true,
    }),
  })

  if (!sendRes.ok) {
    const err = await sendRes.text()
    return res.status(500).json({ error: `Graph API error: ${err}` })
  }

  return res.status(200).json({ success: true })
}
