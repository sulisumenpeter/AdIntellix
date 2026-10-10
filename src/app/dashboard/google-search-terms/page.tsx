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
  
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [devToken, setDevToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [customerId, setCustomerId] = useState('');

  const [importing, setImporting] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  const fetchConnections = async (orgId: string, pId: string) => {
    try {
      const res = await fetch(`/api/google-ads/connections?organizationId=${orgId}&projectId=${pId}`);
      const { data } = await res.json();
      if (data) setConnections(data);
    } catch (e) {
      console.error(e);
    }
  };

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
    }, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConnections(orgId, pId);
     
    fetchSearchTerms(orgId, pId, filterClass);
  }, [filterClass]);

  const handleConnect = async () => {
    try {
      const res = await fetch(`/api/google-ads/oauth/authorize?organizationId=${organizationId}&projectId=${projectId}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Error: ${data.error || 'Failed to start auth'}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImport = async () => {
    if (!selectedConnection) return alert('Select a connection first');
    setImporting(true);
    try {
      const res = await fetch('/api/google-ads/search-terms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': `import-${Date.now()}`
        },
        body: JSON.stringify({
          organizationId,
          projectId,
          connectionId: selectedConnection
        })
      });
      if (res.ok) {
        alert('Import queued. Refresh the page in a moment to see results.');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    }
    setImporting(false);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Google Ads Search Terms</h1>
        <div className="flex gap-2">
            <button onClick={handleConnect} className="px-4 py-2 border rounded hover:bg-gray-50">
              Connect Google Ads
            </button>
            <button onClick={() => fetchSearchTerms(organizationId, projectId, filterClass)} className="px-4 py-2 border rounded hover:bg-gray-50">
              Refresh
            </button>
        </div>
      </div>

      {connections.length > 0 && (
        <div className="bg-white p-6 border rounded shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Select Connection to Import From</label>
                <select value={selectedConnection} onChange={e => setSelectedConnection(e.target.value)} className="w-full border p-2 rounded">
                    <option value="">-- Select Connection --</option>
                    {connections.map(c => (
                        <option key={c.id} value={c.id}>{c.customer_id}</option>
                    ))}
                </select>
            </div>
            <button 
              onClick={handleImport} 
              disabled={importing || !selectedConnection} 
              className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import Search Terms'}
            </button>
        </div>
      )}

      <div className="mb-4">
          <label className="mr-2 font-medium text-sm">Filter by Classification:</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="border p-1 rounded">
              <option value="all">All</option>
              <option value="high intent">High Intent</option>
              <option value="informational">Informational</option>
              <option value="irrelevant">Irrelevant</option>
              <option value="competitor">Competitor</option>
              <option value="research">Research</option>
              <option value="low intent">Low Intent</option>
              <option value="other">Other</option>
          </select>
      </div>

      {fetching ? <p>Loading search terms...</p> : (
        <div className="bg-white border rounded shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="bg-gray-50 border-b">
                      <th className="p-4 font-semibold text-sm">Search Term</th>
                      <th className="p-4 font-semibold text-sm">Classification</th>
                      <th className="p-4 font-semibold text-sm text-right">Clicks / Cost</th>
                      <th className="p-4 font-semibold text-sm text-right">Conv / Value</th>
                      <th className="p-4 font-semibold text-sm">Waste?</th>
                      <th className="p-4 font-semibold text-sm">Negative Keyword?</th>
                  </tr>
              </thead>
              <tbody>
                  {searchTerms.map(term => (
                      <tr key={term.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-4 text-sm font-medium">
                              {term.search_term}
                              <div className="text-xs text-gray-500 font-normal mt-1">{term.campaign} - {term.ad_group}</div>
                          </td>
                          <td className="p-4 text-sm">
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">{term.classification}</span>
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1" title={term.explanation}>{term.explanation}</div>
                          </td>
                          <td className="p-4 text-sm text-right">
                              <div>{term.clicks}</div>
                              <div className="text-gray-500">${term.cost}</div>
                          </td>
                          <td className="p-4 text-sm text-right">
                              <div>{term.conversions}</div>
                              <div className="text-gray-500">${term.conversion_value}</div>
                          </td>
                          <td className="p-4 text-sm">
                              {term.waste_indicator ? <span className="text-red-600 font-bold">Yes</span> : 'No'}
                          </td>
                          <td className="p-4 text-sm text-gray-700">
                              {term.suggested_negative_keyword || '-'}
                          </td>
                      </tr>
                  ))}
                  {searchTerms.length === 0 && (
                      <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                              No search terms found.
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
