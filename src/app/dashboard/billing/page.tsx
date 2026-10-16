'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle2, Clock, Calendar, Receipt, ShieldAlert } from 'lucide-react';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState('');
  interface Subscription {
    status: string;
    plan_id?: string;
    current_period_end?: string;
    [key: string]: unknown;
  }

  interface BillingEvent {
    id: string;
    event_type: string;
    status: string;
    created_at: string;
    paddle_event_id: string;
    [key: string]: unknown;
  }

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [events, setEvents] = useState<BillingEvent[]>([]);

  const fetchBillingData = async (orgId: string) => {
    try {
      const res = await fetch(`/api/billing?organizationId=${orgId}`);
      if (res.ok) {
        const { data } = await res.json();
        setSubscription(data?.subscription || null);
        setEvents(data?.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const orgId = localStorage.getItem('adintelix_org_id') || '';
    
    setTimeout(() => {
      setOrganizationId(orgId);
      if (orgId) {
        fetchBillingData(orgId);
      } else {
        setLoading(false);
      }
    }, 0);
  }, []);

  const handleCheckout = async () => {
    try {
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID;
      if (!priceId) {
        alert('Paddle pricing configuration and plan IDs are currently missing from the frontend configuration.');
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
          window.location.href = data.transaction.checkout.url;
        } else {
          alert('Failed to initialize checkout.');
        }
      } else {
        const err = await res.json();
        alert(`Checkout error: ${err.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Checkout error');
    }
  };

  const handleManageSubscription = () => {
    alert('Subscription management (Customer Portal) requires active Paddle Customer IDs and backend support, which is currently incomplete.');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isSubscribed = subscription && ['active', 'trialing'].includes(subscription.status);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-slate-500 mt-1">Manage your AdIntelix subscription, payment methods, and billing history.</p>
      </div>

      {!organizationId ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-amber-500" />
          <h3 className="text-lg font-medium">Select an Organization</h3>
          <p className="text-sm mt-1">You must select an organization from the sidebar before viewing billing details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-500" />
                    Current Plan
                  </h2>
                  {subscription ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subscription.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                      subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      subscription.status === 'past_due' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {subscription.status.replace('_', ' ').toUpperCase()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      FREE TIER
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {subscription?.plan_id || 'Free Plan'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {subscription?.current_period_end ? (
                        <>Renews on {new Date(subscription.current_period_end).toLocaleDateString()}</>
                      ) : (
                        <>No active billing period</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    {isSubscribed ? (
                      <button onClick={handleManageSubscription} className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-slate-50 transition-colors">
                        Manage Billing
                      </button>
                    ) : (
                      <button onClick={handleCheckout} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 border border-transparent text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 transition-colors">
                        Upgrade Plan
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-900 mb-4">Included Entitlements</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Competitor Ad Intelligence (Up to 10 competitors)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Creative Brief Scorer & Pattern Intelligence</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{isSubscribed ? 'Unlimited' : 'Limited'} automated landing-page matching</span>
                    </li>
                    {!isSubscribed && (
                      <li className="flex items-start gap-2.5 text-sm text-slate-500 opacity-60">
                        <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>Google Ads Search-Term Syncing (Upgrade required)</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-slate-50/50">
                <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  Billing History
                </h2>
              </div>
              <div className="divide-y divide-border">
                {events.length === 0 ? (
                  <div className="p-8 text-center">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No billing events or transactions found.</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{event.event_type.replace('subscription.', '').replace('_', ' ')}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(event.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          event.status === 'processed' ? 'bg-green-100 text-green-700' :
                          event.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {event.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono" title={event.paddle_event_id}>
                          {event.paddle_event_id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                <h3 className="text-indigo-900 font-medium flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Pricing Configuration
                </h3>
                <p className="text-sm text-indigo-700 mt-2">
                  Paddle integration is active for processing webhooks, but product prices and plans have not been securely configured in the system environment variables yet.
                </p>
                <p className="text-sm text-indigo-700 mt-3">
                  Attempting to checkout or upgrade will be blocked until the backend environment is provisioned with valid Paddle Price IDs.
                </p>
              </div>
            )}
            {process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-slate-900 font-medium flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  Pro Plan ($99/mo)
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  Upgrade to AdIntelix Pro to unlock unlimited automated landing-page matching, Google Ads Search-Term Syncing, and priority support.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
