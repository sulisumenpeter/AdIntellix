'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function ICPManagementPage() {
  const [profiles, setProfiles] = useState<Record<string, unknown>[]>([]);
  const [leads, setLeads] = useState<Record<string, unknown>[]>([]);
  const [scores, setScores] = useState<Record<string, unknown>[]>([]);
  const [rules, setRules] = useState<Record<string, unknown>[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [projId, setProjId] = useState<string | null>(null);

  const [supabase] = useState(() => createClient());

  const loadData = async () => {
    let currentOrgId = orgId;
    let currentProjId = projId;

    // Use aggregate Backend API to avoid Supabase auth rate limits
    console.log('BROWSER COOKIES BEFORE FETCH:', document.cookie);
    const res = await fetch(`/api/icp/dashboard${currentOrgId ? `?organizationId=${currentOrgId}` : ''}`, { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      if (json.organizationId && !currentOrgId) {
        currentOrgId = json.organizationId;
        setOrgId(currentOrgId);
      }
      if (json.projectId && !currentProjId) {
        currentProjId = json.projectId;
        setProjId(currentProjId);
      }
      if (json.profiles) setProfiles(json.profiles);
      if (json.rules) setRules(json.rules);
      if (json.leads) setLeads(json.leads);
      if (json.scores) setScores(json.scores);
    } else {
      console.warn('Failed to fetch dashboard data, keeping existing state', res.status);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, []);

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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ICP Management & Lead Scoring</h1>
        <form onSubmit={handleCreateProfile} className="flex gap-2">
          <input name="name" placeholder="ICP Name" required className="border p-2 rounded text-sm" />
          <button type="submit" disabled={!orgId || !projId} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">Create ICP Profile</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Ideal Customer Profiles & Rules</h2>
          {profiles.length === 0 ? (
            <div className="text-gray-400">No ICP profiles created yet.</div>
          ) : (
            <ul className="flex flex-col gap-4">
              {profiles.map(p => {
                const profileRules = rules.filter(r => r.icp_profile_id === p.id);
                return (
                <li key={String(p.id)} data-testid={`profile-${String(p.name).replace(/\s+/g, '-')}`} className="border p-4 rounded flex flex-col gap-3">
                  <div className="flex justify-between font-medium items-center">
                    {String(p.name)} 
                    <button onClick={async () => { await fetch(`/api/icp/profiles?id=${p.id}&organizationId=${orgId}`, { method: 'DELETE', credentials: 'include' }); loadData(); }} className="text-red-500 text-xs">Delete ICP</button>
                  </div>
                  
                  <div className="text-sm mt-2 border-t pt-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Rules</h3>
                    <ul className="flex flex-col gap-1 mb-3">
                      {profileRules.length === 0 ? (
                         <li className="text-gray-500 italic text-xs">No rules yet.</li>
                      ) : profileRules.map(r => (
                        <li key={String(r.id)} className="flex justify-between bg-gray-50 p-1 px-2 rounded border border-gray-100 text-xs items-center">
                          <span>{String(r.rule_type)} {String(r.operator)} &quot;{String(r.value)}&quot; (Weight: {String(r.weight)})</span>
                          <button onClick={() => handleDeleteRule(String(r.id))} className="text-red-500 font-bold ml-2">X</button>
                        </li>
                      ))}
                    </ul>
                    <form onSubmit={(e) => handleAddRule(e, String(p.id))} className="flex flex-col gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="flex gap-2">
                        <select name="rule_type" className="border p-1 text-xs rounded w-1/4 bg-white">
                          <option value="industry">Industry</option>
                          <option value="company_size">Company Size</option>
                          <option value="job_title">Job Title</option>
                          <option value="revenue">Revenue</option>
                        </select>
                        <select name="operator" className="border p-1 text-xs rounded w-1/4 bg-white">
                          <option value="equals">Equals</option>
                          <option value="contains">Contains</option>
                          <option value="regex">Regex</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                        </select>
                        <input name="value" placeholder="Value" required className="border p-1 text-xs rounded w-1/4" />
                        <input name="weight" type="number" placeholder="Weight (e.g. 10)" required className="border p-1 text-xs rounded w-1/4" />
                      </div>
                      <button type="submit" className="bg-gray-800 text-white px-2 py-1 rounded text-xs w-full mt-1 font-semibold">Add Rule</button>
                    </form>
                  </div>
                </li>
              )})}
            </ul>
          )}
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Lead Management</h2>
          <form onSubmit={handleCsvUpload} className="flex gap-2 border p-4 rounded bg-gray-50 flex-col">
            <span className="text-sm font-medium">Bulk Import Leads (CSV)</span>
            <div className="flex gap-2 items-center">
              <input type="file" name="file" accept=".csv" required className="text-sm flex-1" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">Import</button>
            </div>
          </form>
          <button onClick={loadData} className="mt-2 text-sm text-blue-500 text-left hover:underline">Refresh View</button>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-white shadow-sm mt-2">
        <h2 className="text-xl font-semibold mb-4">Recent Leads</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-gray-600 text-sm">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Company</th>
              <th className="py-2 px-2">Job Title</th>
              <th className="py-2 px-2">Score</th>
              <th className="py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {leads.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-gray-500">No leads imported yet.</td></tr>
            ) : leads.map(l => {
              const scoreRow = scores.find(s => s.lead_id === l.id);
              return (
                <tr key={String(l.id)} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{String(l.name || 'Unknown')}</td>
                  <td className="py-2 px-2">{String(l.company || '')}</td>
                  <td className="py-2 px-2">{String(l.job_title || '')}</td>
                  <td className="py-2 px-2 font-medium">{scoreRow ? String(scoreRow.overall_score) : 'Unscored'}</td>
                  <td className="py-2 px-2">
                    {scoreRow && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        String(scoreRow.qualification_status) === 'excellent fit' ? 'bg-green-100 text-green-800' :
                        String(scoreRow.qualification_status) === 'good fit' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {String(scoreRow.qualification_status).toUpperCase()}
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
  );
}
