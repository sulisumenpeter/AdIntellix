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

  const renderPatternCard = (title: string, type: string) => {
    const items = getPatternsByType(type);
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium mb-4">{title}</h4>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No patterns detected yet.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item, i) => (
              <li key={i} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-gray-900 break-words">{item.pattern_value}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    {item.occurrence_count} ads
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Observed: {new Date(item.first_observed).toLocaleDateString()} - {new Date(item.last_observed).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">Ad Pattern Intelligence</h3>
        <select 
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading patterns...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderPatternCard('Recurring Hooks', 'hook')}
            {renderPatternCard('Recurring Offers', 'offer')}
            {renderPatternCard('Recurring CTAs', 'cta')}
            {renderPatternCard('Messaging Themes', 'messaging_theme')}
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 mt-6">
            <h4 className="text-lg font-medium mb-4">Long-Running Ads (&gt;14 Days)</h4>
            {longRunning.length === 0 ? (
              <p className="text-gray-500 text-sm">No long-running ads detected.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advertiser</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Copy Snippet</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {longRunning.map((ad, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ad.advertiser_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ad.duration_days} days</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{ad.ad_text || 'No text'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
