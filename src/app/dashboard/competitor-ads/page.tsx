'use client';

import { useState, useEffect } from 'react';

export default function CompetitorAdsPage() {
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [orgId, setOrgId] = useState<string>('');
  type Ad = {
    id: string;
    advertiser_name: string;
    ad_text?: string;
    headline?: string;
    is_active: boolean;
    advertisement_analyses?: { hook: string; offer: string; cta: string; messaging_theme: string; }[];
  };

  const [ads, setAds] = useState<Ad[]>([]);
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/competitor-ads')
      .then(res => res.json())
      .then(data => {
        if (data.organizationId) setOrgId(data.organizationId);
        if (data.projects) {
          setProjects(data.projects);
          if (data.projects.length > 0) {
            setSelectedProjectId(data.projects[0].id);
          }
        }
      });
  }, []);

  useEffect(() => {
    if (selectedProjectId && orgId) {
      const fetchAds = async () => {
        const res = await fetch(`/api/competitor-ads?projectId=${selectedProjectId}&orgId=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          setAds(data.ads || []);
        }
      };
      fetchAds().catch(console.error);
    }
  }, [selectedProjectId, orgId]);

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ingestion/apify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          projectId: selectedProjectId,
          searchUrl: url,
          resultsLimit: limit
        })
      });
      if (res.ok) {
        alert('Import started successfully. Refresh the page after a few minutes to see the ads.');
        setUrl('');
      } else {
        const error = await res.json();
        alert(`Failed to import: ${error.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">Competitor Ads</h3>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h4 className="text-lg font-medium">Import Ads from Facebook Ads Library</h4>
        <div className="flex space-x-4">
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="Facebook Ads Library Result URL" 
            className="flex-1 border border-gray-300 rounded px-3 py-2"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Limit" 
            className="w-24 border border-gray-300 rounded px-3 py-2"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
          <button 
            onClick={handleImport}
            disabled={loading || !url || !selectedProjectId}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 font-medium"
          >
            {loading ? 'Starting...' : 'Import Ads'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advertiser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Copy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Analysis</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No ads found for this project.</td>
              </tr>
            ) : ads.map(ad => (
              <tr key={ad.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ad.advertiser_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{ad.ad_text || ad.headline || 'No text'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ad.is_active ? <span className="text-green-600">Active</span> : <span className="text-red-600">Inactive</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {ad.advertisement_analyses?.[0] ? (
                    <div className="space-y-1">
                      <div><span className="font-semibold">Hook:</span> {ad.advertisement_analyses[0].hook}</div>
                      <div><span className="font-semibold">Offer:</span> {ad.advertisement_analyses[0].offer}</div>
                      <div><span className="font-semibold">CTA:</span> {ad.advertisement_analyses[0].cta}</div>
                      <div><span className="font-semibold">Theme:</span> {ad.advertisement_analyses[0].messaging_theme}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Pending analysis...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
