'use client';
import React, { useState, useEffect } from 'react';

export default function ICPManagementPage() {
  const [profiles, setProfiles] = useState<Record<string, unknown>[]>([]);
  const [leads, setLeads] = useState<Record<string, unknown>[]>([]);
  const [scores, setScores] = useState<Record<string, unknown>[]>([]);
  const [rules, setRules] = useState<Record<string, unknown>[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [projId, setProjId] = useState<string | null>(null);

  const loadData = async () => {
    let currentOrgId = orgId && orgId !== 'org-1' && orgId !== '00000000-0000-0000-0000-000000000000' ? orgId : null;
    let currentProjId = projId && projId !== 'proj-1' ? projId : null;

    // Use aggregate Backend API to avoid Supabase auth rate limits
    const res = await fetch(`/api/icp/dashboard${currentOrgId ? `?organizationId=${currentOrgId}` : ''}`, { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      if (json.organizationId) {
        currentOrgId = String(json.organizationId);
        setOrgId(currentOrgId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('adintelix_org_id', currentOrgId);
        }
      }
      if (json.projectId) {
        currentProjId = String(json.projectId);
        setProjId(currentProjId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('adintelix_project_id', currentProjId);
        }
      }
      if (json.profiles) setProfiles(json.profiles);
      if (json.rules) setRules(json.rules);
      if (json.leads) setLeads(json.leads);
      if (json.scores) setScores(json.scores);
    } else {
      console.warn('Failed to fetch dashboard data, keeping existing state', res.status);
    }
  };

  useEffect(() => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('adintelix_org_id') : null;
    const storedProjId = typeof window !== 'undefined' ? localStorage.getItem('adintelix_project_id') : null;
    setTimeout(() => {
      if (storedOrgId) setOrgId(storedOrgId);
      if (storedProjId) setProjId(storedProjId);
      loadData();
    }, 0);
  }, []);

  const handleCreateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/icp/profiles', {
      method: 'POST',
      body: JSON.stringify({ name: formData.get('name'), organizationId: orgId, projectId: projId }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    loadData();
  };

  const handleCsvUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => obj[h] = values[i]?.trim());
      return obj;
    });

    await fetch('/api/icp/leads', {
      method: 'POST',
      body: JSON.stringify({ organizationId: orgId, projectId: projId, icpProfileId: profiles[0]?.id, rows }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    alert('Import Job Submitted!');
    loadData();
  };

  const handleAddRule = async (e: React.FormEvent<HTMLFormElement>, profileId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/icp/rules', {
      method: 'POST',
      body: JSON.stringify({
        icpProfileId: profileId,
        rule_type: formData.get('rule_type'),
        operator: formData.get('operator'),
        value: formData.get('value'),
        weight: Number(formData.get('weight')),
        organizationId: orgId
      }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    loadData();
  };

  const handleDeleteRule = async (id: string) => {
    const res = await fetch(`/api/icp/rules?id=${id}&organizationId=${orgId}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      console.error('Delete failed:', res.status, await res.text());
    }
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" suppressHydrationWarning>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ICP Lead Scoring</h1>
          <p className="text-muted-fg mt-1 text-sm">Define Ideal Customer Profiles and auto-score inbound leads.</p>
        </div>
        <form onSubmit={handleCreateProfile} className="flex gap-2 w-full sm:w-auto">
          <input name="name" placeholder="New ICP Name" required className="bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow w-full sm:w-48" />
          <button type="submit" disabled={!orgId} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 font-medium hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap">Create Profile</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 border border-border rounded-xl p-6 bg-surface shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Ideal Customer Profiles & Rules</h2>
          </div>
          
          {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl">
              <svg className="w-10 h-10 text-muted-fg mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <p className="text-foreground font-medium mb-1">No ICP profiles found</p>
              <p className="text-sm text-muted-fg max-w-sm">Create an Ideal Customer Profile using the form above to start defining scoring rules.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-6">
              {profiles.map(p => {
                const profileRules = rules.filter(r => r.icp_profile_id === p.id);
                return (
                <li key={String(p.id)} data-testid={`profile-${String(p.name).replace(/\s+/g, '-')}`} className="border border-border rounded-lg bg-background overflow-hidden flex flex-col">
                  <div className="flex justify-between font-semibold items-center p-4 bg-surface border-b border-border">
                    <span className="text-foreground">{String(p.name)}</span>
                    <button onClick={async () => { await fetch(`/api/icp/profiles?id=${p.id}&organizationId=${orgId}`, { method: 'DELETE', credentials: 'include' }); loadData(); }} className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete ICP</button>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider mb-3">Scoring Rules</h3>
                    <ul className="flex flex-col gap-2 mb-4">
                      {profileRules.length === 0 ? (
                         <li className="text-muted-fg italic text-sm py-2 text-center bg-surface border border-dashed border-border rounded-lg">No rules yet. Add one below.</li>
                      ) : profileRules.map(r => (
                        <li key={String(r.id)} className="flex justify-between bg-surface border border-border p-2.5 rounded-lg text-sm items-center hover:shadow-sm transition-shadow">
                          <span className="text-foreground">
                            <span className="font-semibold text-indigo-700 capitalize mr-1">{String(r.rule_type).replace('_', ' ')}</span>
                            <span className="text-muted-fg mx-1">{String(r.operator).replace('_', ' ')}</span>
                            <span className="font-medium mx-1">&quot;{String(r.value)}&quot;</span>
                            <span className="text-xs text-muted-fg ml-2 bg-background px-2 py-0.5 border border-border rounded-full">Weight: {String(r.weight)}</span>
                          </span>
                          <button onClick={() => handleDeleteRule(String(r.id))} className="text-muted-fg hover:text-red-600 p-1 transition-colors" title="Remove rule" aria-label="Remove rule">
                            <span className="sr-only">X</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <form onSubmit={(e) => handleAddRule(e, String(p.id))} className="flex flex-col gap-3 bg-surface p-4 rounded-lg border border-border mt-2">
                      <div className="text-sm font-semibold text-foreground mb-1">Add New Rule</div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <select name="rule_type" className="bg-background border border-border text-foreground rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="industry">Industry</option>
                          <option value="company_size">Company Size</option>
                          <option value="job_title">Job Title</option>
                          <option value="revenue">Revenue</option>
                        </select>
                        <select name="operator" className="bg-background border border-border text-foreground rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="equals">Equals</option>
                          <option value="contains">Contains</option>
                          <option value="regex">Regex</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                        </select>
                        <input name="value" placeholder="Target Value" required className="bg-background border border-border text-foreground rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        <input name="weight" type="number" placeholder="Weight (e.g. 10)" required className="bg-background border border-border text-foreground rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <button type="submit" className="bg-background hover:bg-surface-hover text-foreground border border-border px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm self-end sm:w-auto w-full">Add Rule</button>
                    </form>
                  </div>
                </li>
              )})}
            </ul>
          )}
        </div>

        <div className="lg:col-span-4 border border-border rounded-xl p-6 bg-surface shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Import Leads</h2>
          </div>
          
          <form onSubmit={handleCsvUpload} className="flex flex-col gap-3 bg-background border border-border p-4 rounded-xl">
            <p className="text-sm text-muted-fg mb-1">Upload a CSV containing leads to score them against your active ICP rules.</p>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-surface transition-colors cursor-pointer relative">
              <input type="file" name="file" accept=".csv" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <svg className="w-8 h-8 text-indigo-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <span className="text-sm font-medium text-foreground block">Click to select CSV</span>
            </div>
            <button type="submit" className="bg-indigo-600 text-white w-full py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm mt-1">Process Import</button>
          </form>
          
          <div className="mt-auto pt-4 flex justify-center">
            <button onClick={loadData} className="text-sm text-indigo-600 font-medium flex items-center gap-1.5 hover:text-indigo-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh View
            </button>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-surface shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-background flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Recently Scored Leads</h2>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border text-muted-fg text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Company</th>
                <th className="py-3 px-6">Job Title</th>
                <th className="py-3 px-6 text-center">Score</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border bg-background">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-10 h-10 text-muted-fg mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p className="text-foreground font-medium mb-1">No leads imported yet</p>
                    </div>
                  </td>
                </tr>
              ) : leads.map(l => {
                const scoreRow = scores.find(s => s.lead_id === l.id);
                return (
                  <tr key={String(l.id)} className="hover:bg-surface-hover transition-colors">
                    <td className="py-4 px-6 font-medium text-foreground">{String(l.name || 'Unknown')}</td>
                    <td className="py-4 px-6 text-muted-fg">{String(l.company || '—')}</td>
                    <td className="py-4 px-6 text-muted-fg">{String(l.job_title || '—')}</td>
                    <td className="py-4 px-6 text-center">
                      {scoreRow ? (
                        <span className="font-bold text-foreground text-lg">{String(scoreRow.overall_score)}</span>
                      ) : (
                        <span className="text-muted-fg italic text-xs">Unscored</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {scoreRow && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          String(scoreRow.qualification_status) === 'excellent fit' ? 'bg-green-50 text-green-700 border-green-200' :
                          String(scoreRow.qualification_status) === 'good fit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          String(scoreRow.qualification_status) === 'poor fit' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {String(scoreRow.qualification_status).replace(' fit', '').toUpperCase()}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
