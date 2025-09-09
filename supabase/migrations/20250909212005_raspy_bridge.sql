/*
  # Fix timers table RLS policy for authenticated users

  1. Security Changes
    - Add policy for authenticated users to manage their own timers
    - Keep existing anon policy for testing/bypass functionality
    - Ensure authenticated users can only access their own timers

  2. Policy Details
    - Authenticated users can INSERT, SELECT, UPDATE, DELETE their own timers
    - Anonymous users retain full access (for testing bypass)
*/

-- Add policy for authenticated users to manage their own timers
CREATE POLICY "Authenticated users can manage their own timers"
  ON timers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);