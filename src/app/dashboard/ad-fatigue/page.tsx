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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ad Fatigue Overview</h1>
        <button onClick={() => fetchReports(organizationId)} className="px-4 py-2 border rounded hover:bg-gray-50">
          Refresh
        </button>
      </div>
      
      {fetching ? <p>Loading...</p> : (
        <div className="grid gap-6">
          {reports.map(report => (
            <div key={report.id} className="p-6 border rounded bg-white shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{report.advertisements?.advertiser_name}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(report.fatigue_status)}`}>
                    {report.fatigue_status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{report.advertisements?.ad_text}</p>
                <div className="text-sm">
                  <p><strong>Observed:</strong> {report.first_observed_date} to {report.latest_observed_date}</p>
                </div>
              </div>
              <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded">
                <div className="mb-2">
                  <span className="text-sm text-gray-500 block">Fatigue Score</span>
                  <span className="text-3xl font-bold">{report.fatigue_score}/100</span>
                </div>
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-semibold">Signals Detected:</p>
                  <ul className="list-disc pl-4 text-sm text-gray-700">
                    {report.signals_detected?.map((sig: string, i: number) => <li key={i}>{sig}</li>)}
                  </ul>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold">Recommendation:</p>
                  <p className="text-sm text-gray-700">{report.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded">
              No ad fatigue reports found. Ensure ads have been analyzed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
