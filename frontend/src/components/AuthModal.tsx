import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { authService, AuthUser } from '../services/auth';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [fullName, setFullName] = useState<string>('Adarsh');
  const [email, setEmail] = useState<string>('adarsh@smartspend.app');
  const [password, setPassword] = useState<string>('smartspend123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let user: AuthUser;
      if (mode === 'signup') {
        user = await authService.signUp(email, password, fullName);
      } else {
        user = await authService.signIn(email, password);
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const demoUser = await authService.signIn('adarsh@smartspend.app', 'smartspend123');
      onSuccess(demoUser);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo sign-in failed.');
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
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight mt-4">
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
            {mode === 'login'
              ? 'Log in to view your personal clarity overview'
              : 'Start managing your income and expenses with clarity'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-expense-light/90 border border-expense/30 text-xs font-semibold text-expense">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5 ml-1">
              Password
            </label>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-primary hover:bg-[#83769D] shadow-glass hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Log In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Access */}
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

        {/* Toggle Mode */}
        <div className="mt-5 text-center">
          <p className="text-xs text-text-secondary font-medium">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrorMsg(null);
              }}
              className="font-bold text-primary hover:text-text-primary underline cursor-pointer ml-1"
            >
              {mode === 'login' ? 'Create Account' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

