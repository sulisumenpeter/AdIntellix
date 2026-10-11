'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Zap, Activity, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function N8nIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const orgId = localStorage.getItem('adintelix_org_id');
      if (!orgId) {
        setError('No active organization selected.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/integrations/n8n', {
        headers: {
          'x-organization-id': orgId
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to load n8n configuration.');
      }
      
      const data = await res.json();
      setUrl(data.url || '');
      setHasApiKey(data.hasApiKey);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Avoid React strict mode issues
    setTimeout(() => {
      loadData();
    }, 0);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const orgId = localStorage.getItem('adintelix_org_id');
      if (!orgId) throw new Error('No organization selected');

      const payload: Record<string, string> = { action: 'save', url };
      if (apiKey) {
        payload.apiKey = apiKey;
      }

      const res = await fetch('/api/integrations/n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': orgId
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save configuration');
      
      setSuccessMessage('n8n integration settings saved successfully.');
      if (apiKey) {
        setHasApiKey(true);
        setApiKey(''); // Clear from state
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const orgId = localStorage.getItem('adintelix_org_id');
      if (!orgId) throw new Error('No organization selected');

      const res = await fetch('/api/integrations/n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': orgId
        },
        body: JSON.stringify({ action: 'test' })
      });

      if (!res.ok) throw new Error('Test connection failed');
      setTestResult('success');
    } catch (err) {
      setTestResult('error');
      setError((err as Error).message);
    } finally {
      setTesting(false);
    }
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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">n8n Integration</h1>
          <p className="text-slate-500 mt-1">Connect your n8n instance to automate workflows and data sync.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            Connection Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure your n8n instance URL and API credentials. Credentials are encrypted and securely stored on the server.
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instance URL
            </label>
            <input
              type="url"
              required
              placeholder="https://n8n.your-company.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-md border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              The base URL of your n8n instance. Must include https://.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              placeholder={hasApiKey ? '•••••••••••••••• (Key is set)' : 'Enter your n8n API Key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-md border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave blank to keep your existing key. We never expose your key in the browser once saved.
            </p>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !url}
              className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-500" /> : <Zap className="mr-2 h-4 w-4 text-amber-500" />}
              Test Connection
            </button>

            {testResult === 'success' && (
              <span className="text-sm font-medium text-green-600 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Verified
              </span>
            )}
            {testResult === 'error' && (
              <span className="text-sm font-medium text-red-600 flex items-center">
                <XCircle className="w-4 h-4 mr-1" /> Connection Failed
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Webhook Status
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <WebhookStatusItem name="Report Delivery" status="unverified" description="Handles scheduled PDF reports" />
            <WebhookStatusItem name="Collection Completion" status="unverified" description="Triggers upon ad sync finish" />
            <WebhookStatusItem name="CRM Sync" status="unverified" description="Pushes ICP leads to your CRM" />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Setup Instructions
            </h2>
          </div>
          <div className="p-6 text-sm text-slate-600 space-y-4">
            <p>To connect AdIntelix with your n8n instance:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open your n8n instance and navigate to Settings &gt; API.</li>
              <li>Create a new API key and paste it in the configuration above.</li>
              <li>Provide your n8n instance URL (e.g., <code className="bg-slate-100 px-1 rounded">https://n8n.your-domain.com</code>).</li>
              <li>Click <strong>Save Configuration</strong>.</li>
              <li>Use the <strong>Test Connection</strong> button to ensure AdIntelix can reach your instance.</li>
            </ol>
            <div className="mt-4 p-3 bg-indigo-50 rounded text-indigo-800 text-xs">
              <strong>Note:</strong> Workflows will show as &quot;Unverified&quot; until their active status can be confirmed by an actual payload delivery or via the n8n API.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhookStatusItem({ name, status, description }: { name: string, status: 'verified' | 'unverified' | 'error', description: string }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg border border-border bg-slate-50/50">
      <div>
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div>
        {status === 'verified' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</span>}
        {status === 'unverified' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Unverified</span>}
        {status === 'error' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Error</span>}
      </div>
    </div>
  );
}
