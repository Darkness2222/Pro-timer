/*
  # Fix RLS policies for timer_logs table

  1. Security Updates
    - Add INSERT policy for authenticated users on timer_logs table
    - Add UPDATE policy for authenticated users on timer_logs table
    - Ensure users can only manage timer logs for their own timers

  2. Changes
    - Allow authenticated users to insert timer logs for their own timers
    - Allow authenticated users to update timer logs for their own timers
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert timer logs" ON timer_logs;
DROP POLICY IF EXISTS "Authenticated users can update timer logs" ON timer_logs;

-- Create INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert timer logs"
  ON timer_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  );

-- Create UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update timer logs"
  ON timer_logs
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