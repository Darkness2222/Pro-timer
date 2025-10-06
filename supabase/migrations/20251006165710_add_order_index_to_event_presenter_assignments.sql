/*
  # Add order_index to event_presenter_assignments table

  ## Overview
  This migration adds the order_index column to track the sequence of presenters in an event.

  ## Changes Made

  1. Schema Changes
    - Add `order_index` column to `event_presenter_assignments` table
    - Type: integer, NOT NULL, default 0
    - Used to determine the order of presenters in an event sequence

  2. Data Migration
    - Update existing records to set order_index based on created_at timestamp
    - Earlier records get lower order_index values

  3. Purpose
    - Enables proper sequencing of presenters in multi-presenter events
    - Allows "Next Presenter" feature to work correctly
    - Supports buffer timer transitions between presenters

  ## Important Notes
  - Existing event assignments will be ordered by their created_at timestamp
  - New assignments should explicitly set order_index when created
  - Order_index is used in PresenterView to determine next presenter
*/

-- Add order_index column to event_presenter_assignments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_presenter_assignments' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE event_presenter_assignments ADD COLUMN order_index integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Update existing records to set order_index based on created_at timestamp
-- This ensures existing data has proper ordering
DO $$
DECLARE
  rec RECORD;
  idx integer;
BEGIN
  FOR rec IN (SELECT DISTINCT event_id FROM event_presenter_assignments ORDER BY event_id)
  LOOP
    idx := 0;
    FOR rec IN (
      SELECT id 
      FROM event_presenter_assignments 
      WHERE event_id = rec.event_id 
      ORDER BY created_at ASC
    )
    LOOP
      UPDATE event_presenter_assignments 
      SET order_index = idx 
      WHERE id = rec.id;
      idx := idx + 1;
    END LOOP;
  END LOOP;
END $$;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_event_presenter_assignments_order 
ON event_presenter_assignments(event_id, order_index);