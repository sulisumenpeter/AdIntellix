'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // In Next.js, we need to access localStorage only after mount
  useEffect(() => {
    const orgId = localStorage.getItem('adintellix_selected_org') || localStorage.getItem('adintelix_org_id');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrganizationId(orgId || null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, []);

  const handleCheckout = async () => {
    if (!organizationId) {
      router.push('/signup');
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      // Fetch the actual environment variable safely provided to the client via NEXT_PUBLIC prefix
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID;
      
      if (!priceId) {
        setError('Paddle pricing configuration and plan IDs are currently missing from the frontend configuration.');
        setCheckoutLoading(false);
        return;
      }

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, priceId })
      });

      if (res.ok) {
        const { data } = await res.json();
        if (data?.transaction?.checkout?.url) {
          window.location.assign(data.transaction.checkout.url);
        } else {
          setError('Failed to initialize checkout url from provider.');
          setCheckoutLoading(false);
        }
      } else {
        const err = await res.json();
        if (res.status === 401) {
           router.push('/login');
        } else {
           setError(`Checkout error: ${err.error || 'Unknown error'}`);
           setCheckoutLoading(false);
        }
      }
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred during checkout.');
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="h-20 bg-surface border-b border-border flex items-center justify-between px-8 z-10 sticky top-0">
        <Link href="/" onClick={() => router.push('/')} aria-label="AdIntelix home" className="flex items-center gap-3 hover:opacity-80 transition-opacity relative z-50 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            A
          </div>
          <span className="text-xl font-bold tracking-tight">AdIntelix</span>
        </Link>
        <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
          <Link href="/#features" className="text-muted-fg hover:text-foreground transition-colors">Features</Link>
          <Link href="/how-it-works" className="text-muted-fg hover:text-foreground transition-colors">How it Works</Link>
          <Link href="/pricing" className="text-foreground transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-foreground hover:text-indigo-600 transition-colors">
            {loading ? '...' : organizationId ? 'Dashboard' : 'Sign In'}
          </Link>
          {!organizationId && (
            <Link href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
              Get Started
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Simple Pricing for <span className="text-indigo-600">Smarter Marketing Decisions</span>
          </h1>
          <p className="text-lg text-muted-fg mb-10 max-w-3xl mx-auto">
            Unlock the full power of competitor ad intelligence, AI creative analysis, and automated insights. Choose the plan that aligns with your marketing velocity.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="pb-24 px-8 max-w-6xl mx-auto">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Checkout failed</h4>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground">Free</h3>
                <p className="text-muted-fg text-sm mt-2">Essential features to get started with competitive intelligence.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-muted-fg font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>Competitor Ad Intelligence (Up to 10 competitors)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>Creative Brief Scoring & Ad Pattern Intelligence</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>Limited automated landing-page matching</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>Reports and CSV exports</span>
                </li>
              </ul>
              <Link 
                href={organizationId ? "/dashboard" : "/signup"}
                className="w-full py-3 px-6 text-center border-2 border-border rounded-lg font-bold text-foreground hover:bg-surface-hover hover:border-indigo-200 transition-colors"
              >
                {organizationId ? 'Go to Dashboard' : 'Get Started Free'}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-indigo-600 rounded-2xl border-2 border-indigo-500 p-8 shadow-xl flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 right-6 transform -translate-y-1/2">
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                  Recommended
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white">AdIntelix Pro</h3>
                <p className="text-indigo-100 text-sm mt-2">Advanced insights and automation for scaling teams.</p>
              </div>
              <div className="mb-8 text-white">
                <span className="text-4xl font-extrabold">$49</span>
                <span className="text-indigo-200 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-indigo-50">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" />
                  <span><strong>Everything in Free</strong>, plus:</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" />
                  <span>Unlimited automated Ad-to-Landing-Page match</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" />
                  <span>Google Ads Search-Term Intelligence integration</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" />
                  <span>Advanced ICP Scoring & Domain profiling</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" />
                  <span>Ad Fatigue Analysis & Alerts</span>
                </li>
              </ul>
              <button 
                onClick={handleCheckout}
                disabled={loading || checkoutLoading}
                className="w-full py-3 px-6 text-center bg-white rounded-lg font-bold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <><svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Initializing...</>
                ) : (
                  organizationId ? 'Subscribe to Pro' : 'Get Started'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-20 bg-surface border-t border-border px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Feature Comparison</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-4 px-6 border-b border-border font-semibold text-foreground w-1/2">Features</th>
                    <th className="py-4 px-6 border-b border-border font-semibold text-center text-foreground w-1/4">Free</th>
                    <th className="py-4 px-6 border-b border-border font-semibold text-center text-indigo-600 w-1/4">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="py-4 px-6 border-b border-border text-foreground font-medium">Competitor Ad Intelligence</td>
                    <td className="py-4 px-6 border-b border-border text-center text-muted-fg">Up to 10</td>
                    <td className="py-4 px-6 border-b border-border text-center text-indigo-600 font-semibold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 border-b border-border text-foreground font-medium">Ad Pattern Intelligence</td>
                    <td className="py-4 px-6 border-b border-border text-center text-muted-fg"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                    <td className="py-4 px-6 border-b border-border text-center"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 border-b border-border text-foreground font-medium">Creative Brief Scoring</td>
                    <td className="py-4 px-6 border-b border-border text-center text-muted-fg"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                    <td className="py-4 px-6 border-b border-border text-center"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 border-b border-border text-foreground font-medium">Reports and Exports</td>
                    <td className="py-4 px-6 border-b border-border text-center text-muted-fg"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                    <td className="py-4 px-6 border-b border-border text-center"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 border-b border-border text-foreground font-medium">Ad-to-Landing-Page Match</td>
                    <td className="py-4 px-6 border-b border-border text-center text-muted-fg">Limited</td>
                    <td className="py-4 px-6 border-b border-border text-center text-indigo-600 font-semibold">Unlimited</td>
                  </tr>
                  <tr className="bg-indigo-50/30">
                    <td className="py-4 px-6 border-b border-border text-foreground font-medium">Google Ads Search-Term Intelligence</td>
                    <td className="py-4 px-6 border-b border-border text-center text-muted-fg">—</td>
                    <td className="py-4 px-6 border-b border-border text-center"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="bg-indigo-50/30">
                    <td className="py-4 px-6 border-b border-border text-foreground font-medium">ICP Scoring & Intelligence</td>
                    <td className="py-4 px-6 border-b border-border text-center text-muted-fg">—</td>
                    <td className="py-4 px-6 border-b border-border text-center"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="bg-indigo-50/30">
                    <td className="py-4 px-6 border-b border-border text-foreground font-medium">Ad Fatigue Detection</td>
                    <td className="py-4 px-6 border-b border-border text-center text-muted-fg">—</td>
                    <td className="py-4 px-6 border-b border-border text-center"><CheckCircle2 className="w-5 h-5 mx-auto text-green-500" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">How does the free tier work?</h4>
              <p className="text-muted-fg">The free tier allows you to monitor up to 10 competitors and evaluate ad patterns and creative briefs. It is completely free forever with no credit card required.</p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">When am I billed for AdIntelix Pro?</h4>
              <p className="text-muted-fg">You will be billed $49 monthly on a recurring basis starting from the day you upgrade. Payments are processed securely via Paddle.</p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">Can I cancel my subscription?</h4>
              <p className="text-muted-fg">Yes, you can cancel your subscription at any time from your dashboard billing settings. Your access will remain active until the end of your current billing period.</p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">How long does it take to activate Pro?</h4>
              <p className="text-muted-fg">Your account will be instantly upgraded to AdIntelix Pro immediately upon successful checkout processing.</p>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-surface border-t border-border py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-fg">
          <div className="flex items-center gap-3">
            <Link href="/" onClick={() => router.push('/')} aria-label="AdIntelix home" className="flex items-center gap-3 hover:opacity-80 transition-opacity relative z-50 cursor-pointer">
              <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                A
              </div>
              <span className="font-semibold text-foreground">AdIntelix</span>
            </Link>
            <span suppressHydrationWarning>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
 
