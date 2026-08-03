"""Email delivery via Resend API — with SMTP fallback for development."""
import os
import logging

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
FROM_ADDRESS   = os.environ.get("MAIL_FROM", "onboarding@resend.dev")
PORTAL_URL     = "https://moviq-bwz.vercel.app"

# ── Low-level sender ──────────────────────────────────────────────────────────

async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email using Resend API. Falls back to logging if key not set."""
    if not to_email:
        logger.warning("📩 Skip: no recipient address")
        return False

    if RESEND_API_KEY:
        try:
            import resend
            resend.api_key = RESEND_API_KEY
            params = {
                "from": FROM_ADDRESS,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            resend.Emails.send(params)
            logger.info("✅ Email sent via Resend to %s", to_email)
            return True
        except Exception as e:
            logger.error("❌ Resend failed for %s: %s", to_email, str(e))

    # Dev fallback — just log it
    logger.info(
        "\n=================== MOCK EMAIL ===================\n"
        "TO: %s\nSUBJECT: %s\n(Set RESEND_API_KEY to actually send)\n"
        "===================================================",
        to_email, subject,
    )
    return True


# ── Invite email ──────────────────────────────────────────────────────────────

async def send_invite_email(
    name: str,
    email: str,
    role: str,
    password: str = "",
) -> bool:
    role_labels = {
        "admin":      "Platform Admin",
        "agency":     "Agency Head",
        "supervisor": "Supervisor",
        "field":      "Field Executive",
    }
    role_label = role_labels.get(role.lower(), role.title())
    subject    = f"You're invited to MOVIQ — {role_label} access"

    login_block = ""
    if password:
        login_block = f"""
        <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
          <tr>
            <td style="padding:14px 18px;font-size:13px;color:#64748b;width:110px;font-weight:600;">Email</td>
            <td style="padding:14px 18px;font-size:14px;color:#0f172a;font-weight:700;">{email}</td>
          </tr>
          <tr style="border-top:1px solid #fecaca;">
            <td style="padding:14px 18px;font-size:13px;color:#64748b;width:110px;font-weight:600;">Temp&nbsp;Password</td>
            <td style="padding:14px 18px;font-size:14px;color:#0f172a;font-weight:700;font-family:monospace;">{password}</td>
          </tr>
          <tr style="border-top:1px solid #fecaca;">
            <td style="padding:14px 18px;font-size:13px;color:#64748b;width:110px;font-weight:600;">Role</td>
            <td style="padding:14px 18px;font-size:14px;color:#0f172a;">{role_label}</td>
          </tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:0;">
          ⚠️ Please change your password after your first login.
        </p>
        """
    else:
        login_block = f"""
        <p style="font-size:14px;color:#475569;">
          Log in using your email address: <strong>{email}</strong>
        </p>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>MOVIQ Invite</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:36px 40px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MOVIQ</div>
            <div style="font-size:12px;color:#fca5a5;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Field Operations Platform</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Welcome aboard, {name}! 👋</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
              You've been added to the MOVIQ platform as a <strong style="color:#dc2626;">{role_label}</strong>.
              Your account is ready — here are your login credentials:
            </p>

            {login_block}

            <!-- CTA -->
            <div style="text-align:center;margin:32px 0;">
              <a href="{PORTAL_URL}/login"
                 style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;
                        padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;
                        letter-spacing:0.3px;">
                Open MOVIQ Dashboard →
              </a>
            </div>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">

            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              This invite was sent by your MOVIQ administrator.<br>
              If you weren't expecting this email, you can safely ignore it.<br>
              Need help? Contact your admin.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#cbd5e1;">
              © 2026 MOVIQ · Intelligence in Motion · <a href="{PORTAL_URL}" style="color:#dc2626;text-decoration:none;">moviq-bwz.vercel.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    return await send_email(to_email, subject, html)


# ── Password changed notification ─────────────────────────────────────────────

async def send_password_changed_email(name: str, email: str) -> bool:
    subject = "Security Alert: Your MOVIQ password has been changed"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Password Changed</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:28px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#ffffff;">MOVIQ</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#0f172a;">🔐 Password Changed</h2>
            <p style="color:#475569;line-height:1.6;">Hi <strong>{name}</strong>,</p>
            <p style="color:#475569;line-height:1.6;">
              The password for your account (<strong>{email}</strong>) was just changed.
              If you made this change, no action is needed.
            </p>
            <p style="color:#dc2626;font-weight:600;">
              ⚠️ If you did NOT change your password, contact your admin immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 MOVIQ · Intelligence in Motion</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    return await send_email(email, subject, html)
