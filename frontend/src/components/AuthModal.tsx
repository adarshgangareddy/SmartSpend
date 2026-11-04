import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
  RotateCcw,
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
  | 'reset_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { success, error, info } = useNotification();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState<string>('Adarsh');
  const [email, setEmail] = useState<string>('adarsh@smartspend.app');
  const [password, setPassword] = useState<string>('smartspend123');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cooldown timers for resending emails
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle Login & Signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }
        const result = await authService.signUp(email, password, fullName);
        if (result.confirmationRequired) {
          setMode('check_inbox');
          setResendCooldown(60);
          info('Verification email sent. Please check your inbox.');
        } else if (result.user) {
          success('Account created successfully!');
          onSuccess(result.user);
          onClose();
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

  // Handle Demo Fast Sign-in
  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const demoUser = await authService.signIn('adarsh@smartspend.app', 'smartspend123');
      success('Signed in as Adarsh (Demo).');
      onSuccess(demoUser);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo sign-in failed.');
      error('Demo sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#302C49]/30 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md glass-modal rounded-[32px] p-7 sm:p-9 z-10 shadow-glass-lg border border-white/90 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
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
            {mode === 'forgot_password' && "Enter your email to receive a recovery link"}
            {mode === 'forgot_inbox' &&
              "If an account exists for this email, you'll receive a password reset link."}
            {mode === 'reset_password' && 'Enter and confirm your new secure password'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#FBEEEC] border border-[#C96F70]/30 text-xs font-semibold text-expense">
            {errorMsg}
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
                onClick={() => setMode('login')}
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
                onClick={() => setMode('login')}
                className="w-full py-2.5 text-xs font-bold text-primary hover:text-text-primary underline cursor-pointer"
              >
                Back to Log In
              </button>
            </div>
          </div>
        )}

        {/* 3. STANDARD FORM (Login / Signup / Forgot / Reset) */}
        {mode !== 'check_inbox' && mode !== 'forgot_inbox' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Adarsh"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                  />
                  <User className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Email (Login, Signup, Forgot) */}
            {mode !== 'reset_password' && (
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                  />
                  <Mail className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Password (Login, Signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
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
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                  />
                  <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                  />
                  <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Set New Password Form */}
            {mode === 'reset_password' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5 ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                    />
                    <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5 ml-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary placeholder:text-text-muted transition-all"
                    />
                    <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
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
        )}

        {/* Demo Fast Access (available in login mode) */}
        {mode === 'login' && (
          <div className="mt-4 pt-4 border-t border-white/60">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-[#302C49] bg-white/70 hover:bg-white/95 border border-white shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Fast Sign-in as Adarsh (Demo)</span>
            </button>
          </div>
        )}

        {/* Footer Navigation between Modes */}
        {mode !== 'check_inbox' && mode !== 'forgot_inbox' && (
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
