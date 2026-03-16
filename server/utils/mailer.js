const nodemailer = require('nodemailer')

// Configure the transport using environment variables
// Defaults to a console-logger if SMTP is not properly defined, to prevent crashes
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  // Fallback dev transporter that just logs the email to console
  return {
    sendMail: async (mailOptions) => {
      console.log('-------------------------------------------------------')
      console.log('📧 MOCK EMAIL DISPATCHED (SMTP Not Configured):')
      console.log(`To: ${mailOptions.to}`)
      console.log(`Subject: ${mailOptions.subject}`)
      console.log(`Body:\n${mailOptions.text || mailOptions.html}`)
      console.log('-------------------------------------------------------')
      return { messageId: 'mock-id' }
    }
  }
}

const transporter = createTransporter()

const sendInviteEmail = async (toEmail, inviterName, itemName, itemLink, role) => {
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@collabsheets.com'
  
  const subject = `${inviterName} invited you to collaborate on "${itemName}"`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 24px;">CollabSheets</h2>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #334155; margin-top: 0;">Hi there,</p>
        <p style="font-size: 16px; color: #334155;">
          <strong>${inviterName}</strong> has invited you to collaborate on <strong>"${itemName}"</strong> as a ${role}.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${itemLink}" style="background: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Open in CollabSheets
          </a>
        </div>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
          If you don't have an account yet, you can sign up for free and jump right into editing.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">CollabSheets - Real-time Collaborative Workspace</p>
      </div>
    </div>
  `

  const text = `Hi there,\n\n${inviterName} has invited you to collaborate on "${itemName}" as a ${role}.\n\nOpen it here: ${itemLink}\n\n- The CollabSheets Team`

  try {
    const info = await transporter.sendMail({
      from: `"CollabSheets" <${fromEmail}>`,
      to: toEmail,
      subject,
      text,
      html
    })
    console.log(`Invite email sent to ${toEmail} | MessageID: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

module.exports = { sendInviteEmail }
