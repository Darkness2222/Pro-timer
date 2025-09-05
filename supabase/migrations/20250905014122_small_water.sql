/*
  # Create timer logs table

  1. New Tables
    - `timer_logs`
      - `id` (uuid, primary key)
      - `timer_id` (uuid, foreign key to timers)
      - `action` (text) - start, pause, stop, reset, adjust, complete
      - `time_value` (integer) - time when action occurred
      - `duration_change` (integer) - for adjust actions
      - `notes` (text) - optional notes
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `timer_logs` table
    - Add policy for anonymous users to access all logs
*/

CREATE TABLE IF NOT EXISTS timer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timer_id uuid REFERENCES timers(id) ON DELETE CASCADE,
  action text NOT NULL,
  time_value integer DEFAULT 0,
  duration_change integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for anon users"
  ON timer_logs
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_timer_logs_timer_id ON timer_logs(timer_id);
CREATE INDEX IF NOT EXISTS idx_timer_logs_created_at ON timer_logs(created_at DESC);