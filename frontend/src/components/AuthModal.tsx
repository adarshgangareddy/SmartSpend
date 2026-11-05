import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  KeyRound,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  Sparkles,
} from 'lucide-react';
import { authService, AuthUser } from '../services/auth';
import { useNotification } from './NotificationToast';
import { Logo } from './Logo';

export type AuthMode =
  | 'login'
  | 'signup'
  | 'check_inbox'
  | 'forgot_password'
  | 'forgot_inbox'
  | 'reset_password'
  | 'verified';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess: (user: AuthUser) => void;
}

// Official Google "G" SVG Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { success, error, info } = useNotification();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null);

  // Cooldown timers for resending emails
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    const saved = localStorage.getItem('smartspend_registered_email');
    if (saved && !email) {
      setEmail(saved);
    }
  }, [initialMode, isOpen]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Trigger celebration screen before transitioning to dashboard
  const triggerVerifiedAnimation = (u: AuthUser) => {
    setVerifiedUser(u);
    setMode('verified');
    setTimeout(() => {
      onSuccess(u);
      onClose();
    }, 1600);
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      await authService.signInWithGoogle();
      // Browser redirects to Google OAuth page
    } catch (err: any) {
      const msg = err.message || 'Google sign-in could not be initiated.';
      setErrorMsg(msg);
      error(msg);
      setIsGoogleLoading(false);
    }
  };

  // Handle Login & Signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }
        const result = await authService.signUp(email, password, fullName);
        localStorage.setItem('smartspend_registered_email', email.trim().toLowerCase());
        if (result.confirmationRequired) {
          setMode('check_inbox');
          setResendCooldown(60);
          info('Verification email sent. Please check your inbox.');
        } else if (result.user) {
          success('Account created successfully!');
          triggerVerifiedAnimation(result.user);
        }
      } else if (mode === 'login') {
        const user = await authService.signIn(email, password);
        success('Signed in successfully.');
        onSuccess(user);
        onClose();
      } else if (mode === 'forgot_password') {
        await authService.resetPassword(email);
        setMode('forgot_inbox');
        setResendCooldown(60);
        info('Password reset email sent. Please check your inbox.');
      } else if (mode === 'reset_password') {
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await authService.updatePassword(newPassword);
        success('Password updated successfully. You can now log in.');
        setMode('login');
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred during authentication.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Verification Email
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await authService.resendVerification(email);
      setResendCooldown(60);
      success('Email verification link re-sent.');
    } catch (err: any) {
      error(err.message || 'Unable to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Password Reset
  const handleResendPasswordReset = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await authService.resetPassword(email);
      setResendCooldown(60);
      success('Password reset link re-sent.');
    } catch (err: any) {
      error(err.message || 'Unable to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#302C49]/30 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto glass-modal rounded-2xl sm:rounded-[32px] p-5 sm:p-8 z-10 shadow-glass-lg border border-white/90 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        {mode !== 'verified' && (
          <div className="flex flex-col items-center text-center mb-6">
            <Logo size="md" />

            {/* Dynamic Title based on Mode */}
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight mt-4">
              {mode === 'login' && 'Welcome back!'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'check_inbox' && 'Check your inbox'}
              {mode === 'forgot_password' && 'Reset your password'}
              {mode === 'forgot_inbox' && 'Check your inbox'}
              {mode === 'reset_password' && 'Set new password'}
            </h2>

            <p className="text-xs sm:text-sm text-text-secondary mt-1 font-medium leading-relaxed max-w-xs">
              {mode === 'login' && 'Log in to view your personal clarity overview'}
              {mode === 'signup' && 'Start managing your income and expenses with clarity'}
              {mode === 'check_inbox' && "We've sent a verification link to your email."}
              {mode === 'forgot_password' && 'Enter your email to receive a recovery link'}
              {mode === 'forgot_inbox' &&
                "If an account exists for this email, you'll receive a password reset link."}
              {mode === 'reset_password' && 'Enter and confirm your new secure password'}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && mode !== 'verified' && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#FBEEEC] border border-[#C96F70]/30 text-xs font-semibold text-expense">
            {errorMsg}
          </div>
        )}

        {/* 0. VERIFIED CELEBRATION SCREEN */}
        {mode === 'verified' && verifiedUser && (
          <div className="space-y-5 py-4 text-center animate-in zoom-in-90 fade-in duration-300">
            <div className="flex justify-center mb-2">
              <Logo size="md" />
            </div>

            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#75A65A]/20 animate-ping opacity-60" />
              <div className="absolute -inset-1.5 rounded-full bg-linear-to-tr from-[#75A65A]/40 to-[#8A83AC]/40 blur-sm" />
              <div className="relative w-20 h-20 rounded-full bg-linear-to-tr from-[#75A65A] to-[#88B86D] text-white flex items-center justify-center shadow-glass-lg scale-100 animate-in zoom-in-50 duration-500">
                <Check className="w-10 h-10 stroke-[3.2]" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#EBF5EA] text-[#55823D] border border-[#75A65A]/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Account Verified</span>
              </div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                Welcome to SmartSpend!
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary font-medium mt-1">
                Hello, <strong className="text-text-primary">{verifiedUser.fullName}</strong>. Opening your dashboard...
              </p>
            </div>

            <div className="w-48 h-1.5 bg-white/60 rounded-full mx-auto overflow-hidden mt-4">
              <div className="h-full bg-linear-to-r from-primary to-[#75A65A] rounded-full animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* 1. CHECK INBOX SCREEN (Signup Verification) */}
        {mode === 'check_inbox' && (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-3xl bg-[#EBF5EA] text-income flex items-center justify-center mx-auto shadow-sm">
              <Mail className="w-8 h-8 stroke-[2.2]" />
            </div>

            <p className="text-xs sm:text-sm text-text-secondary font-medium px-2">
              Please click the link inside the confirmation email sent to{' '}
              <strong className="text-text-primary">{email}</strong> to activate your account.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || isLoading}
                className="w-full py-3 px-5 rounded-2xl text-xs font-bold text-text-primary bg-white/80 hover:bg-white border border-white shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                <span>
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Resend Verification Email'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  const saved = localStorage.getItem('smartspend_registered_email');
                  if (saved) {
                    setEmail(saved);
                  }
                }}
                className="w-full py-2.5 text-xs font-bold text-primary hover:text-text-primary underline cursor-pointer"
              >
                Back to Log In
              </button>
            </div>
          </div>
        )}

        {/* 2. FORGOT PASSWORD INBOX SCREEN */}
        {mode === 'forgot_inbox' && (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-3xl bg-[#F0EBF5] text-primary flex items-center justify-center mx-auto shadow-sm">
              <KeyRound className="w-8 h-8 stroke-[2.2]" />
            </div>

            <p className="text-xs sm:text-sm text-text-secondary font-medium px-2">
              We dispatched instructions to{' '}
              <strong className="text-text-primary">{email}</strong>. If an account is registered with this address, you will find a reset button.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResendPasswordReset}
                disabled={resendCooldown > 0 || isLoading}
                className="w-full py-3 px-5 rounded-2xl text-xs font-bold text-text-primary bg-white/80 hover:bg-white border border-white shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                <span>
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Resend Password Reset'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  const saved = localStorage.getItem('smartspend_registered_email');
                  if (saved) {
                    setEmail(saved);
                  }
                }}
                className="w-full py-2.5 text-xs font-bold text-primary hover:text-text-primary underline cursor-pointer"
              >
                Back to Log In
              </button>
            </div>
          </div>
        )}

        {/* 3. STANDARD FORM (Login / Signup / Forgot / Reset) */}
        {mode !== 'check_inbox' && mode !== 'forgot_inbox' && mode !== 'verified' && (
          <div>
            {/* Google OAuth Button (Login & Signup modes) */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-text-primary bg-white/85 hover:bg-white border border-white shadow-2xs hover:shadow-glass transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon className="w-4 h-4 shrink-0" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Subtle Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-white/80 w-full" />
                  <span className="bg-[#F8F2F8] px-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    or
                  </span>
                  <div className="border-t border-white/80 w-full" />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adarsh"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                    />
                    <User className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Email Address (Login, Signup, Forgot) */}
              {mode !== 'reset_password' && (
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                    />
                    <Mail className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Password (Login, Signup) */}
              {(mode === 'login' || mode === 'signup') && (
                <div>
                  <div className="flex items-center justify-between mb-1 ml-1">
                    <label className="block text-xs font-bold text-text-primary">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot_password');
                          setErrorMsg(null);
                        }}
                        className="text-[11px] font-bold text-primary hover:text-text-primary underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                    />
                    <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                    />
                    <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Set New Password Form */}
              {mode === 'reset_password' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1 ml-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                      />
                      <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1 ml-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                      />
                      <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-primary hover:bg-[#83769D] shadow-glass hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Log In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot_password' && 'Send Recovery Email'}
                      {mode === 'reset_password' && 'Update Password'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Navigation between Modes */}
        {mode !== 'check_inbox' && mode !== 'forgot_inbox' && mode !== 'verified' && (
          <div className="mt-5 text-center">
            {mode === 'login' && (
              <p className="text-xs text-text-secondary font-medium">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-primary hover:text-text-primary underline cursor-pointer ml-1"
                >
                  Create Account
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-xs text-text-secondary font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-primary hover:text-text-primary underline cursor-pointer ml-1"
                >
                  Log In
                </button>
              </p>
            )}

            {(mode === 'forgot_password' || mode === 'reset_password') && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-primary hover:text-text-primary underline cursor-pointer"
              >
                Back to Log In
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
