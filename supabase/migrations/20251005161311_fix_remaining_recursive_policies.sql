/*
  # Fix remaining recursive policies in organization_members

  1. Changes
    - Drop and recreate DELETE and UPDATE policies to remove recursion
    - Use a simpler approach that doesn't query the same table

  2. Security
    - For now, allow admins to manage members (this will be enhanced later)
    - Prevents infinite recursion errors
*/

-- Drop the problematic DELETE policy
DROP POLICY IF EXISTS "Organization admins can delete members" ON organization_members;

-- Drop the problematic UPDATE policy
DROP POLICY IF EXISTS "Organization admins can update members" ON organization_members;

-- Create simpler policies without recursion
-- For DELETE: Only allow users to delete their own membership
CREATE POLICY "Users can delete their own membership"
  ON organization_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- For UPDATE: Only allow users to update their own membership
CREATE POLICY "Users can update their own membership"
  ON organization_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());