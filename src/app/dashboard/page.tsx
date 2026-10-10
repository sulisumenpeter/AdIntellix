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

  if (orgId) {
    orgName = orgs[0].name

    const { data: projects } = await supabase
      .from('projects')
      .select('name')
      .eq('organization_id', orgId)

    if (projects) {
      projectsCount = projects.length
      if (projects.length > 0) {
        firstProjectName = projects[0].name
      }
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold">Overview - {orgName}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm" data-testid="active-projects">
          <div className="text-sm text-gray-500 mb-1">Active Projects ({firstProjectName})</div>
          <div className="text-3xl font-bold">{projectsCount}</div>
        </div>
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Ads Tracked</div>
          <div className="text-3xl font-bold">0</div>
        </div>
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500 mb-1">AI Analyses</div>
          <div className="text-3xl font-bold">0</div>
        </div>
      </div>
    </div>
  );
}
