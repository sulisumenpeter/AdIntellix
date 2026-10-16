'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProjectsPage() {
  const supabase = createClient();
  interface Project {
    id: string;
    name: string;
    description?: string;
    organization_id: string;
    [key: string]: unknown;
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Defer synchronous setState calls to avoid cascading render lint errors
      await Promise.resolve();
      
      let currentOrgId = localStorage.getItem('adintelix_org_id');
      const storedProjId = localStorage.getItem('adintelix_project_id');
      setActiveProjectId(storedProjId);
      
      if (!currentOrgId) {
        // Fallback to fetching first org
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        if (orgs && orgs.length > 0) {
          currentOrgId = orgs[0].id;
          localStorage.setItem('adintelix_org_id', currentOrgId!);
        }
      }
      
      setOrgId(currentOrgId);

      if (!currentOrgId) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      setProjects(data || []);
      
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

  const handleSetProject = (id: string) => {
    localStorage.setItem('adintelix_project_id', id);
    setActiveProjectId(id);
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setIsSaving(true);
    try {
      if (editingProject) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ name: formData.name, description: formData.description })
          .eq('id', editingProject.id)
          .eq('organization_id', orgId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('projects')
          .insert({ name: formData.name, description: formData.description, organization_id: orgId });
        if (insertError) throw insertError;
      }
      setEditingProject(null);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      loadData();
    } catch (err) {
      alert(`Failed to save project: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? All associated data will be lost.')) return;
    try {
      const { error: deleteError } = await supabase.from('projects').delete().eq('id', id).eq('organization_id', orgId);
      if (deleteError) throw deleteError;
      if (activeProjectId === id) {
        localStorage.removeItem('adintelix_project_id');
        setActiveProjectId(null);
      }
      loadData();
    } catch (err) {
      alert(`Failed to delete project: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Projects</h3>
          <p className="text-muted-fg mt-1 text-sm">Manage projects within your organization to organize ad data.</p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setFormData({ name: '', description: '' }); setShowCreateModal(true); }}
          disabled={!orgId}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Project
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {!orgId && !loading && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200">
          You must select or create an organization first.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Projects Found</h3>
          <p className="text-muted-fg mb-4 max-w-sm mx-auto">Create your first project to start tracking competitors and analyzing advertising campaigns.</p>
          <button onClick={() => { setEditingProject(null); setFormData({ name: '', description: '' }); setShowCreateModal(true); }} className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
            + Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const isActive = activeProjectId === project.id;
            return (
              <div key={project.id} className={`border rounded-xl p-5 bg-surface shadow-sm transition-all ${isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-border hover:shadow-md'}`}>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-foreground text-lg truncate pr-2">{project.name}</h4>
                  {isActive && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold border border-indigo-200">Active</span>
                  )}
                </div>
                <p className="text-sm text-muted-fg mb-5 line-clamp-2 h-10">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <button 
                    onClick={() => handleSetProject(project.id)}
                    className={`text-sm font-medium transition-colors ${isActive ? 'text-muted-fg cursor-default' : 'text-indigo-600 hover:text-indigo-800'}`}
                    disabled={isActive}
                  >
                    {isActive ? 'Current Selection' : 'Select Project'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setEditingProject(project); setFormData({ name: project.name, description: project.description || '' }); setShowCreateModal(true); }}
                      className="text-muted-fg hover:text-indigo-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-muted-fg hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-border bg-surface">
              <h3 className="text-lg font-semibold text-foreground">{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
            </div>
            <form onSubmit={handleSaveProject} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-fg mb-1">Project Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                  placeholder="e.g. Q4 Campaigns"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-fg mb-1">Description (Optional)</label>
                <textarea 
                  className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                  rows={3}
                  placeholder="Project details..."
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
