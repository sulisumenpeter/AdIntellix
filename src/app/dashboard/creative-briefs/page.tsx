'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CreativeBriefsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [briefs, setBriefs] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [formData, setFormData] = useState({
    concept: '', hook: '', offer: '', cta: '', messagingTheme: '', format: '', targetAudience: '', destinationIntent: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchBriefs = async (orgId: string) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/creative-briefs?organizationId=${orgId}`);
      const { data } = await res.json();
      if (data) setBriefs(data);
    } catch (e) {
      console.error(e);
    }
    setFetching(false);
  };

  useEffect(() => {
    const orgId = localStorage.getItem('adintelix_org_id') || '00000000-0000-0000-0000-000000000000';
    const projId = localStorage.getItem('adintelix_project_id') || '00000000-0000-0000-0000-000000000000';
    
    setTimeout(() => {
      setOrganizationId(orgId);
      setProjectId(projId);
    }, 0);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBriefs(orgId);
   
  }, []);
  const submitBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/creative-briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          projectId,
          ...formData
        })
      });
      setFormData({ concept: '', hook: '', offer: '', cta: '', messagingTheme: '', format: '', targetAudience: '', destinationIntent: '' });
      fetchBriefs(organizationId);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Creative Brief Scorer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Submit New Brief</h2>
          <form onSubmit={submitBrief} className="space-y-4">
            <input required placeholder="Concept" className="w-full p-2 border rounded" value={formData.concept} onChange={e => setFormData({...formData, concept: e.target.value})} />
            <input required placeholder="Hook" className="w-full p-2 border rounded" value={formData.hook} onChange={e => setFormData({...formData, hook: e.target.value})} />
            <input required placeholder="Offer" className="w-full p-2 border rounded" value={formData.offer} onChange={e => setFormData({...formData, offer: e.target.value})} />
            <input required placeholder="CTA" className="w-full p-2 border rounded" value={formData.cta} onChange={e => setFormData({...formData, cta: e.target.value})} />
            <input required placeholder="Messaging Theme" className="w-full p-2 border rounded" value={formData.messagingTheme} onChange={e => setFormData({...formData, messagingTheme: e.target.value})} />
            <input required placeholder="Format" className="w-full p-2 border rounded" value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})} />
            <input required placeholder="Target Audience" className="w-full p-2 border rounded" value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} />
            <input required placeholder="Destination Intent" className="w-full p-2 border rounded" value={formData.destinationIntent} onChange={e => setFormData({...formData, destinationIntent: e.target.value})} />
            <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {loading ? 'Submitting...' : 'Score Brief'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Scoring History</h2>
          {fetching ? <p>Loading...</p> : (
            <div className="space-y-4">
              {briefs.map(brief => (
                <div key={brief.id} className="p-4 border rounded bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{brief.concept}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${brief.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {brief.status}
                    </span>
                  </div>
                  {brief.status === 'completed' && (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-500">Overall Score</div>
                          <div className="text-2xl font-bold text-blue-600">{brief.overall_score}/100</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Strengths:</strong> {brief.strengths?.join(', ')}</p>
                        <p><strong>Weaknesses:</strong> {brief.weaknesses?.join(', ')}</p>
                        <p><strong>Recommendations:</strong> {brief.recommendations?.join(', ')}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
