# Authorization

- Authentication via Supabase Auth.
- JWT validation on all protected routes.
- Organization membership dictates access.
- Roles: `owner`, `admin`, `member`, `viewer`.
- Every organization-owned resource must be tenant isolated.
- RLS must strictly use `auth.uid()` plus organization membership.
- Do not rely on frontend filtering for authorization.
- Do not rely on hidden UI elements for security.
- Backend authorization is mandatory.
