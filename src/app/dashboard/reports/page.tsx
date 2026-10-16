'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function ReportsPage() {
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [projId, setProjId] = useState<string | null>(null);

  const [supabase] = useState(() => createClient());

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const { data: orgMembers } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1);
    const orgMember = orgMembers?.[0];
    if (!orgMember) return;
    setOrgId(orgMember.organization_id);

    const { data: projs } = await supabase.from('projects').select('id').eq('organization_id', orgMember.organization_id).limit(1);
    if (projs && projs.length > 0) setProjId(projs[0].id);

    const { data: r } = await supabase.from('report_runs').select('*').eq('organization_id', orgMember.organization_id).order('created_at', { ascending: false });
    if (r) setReports(r);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, []);

  const handleExport = async (type: 'csv' | 'pdf') => {
    const res = await fetch('/api/icp/export', {
      method: 'POST',
      body: JSON.stringify({ organizationId: orgId, projectId: projId || reports[0]?.project_id, type }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (res.ok) {
      alert(`Export job for ${type} submitted! Please refresh in a few seconds.`);
      loadData();
    }
  };

  const handleDownload = (base64: string, filename: string) => {
    const a = document.createElement('a');
    a.href = base64;
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Exports</h1>
          <p className="text-muted-fg mt-1 text-sm">Generate and manage data exports for your organization.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => loadData()} className="bg-background text-foreground border border-border px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors font-medium shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh Data
          </button>
          <button onClick={() => handleExport('csv')} disabled={!orgId || !projId} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Generate CSV Export
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!orgId || !projId} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Generate PDF Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.length === 0 ? (
          <div className="md:col-span-2 flex flex-col items-center justify-center py-16 bg-surface border border-dashed border-border rounded-xl">
            <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center border border-border mb-4 shadow-sm">
              <svg className="w-6 h-6 text-muted-fg opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
            </div>
            <p className="text-foreground font-medium mb-1">No reports generated yet</p>
            <p className="text-sm text-muted-fg max-w-md text-center">Use the export buttons above to generate a new CSV or PDF report of your organization&apos;s data.</p>
          </div>
        ) : reports.map((r: Record<string, unknown>) => {
          const data = r.data as Record<string, unknown> | null;
          return (
            <div key={String(r.id)} className="border border-border rounded-xl p-6 bg-surface shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-1">Report Run</h3>
                  <span className="text-sm text-muted-fg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(String(r.created_at)).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${
                  String(r.status) === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                  String(r.status) === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 
                  'bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse'
                }`}>
                  {String(r.status)}
                </span>
              </div>
              
              {data && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="flex flex-col bg-background border border-border p-3 rounded-lg shadow-sm">
                    <span className="text-muted-fg text-xs font-semibold uppercase tracking-wider mb-1">Total Leads</span>
                    <span className="text-2xl font-bold text-foreground">{String(data.totalLeads || 0)}</span>
                  </div>
                  <div className="flex flex-col bg-background border border-border p-3 rounded-lg shadow-sm">
                    <span className="text-muted-fg text-xs font-semibold uppercase tracking-wider mb-1">Avg Score</span>
                    <span className="text-2xl font-bold text-indigo-600">{String(data.averageScore || 0)}</span>
                  </div>
                  <div className="flex flex-col bg-background border border-border p-3 rounded-lg shadow-sm">
                    <span className="text-muted-fg text-xs font-semibold uppercase tracking-wider mb-1">Qualified</span>
                    <span className="text-2xl font-bold text-emerald-600">{String(data.qualifiedLeads || 0)}</span>
                  </div>
                  
                  <div className="col-span-3 mt-1">
                    <h4 className="font-medium text-sm text-foreground mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-muted-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                      Qualification Breakdown
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium">
                       <div className="bg-green-50 text-green-800 border border-green-200 p-2 rounded-md flex flex-col items-center justify-center text-center">
                         <span className="opacity-70 mb-0.5">Excellent</span>
                         <span className="text-sm font-bold">{(data.scoreDistribution as Record<string, number>)?.[`excellent fit`] || 0}</span>
                       </div>
                       <div className="bg-blue-50 text-blue-800 border border-blue-200 p-2 rounded-md flex flex-col items-center justify-center text-center">
                         <span className="opacity-70 mb-0.5">Good</span>
                         <span className="text-sm font-bold">{(data.scoreDistribution as Record<string, number>)?.[`good fit`] || 0}</span>
                       </div>
                       <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-2 rounded-md flex flex-col items-center justify-center text-center">
                         <span className="opacity-70 mb-0.5">Moderate</span>
                         <span className="text-sm font-bold">{(data.scoreDistribution as Record<string, number>)?.[`moderate fit`] || 0}</span>
                       </div>
                       <div className="bg-red-50 text-red-800 border border-red-200 p-2 rounded-md flex flex-col items-center justify-center text-center">
                         <span className="opacity-70 mb-0.5">Poor</span>
                         <span className="text-sm font-bold">{(data.scoreDistribution as Record<string, number>)?.[`poor fit`] || 0}</span>
                       </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-auto border-t border-border pt-4 flex gap-3">
                {data?.csv_export ? (
                  <button onClick={() => handleDownload(`data:text/csv;charset=utf-8,${encodeURIComponent(String(data.csv_export))}`, 'report.csv')} className="flex-1 text-sm bg-background border border-border text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download CSV
                  </button>
                ) : null}
                {data?.pdf_export_base64 ? (
                  <button onClick={() => handleDownload(String(data.pdf_export_base64), 'report.pdf')} className="flex-1 text-sm bg-background border border-border text-foreground hover:bg-surface-hover px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download PDF
                  </button>
                ) : null}
                {!data?.csv_export && !data?.pdf_export_base64 && String(r.status) === 'completed' ? (
                  <span className="text-sm text-muted-fg italic py-1">No file attachments available.</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
