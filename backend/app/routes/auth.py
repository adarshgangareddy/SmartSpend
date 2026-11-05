import json
import logging
from pathlib import Path
import secrets
import time
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from supabase import Client
from app.database import get_supabase_client
from app.auth import get_current_user
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignUpRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")
    full_name: str = Field(..., min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if "@" not in clean or "." not in clean:
            raise ValueError("Invalid email format")
        return clean


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()


class ResetPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()


class ResendVerificationRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()


class RequestPasswordChange(BaseModel):
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")


class ConfirmPasswordChange(BaseModel):
    token: str = Field(..., min_length=10)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TOKENS_FILE = DATA_DIR / "pending_password_tokens.json"


def _load_password_tokens() -> Dict[str, Dict[str, Any]]:
    if not TOKENS_FILE.exists():
        return {}
    try:
        with open(TOKENS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Error reading {TOKENS_FILE}: {e}")
        return {}


def _save_password_tokens(tokens: Dict[str, Dict[str, Any]]) -> None:
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(TOKENS_FILE, "w", encoding="utf-8") as f:
            json.dump(tokens, f, indent=2)
    except Exception as e:
        logger.error(f"Error writing {TOKENS_FILE}: {e}")


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Registers a new user in Supabase Auth securely on the backend without leaking secret keys.",
)
def signup(req: SignUpRequest, client: Client = Depends(get_supabase_client)):
    clean_name = req.full_name.strip()
    email_str = req.email.strip().lower()

    try:
        # First attempt standard sign_up
        res = client.auth.sign_up({
            "email": email_str,
            "password": req.password,
            "options": {
                "data": {"full_name": clean_name},
                "email_redirect_to": "http://localhost:5173/auth/callback",
            },
        })

        if res and res.user:
            # When email already exists, Supabase Auth returns a user with empty identities []
            user_identities = getattr(res.user, "identities", None)
            if user_identities is not None and len(user_identities) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email is already registered. Please log in.",
                )

            # Never grant access tokens on signup before confirmation
            return {
                "user": {
                    "id": str(res.user.id),
                    "email": res.user.email or email_str,
                    "fullName": clean_name,
                },
                "access_token": None,
                "confirmation_required": True,
            }
    except HTTPException:
        raise
    except Exception as exc:
        err_msg = str(exc)
        logger.warning(f"Standard sign_up encountered: {err_msg}")

        # If already registered
        if "already registered" in err_msg.lower() or "user already exists" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered. Please log in.",
            )

        # If Supabase default email service encountered a sending issue / rate limit,
        # generate the official unconfirmed link and dispatch via Brevo/email service
        if "error sending confirmation email" in err_msg.lower() or "rate limit" in err_msg.lower():
            try:
                link_res = client.auth.admin.generate_link({
                    "type": "signup",
                    "email": email_str,
                    "password": req.password,
                    "options": {
                        "data": {"full_name": clean_name},
                        "redirect_to": "http://localhost:5173/auth/callback",
                    },
                })
                if link_res and link_res.user:
                    action_link = getattr(link_res.properties, "action_link", None)
                    if action_link:
                        EmailService.send_confirmation_email(email_str, action_link)
                    return {
                        "user": {
                            "id": str(link_res.user.id),
                            "email": email_str,
                            "fullName": clean_name,
                        },
                        "access_token": None,
                        "confirmation_required": True,
                    }
            except Exception as link_exc:
                logger.error(f"Generate link fallback error: {link_exc}")
                if "already registered" in str(link_exc).lower():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This email is already registered. Please log in.",
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unable to send verification email. Please check your Brevo SMTP settings.",
                )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg or "Failed to register account.",
        )


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates user with email and password via Supabase Auth.",
)
def login(req: LoginRequest, client: Client = Depends(get_supabase_client)):
    email_str = req.email.strip().lower()
    try:
        res = client.auth.sign_in_with_password({
            "email": email_str,
            "password": req.password,
        })

        if not res or not res.user or not res.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        user = res.user
        # Strict email verification enforcement
        if not getattr(user, "email_confirmed_at", None) and not getattr(user, "confirmed_at", None):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before signing in. Check your inbox for the confirmation link.",
            )

        full_name = (
            user.user_metadata.get("full_name")
            or user.user_metadata.get("name")
            or email_str.split("@")[0]
        )

        return {
            "user": {
                "id": str(user.id),
                "email": user.email or email_str,
                "fullName": full_name,
            },
            "access_token": res.session.access_token,
        }
    except HTTPException:
        raise
    except Exception as exc:
        err_msg = str(exc)
        if "email not confirmed" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please verify your email before signing in. Check your inbox.",
            )
        if "invalid login credentials" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg or "Authentication failed.",
        )


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Password Reset Request",
    description="Dispatches a recovery email to the registered address.",
)
def reset_password(req: ResetPasswordRequest, client: Client = Depends(get_supabase_client)):
    email_str = req.email.strip().lower()
    try:
        client.auth.reset_password_for_email(
            email_str,
            {"redirect_to": "http://localhost:5173/#reset-password"}
        )
    except Exception as exc:
        logger.warning(f"Standard reset_password_for_email error: {exc}")
        # Try generating official recovery link and dispatching via email service
        try:
            link_res = client.auth.admin.generate_link({
                "type": "recovery",
                "email": email_str,
                "options": {"redirect_to": "http://localhost:5173/#reset-password"},
            })
            if link_res and hasattr(link_res, "properties"):
                action_link = getattr(link_res.properties, "action_link", None)
                if action_link:
                    EmailService.send_recovery_email(email_str, action_link)
        except Exception as link_exc:
            logger.warning(f"Generate recovery link error: {link_exc}")

    # Always return standard neutral response to prevent email enumeration
    return {"message": "If an account exists for this email, you will receive a password reset link."}


