/*
  # Fix RLS policies for timer_sessions table

  1. Security Updates
    - Add INSERT policy for authenticated users on timer_sessions table
    - Add UPDATE policy for authenticated users on timer_sessions table
    - Ensure users can only manage timer sessions for their own timers

  2. Changes
    - Allow authenticated users to insert timer sessions for their own timers
    - Allow authenticated users to update timer sessions for their own timers
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert timer sessions" ON timer_sessions;
DROP POLICY IF EXISTS "Authenticated users can update timer sessions" ON timer_sessions;

-- Create INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert timer sessions"
  ON timer_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  );

-- Create UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update timer sessions"
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