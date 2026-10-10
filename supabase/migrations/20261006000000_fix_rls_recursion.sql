-- Fix infinite recursion in organization_members RLS
DROP POLICY IF EXISTS "Users can view members of their orgs" ON public.organization_members;

-- Allow users to view their own membership (which is sufficient for dashboard)
CREATE POLICY "Users can view their own membership" 
ON public.organization_members FOR SELECT 
USING (user_id = auth.uid());

-- Allow users to view organizations where they are a member
DROP POLICY IF EXISTS "Users can view their orgs" ON public.organizations;
CREATE POLICY "Users can view their orgs" 
ON public.organizations FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);
