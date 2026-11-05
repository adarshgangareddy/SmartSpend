import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Sparkles, KeyRound } from 'lucide-react';
import { authService, AuthUser } from '../services/auth';
import { api } from '../services/api';
import { Logo } from './Logo';

interface AuthCallbackProps {
  onSuccess: (user: AuthUser) => void;
  onFailure: (errorMessage: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onFailure }) => {
  const [statusText, setStatusText] = useState<string>('Verifying authentication...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null);
  const [isPasswordChangeSuccess, setIsPasswordChangeSuccess] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const processOAuthCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        // 0. Check for Password Change Confirmation (?type=confirm_password_change&token=...)
        const type = searchParams.get('type');
        const token = searchParams.get('token');

        if (type === 'confirm_password_change' && token) {
          if (isMounted) setStatusText('Verifying and updating your password credentials...');
          await api.confirmPasswordChange(token);
          const currentUser = await authService.getCurrentUser();
          if (isMounted) {
            setIsPasswordChangeSuccess(true);
            setVerifiedUser(currentUser || { id: 'verified', email: '', fullName: 'Adarsh' });
          }
          return;
        }

        // 1. Check for error parameters (e.g. user canceled consent)
        const errorParam =
          searchParams.get('error') ||
          (hash.includes('error=') ? new URLSearchParams(hash.substring(1)).get('error') : null);
        const errorDesc =
          searchParams.get('error_description') ||
          (hash.includes('error_description=')
            ? new URLSearchParams(hash.substring(1)).get('error_description')
            : null);

        if (errorParam) {
          const formattedError = errorDesc
            ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
            : 'Authentication was canceled or denied.';
          throw new Error(formattedError);
        }

        // 2. Check for PKCE Authorization Code (?code=...)
        const code = searchParams.get('code');
        if (code) {
          if (isMounted) setStatusText('Completing secure authorization with Google...');
          const user = await authService.handleOAuthCallback(code);
          if (isMounted) {
            setVerifiedUser(user);
          }
          return;
        }

        // 3. Check for implicit token in hash (#access_token=...)
        if (hash.includes('access_token')) {
          if (isMounted) setStatusText('Establishing your authenticated session...');
          const user = await authService.handleOAuthHash(hash);
          if (isMounted) {
            setVerifiedUser(user);
          }
          return;
        }

        // 4. If neither code nor hash present, check if session already exists
        const existing = await authService.getCurrentUser();
        if (existing) {
          setVerifiedUser(existing);
          return;
        }

        throw new Error('No authentication credentials found in the callback URL.');
      } catch (err: any) {
        const msg = err.message || 'Authentication failed. Please try logging in again.';
        if (isMounted) {
          setErrorMsg(msg);
          onFailure(msg);
        }
      }
    };

    processOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [onFailure]);

  // When verifiedUser is detected, show the verified animation for 1.6s, then redirect to dashboard
  useEffect(() => {
    if (verifiedUser) {
      const timer = setTimeout(() => {
        window.history.replaceState(null, '', '/');
        onSuccess(verifiedUser);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [verifiedUser, onSuccess]);

  const handleReturnToLogin = () => {
    window.history.replaceState(null, '', '/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-x-hidden bg-[#F3EDF4]">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-[#E9DCF0] opacity-60 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-[#F7E1EA] opacity-50 blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-md glass-modal rounded-[36px] p-8 sm:p-10 z-10 shadow-glass-lg border border-white/90 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        {errorMsg ? (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-[#FBEEEC] text-expense flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                Authentication Error
              </h2>
              <p className="text-xs sm:text-sm text-expense font-semibold mt-2 px-3 leading-relaxed">
                {errorMsg}
              </p>
            </div>

            <button
              type="button"
              onClick={handleReturnToLogin}
              className="w-full py-3 px-5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-[#83769D] shadow-glass transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Login</span>
            </button>
          </div>
        ) : verifiedUser ? (
          /* VERIFIED ANIMATION SCREEN */
          <div className="space-y-5 py-3 animate-in zoom-in-90 fade-in duration-300">
            {/* Animated Celebration Badge */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              {/* Soft pulsing halo */}
              <div className="absolute inset-0 rounded-full bg-[#75A65A]/20 animate-ping opacity-60" />
              <div className="absolute -inset-1.5 rounded-full bg-linear-to-tr from-[#75A65A]/40 to-[#8A83AC]/40 blur-sm" />
              <div className="relative w-20 h-20 rounded-full bg-linear-to-tr from-[#75A65A] to-[#88B86D] text-white flex items-center justify-center shadow-glass-lg scale-100 animate-in zoom-in-50 duration-500">
                <Check className="w-10 h-10 stroke-[3.2]" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#EBF5EA] text-[#55823D] border border-[#75A65A]/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPasswordChangeSuccess ? 'Password Verified' : 'Account Verified'}</span>
              </div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                {isPasswordChangeSuccess ? 'Password Updated!' : 'Welcome to SmartSpend!'}
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary font-medium mt-1">
                {isPasswordChangeSuccess
                  ? 'Your new credentials are now active. Opening your dashboard...'
                  : <>Hello, <strong className="text-text-primary">{verifiedUser.fullName}</strong>. Opening your dashboard...</>}
              </p>
            </div>

            {/* Subtle progress loading bar */}
            <div className="w-48 h-1.5 bg-white/60 rounded-full mx-auto overflow-hidden mt-4">
              <div className="h-full bg-linear-to-r from-primary to-[#75A65A] rounded-full animate-pulse w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="w-12 h-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
            </div>

            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {statusText}
            </h2>
            <p className="text-xs text-text-secondary font-medium">
              Please wait while we secure your SmartSpend account...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
