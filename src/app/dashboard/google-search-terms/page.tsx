'use client';

import { useState, useEffect } from 'react';

export default function GoogleSearchTermsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [connections, setConnections] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchTerms, setSearchTerms] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [fetching, setFetching] = useState(true);
  const [filterClass, setFilterClass] = useState('all');
  


  const fetchSearchTerms = async (orgId: string, pId: string, classification = 'all') => {
    setFetching(true);
    try {
      const res = await fetch(`/api/google-ads/search-terms?organizationId=${orgId}&projectId=${pId}&classification=${classification}`);
      const { data } = await res.json();
      if (data) setSearchTerms(data);
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
      fetchSearchTerms(orgId, pId, filterClass);
    }, 0);
  }, [filterClass]);



  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Google Ads Search Terms</h3>
          <p className="text-muted-fg mt-1 text-sm">Analyze query intent, discover negative keywords, and reduce wasted spend.</p>
        </div>
        <div className="flex gap-3">

          <button onClick={() => fetchSearchTerms(organizationId, projectId, filterClass)} className="bg-background text-foreground border border-border px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors font-medium shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>



      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-3 bg-background">
          <label className="font-semibold text-sm text-foreground flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filter Classification
          </label>
          <select 
            value={filterClass} 
            onChange={e => setFilterClass(e.target.value)} 
            className="w-full sm:w-auto bg-surface border border-border text-sm text-foreground rounded-md px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          >
            <option value="all">All Terms</option>
            <option value="high intent">High Intent</option>
            <option value="informational">Informational</option>
            <option value="irrelevant">Irrelevant</option>
            <option value="competitor">Competitor</option>
            <option value="research">Research</option>
            <option value="low intent">Low Intent</option>
            <option value="other">Other</option>
          </select>
        </div>

        {fetching ? (
          <div className="flex justify-center items-center py-20 bg-surface">
            <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="ml-3 text-muted-fg font-medium">Loading search terms...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar bg-surface">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-6 py-4 font-semibold text-xs text-muted-fg uppercase tracking-wider">Search Term</th>
                  <th className="px-6 py-4 font-semibold text-xs text-muted-fg uppercase tracking-wider">Classification</th>
                  <th className="px-6 py-4 font-semibold text-xs text-muted-fg uppercase tracking-wider text-right">Clicks / Cost</th>
                  <th className="px-6 py-4 font-semibold text-xs text-muted-fg uppercase tracking-wider text-right">Conv / Value</th>
                  <th className="px-6 py-4 font-semibold text-xs text-muted-fg uppercase tracking-wider text-center">Waste?</th>
                  <th className="px-6 py-4 font-semibold text-xs text-muted-fg uppercase tracking-wider">Neg. Keyword</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {searchTerms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-muted-fg mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <p className="text-foreground font-medium mb-1">No search terms found</p>
                        <p className="text-sm text-muted-fg">Try adjusting your filters or importing fresh data.</p>
                      </div>
                    </td>
                  </tr>
                ) : searchTerms.map(term => (
                  <tr key={term.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-foreground">{term.search_term}</div>
                      <div className="text-xs text-muted-fg mt-1 font-mono flex items-center gap-1 opacity-80"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> {term.campaign}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          term.classification.toLowerCase() === 'high intent' ? 'bg-green-50 text-green-700 border-green-200' :
                          term.classification.toLowerCase() === 'irrelevant' ? 'bg-red-50 text-red-700 border-red-200' :
                          term.classification.toLowerCase() === 'competitor' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {term.classification}
                        </span>
                        <div className="text-xs text-muted-fg line-clamp-1 max-w-xs" title={term.explanation}>{term.explanation}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-foreground">{term.clicks}</div>
                      <div className="text-xs text-muted-fg mt-0.5">${Number(term.cost).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-foreground">{term.conversions}</div>
                      <div className="text-xs text-muted-fg mt-0.5">${Number(term.conversion_value).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {term.waste_indicator ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600" title="High Waste">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600" title="Efficient">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {term.suggested_negative_keyword ? (
                        <code className="text-xs font-mono bg-background border border-border px-2 py-1 rounded text-red-600">[{term.suggested_negative_keyword}]</code>
                      ) : <span className="text-muted-fg text-sm">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
