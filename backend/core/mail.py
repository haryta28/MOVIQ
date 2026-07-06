import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = os.environ.get("SMTP_PORT")
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_FROM = os.environ.get("SMTP_FROM", "no-reply@moviq.in")

async def send_email(to_email: str, subject: str, html_content: str):
    """Sends an email using configured SMTP settings, fallback to logging."""
    if not to_email:
        logger.warning("📩 Skip sending email: no recipient address provided")
        return False
        
    logger.info("📩 Preparing to send email to %s (Subject: %s)", to_email, subject)
    
    if SMTP_HOST and SMTP_PORT and SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = to_email
            
            part = MIMEText(html_content, "html")
            msg.attach(part)
            
            port = int(SMTP_PORT)
            if port == 465:
                server = smtplib.SMTP_SSL(SMTP_HOST, port, timeout=10)
            else:
                server = smtplib.SMTP(SMTP_HOST, port, timeout=10)
                server.starttls()
                
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
            server.quit()
            logger.info("✅ Email successfully sent to %s via SMTP", to_email)
            return True
        except Exception as e:
            logger.error("❌ Failed to send email via SMTP to %s: %s", to_email, str(e))
            # Fall through to logging
            
    # Mock fallback for development or unconfigured production envs
    logger.info(
        "\n"
        "=================== MOCK EMAIL SENT ===================\n"
        "TO: %s\n"
        "FROM: %s\n"
        "SUBJECT: %s\n"
        "BODY:\n"
        "%s\n"
        "=======================================================",
        to_email, SMTP_FROM, subject, html_content
    )
    return True

async def send_invite_email(name: str, email: str, role: str):
    subject = "Welcome to MOVIQ - You have been invited!"
    
    role_labels = {
        "admin": "Platform Admin",
        "agency": "Agency Head",
        "supervisor": "Supervisor",
        "field": "Field Executive"
    }
    role_label = role_labels.get(role.lower(), role)
    
    html_content = f"""
    <html>
      <body style="font-family: sans-serif; color: #1e293b; line-height: 1.6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h2 style="color: #ef4444; margin-top: 0;">Welcome to MOVIQ</h2>
          <p>Hi <strong>{name}</strong>,</p>
          <p>You have been invited to join the <strong>MOVIQ Field Operations Platform</strong> as a <strong>{role_label}</strong>.</p>
          <p>You can log in to your account using your email: <strong>{email}</strong></p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="https://moviq-bwz.vercel.app/accept-invite?email={email}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Moviq Dashboard</a>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            This is an automated invitation. If you did not expect this, please ignore this email.
          </p>
        </div>
      </body>
    </html>
    """
    await send_invite_email_task(email, subject, html_content)

async def send_invite_email_task(to_email: str, subject: str, html_content: str):
    await send_email(to_email, subject, html_content)
