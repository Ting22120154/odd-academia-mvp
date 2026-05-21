import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/email/suspension
 * Body: { userId, userEmail, userName, action: "ban" | "unban", reason? }
 *
 * STUB — email delivery is not yet configured.
 * TODO: integrate an email provider (e.g. Resend, SendGrid) here and send:
 *   Subject : "Your account has been [suspended/banned] — Odd Academia"
 *   Body    : reason for action + APPEAL_EMAIL for the user to contact
 *
 * APPEAL INFO: Admin contact email must be surfaced in both email and UI error message
 */
export const APPEAL_EMAIL = "support@oddacademia.com";

export async function POST(_req: NextRequest) {
  // TODO: parse body, build email template, send via email provider
  return NextResponse.json(
    { ok: false, message: "Email service not yet configured." },
    { status: 501 },
  );
}
