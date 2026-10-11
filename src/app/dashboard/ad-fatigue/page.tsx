'use client';

import { useState, useEffect } from 'react';

export default function AdFatiguePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [fetching, setFetching] = useState(true);

  const fetchReports = async (orgId: string) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/ad-fatigue?organizationId=${orgId}`);
      const { data } = await res.json();
      if (data) setReports(data);
    } catch (e) {
      console.error(e);
    }
    setFetching(false);
  };

  useEffect(() => {
    const orgId = localStorage.getItem('adintelix_org_id') || '00000000-0000-0000-0000-000000000000';
    setTimeout(() => {
      setOrganizationId(orgId);
    }, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports(orgId);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'fatigued': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Ad Fatigue Detection</h3>
          <p className="text-muted-fg mt-1 text-sm">Monitor ad longevity and detect signs of creative exhaustion before performance drops.</p>
        </div>
        <button onClick={() => fetchReports(organizationId)} className="bg-background text-foreground border border-border px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors font-medium shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh Data
        </button>
      </div>
      
      {fetching ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="ml-3 text-muted-fg font-medium">Analyzing ad lifecycle...</span>
        </div>
      ) : (
        <div className="grid gap-6">
          {reports.length === 0 ? (
            <div className="bg-surface p-12 rounded-xl border border-border shadow-sm text-center">
              <svg className="w-12 h-12 text-muted-fg mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-foreground font-medium mb-1">No fatigue reports available</p>
              <p className="text-sm text-muted-fg max-w-sm mx-auto">Track competitor ads over time to generate fatigue reports and identify creative burnout.</p>
            </div>
          ) : reports.map(report => (
            <div key={report.id} className="bg-surface p-6 border border-border rounded-xl shadow-sm flex flex-col md:flex-row gap-6 hover:shadow transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {report.advertisements?.advertiser_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground leading-tight">{report.advertisements?.advertiser_name}</h3>
                    <div className="text-xs text-muted-fg mt-0.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(report.first_observed_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} &mdash; {new Date(report.latest_observed_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      report.fatigue_status === 'healthy' ? 'bg-green-50 text-green-700 border-green-200' : 
                      report.fatigue_status === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {report.fatigue_status === 'healthy' && <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>}
                      {report.fatigue_status === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>}
                      {report.fatigue_status === 'fatigued' && <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>}
                      {report.fatigue_status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-muted-fg text-sm italic line-clamp-3">&quot;{report.advertisements?.ad_text}&quot;</p>
                </div>
              </div>
              <div className="w-full md:w-80 bg-background border border-border p-5 rounded-lg flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Fatigue Score</span>
                  <div className={`text-2xl font-bold ${
                    report.fatigue_score < 40 ? 'text-green-600' :
                    report.fatigue_score < 75 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {report.fatigue_score}<span className="text-sm text-muted-fg font-normal">/100</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Signals Detected:</p>
                  <ul className="space-y-1.5">
                    {report.signals_detected?.map((sig: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="leading-tight">{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {report.recommendation && (
                  <div className="mt-5 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-1">Recommendation:</p>
                    <p className="text-sm text-foreground leading-snug">{report.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
