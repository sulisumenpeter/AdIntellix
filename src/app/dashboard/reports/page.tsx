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
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) alert(`Export job for ${type} submitted! Please refresh in a few seconds.`);
  };

  const handleDownload = (base64: string, filename: string) => {
    const a = document.createElement('a');
    a.href = base64;
    a.download = filename;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => loadData()} className="bg-gray-100 text-gray-800 px-4 py-2 rounded text-sm border hover:bg-gray-200">Refresh Data</button>
          <button onClick={() => handleExport('csv')} disabled={!orgId || !projId} className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">Generate CSV Export</button>
          <button onClick={() => handleExport('pdf')} disabled={!orgId || !projId} className="bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">Generate PDF Export</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((r: Record<string, unknown>) => {
          const data = r.data as Record<string, unknown> | null;
          return (
            <div key={String(r.id)} className="border rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-semibold text-gray-800">Report Run: {new Date(String(r.created_at)).toLocaleString()}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${String(r.status) === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{String(r.status).toUpperCase()}</span>
              </div>
              
              {data && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 text-xs uppercase font-bold">Total Leads</span>
                    <span className="text-xl font-semibold">{String(data.totalLeads || 0)}</span>
                  </div>
                  <div className="flex flex-col bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 text-xs uppercase font-bold">Average Score</span>
                    <span className="text-xl font-semibold">{String(data.averageScore || 0)}</span>
                  </div>
                  <div className="flex flex-col bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 text-xs uppercase font-bold">Qualified</span>
                    <span className="text-xl font-semibold">{String(data.qualifiedLeads || 0)}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <h4 className="font-semibold text-sm mb-2 mt-2 border-t pt-2">Qualification Distribution</h4>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                       <div className="bg-green-100 text-green-800 p-2 rounded text-center">Excellent: {(data.scoreDistribution as Record<string, number>)?.[`excellent fit`] || 0}</div>
                       <div className="bg-blue-100 text-blue-800 p-2 rounded text-center">Good: {(data.scoreDistribution as Record<string, number>)?.[`good fit`] || 0}</div>
                       <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-center">Moderate: {(data.scoreDistribution as Record<string, number>)?.[`moderate fit`] || 0}</div>
                       <div className="bg-red-100 text-red-800 p-2 rounded text-center">Poor: {(data.scoreDistribution as Record<string, number>)?.[`poor fit`] || 0}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-auto border-t pt-4 flex gap-2">
                {data?.csv_export ? (
                  <button onClick={() => handleDownload(`data:text/csv;charset=utf-8,${encodeURIComponent(String(data.csv_export))}`, 'report.csv')} className="text-sm bg-gray-100 border border-gray-300 px-3 py-1 rounded">Download CSV</button>
                ) : null}
                {data?.pdf_export_base64 ? (
                  <button onClick={() => handleDownload(String(data.pdf_export_base64), 'report.pdf')} className="text-sm bg-gray-100 border border-gray-300 px-3 py-1 rounded">Download PDF</button>
                ) : null}
              </div>
            </div>
          );
        })}
        {reports.length === 0 && <div className="text-gray-500">No reports generated yet.</div>}
      </div>
    </div>
  );
}
