import json
import logging
import os
import smtplib
import urllib.request
import urllib.error
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=True)
else:
    load_dotenv(override=True)

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "supabase" / "email_templates"


class EmailService:
    """
    Handles transactional authentication email dispatching.
    Supports:
      1. Brevo HTTP API (via BREVO_API_KEY)
      2. Brevo Custom SMTP (via BREVO_SMTP_KEY, BREVO_SMTP_USER, BREVO_SENDER_EMAIL)
      3. Fallback instructions logging
    """

    @classmethod
    def get_smtp_config(cls) -> Dict[str, Optional[str]]:
        return {
            "api_key": os.getenv("BREVO_API_KEY"),
            "smtp_host": os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com"),
            "smtp_port": int(os.getenv("BREVO_SMTP_PORT", "587")),
            "smtp_user": os.getenv("BREVO_SMTP_USER"),
            "smtp_key": os.getenv("BREVO_SMTP_KEY") or os.getenv("BREVO_SMTP_PASSWORD"),
            "sender_email": os.getenv("BREVO_SENDER_EMAIL", "notifications@smartspend.app"),
            "sender_name": os.getenv("BREVO_SENDER_NAME", "SmartSpend"),
        }

    @classmethod
    def load_template(cls, template_name: str, replacements: Dict[str, str]) -> str:
        tpl_path = TEMPLATES_DIR / template_name
        if not tpl_path.exists():
            # Fallback simple HTML
            action_url = replacements.get("ConfirmationURL", replacements.get("Token", "#"))
            return f"""
            <div style="font-family:sans-serif;padding:30px;background:#F3EDF4;">
              <div style="max-width:500px;margin:auto;background:#fff;padding:30px;border-radius:20px;">
                <h2 style="color:#302C49;">SmartSpend Authentication</h2>
                <p style="color:#77718B;">Please click the button below to proceed:</p>
                <a href="{action_url}" style="display:inline-block;padding:12px 24px;background:#9589AD;color:#fff;text-decoration:none;border-radius:999px;font-weight:bold;">Proceed &rarr;</a>
              </div>
            </div>
            """
        with open(tpl_path, "r", encoding="utf-8") as f:
            html = f.read()

        for key, val in replacements.items():
            html = html.replace(f"{{{{ .{key} }}}}", val)
            html = html.replace(f"{{{{.{key}}}}}", val)
            html = html.replace(f"{{ .ConfirmationURL }}", val)
            html = html.replace(f"{{.ConfirmationURL}}", val)
        return html

    @classmethod
    def send_via_brevo_api(cls, to_email: str, subject: str, html_content: str, api_key: str, sender_email: str, sender_name: str) -> bool:
        url = "https://api.brevo.com/v3/smtp/email"
        payload = {
            "sender": {"name": sender_name, "email": sender_email},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content,
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "accept": "application/json",
                    "api-key": api_key,
                    "content-type": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201):
                    logger.info(f"Email successfully delivered via Brevo API to {to_email}")
                    return True
        except Exception as e:
            logger.warning(f"Brevo API send failed: {e}")
        return False

    @classmethod
    def send_via_smtp(cls, to_email: str, subject: str, html_content: str, config: Dict[str, Any]) -> bool:
        host = config["smtp_host"]
        port = config["smtp_port"]
        user = config["smtp_user"]
        password = config["smtp_key"]
        sender_email = config["sender_email"]
        sender_name = config["sender_name"]

        if not user or not password:
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email

        part = MIMEText(html_content, "html", "utf-8")
        msg.attach(part)

        try:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
                server.sendmail(sender_email, [to_email], msg.as_string())
            logger.info(f"Email successfully dispatched via Brevo SMTP to {to_email}")
            return True
        except Exception as e:
            logger.warning(f"Direct Brevo SMTP dispatch failed: {e}")
            return False

    @classmethod
    def send_confirmation_email(cls, to_email: str, action_link: str) -> bool:
        cfg = cls.get_smtp_config()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        subject = "Verify your email — SmartSpend"
        html = cls.load_template("confirm_signup.html", {"ConfirmationURL": action_link, "SiteURL": frontend_url})

        if cfg["api_key"]:
            if cls.send_via_brevo_api(to_email, subject, html, cfg["api_key"], cfg["sender_email"], cfg["sender_name"]):
                return True

        if cfg["smtp_user"] and cfg["smtp_key"]:
            if cls.send_via_smtp(to_email, subject, html, cfg):
                return True

        logger.info(f"Direct email dispatch skipped (no local Brevo credentials in backend .env). Link: {action_link}")
        return False

    @classmethod
    def send_recovery_email(cls, to_email: str, action_link: str) -> bool:
        cfg = cls.get_smtp_config()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        subject = "Reset your SmartSpend password"
        html = cls.load_template("reset_password.html", {"ConfirmationURL": action_link, "SiteURL": frontend_url})

        if cfg["api_key"]:
            if cls.send_via_brevo_api(to_email, subject, html, cfg["api_key"], cfg["sender_email"], cfg["sender_name"]):
                return True

        if cfg["smtp_user"] and cfg["smtp_key"]:
            if cls.send_via_smtp(to_email, subject, html, cfg):
                return True

        logger.info(f"Direct password recovery dispatch skipped. Link: {action_link}")
        return False

    @classmethod
    def send_password_change_confirmation(cls, to_email: str, action_link: str) -> bool:
        cfg = cls.get_smtp_config()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
        subject = "Confirm your new password — SmartSpend"
        html = cls.load_template("confirm_password_change.html", {"ConfirmationURL": action_link, "SiteURL": frontend_url})

        if cfg["api_key"]:
            if cls.send_via_brevo_api(to_email, subject, html, cfg["api_key"], cfg["sender_email"], cfg["sender_name"]):
                return True

        if cfg["smtp_user"] and cfg["smtp_key"]:
            if cls.send_via_smtp(to_email, subject, html, cfg):
                return True

        logger.info(f"Direct password change confirmation dispatch skipped. Link: {action_link}")
        return False

