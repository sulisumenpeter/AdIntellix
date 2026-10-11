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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Competitor Ad Intelligence</h3>
          <p className="text-muted-fg mt-1 text-sm">Monitor and analyze your competitors&apos; advertising strategies in real-time.</p>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <h4 className="text-lg font-semibold text-foreground">Import Ads from Facebook Ads Library</h4>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="w-full lg:w-48">
            <label className="block text-xs font-medium text-muted-fg mb-1">Target Project</label>
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {projects.length === 0 && <option value="">No projects available</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-muted-fg mb-1">Facebook Ads Library Result URL</label>
            <input 
              type="url" 
              placeholder="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL..." 
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="w-full lg:w-24">
            <label className="block text-xs font-medium text-muted-fg mb-1">Max Results</label>
            <input 
              type="number" 
              min="1"
              max="100"
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
          <div className="w-full lg:w-auto lg:self-end">
            <button 
              onClick={handleImport}
              disabled={loading || !url || !selectedProjectId}
              className="w-full bg-indigo-600 text-white px-5 py-2 rounded-lg disabled:opacity-50 font-medium hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              {loading ? (
                <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Starting...</>
              ) : 'Import Ads'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-fg uppercase tracking-wider">Advertiser</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-fg uppercase tracking-wider">Ad Copy</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-fg uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-fg uppercase tracking-wider">AI Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-muted-fg mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      <p className="text-foreground font-medium mb-1">No ads found</p>
                      <p className="text-sm text-muted-fg max-w-sm text-center">There are no tracked competitor ads in this project yet. Start an import job above to collect intelligence.</p>
                    </div>
                  </td>
                </tr>
              ) : ads.map(ad => (
                <tr key={ad.id} className="hover:bg-surface-hover transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {ad.advertiser_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{ad.advertiser_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-muted-fg max-w-xs xl:max-w-md line-clamp-2" title={ad.ad_text || ad.headline}>
                      {ad.ad_text || ad.headline || <span className="italic opacity-50">No text content</span>}
                    </p>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {ad.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {ad.advertisement_analyses?.[0] ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-foreground text-xs uppercase w-14 shrink-0">Hook:</span>
                          <span className="text-muted-fg line-clamp-1">{ad.advertisement_analyses[0].hook}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-foreground text-xs uppercase w-14 shrink-0">Offer:</span>
                          <span className="text-muted-fg line-clamp-1">{ad.advertisement_analyses[0].offer}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-foreground text-xs uppercase w-14 shrink-0">CTA:</span>
                          <span className="text-muted-fg line-clamp-1">{ad.advertisement_analyses[0].cta}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-foreground text-xs uppercase w-14 shrink-0">Theme:</span>
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">{ad.advertisement_analyses[0].messaging_theme}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-fg italic">
                        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Pending AI Analysis
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
