/*
  # Fix timer_messages RLS policies

  1. Security
    - Add RLS policies for authenticated users on timer_messages table
    - Allow INSERT, UPDATE, SELECT, and DELETE for users who own the associated timer
    - Maintain existing anon access for testing
*/

-- Add INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert timer messages"
  ON timer_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  );

-- Add UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update timer messages"
  ON timer_messages
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

-- Add SELECT policy for authenticated users
CREATE POLICY "Authenticated users can select timer messages"
  ON timer_messages
  FOR SELECT
  TO authenticated
  USING (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  );

-- Add DELETE policy for authenticated users
CREATE POLICY "Authenticated users can delete timer messages"
  ON timer_messages
  FOR DELETE
  TO authenticated
  USING (
    timer_id IN (
      SELECT id FROM timers WHERE user_id = auth.uid()
    )
  );