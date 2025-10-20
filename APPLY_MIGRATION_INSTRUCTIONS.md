# How to Apply the Owner Permissions Fix

## Problem
You're identified as the owner but can't see the "Invite Team Member" button because the database Row Level Security (RLS) policies are too restrictive.

## Solution
A migration file has been created to fix the database policies:
`supabase/migrations/20251020150000_fix_owner_team_management_permissions.sql`

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Navigate to your project directory
cd /path/to/your/project

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration to your database
supabase db push
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file `supabase/migrations/20251020150000_fix_owner_team_management_permissions.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" to execute the migration

### Option 3: Direct Database Access
If you have direct PostgreSQL access:
```bash
psql "your-connection-string" < supabase/migrations/20251020150000_fix_owner_team_management_permissions.sql
```

## What This Migration Does

1. **Fixes SELECT Policy on organization_members**
   - Before: Users could only see their own membership record
   - After: Owners and admins can see ALL members in their organization

2. **Fixes INSERT Policy on organization_members**
   - Ensures owners (with `role='owner'` OR `is_owner=true`) can add new members
   - Fixes circular reference bug in the original policy

3. **Updates organization_invitations Policies**
   - Ensures policies check BOTH `role IN ('owner', 'admin')` AND `is_owner=true`
   - Allows owners to create, view, update, and delete invitations

## After Applying the Migration

1. Refresh your browser/app
2. Open the Team Management modal
3. You should now see the "Invite Team Member" button
4. You'll be able to:
   - Send email invitations
   - Create shareable invite links
   - Manually add existing users
   - View all team members (not just yourself)

## Verification

To verify the fix worked, check the browser console in Team Management modal:
- Look for `[TeamManagement] Render state:` log
- Verify `canManage: true` is shown
- Verify `memberCount` shows all members (not just 1)

## Rollback (if needed)

If you need to rollback this migration for any reason, you can manually drop and recreate the old policies using the SQL from the previous migration file: `20251005161255_fix_organization_members_recursive_policy.sql`
