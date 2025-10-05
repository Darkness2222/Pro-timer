/*
  # Add buffer_duration field to timers table

  1. Schema Changes
    - Add `buffer_duration` column to `timers` table
    - Set default value to 120 (2 minutes in seconds) for event timers
    - Column stores the buffer time between presenters in seconds

  2. Purpose
    - Stores the configurable buffer time between sequential presenters in event timers
    - Allows each event to have its own buffer duration setting
    - Used when transitioning between presenters in an event

  3. Notes
    - Buffer duration is configured during event timer creation
    - Only applies to event-type timers (timer_type = 'event')
    - Single timers will have buffer_duration = 0 or null
*/

-- Add buffer_duration column to timers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timers' AND column_name = 'buffer_duration'
  ) THEN
    ALTER TABLE timers ADD COLUMN buffer_duration integer DEFAULT 0;
  END IF;
END $$;