/*
  # Add Overtime Tracking to Timer Logs

  1. Schema Changes
    - Add `overtime_seconds` column to `timer_logs` table
      - Stores the total overtime duration when a timer goes negative
      - NULL for non-overtime actions, positive integer for overtime duration

  2. Indexes
    - Add index on `action` column for faster overtime queries
    - Add index on `overtime_seconds` for reporting queries

  3. Notes
    - This migration is idempotent and safe to run multiple times
    - Existing data is preserved; new column will be NULL for existing records
*/

-- Add overtime_seconds column to timer_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timer_logs' AND column_name = 'overtime_seconds'
  ) THEN
    ALTER TABLE timer_logs ADD COLUMN overtime_seconds integer DEFAULT NULL;
  END IF;
END $$;

-- Add index on action column for faster queries
CREATE INDEX IF NOT EXISTS idx_timer_logs_action ON timer_logs(action);

-- Add index on overtime_seconds for reporting
CREATE INDEX IF NOT EXISTS idx_timer_logs_overtime ON timer_logs(overtime_seconds) WHERE overtime_seconds IS NOT NULL;
