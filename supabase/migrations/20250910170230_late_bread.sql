/*
  # Fix timer_sessions RLS policies

  1. Security Updates
    - Drop existing problematic policies on timer_sessions table
    - Add correct INSERT policy for authenticated users
    - Add correct UPDATE policy for authenticated users
    - Ensure policies properly check timer ownership through timers.user_id

  2. Policy Logic
    - Users can only manage timer sessions for timers they own
    - Policies check that timer_id belongs to a timer with matching user_id
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Authenticated users can insert timer sessions" ON timer_sessions;
DROP POLICY IF EXISTS "Authenticated users can update timer sessions" ON timer_sessions;

-- Create correct INSERT policy for timer_sessions
CREATE POLICY "Users can insert timer sessions for their timers"
  ON timer_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  );

-- Create correct UPDATE policy for timer_sessions  
CREATE POLICY "Users can update timer sessions for their timers"
  ON timer_sessions
  FOR UPDATE
  TO authenticated
  USING (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  );

-- Create SELECT policy for timer_sessions
CREATE POLICY "Users can select timer sessions for their timers"
  ON timer_sessions
  FOR SELECT
  TO authenticated
  USING (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  );