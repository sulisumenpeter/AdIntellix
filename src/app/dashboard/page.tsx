import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function DashboardOverview() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get user's orgs directly
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')

  const orgId = orgs?.[0]?.id

  let orgName = 'No Organization'
  let projectsCount = 0
  let firstProjectName = 'None'

  let projectId: string | undefined = undefined;

  if (orgId) {
    orgName = orgs[0].name

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', orgId)

    if (projects) {
      projectsCount = projects.length
      if (projects.length > 0) {
        firstProjectName = projects[0].name
        projectId = projects[0].id
      }
    }
  }

  let adsCount = 0;
  let patternsCount = 0;
  let briefsCount = 0;
  let fatigueCount = 0;
  let lpMatchesCount = 0;
  let leadsCount = 0;
  let reportsCount = 0;

  if (projectId) {
    // We use safe Promise.allSettled to avoid failing the whole page if a table doesn't exist yet
    const queries = await Promise.allSettled([
      supabase.from('competitor_ads').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('ad_patterns').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('creative_briefs').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('ad_fatigue').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('landing_page_matches').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('icp_leads').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
    ]);

    adsCount = queries[0].status === 'fulfilled' ? (queries[0].value.count || 0) : 0;
    patternsCount = queries[1].status === 'fulfilled' ? (queries[1].value.count || 0) : 0;
    briefsCount = queries[2].status === 'fulfilled' ? (queries[2].value.count || 0) : 0;
    fatigueCount = queries[3].status === 'fulfilled' ? (queries[3].value.count || 0) : 0;
    lpMatchesCount = queries[4].status === 'fulfilled' ? (queries[4].value.count || 0) : 0;
    leadsCount = queries[5].status === 'fulfilled' ? (queries[5].value.count || 0) : 0;
    reportsCount = queries[6].status === 'fulfilled' ? (queries[6].value.count || 0) : 0;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Overview</h3>
        <p className="text-muted-fg mt-1">
          {orgName} {projectsCount > 0 ? `• Project: ${firstProjectName}` : ''}
        </p>
      </div>

      {!projectId ? (
        <div className="p-12 text-center bg-surface border border-border rounded-xl shadow-sm">
          <div className="w-16 h-16 mx-auto bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">No Projects Found</h4>
          <p className="text-muted-fg mb-6 max-w-md mx-auto">Get started by creating a project to begin tracking competitor ads and generating insights.</p>
          <a href="/dashboard/projects" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Create Project
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Competitor Ads" 
              value={adsCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />} 
            />
            <MetricCard 
              title="Ad Patterns" 
              value={patternsCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />} 
            />
            <MetricCard 
              title="Creative Briefs" 
              value={briefsCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />} 
            />
            <MetricCard 
              title="Fatigue Alerts" 
              value={fatigueCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />} 
              isAlert={fatigueCount > 0}
            />
            <MetricCard 
              title="Landing Page Matches" 
              value={lpMatchesCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />} 
            />
            <MetricCard 
              title="ICP Leads" 
              value={leadsCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />} 
            />
            <MetricCard 
              title="Generated Reports" 
              value={reportsCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />} 
            />
          </div>

          <div className="mt-8">
            <h4 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h4>
            <div className="bg-surface border border-border rounded-xl shadow-sm p-8 text-center">
               <div className="w-12 h-12 mx-auto bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-3">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <p className="text-muted-fg font-medium">Activity feed will populate as data is collected.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, isAlert = false }: { title: string, value: number, icon: React.ReactNode, isAlert?: boolean }) {
  return (
    <div className="p-6 bg-surface border border-border rounded-xl shadow-sm flex flex-col relative overflow-hidden transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isAlert ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
          </svg>
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-foreground mb-1">{value.toLocaleString()}</div>
        <div className="text-sm font-medium text-muted-fg">{title}</div>
      </div>
    </div>
  );
}
