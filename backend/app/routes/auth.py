import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from supabase import Client
from app.database import get_supabase_client

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
            },
        })

        if res and res.user:
            is_confirmed = bool(res.session) or (res.user.confirmed_at is not None)
            return {
                "user": {
                    "id": str(res.user.id),
                    "email": res.user.email or email_str,
                    "fullName": clean_name,
                },
                "access_token": res.session.access_token if res.session else None,
                "confirmation_required": not is_confirmed,
            }
    except Exception as exc:
        err_msg = str(exc)
        logger.warning(f"Standard sign_up encountered: {err_msg}")

        # If already registered
        if "already registered" in err_msg.lower() or "user already exists" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered. Please log in.",
            )

        # If Supabase default email limits were hit or SMTP is unconfigured, fallback to admin creation
        if "error sending confirmation email" in err_msg.lower() or "rate limit" in err_msg.lower():
            try:
                admin_res = client.auth.admin.create_user({
                    "email": email_str,
                    "password": req.password,
                    "email_confirm": True,
                    "user_metadata": {"full_name": clean_name},
                })
                if admin_res and admin_res.user:
                    # Sign the user in to get an access_token session
                    login_res = client.auth.sign_in_with_password({
                        "email": email_str,
                        "password": req.password,
                    })
                    return {
                        "user": {
                            "id": str(admin_res.user.id),
                            "email": email_str,
                            "fullName": clean_name,
                        },
                        "access_token": login_res.session.access_token if login_res and login_res.session else None,
                        "confirmation_required": False,
                    }
            except Exception as admin_exc:
                logger.error(f"Admin create_user fallback failed: {admin_exc}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unable to create account: {admin_exc}",
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
    try:
        client.auth.reset_password_for_email(req.email.strip().lower())
    except Exception as exc:
        logger.warning(f"Reset password notice: {exc}")
    # Always return success to prevent email enumeration
    return {"message": "If an account exists for this email, you will receive a password reset link."}


@router.post(
    "/resend-verification",
    status_code=status.HTTP_200_OK,
    summary="Resend Verification Email",
)
def resend_verification(req: ResendVerificationRequest, client: Client = Depends(get_supabase_client)):
    try:
        client.auth.resend({
            "type": "signup",
            "email": req.email.strip().lower(),
        })
        return {"message": "Verification email resent."}
    except Exception as exc:
        logger.warning(f"Resend verification error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to send verification email. Please try again later.",
        )


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


