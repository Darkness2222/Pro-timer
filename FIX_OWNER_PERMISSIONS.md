# Fix Owner Permissions - Quick Guide

## Option 1: Use Built-In Diagnostic Tool (RECOMMENDED)

1. **Open Team Management Modal** - Click "Invite Team" button in your app
2. **Click "Run Diagnosis"** - This button is visible in the troubleshooting section
3. **Review Results** - The tool will identify any permission issues
4. **Click "Fix Automatically"** - If issues are found, this will correct them
5. **Close and Reopen** - Close the Team Management modal and reopen it to see changes

## Option 2: Manual Database Fix via Supabase Dashboard

If the diagnostic tool doesn't work, you can manually fix the database:

### Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `rjitcfqsjjsptbchvmxj`
3. Click "SQL Editor" in the left sidebar

### Step 2: Check Your Current Status

Run this query to see your current user information:

```sql
-- Find your user ID and current role
SELECT
  au.id as user_id,
  au.email,
  om.id as member_id,
  om.organization_id,
  om.role,
  om.is_owner,
  om.counted_in_limit,
  o.name as org_name,
  o.owner_id as org_owner_id
FROM auth.users au
LEFT JOIN organization_members om ON om.user_id = au.id
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- Replace with your actual email
```

### Step 3: Fix Owner Permissions

Based on the results, run ONE of these queries:

**Scenario A: You have an organization but not marked as owner**

```sql
-- Replace YOUR_USER_ID and YOUR_ORG_ID with values from Step 2
BEGIN;

-- Update your membership to owner role
UPDATE organization_members
SET
  role = 'owner',
  is_owner = true,
  counted_in_limit = false
WHERE user_id = 'YOUR_USER_ID'
  AND organization_id = 'YOUR_ORG_ID';

-- Update organization owner_id
UPDATE organizations
SET owner_id = 'YOUR_USER_ID'
WHERE id = 'YOUR_ORG_ID';

COMMIT;
```

**Scenario B: You don't have any organization at all**

```sql
-- Replace YOUR_USER_ID and YOUR_EMAIL with your actual values
DO $$
DECLARE
  new_org_id uuid;
  user_id_var uuid := 'YOUR_USER_ID';
  user_email_var text := 'YOUR_EMAIL';
BEGIN
  -- Create new organization
  INSERT INTO organizations (name, owner_id, counted_user_count)
  VALUES (user_email_var, user_id_var, 0)
  RETURNING id INTO new_org_id;

  -- Create owner membership
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_owner,
    counted_in_limit
  )
  VALUES (new_org_id, user_id_var, 'owner', true, false);

  RAISE NOTICE 'Created organization with ID: %', new_org_id;
END $$;
```

### Step 4: Verify the Fix

```sql
-- Check your permissions are now correct
SELECT
  au.email,
  om.role,
  om.is_owner,
  om.counted_in_limit,
  o.name as org_name,
  CASE
    WHEN om.role IN ('owner', 'admin') THEN 'CAN INVITE'
    ELSE 'CANNOT INVITE'
  END as invite_permission
FROM auth.users au
JOIN organization_members om ON om.user_id = au.id
JOIN organizations o ON o.id = om.organization_id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- Replace with your actual email
```

You should see:
- `role`: owner
- `is_owner`: true
- `counted_in_limit`: false
- `invite_permission`: CAN INVITE

## Option 3: Contact Support

If both options above fail, there may be a deeper issue with your database setup. Check the browser console for errors when using the diagnostic tool.

## After Fixing

Once the fix is applied:

1. **Refresh the page** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Open Team Management** - Click "Invite Team" button
3. **Verify "Invite Team Member" button is visible** - This confirms owner permissions
4. **Test inviting a user** - Try sending an invitation to ensure full functionality

## Understanding the Role System

- **Owner**: Full control, not counted in user limits, cannot be removed
- **Admin**: Can manage team and events, counted in user limits
- **Presenter**: Can only present at events, counted in user limits

Only Owners and Admins can invite new team members.
