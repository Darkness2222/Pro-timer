/*
  # Add timer_type column to timers table

  1. Schema Changes
    - Add `timer_type` column to `timers` table
    - Set default value to 'single' for existing timers
    - Column allows values like 'single', 'event', etc.

  2. Data Migration
    - All existing timers will default to 'single' type
    - New timers can specify their type during creation

  3. Notes
    - This column helps distinguish between individual timers and event-based timers
    - Default value ensures backward compatibility
*/

-- Add timer_type column to timers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timers' AND column_name = 'timer_type'
  ) THEN
    ALTER TABLE timers ADD COLUMN timer_type text DEFAULT 'single' NOT NULL;
  END IF;
END $$;