@router.post(
    "/resend-verification",
    status_code=status.HTTP_200_OK,
    summary="Resend Verification Email",
)
def resend_verification(req: ResendVerificationRequest, client: Client = Depends(get_supabase_client)):
    email_str = req.email.strip().lower()
    try:
        client.auth.resend({
            "type": "signup",
            "email": email_str,
            "options": {"email_redirect_to": "http://localhost:5173/auth/callback"},
        })
        return {"message": "Verification email resent."}
    except Exception as exc:
        logger.warning(f"Standard resend verification failed: {exc}")
        # Try generating official signup link and dispatching
        try:
            link_res = client.auth.admin.generate_link({
                "type": "signup",
                "email": email_str,
                "options": {"redirect_to": "http://localhost:5173/auth/callback"},
            })
            if link_res and hasattr(link_res, "properties"):
                action_link = getattr(link_res.properties, "action_link", None)
                if action_link:
                    EmailService.send_confirmation_email(email_str, action_link)
            return {"message": "Verification email resent."}
        except Exception as link_exc:
            logger.error(f"Fallback link resend failed: {link_exc}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to send verification email. Please try again later.",
            )


@router.post(
    "/request-password-change",
    status_code=status.HTTP_200_OK,
    summary="Request Password Change via Email Verification",
    description="Initiates password change and dispatches verification email. Password is only updated after verification.",
)
def request_password_change(
    req: RequestPasswordChange,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = current_user.get("id")
    email = current_user.get("email")
    if not user_id or not email:
        raise HTTPException(status_code=400, detail="Authenticated user email not found.")

    now = time.time()
    tokens = _load_password_tokens()
    # Prune any expired tokens
    tokens = {k: v for k, v in tokens.items() if v.get("expires_at", 0) > now}

    token = secrets.token_urlsafe(32)
    tokens[token] = {
        "user_id": user_id,
        "email": email,
        "new_password": req.new_password,
        "expires_at": now + 900,  # 15 minutes
    }
    _save_password_tokens(tokens)

    action_link = f"http://localhost:5173/auth/callback?type=confirm_password_change&token={token}"
    EmailService.send_password_change_confirmation(email, action_link)

    return {
        "message": f"A confirmation link has been sent to {email}. Please verify to apply your new password.",
        "email": email,
    }


@router.post(
    "/confirm-password-change",
    status_code=status.HTTP_200_OK,
    summary="Confirm Password Change with Verification Token",
)
def confirm_password_change(
    req: ConfirmPasswordChange,
    client: Client = Depends(get_supabase_client),
):
    tokens = _load_password_tokens()
    pending = tokens.get(req.token)
    if not pending:
        logger.warning(f"Pending password change token not found: {req.token[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link. Please request a new password change from Settings.",
        )

    if time.time() > pending["expires_at"]:
        tokens.pop(req.token, None)
        _save_password_tokens(tokens)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This confirmation link has expired. Please request a new password change from Settings.",
        )

    user_id = pending["user_id"]
    new_password = pending["new_password"]
    email = pending.get("email", "")

    try:
        client.auth.admin.update_user_by_id(user_id, {"password": new_password})
        tokens.pop(req.token, None)
        _save_password_tokens(tokens)
        logger.info(f"Successfully updated password in Supabase for user {user_id} ({email})")
        return {
            "success": True,
            "email": email,
            "message": "Password successfully updated! You can now log in with your new password.",
        }
    except Exception as exc:
        logger.error(f"Failed to update password for user {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update password. Please try again.",
        )


@router.get(
    "/me",
    summary="Get current verified user session",
    description="Validates the caller's JWT token and verifies email confirmation status.",
)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "user": current_user,
        "verified": True,
    }


@router.get(
    "/oauth/google",
    summary="Get Google OAuth Authorization URL",
    description="Generates the Supabase OAuth authorization URL for Google Sign-in.",
)
def get_google_oauth_url(redirect_to: Optional[str] = None, client: Client = Depends(get_supabase_client)):
    try:
        options: Dict[str, Any] = {}
        if redirect_to:
            options["redirect_to"] = redirect_to
        res = client.auth.sign_in_with_oauth({
            "provider": "google",
            "options": options,
        })
        return {"url": res.url, "provider": "google"}
    except Exception as exc:
        logger.error(f"Failed to generate Google OAuth URL: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google sign-in is not configured yet. Please configure Google provider in your Supabase dashboard.",
        )


class ExchangeCodeRequest(BaseModel):
    code: str


@router.post(
    "/exchange-code",
    summary="Exchange OAuth authorization code for session",
    description="Exchanges Supabase OAuth auth_code for access token and user metadata.",
)
def exchange_code(req: ExchangeCodeRequest, client: Client = Depends(get_supabase_client)):
    try:
        res = client.auth.exchange_code_for_session({"auth_code": req.code})
        if not res or not res.user or not res.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code for session.",
            )
        u = res.user
        meta = u.user_metadata or {}
        full_name = meta.get("full_name") or meta.get("name") or (u.email.split("@")[0] if u.email else "User")
        avatar_url = meta.get("avatar_url") or meta.get("picture")

        return {
            "user": {
                "id": str(u.id),
                "email": u.email or "",
                "fullName": full_name,
                "avatarUrl": avatar_url,
            },
            "access_token": res.session.access_token,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Code exchange failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication code exchange failed: {exc}",
        )


