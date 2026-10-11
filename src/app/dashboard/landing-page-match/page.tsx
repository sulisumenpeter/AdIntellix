'use client';

import { useState, useEffect } from 'react';

export default function LandingPageMatchPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matches, setMatches] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [fetching, setFetching] = useState(true);
  
  const [adId, setAdId] = useState('');
  const [destUrl, setDestUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const fetchMatches = async (orgId: string, pId: string) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/landing-page-match?organizationId=${orgId}&projectId=${pId}`);
      const { data } = await res.json();
      if (data) setMatches(data);
    } catch (e) {
      console.error(e);
    }
    setFetching(false);
  };

  useEffect(() => {
    const orgId = localStorage.getItem('adintelix_org_id') || '00000000-0000-0000-0000-000000000000';
    const pId = localStorage.getItem('adintelix_project_id') || '00000000-0000-0000-0000-000000000000';
    setTimeout(() => {
      setOrganizationId(orgId);
      setProjectId(pId);
    }, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatches(orgId, pId);
  }, []);

  const handleAnalyze = async () => {
    if (!adId || !destUrl) return alert('Ad ID and Destination URL are required.');
    setAnalyzing(true);
    try {
      const res = await fetch('/api/landing-page-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          projectId,
          advertisementId: adId,
          destinationUrl: destUrl
        })
      });
      if (res.ok) {
        alert('Analysis queued successfully. It may take a minute to process.');
        setAdId('');
        setDestUrl('');
      } else {
        const error = await res.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error queuing analysis.');
    }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Ad-to-Landing-Page Match</h3>
          <p className="text-muted-fg mt-1 text-sm">Analyze message continuity between ad creatives and their final destination URLs.</p>
        </div>
        <button onClick={() => fetchMatches(organizationId, projectId)} className="bg-background text-foreground border border-border px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors font-medium shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh Data
        </button>
      </div>

      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          </div>
          <h4 className="text-lg font-semibold text-foreground">Analyze New Match</h4>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-fg mb-1">Advertisement ID</label>
            <input 
              type="text" 
              placeholder="e.g. 1234567890" 
              value={adId} 
              onChange={e => setAdId(e.target.value)} 
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-fg mb-1">Destination URL</label>
            <input 
              type="url" 
              placeholder="https://example.com/landing-page" 
              value={destUrl} 
              onChange={e => setDestUrl(e.target.value)} 
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleAnalyze} 
              disabled={analyzing} 
              className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 font-medium hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              {analyzing ? (
                <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Queuing...</>
              ) : 'Analyze'}
            </button>
          </div>
        </div>
      </div>
      
      {fetching ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="ml-3 text-muted-fg font-medium">Loading match reports...</span>
        </div>
      ) : (
        <div className="grid gap-6">
          {matches.length === 0 ? (
            <div className="bg-surface p-12 rounded-xl border border-border shadow-sm text-center">
              <svg className="w-12 h-12 text-muted-fg mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              <p className="text-foreground font-medium mb-1">No landing page matches analyzed yet</p>
              <p className="text-sm text-muted-fg max-w-sm mx-auto">Use the form above to queue a new ad and landing page pair for AI continuity analysis.</p>
            </div>
          ) : matches.map(match => (
            <div key={match.id} className="bg-surface p-6 border border-border rounded-xl shadow-sm flex flex-col md:flex-row gap-6 hover:shadow transition-shadow">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {match.advertisements?.advertiser_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <h3 className="font-bold text-lg text-foreground leading-tight">{match.advertisements?.advertiser_name}</h3>
                  </div>
                  <div className="text-xs text-muted-fg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(match.crawled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                <div className="mb-5 bg-background rounded-lg border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-surface-hover flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    <a href={match.destination_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate">
                      {match.destination_url}
                    </a>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-foreground">&quot;{match.advertisements?.ad_text}&quot;</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-red-700 mb-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Mismatches
                    </div>
                    {match.mismatches?.length > 0 ? (
                      <ul className="space-y-1.5">
                        {match.mismatches.map((m: string, i: number) => (
                          <li key={i} className="text-sm text-muted-fg flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-fg italic">No significant mismatches detected.</p>
                    )}
                    
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-1">Evidence</p>
                      <p className="text-sm text-foreground">{match.supporting_evidence}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-700 mb-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Recommendations
                    </div>
                    {match.recommendations?.length > 0 ? (
                      <ul className="space-y-1.5">
                        {match.recommendations.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-muted-fg flex items-start gap-2">
                            <span className="text-indigo-500 mt-1">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-fg italic">No recommendations.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-72 bg-background border border-border p-5 rounded-lg flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Overall Match Score</span>
                  <div className={`text-3xl font-bold ${
                    match.overall_score >= 80 ? 'text-green-600' :
                    match.overall_score >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {match.overall_score}<span className="text-sm text-muted-fg font-normal">/100</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-fg font-medium">Hook Alignment</span>
                      <span className="text-foreground font-semibold">{match.hook_alignment}%</span>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-2">
                      <div className={`h-2 rounded-full ${match.hook_alignment >= 80 ? 'bg-green-500' : match.hook_alignment >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${match.hook_alignment}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-fg font-medium">Offer Alignment</span>
                      <span className="text-foreground font-semibold">{match.offer_alignment}%</span>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-2">
                      <div className={`h-2 rounded-full ${match.offer_alignment >= 80 ? 'bg-green-500' : match.offer_alignment >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${match.offer_alignment}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-fg font-medium">CTA Alignment</span>
                      <span className="text-foreground font-semibold">{match.cta_alignment}%</span>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-2">
                      <div className={`h-2 rounded-full ${match.cta_alignment >= 80 ? 'bg-green-500' : match.cta_alignment >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${match.cta_alignment}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-fg font-medium">Messaging Alignment</span>
                      <span className="text-foreground font-semibold">{match.messaging_alignment}%</span>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-2">
                      <div className={`h-2 rounded-full ${match.messaging_alignment >= 80 ? 'bg-green-500' : match.messaging_alignment >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${match.messaging_alignment}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
