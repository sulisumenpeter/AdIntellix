'use client';

import { useState, useEffect } from 'react';

interface InputFieldProps {
  name?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField = ({ placeholder, value, onChange }: InputFieldProps) => (
  <div>
    <label className="block text-xs font-medium text-muted-fg mb-1">{placeholder}</label>
    <input 
      required 
      placeholder={placeholder} 
      className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
      value={value} 
      onChange={onChange} 
    />
  </div>
);

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Creative Brief Scorer</h3>
        <p className="text-muted-fg mt-1 text-sm">Evaluate and score your ad concepts against AI-detected competitor benchmarks.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h4 className="text-lg font-semibold text-foreground">Submit New Brief</h4>
          </div>
          <form onSubmit={submitBrief} className="space-y-4">
            <InputField placeholder="Concept Name" value={formData.concept} onChange={(e) => setFormData({...formData, concept: e.target.value})} />
            <InputField placeholder="Hook" value={formData.hook} onChange={(e) => setFormData({...formData, hook: e.target.value})} />
            <InputField placeholder="Offer" value={formData.offer} onChange={(e) => setFormData({...formData, offer: e.target.value})} />
            <InputField placeholder="Call to Action (CTA)" value={formData.cta} onChange={(e) => setFormData({...formData, cta: e.target.value})} />
            <InputField placeholder="Messaging Theme" value={formData.messagingTheme} onChange={(e) => setFormData({...formData, messagingTheme: e.target.value})} />
            <InputField placeholder="Format (e.g. Video, Image)" value={formData.format} onChange={(e) => setFormData({...formData, format: e.target.value})} />
            <InputField placeholder="Target Audience" value={formData.targetAudience} onChange={(e) => setFormData({...formData, targetAudience: e.target.value})} />
            <InputField placeholder="Destination Intent" value={formData.destinationIntent} onChange={(e) => setFormData({...formData, destinationIntent: e.target.value})} />
            
            <button disabled={loading} type="submit" className="w-full mt-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 font-medium hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Scoring...</>
              ) : 'Score Brief'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-lg font-semibold text-foreground mb-4">Scoring History</h4>
          {fetching ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : briefs.length === 0 ? (
            <div className="bg-surface p-8 rounded-xl border border-border shadow-sm text-center">
              <svg className="w-12 h-12 text-muted-fg mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-foreground font-medium mb-1">No briefs scored yet</p>
              <p className="text-sm text-muted-fg max-w-sm mx-auto">Submit a creative brief using the form to generate AI-powered scoring and recommendations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {briefs.map(brief => (
                <div key={brief.id} className="p-6 rounded-xl border border-border bg-surface shadow-sm hover:shadow transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{brief.concept}</h3>
                      <p className="text-xs text-muted-fg mt-0.5">Format: {brief.format}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${brief.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                      {brief.status === 'completed' ? (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Scored</>
                      ) : (
                        <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing</>
                      )}
                    </span>
                  </div>
                  {brief.status === 'completed' && (
                    <div className="mt-5 space-y-5">
                      <div className="flex items-center p-4 bg-background rounded-lg border border-border">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-muted-fg">Overall Score</div>
                          <div className="text-3xl font-bold text-indigo-600 mt-1">{brief.overall_score}<span className="text-lg text-muted-fg font-normal">/100</span></div>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-indigo-600">{brief.overall_score}</span>
                        </div>
                      </div>
                      <div className="space-y-4 text-sm">
                        {brief.strengths?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-green-700 mb-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                              Strengths
                            </div>
                            <ul className="list-disc pl-5 text-muted-fg space-y-0.5">
                              {brief.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        {brief.weaknesses?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-red-700 mb-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                              Weaknesses
                            </div>
                            <ul className="list-disc pl-5 text-muted-fg space-y-0.5">
                              {brief.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                            </ul>
                          </div>
                        )}
                        {brief.recommendations?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-indigo-700 mb-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              Recommendations
                            </div>
                            <ul className="list-disc pl-5 text-muted-fg space-y-0.5">
                              {brief.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
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
