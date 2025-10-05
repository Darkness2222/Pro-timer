/*
  # Fix infinite recursion in organization_members policies

  1. Changes
    - Drop the existing SELECT policy that causes infinite recursion
    - Create a simple SELECT policy that allows users to view their own memberships
    - This prevents the circular reference that was causing the error

  2. Security
    - Users can only see organization_members records where they are the user
    - This is sufficient for loading the user's organization in the Create Event modal
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;

-- Create a simple, non-recursive policy
CREATE POLICY "Users can view their own memberships"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());