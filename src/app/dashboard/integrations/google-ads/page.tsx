'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link2, AlertCircle, CheckCircle2, Zap, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GoogleAdsIntegrationPage() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const successParam = searchParams.get('success');

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Record<string, unknown>[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const fetchConnections = async (orgId: string, pId: string) => {
    try {
      const res = await fetch(`/api/google-ads/connections?organizationId=${orgId}&projectId=${pId}`);
      if (res.ok) {
        const { data } = await res.json();
        setConnections(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const orgId = localStorage.getItem('adintelix_org_id') || '';
    const pId = localStorage.getItem('adintelix_project_id') || '';
    
    setTimeout(() => {
      setOrganizationId(orgId);
      setProjectId(pId);
      if (orgId && pId) {
        fetchConnections(orgId, pId);
      } else {
        setLoading(false);
      }
    }, 0);
  }, []);

  const handleConnect = async () => {
    if (!organizationId || !projectId) return alert('Select an organization and project first');
    setConnecting(true);
    try {
      const res = await fetch(`/api/google-ads/oauth/authorize?organizationId=${organizationId}&projectId=${projectId}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Error: ${data.error || 'Failed to start auth'}`);
        setConnecting(false);
      }
    } catch (e) {
      console.error(e);
      setConnecting(false);
    }
  };

  const handleImport = async (connectionId: string) => {
    setImporting(connectionId);
    try {
      const res = await fetch('/api/google-ads/search-terms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId,
          projectId,
          connectionId
        })
      });
      if (res.ok) {
        alert('Import queued successfully. Search terms will appear shortly.');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to trigger import');
    } finally {
      setImporting(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    alert(`Disconnect functionality for connection ${connectionId} is not yet supported by the backend.`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Google Ads Integration</h1>
          <p className="text-slate-500 mt-1">Connect your Google Ads account to analyze search terms and reduce wasted spend.</p>
        </div>
      </div>

      {errorParam && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">OAuth Error</p>
            <p className="text-sm">{errorParam}</p>
          </div>
        </div>
      )}

      {successParam === 'connected' && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">Successfully connected to Google Ads.</p>
        </div>
      )}

      {!organizationId || !projectId ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-amber-500" />
          <h3 className="text-lg font-medium">Select a Project</h3>
          <p className="text-sm mt-1">You must select an organization and project from the sidebar before configuring Google Ads.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-500" />
                Active Connections
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Accounts currently connected for this project.
              </p>
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.333.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>}
              Connect Google Ads
            </button>
          </div>

          {connections.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Link2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No accounts connected</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Connect your Google Ads account to start importing search term reports and automatically analyzing them for wasted spend.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {connections.map((conn) => (
                <div key={conn.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.333.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Customer ID: {conn.customer_id}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </span>
                        <span className="text-xs text-slate-500">
                          Connected on {new Date(conn.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleImport(conn.id)}
                      disabled={importing === conn.id}
                      className="inline-flex items-center justify-center rounded-md bg-white border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {importing === conn.id ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-400" /> Importing...</>
                      ) : (
                        <><Zap className="w-4 h-4 mr-2 text-amber-500" /> Import Search Terms</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDisconnect(conn.id)}
                      className="inline-flex items-center justify-center rounded-md bg-white border border-slate-300 px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {connections.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-indigo-900 font-medium flex items-center gap-2">
              Ready to view your search term intelligence?
            </h3>
            <p className="text-indigo-700 text-sm mt-1">
              Once you&apos;ve imported search terms, view the analyzed data and discovered negative keywords.
            </p>
          </div>
          <Link 
            href="/dashboard/google-search-terms"
            className="shrink-0 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            View Search Terms <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
