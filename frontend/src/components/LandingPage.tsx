import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Lock,
  Wallet,
  TrendingUp,
  PieChart,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { DashboardPreview } from './DashboardPreview';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenSignup,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-x-hidden">
      {/* Subtle Ambient Background Orbs */}
      <div className="fixed top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-[#E9DCF0] opacity-60 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-[#F7E1EA] opacity-50 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] right-[25%] w-[400px] h-[400px] rounded-full bg-[#E5E0F2] opacity-45 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 z-10">
        {/* Navigation Bar */}
        <header className="sticky top-3 sm:top-4 z-40 glass-outer rounded-2xl sm:rounded-full px-4 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-glass mb-6 sm:mb-12 border border-white/90 backdrop-blur-xl">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-9 text-[15px] font-bold text-text-secondary">
            <a href="#home" className="text-text-primary hover:text-primary transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-text-primary transition-colors">
              About
            </a>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-text-primary hover:bg-white/60 transition-all cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={onOpenSignup}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-glass hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Create Account
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="sm:hidden p-2 rounded-xl text-text-secondary hover:bg-white/60 transition-colors"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="sm:hidden glass-outer rounded-3xl p-5 mb-8 space-y-4 animate-in fade-in duration-150">
            <nav className="flex flex-col gap-3 text-sm font-bold text-text-secondary">
              <a
                href="#home"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-xl text-text-primary hover:bg-white/60"
              >
                Home
              </a>
              <a
                href="#features"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-white/60"
              >
                Features
              </a>
              <a
                href="#about"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-white/60"
              >
                About
              </a>
            </nav>
            <div className="pt-3 border-t border-white/60 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-text-primary bg-white/60"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenSignup();
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-primary shadow-sm"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section id="home" className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-16 sm:mb-24 pt-4">
          {/* Left Column: Headings, Subtitle, Action Buttons, Trust Pills */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-primary tracking-tight leading-[1.12]">
                Your money.
                <br />
                <span className="text-primary-dark">Your clarity.</span>
              </h1>
              <p className="text-base sm:text-lg text-text-secondary max-w-md font-medium leading-relaxed pt-2">
                Track your income, manage expenses, and understand your spending — all in one simple, beautiful space.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <button
                onClick={onOpenSignup}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white bg-primary hover:bg-[#83769D] shadow-glass hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Get Started — It's Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full text-sm font-bold text-text-primary bg-white/70 hover:bg-white/95 border border-white shadow-xs transition-all cursor-pointer"
              >
                <span>Log In</span>
              </button>
            </div>

            {/* Supporting Trust Badges */}
            <div className="flex items-center gap-6 pt-2 text-xs font-bold text-text-secondary">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-income" />
                <span>Simple</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Personal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#A88BB8]" />
                <span>Secure</span>
              </div>
            </div>
          </div>

          {/* Right Column: Illustrative Dashboard Preview Component */}
          <div className="lg:col-span-6 flex justify-center">
            <DashboardPreview />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-16 sm:mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-box rounded-[28px] p-7 transition-all duration-200 hover:scale-[1.01]">
              <div className="w-12 h-12 rounded-2xl bg-[#EFEAF4] text-primary flex items-center justify-center mb-5 shadow-2xs">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
                Track Expenses
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 font-medium leading-relaxed">
                Record everyday spending and understand where your money goes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-box rounded-[28px] p-7 transition-all duration-200 hover:scale-[1.01]">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF5EA] text-income flex items-center justify-center mb-5 shadow-2xs">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
                Monitor Income
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 font-medium leading-relaxed">
                Keep your earnings organized in one place.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-box rounded-[28px] p-7 transition-all duration-200 hover:scale-[1.01]">
              <div className="w-12 h-12 rounded-2xl bg-[#EFEAF4] text-primary flex items-center justify-center mb-5 shadow-2xs">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
                See the Bigger Picture
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 font-medium leading-relaxed">
                Understand your balance and monthly financial activity at a glance.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section id="about" className="mb-14 sm:mb-16">
          <div className="glass-outer rounded-[32px] p-7 sm:p-9 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                Start managing your money with clarity.
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
                Join SmartSpend today — completely free and personal.
              </p>
            </div>

            <button
              onClick={onOpenSignup}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white bg-primary hover:bg-[#83769D] shadow-glass hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
            >
              <span>Create Your Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 pb-4 border-t border-white/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-text-secondary">
          <Logo size="sm" />

          <div className="flex items-center gap-6">
            <a href="#home" className="hover:text-text-primary transition-colors">
              Privacy
            </a>
            <span>•</span>
            <a href="#about" className="hover:text-text-primary transition-colors">
              Contact
            </a>
          </div>

          <div>
            © 2026 SmartSpend. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

