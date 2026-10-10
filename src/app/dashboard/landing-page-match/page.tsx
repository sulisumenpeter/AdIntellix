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
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Ad-to-Landing-Page Match</h1>
        <button onClick={() => fetchMatches(organizationId, projectId)} className="px-4 py-2 border rounded hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="bg-white p-6 border rounded shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Analyze New Match</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Advertisement ID" 
            value={adId} 
            onChange={e => setAdId(e.target.value)} 
            className="border p-2 rounded flex-1"
          />
          <input 
            type="url" 
            placeholder="Destination URL (Landing Page)" 
            value={destUrl} 
            onChange={e => setDestUrl(e.target.value)} 
            className="border p-2 rounded flex-1"
          />
          <button 
            onClick={handleAnalyze} 
            disabled={analyzing} 
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {analyzing ? 'Queuing...' : 'Analyze'}
          </button>
        </div>
      </div>
      
      {fetching ? <p>Loading matches...</p> : (
        <div className="grid gap-6">
          {matches.map(match => (
            <div key={match.id} className="p-6 border rounded bg-white shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg line-clamp-1">{match.advertisements?.advertiser_name}</h3>
                  <span className="text-xs text-gray-500">{new Date(match.crawled_at).toLocaleString()}</span>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Destination:</p>
                  <a href={match.destination_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 truncate block">
                    {match.destination_url}
                  </a>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>Ad Text:</strong> {match.advertisements?.ad_text}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold mb-2">Mismatches:</p>
                  <ul className="list-disc pl-4 text-sm text-gray-700 mb-4">
                    {match.mismatches?.map((m: string, i: number) => <li key={i}>{m}</li>)}
                  </ul>
                  <p className="text-sm font-semibold mb-2">Evidence:</p>
                  <p className="text-sm text-gray-700 mb-4">{match.supporting_evidence}</p>
                  <p className="text-sm font-semibold mb-2">Recommendations:</p>
                  <ul className="list-disc pl-4 text-sm text-gray-700">
                    {match.recommendations?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
              <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded">
                <div className="mb-4">
                  <span className="text-sm text-gray-500 block">Overall Match Score</span>
                  <span className="text-3xl font-bold">{match.overall_score}/100</span>
                </div>
                <div className="space-y-3 mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hook Alignment</span>
                    <span className="font-medium">{match.hook_alignment}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Offer Alignment</span>
                    <span className="font-medium">{match.offer_alignment}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CTA Alignment</span>
                    <span className="font-medium">{match.cta_alignment}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Messaging Alignment</span>
                    <span className="font-medium">{match.messaging_alignment}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {matches.length === 0 && (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded">
              No landing page matches analyzed yet. Use the form above to start one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
