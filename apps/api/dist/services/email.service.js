"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendMagicLinkEmail = sendMagicLinkEmail;
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
        You requested a secure verification link to sign in or register to OCS Helpdesk. Click the button below to log in directly.
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
