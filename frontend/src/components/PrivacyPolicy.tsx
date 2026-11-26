import React from 'react';
import { Shield, ArrowLeft, Lock, Mail, Database, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F3EDF4] text-text-primary py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/60">
          <Logo size="md" />
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-text-secondary hover:text-text-primary text-sm font-semibold transition-all shadow-2xs border border-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to SmartSpend
          </a>
        </div>

        {/* Hero Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white shadow-sm mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
            <Shield className="w-3.5 h-3.5" /> Privacy & Data Protection
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
            Privacy Policy for SmartSpend
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Effective Date: November 26, 2026 &bull; Last Updated: November 26, 2026
          </p>
          <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed">
            Welcome to SmartSpend (<a href="https://smart-spend-umber.vercel.app" className="text-primary underline">https://smart-spend-umber.vercel.app</a>). 
            Your privacy is of paramount importance to us. This Privacy Policy details how SmartSpend collects, uses, protects, and discloses your personal information when you use our web application, particularly through Google Sign-In and our financial tracking services.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
              <p>When you register or interact with SmartSpend, we may collect the following categories of information:</p>
              <ul className="space-y-2.5 pl-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Google Account Information (OAuth):</strong> When you choose to sign in using Google, we access your basic public profile information authorized by you, including your name, email address, and profile picture avatar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Financial Records:</strong> Income and expense transactions, dates, categories, payment methods, planning lists, and currencies that you actively input into SmartSpend.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Preferences & Settings:</strong> Display currency preferences, date formatting choices, and notification settings.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Google User Data */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-primary/20 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Google API Services User Data Policy Compliance</h2>
            </div>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p className="font-semibold text-text-primary">
                SmartSpend adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements.
              </p>
              <p>Specifically regarding data obtained via Google Sign-In:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>We only use Google user data to provide and improve user-facing features (authenticating your account and personalizing your dashboard).</li>
                <li>We <strong>NEVER</strong> sell your Google user data to third parties, data brokers, or advertising networks.</li>
                <li>We <strong>NEVER</strong> use or transfer Google user data for serving personalized, retargeted, or interest-based advertisements.</li>
                <li>We do not allow humans to read your private data unless you provide explicit consent for troubleshooting, it is required for security/legal compliance, or the data is aggregated and anonymized.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: How We Use Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-lg sm:text-xl font-bold">How We Use Your Information</h2>
            </div>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>We use the collected information exclusively for legitimate application purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To establish and maintain your authenticated SmartSpend account.</li>
                <li>To calculate monthly totals, balances, charts, and budget analytics.</li>
                <li>To synchronize planned expenses and purchases across your devices.</li>
                <li>To secure our infrastructure, prevent abuse, and deliver critical account security alerts.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Data Storage & Security */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Data Storage, Retention & Security</h2>
            </div>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>
                Your financial transactions and authentication tokens are encrypted in transit using industry-standard TLS (HTTPS) and stored in secure PostgreSQL databases powered by Supabase with Row Level Security (RLS) enabled. Only your authenticated user account can read or modify your financial records.
              </p>
              <p>
                We retain your information for as long as your account is active. If you choose to delete your account, all associated financial logs, planned items, and profile metadata are permanently deleted from our primary servers.
              </p>
            </div>
          </div>

          {/* Section 5: User Rights & Deletion */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                3
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Your Rights and Data Deletion</h2>
            </div>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>You have full ownership of your data at all times. You can:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Access and Export:</strong> View all your transactions and download financial summaries.</li>
                <li><strong>Modify:</strong> Update your profile, currency, or edit/delete any individual transaction directly from the application.</li>
                <li><strong>Request Account Deletion:</strong> Permanently delete your account and all associated data either through the in-app Settings page or by contacting our team.</li>
              </ul>
            </div>
          </div>

          {/* Section 6: Contact Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Contact Us</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact our support and developer team:
            </p>
            <div className="p-4 rounded-2xl bg-background border border-white text-sm">
              <p className="font-bold text-text-primary">SmartSpend Support</p>
              <p className="text-text-secondary mt-1">
                Developer & Support Email:{' '}
                <a href="mailto:adarshavg07@gmail.com" className="text-primary font-semibold underline">
                  adarshavg07@gmail.com
                </a>
              </p>
              <p className="text-text-secondary mt-1">
                Website:{' '}
                <a href="https://smart-spend-umber.vercel.app" className="text-primary font-semibold underline">
                  https://smart-spend-umber.vercel.app
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-text-secondary">
          &copy; {new Date().getFullYear()} SmartSpend. All rights reserved.
        </div>
      </div>
    </div>
  );
};
