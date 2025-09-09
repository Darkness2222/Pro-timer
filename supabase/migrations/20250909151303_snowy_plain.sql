/*
  # Add timer status tracking

  1. New Enum Type
    - `timer_status` enum with values: 'active', 'finished_early', 'completed', 'archived'

  2. Table Changes
    - Add `status` column to `timers` table with default 'active'
    - Add index on status column for efficient filtering

  3. Security
    - No RLS changes needed as existing policies will apply
*/

-- Create enum type for timer status
DO $$ BEGIN
  CREATE TYPE timer_status AS ENUM ('active', 'finished_early', 'completed', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column to timers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timers' AND column_name = 'status'
  ) THEN
    ALTER TABLE timers ADD COLUMN status timer_status DEFAULT 'active';
  END IF;
END $$;

-- Add index for efficient filtering by status
CREATE INDEX IF NOT EXISTS idx_timers_status ON timers(status);

-- Update existing timers to have 'active' status if null
UPDATE timers SET status = 'active' WHERE status IS NULL;