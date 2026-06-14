import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const senderEmail = process.env.OUTLOOK_SENDER_EMAIL
  const senderPassword = process.env.OUTLOOK_SENDER_PASSWORD

  if (!senderEmail || !senderPassword) {
    return res.status(500).json({ error: 'Email credentials not configured on server' })
  }

  const { to, subject, body, senderName } = req.body
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required' })
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  try {
    await transporter.sendMail({
      from: `"${senderName ?? 'ITTravelers'}" <${senderEmail}>`,
      to,
      subject,
      text: body,
    })
    return res.status(200).json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Failed to send email' })
  }
}
