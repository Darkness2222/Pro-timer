/*
  # Fix Owner Team Management Permissions

  ## Problem
  The current RLS policy on organization_members only allows users to see their OWN
  membership record (USING user_id = auth.uid()). This prevents owners and admins
  from viewing ALL team members in the Team Management modal, which causes the
  "Invite Team Member" button to not appear.

  ## Solution
  1. Drop the restrictive SELECT policy that only shows own membership
  2. Create a comprehensive SELECT policy that allows:
     - Users to see their own membership record
     - Owners and admins to see ALL members in their organization

  3. Fix INSERT policy to properly reference the table being inserted into
  4. Ensure all policies check for BOTH role='owner' OR is_owner=true

  ## Tables Modified
  - organization_members: Updated SELECT and INSERT policies

  ## Security
  - Users can always see their own membership
  - Owners (role='owner' OR is_owner=true) can see all members in their org
  - Admins (role='admin') can see all members in their org
  - Owners and admins can insert new members

  ## Impact
  After this migration, the Team Management modal will properly display the
  "Invite Team Member" button for owners and admins.
*/

-- Drop existing SELECT policy that's too restrictive
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;

-- Create comprehensive SELECT policy
-- This policy allows:
-- 1. Users to always see their own membership record
-- 2. Owners and admins to see ALL members in their organization
CREATE POLICY "Users can view organization members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    -- Users can always see their own membership
    user_id = auth.uid()
    OR
    -- Owners and admins can see all members in their organization
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.role IN ('owner', 'admin') OR om.is_owner = true)
    )
  );

-- Drop and recreate INSERT policy with proper table reference
DROP POLICY IF EXISTS "Organization owners and admins can insert members" ON organization_members;

CREATE POLICY "Organization owners and admins can insert members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.role IN ('owner', 'admin') OR om.is_owner = true)
    )
  );

-- Ensure UPDATE and DELETE policies also check for owner properly
DROP POLICY IF EXISTS "Organization owners and admins can update members" ON organization_members;

CREATE POLICY "Organization owners and admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.role IN ('owner', 'admin') OR om.is_owner = true)
    )
    AND (
      -- Cannot modify owner records unless you are the owner
      organization_members.is_owner = false
      OR EXISTS (
        SELECT 1 FROM organization_members om2
        WHERE om2.organization_id = organization_members.organization_id
        AND om2.user_id = auth.uid()
        AND om2.is_owner = true
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.role IN ('owner', 'admin') OR om.is_owner = true)
    )
    AND (
      -- Cannot modify owner records unless you are the owner
      organization_members.is_owner = false
      OR EXISTS (
        SELECT 1 FROM organization_members om2
        WHERE om2.organization_id = organization_members.organization_id
        AND om2.user_id = auth.uid()
        AND om2.is_owner = true
      )
    )
  );

DROP POLICY IF EXISTS "Organization owners and admins can delete members" ON organization_members;

CREATE POLICY "Organization owners and admins can delete members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.role IN ('owner', 'admin') OR om.is_owner = true)
    )
    -- Cannot delete owner records
    AND organization_members.is_owner = false
  );

-- Fix organization_invitations policies to also check is_owner
DROP POLICY IF EXISTS "Organization owners and admins can view invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Organization owners and admins can create invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Organization owners and admins can update invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Organization owners and admins can delete invitations" ON organization_invitations;

CREATE POLICY "Organization owners and admins can view invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND (organization_members.role IN ('owner', 'admin') OR organization_members.is_owner = true)
    )
  );

CREATE POLICY "Organization owners and admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND (organization_members.role IN ('owner', 'admin') OR organization_members.is_owner = true)
    )
  );

CREATE POLICY "Organization owners and admins can update invitations"
  ON organization_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND (organization_members.role IN ('owner', 'admin') OR organization_members.is_owner = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND (organization_members.role IN ('owner', 'admin') OR organization_members.is_owner = true)
    )
  );

CREATE POLICY "Organization owners and admins can delete invitations"
  ON organization_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND (organization_members.role IN ('owner', 'admin') OR organization_members.is_owner = true)
    )
  );
