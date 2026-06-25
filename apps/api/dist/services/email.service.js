"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendMagicLinkEmail = sendMagicLinkEmail;
exports.sendInvitationEmail = sendInvitationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendTicketNotificationEmail = sendTicketNotificationEmail;
exports.sendCustomerTicketCreatedEmail = sendCustomerTicketCreatedEmail;
exports.sendCustomerTicketResolvedEmail = sendCustomerTicketResolvedEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEmail(input) {
    const host = process.env["SMTP_HOST"];
    const port = process.env["SMTP_PORT"];
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];
    const from = process.env["SMTP_FROM"] || '"OCS Helpdesk" <noreply@ocs-helpdesk.local>';
    if (host && port && user && pass) {
        try {
            const transporter = nodemailer_1.default.createTransport({
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
        }
        catch (error) {
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
async function sendMagicLinkEmail(email, magicLink, name) {
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
async function sendInvitationEmail(email, invitationLink, tempPassword, name) {
    const greeting = name ? `Hello ${name},` : "Hello,";
    const tempPassMessage = tempPassword
        ? `\nWe have generated a temporary password for you: ${tempPassword}\n`
        : "";
    const text = `
${greeting}

You have been invited to join the OCS Helpdesk.
${tempPassMessage}
Click the link below to set up your password and activate your account:
${invitationLink}

This link is valid for 24 hours.

If you did not expect this invitation, you can safely ignore this email.
  `.trim();
    const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: bold; color: #0f172a;">OCS Helpdesk</span>
      </div>
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #0f172a;">Welcome to OCS Helpdesk!</h2>
      <p style="font-size: 15px; line-height: 24px; margin-bottom: 16px; color: #475569;">
        ${greeting}
      </p>
      <p style="font-size: 15px; line-height: 24px; margin-bottom: 24px; color: #475569;">
        You have been invited to access the OCS Helpdesk customer support portal. Click the button below to set up your password and activate your account.
      </p>
      ${tempPassword
        ? `<div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 14px; color: #334155; margin-bottom: 24px; text-align: center;">
              <strong>Temporary Password:</strong> <code style="font-size: 15px; color: #0f172a;">${tempPassword}</code>
             </div>`
        : ""}
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${invitationLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -2px rgba(14, 165, 233, 0.1);">
          Set Up Password
        </a>
      </div>
      <p style="font-size: 13px; line-height: 20px; color: #64748b; margin-bottom: 24px;">
        This setup link is valid for 24 hours.
      </p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8;">
        If you didn't expect this invitation, you can safely ignore this email.
        <br/><br/>
        Or copy and paste this link in your browser:
        <br/>
        <a href="${invitationLink}" style="color: #0ea5e9; text-decoration: underline; word-break: break-all;">${invitationLink}</a>
      </div>
    </div>
  `;
    await sendEmail({
        to: email,
        subject: "Welcome to OCS Helpdesk - Account Invitation",
        html,
        text,
    });
}
async function sendPasswordResetEmail(email, resetLink, name) {
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
async function sendTicketNotificationEmail(email, ticketDetails) {
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
async function sendCustomerTicketCreatedEmail(email, ticketDetails) {
    const text = `
Dear ${ticketDetails.customerName},

Thank you for contacting OCS Support. Your ticket has been successfully created.

Ticket Details:
- Ticket ID: ${ticketDetails.id}
- Title: ${ticketDetails.title}
- Category: ${ticketDetails.category}
- Priority: ${ticketDetails.priority}

Description:
${ticketDetails.description}

Our support team is reviewing your ticket and will get back to you as soon as possible. You can track the status of your ticket and add updates via the support portal.

Best regards,
OCS Helpdesk Team
  `.trim();
    const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #0ea5e9; letter-spacing: -0.5px;">OCS Helpdesk</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #0f172a; text-align: center;">Ticket Received</h2>
      <p style="font-size: 15px; color: #475569; line-height: 24px; margin-bottom: 24px;">
        Hi ${ticketDetails.customerName},<br/><br/>
        We've received your support request and our team is already looking into it. Here are the details of your ticket for your reference:
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; background-color: #f8fafc; border-radius: 12px; padding: 16px; display: table;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: 600; color: #64748b; width: 120px;">Ticket ID</td>
          <td style="padding: 12px; color: #0f172a; font-family: monospace; font-weight: bold;">${ticketDetails.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: 600; color: #64748b;">Title</td>
          <td style="padding: 12px; color: #0f172a;">${ticketDetails.title}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: 600; color: #64748b;">Category</td>
          <td style="padding: 12px; color: #0f172a;">${ticketDetails.category}</td>
        </tr>
        <tr>
          <td style="padding: 12px; font-weight: 600; color: #64748b;">Priority</td>
          <td style="padding: 12px; font-weight: bold; color: ${ticketDetails.priority === 'HIGH' ? '#ef4444' : ticketDetails.priority === 'MEDIUM' ? '#f59e0b' : '#3b82f6'}">${ticketDetails.priority}</td>
        </tr>
      </table>

      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #334155; border-left: 4px solid #0ea5e9;">
        <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">Description:</h4>
        <p style="margin: 0; white-space: pre-wrap; line-height: 20px;">${ticketDetails.description}</p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/tickets/${ticketDetails.id}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2);">
          View Ticket Portal
        </a>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        This is an automated notification. Please do not reply directly to this email.
      </div>
    </div>
  `;
    await sendEmail({
        to: email,
        subject: `[Ticket Received] #${ticketDetails.id}: ${ticketDetails.title}`,
        html,
        text,
    });
}
async function sendCustomerTicketResolvedEmail(email, ticketDetails) {
    const text = `
Dear ${ticketDetails.customerName},

Great news! Your support ticket has been resolved by our team.

Ticket ID: ${ticketDetails.id}
Title: ${ticketDetails.title}

If your issue has been fully addressed, no further action is required. If you feel the issue has not been fully resolved, you can reopen it or contact us through the portal.

Thank you for your patience!

Best regards,
OCS Helpdesk Team
  `.trim();
    const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #10b981; letter-spacing: -0.5px;">OCS Helpdesk</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #0f172a; text-align: center;">Ticket Resolved!</h2>
      <p style="font-size: 15px; color: #475569; line-height: 24px; margin-bottom: 24px;">
        Hi ${ticketDetails.customerName},<br/><br/>
        We are pleased to inform you that your support ticket has been marked as <strong>Resolved</strong>.
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; background-color: #f0fdf4; border-radius: 12px; padding: 16px; display: table; border: 1px solid #bbf7d0;">
        <tr style="border-bottom: 1px solid #bbf7d0;">
          <td style="padding: 12px; font-weight: 600; color: #166534; width: 120px;">Ticket ID</td>
          <td style="padding: 12px; color: #14532d; font-family: monospace; font-weight: bold;">${ticketDetails.id}</td>
        </tr>
        <tr>
          <td style="padding: 12px; font-weight: 600; color: #166534;">Title</td>
          <td style="padding: 12px; color: #14532d;">${ticketDetails.title}</td>
        </tr>
      </table>

      <p style="font-size: 14px; color: #475569; line-height: 22px; margin-bottom: 24px;">
        If you have any further questions or if the issue persists, please feel free to view the ticket or reopen it through the portal.
      </p>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/tickets/${ticketDetails.id}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
          View Ticket Detail
        </a>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        Thank you for choosing OCS Support.
      </div>
    </div>
  `;
    await sendEmail({
        to: email,
        subject: `[Resolved] Ticket #${ticketDetails.id}: ${ticketDetails.title}`,
        html,
        text,
    });
}
