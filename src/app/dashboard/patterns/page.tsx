'use client';

import { useState, useEffect } from 'react';
import type { AdPattern, LongRunningAd } from '@/lib/intelligence/pattern-detector';

export default function PatternsPage() {
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [orgId, setOrgId] = useState<string>('');
  
  const [patterns, setPatterns] = useState<AdPattern[]>([]);
  const [longRunning, setLongRunning] = useState<LongRunningAd[]>([]);
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
      const loadPatterns = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/competitor-ads/patterns?projectId=${selectedProjectId}&orgId=${orgId}`);
          if (res.ok) {
            const data = await res.json();
            setPatterns(data.patterns || []);
            setLongRunning(data.longRunning || []);
          }
        } finally {
          setLoading(false);
        }
      };
      loadPatterns().catch(console.error);
    }
  }, [selectedProjectId, orgId]);

  const getPatternsByType = (type: string) => patterns.filter(p => p.pattern_type === type);

  const renderPatternCard = (title: string, type: string, iconUrl?: string) => {
    const items = getPatternsByType(type);
    return (
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            {iconUrl ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" dangerouslySetInnerHTML={{ __html: iconUrl }} />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            )}
          </div>
          <h4 className="text-lg font-semibold text-foreground">{title}</h4>
        </div>
        
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <svg className="w-10 h-10 text-muted-fg mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-sm text-muted-fg">No patterns detected yet</p>
          </div>
        ) : (
          <ul className="space-y-4 flex-1">
            {items.slice(0, 5).map((item, i) => (
              <li key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-foreground text-sm leading-tight break-words">{item.pattern_value}</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                    {item.occurrence_count} ads
                  </span>
                </div>
                <div className="text-xs text-muted-fg mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(item.first_observed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} &mdash; {new Date(item.last_observed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Ad Pattern Intelligence</h3>
          <p className="text-muted-fg mt-1 text-sm">AI-detected recurring strategies, hooks, and themes across competitor ads.</p>
        </div>
        <div className="w-full sm:w-64">
          <label className="sr-only">Target Project</label>
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          >
            {projects.length === 0 && <option value="">No projects available</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="ml-3 text-muted-fg font-medium">Analyzing patterns...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {renderPatternCard('Recurring Hooks', 'hook', '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />')}
            {renderPatternCard('Recurring Offers', 'offer', '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />')}
            {renderPatternCard('Recurring CTAs', 'cta', '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />')}
            {renderPatternCard('Messaging Themes', 'messaging_theme', '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />')}
          </div>

          <div className="bg-surface rounded-xl border border-border shadow-sm mt-8 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Long-Running Ads</h4>
                <p className="text-sm text-muted-fg mt-0.5">Ads running continuously for more than 14 days, indicating strong performance.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-fg uppercase tracking-wider">Advertiser</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-fg uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-fg uppercase tracking-wider">Ad Copy Snippet</th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {longRunning.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-muted-fg mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          <p className="text-foreground font-medium mb-1">No long-running ads detected</p>
                          <p className="text-sm text-muted-fg max-w-sm text-center">We haven&apos;t found any competitor ads that have run continuously for more than 14 days in this project.</p>
                        </div>
                      </td>
                    </tr>
                  ) : longRunning.map((ad, i) => (
                    <tr key={i} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                            {ad.advertiser_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">{ad.advertiser_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          {ad.duration_days} days
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-muted-fg max-w-lg xl:max-w-2xl line-clamp-2" title={ad.ad_text || ''}>
                          {ad.ad_text || <span className="italic opacity-50">No text</span>}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
