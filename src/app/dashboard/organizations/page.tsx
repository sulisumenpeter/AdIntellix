'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function OrganizationsPage() {
  const supabase = createClient();
  const [organizations, setOrganizations] = useState<Record<string, unknown>[]>([]);
  const [members, setMembers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingOrg, setEditingOrg] = useState<Record<string, unknown> | null>(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: orgsData, error: orgsError } = await supabase.from('organizations').select('*');
      if (orgsError) throw orgsError;
      
      setOrganizations(orgsData || []);
      
      if (orgsData && orgsData.length > 0) {
        // By default load members for the first org
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members')
          .select('*, users(email, full_name)')
          .eq('organization_id', orgsData[0].id);
          
        if (membersError) throw membersError;
        setMembers(membersData || []);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setTimeout(() => {
      loadData();
    }, 0);
  }, []);

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ name: editName })
        .eq('id', editingOrg.id);
        
      if (updateError) throw updateError;
      setEditingOrg(null);
      loadData();
    } catch (err) {
      alert(`Failed to update organization: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Organization Settings</h3>
        <p className="text-muted-fg mt-1 text-sm">Manage your organization details, billing, and team members.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
           <svg className="w-12 h-12 text-muted-fg mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Organizations Found</h3>
          <p className="text-muted-fg mb-4">You need to create or join an organization to access these settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h4 className="text-lg font-semibold text-foreground">Organization Details</h4>
              </div>

              {organizations.map(org => (
                <div key={org.id} className="border border-border rounded-lg p-4 mb-4 bg-background">
                  {editingOrg?.id === org.id ? (
                    <form onSubmit={handleUpdateOrg} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-fg mb-1">Organization Name</label>
                        <input 
                          type="text" 
                          required 
                          className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                        />
                      </div>
                      <div className="flex gap-2 justify-end mt-4">
                        <button type="button" onClick={() => setEditingOrg(null)} className="px-3 py-1.5 border border-border rounded-md text-sm text-foreground hover:bg-surface transition-colors">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-1">Name</p>
                          <p className="text-foreground font-medium">{org.name}</p>
                        </div>
                        <button onClick={() => { setEditingOrg(org); setEditName(org.name); }} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors">Edit</button>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-1">Organization ID</p>
                        <p className="text-foreground text-sm font-mono bg-surface p-1.5 rounded border border-border inline-block">{org.id}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border bg-background flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h4 className="text-lg font-semibold text-foreground">Team Members</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface border-b border-border text-muted-fg text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-6">User</th>
                      <th className="py-3 px-6">Role</th>
                      <th className="py-3 px-6 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-border bg-background">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-muted-fg">No members found.</td>
                      </tr>
                    ) : members.map((m) => (
                      <tr key={m.user_id} className="hover:bg-surface-hover transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                              {m.users?.full_name?.charAt(0) || m.users?.email?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{m.users?.full_name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-fg">{m.users?.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            m.role === 'owner' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            m.role === 'admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                            'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {m.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-muted-fg">
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
