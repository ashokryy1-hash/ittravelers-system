import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const senderEmail = process.env.OUTLOOK_SENDER_EMAIL
  const senderPassword = process.env.OUTLOOK_SENDER_PASSWORD

  if (!senderEmail || !senderPassword) {
    return res.status(500).json({ error: 'Credentials not set', senderEmail: !!senderEmail, senderPassword: !!senderPassword })
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: { user: senderEmail, pass: senderPassword },
    tls: { rejectUnauthorized: false },
  })

  try {
    await transporter.verify()
    // Send a test email to yourself
    await transporter.sendMail({
      from: `"ITTravelers Test" <${senderEmail}>`,
      to: senderEmail,
      subject: 'ITTravelers HMS — SMTP Test',
      text: 'If you receive this, email sending is working correctly.',
    })
    return res.status(200).json({ success: true, message: `Test email sent to ${senderEmail}` })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message, code: err?.code, command: err?.command })
  }
}
