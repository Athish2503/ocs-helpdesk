import nodemailer from "nodemailer";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const host = process.env["SMTP_HOST"];
  const port = process.env["SMTP_PORT"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  const from = process.env["SMTP_FROM"] || '"OCS Helpdesk" <noreply@ocs-helpdesk.local>';

  if (host && port && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      console.log(`[Email Service] Email sent successfully to ${input.to}`);
      return;
    } catch (error) {
      console.error("[Email Service] Failed to send email via SMTP, falling back to console:", error);
    }
  }

  // Fallback to beautiful console output
  const boxWidth = 70;
  const line = "─".repeat(boxWidth - 2);
  const title = " OCS HELPDESK EMAIL OUTBOX (DEV MODE) ";
  const paddingLeft = Math.floor((boxWidth - 2 - title.length) / 2);
  const paddingRight = boxWidth - 2 - title.length - paddingLeft;
  const formattedTitle = " ".repeat(paddingLeft) + title + " ".repeat(paddingRight);

  console.log(`
┌${line}┐
│${formattedTitle}│
├${line}┤
│ To: ${input.to.padEnd(boxWidth - 7)}│
│ Subject: ${input.subject.padEnd(boxWidth - 12)}│
├${line}┤
│ Text Body:                                                           │
${input.text
  .split("\n")
  .map((l) => `│   ${l.trim().padEnd(boxWidth - 7)}│`)
  .join("\n")}
└${line}┘
`);
}

export async function sendMagicLinkEmail(email: string, magicLink: string, name?: string): Promise<void> {
  const greeting = name ? `Hello ${name},` : "Hello,";

  const text = `
${greeting}

 Sign in to OCS Helpdesk.

Click the link below to verify your email and access your account:
${magicLink}

This link will expire in 15 minutes and can only be used once.

If you did not request this email, you can safely ignore it.
  `.trim();

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: bold; color: #0f172a;">OCS Helpdesk</span>
      </div>
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #0f172a;">${greeting}</h2>
      <p style="font-size: 15px; line-height: 24px; margin-bottom: 24px; color: #475569;">
        You requested a verification link to sign in to OCS Helpdesk. Click the button below to log in directly.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${magicLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -2px rgba(14, 165, 233, 0.1);">
          Verify and Sign In
        </a>
      </div>
      <p style="font-size: 13px; line-height: 20px; color: #64748b; margin-bottom: 24px;">
        This link is only valid for 15 minutes and will expire after its first use.
      </p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8;">
        If you didn't request this email, please ignore it or contact support if you have concerns.
        <br/><br/>
        Or copy and paste this link in your browser:
        <br/>
        <a href="${magicLink}" style="color: #0ea5e9; text-decoration: underline; word-break: break-all;">${magicLink}</a>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Sign in to OCS Helpdesk",
    html,
    text,
  });
}

export async function sendPasswordResetEmail(email: string, resetLink: string, name?: string): Promise<void> {
  const greeting = name ? `Hello ${name},` : "Hello,";

  const text = `
${greeting}

Reset your OCS Helpdesk password.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour and can only be used once.

If you did not request a password reset, you can safely ignore this email.
  `.trim();

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: bold; color: #0f172a;">OCS Helpdesk</span>
      </div>
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #0f172a;">${greeting}</h2>
      <p style="font-size: 15px; line-height: 24px; margin-bottom: 24px; color: #475569;">
        We received a request to reset the password for your OCS Helpdesk account. Click the button below to set a new password.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -2px rgba(14, 165, 233, 0.1);">
          Reset Password
        </a>
      </div>
      <p style="font-size: 13px; line-height: 20px; color: #64748b; margin-bottom: 24px;">
        This password reset link is valid for 1 hour and will expire after its first use.
      </p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8;">
        If you didn't request a password reset, you can safely ignore this email.
        <br/><br/>
        Or copy and paste this link in your browser:
        <br/>
        <a href="${resetLink}" style="color: #0ea5e9; text-decoration: underline; word-break: break-all;">${resetLink}</a>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Reset your OCS Helpdesk password",
    html,
    text,
  });
}

export async function sendTicketNotificationEmail(
  email: string,
  ticketDetails: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    customerName: string;
    customerEmail: string;
    affectedDomain?: string | null;
  }
): Promise<void> {
  const text = `
New ticket assigned to you/your team:
Ticket ID: ${ticketDetails.id}
Title: ${ticketDetails.title}
Customer: ${ticketDetails.customerName} (${ticketDetails.customerEmail})
Category: ${ticketDetails.category}
Priority: ${ticketDetails.priority}
Affected Domain: ${ticketDetails.affectedDomain || "N/A"}

Description:
${ticketDetails.description}

Please check your portal to respond.
  `.trim();

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: bold; color: #0f172a;">OCS Helpdesk</span>
      </div>
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #0f172a;">New Ticket Assigned</h2>
      <p style="font-size: 15px; color: #475569; margin-bottom: 20px;">
        A new ticket has been assigned to you or your department. Below are the details:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; font-weight: 600; color: #64748b; width: 150px;">Ticket ID</td>
          <td style="padding: 10px 0; color: #0f172a; font-family: monospace;">${ticketDetails.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Title</td>
          <td style="padding: 10px 0; color: #0f172a;">${ticketDetails.title}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Customer</td>
          <td style="padding: 10px 0; color: #0f172a;">${ticketDetails.customerName} (${ticketDetails.customerEmail})</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Category</td>
          <td style="padding: 10px 0; color: #0f172a;">${ticketDetails.category}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Priority</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: bold; color: ${ticketDetails.priority === 'HIGH' ? '#ef4444' : ticketDetails.priority === 'MEDIUM' ? '#f59e0b' : '#64748b'}">${ticketDetails.priority}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Affected Domain</td>
          <td style="padding: 10px 0; color: #0f172a;">${ticketDetails.affectedDomain || "N/A"}</td>
        </tr>
      </table>
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #334155;">
        <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">Description:</h4>
        <p style="margin: 0; white-space: pre-wrap; line-height: 20px;">${ticketDetails.description}</p>
      </div>
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/dashboard" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          Open Admin Portal
        </a>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `[New Ticket] ${ticketDetails.priority}: ${ticketDetails.title}`,
    html,
    text,
  });
}
