/*
  # Event Soft Delete and Recovery System

  ## Overview
  This migration implements a soft delete system for events where deleted events
  remain recoverable for 5 days before being permanently removed. Only organization
  admins can view and manage deleted events.

  ## Schema Changes

  ### 1. events table modifications
  - `deleted_at` (timestamptz, nullable) - Timestamp when event was soft deleted
  - `deleted_by` (uuid, nullable) - Admin user who deleted the event

  ## Indexes
  - Composite index on (deleted_at, organization_id) for efficient filtering
  - Index on deleted_by for audit queries

  ## Functions

  ### delete_expired_events()
  Automatically removes events that have been soft deleted for more than 5 days.
  Cascades deletion to all related records:
  - presenter_access
  - timer_messages
  - timer_logs
  - timer_sessions
  - timers
  - events

  ## Security (Row Level Security)

  Updated policies to handle soft deleted events:
  - Normal users only see events where deleted_at IS NULL
  - Admins can view events where deleted_at IS NOT NULL
  - Admins can restore events (update deleted_at back to NULL)
  - Only admins can permanently delete events

  ## Important Notes
  1. Events retain their original status when soft deleted and recovered
  2. All related data is preserved during soft delete period
  3. After 5 days, events are automatically and permanently deleted
  4. Manual permanent deletion by admins is also supported
  5. All operations respect organization boundaries
*/

-- Add soft delete columns to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE events ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE events ADD COLUMN deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT NULL;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_deleted_at_org
  ON events(deleted_at, organization_id)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_deleted_by
  ON events(deleted_by)
  WHERE deleted_by IS NOT NULL;

-- Update existing RLS policy to exclude soft deleted events
DROP POLICY IF EXISTS "Organization members can view events" ON events;
CREATE POLICY "Organization members can view events"
  ON events FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Create policy for admins to view deleted events
CREATE POLICY "Admins can view deleted events"
  ON events FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Update admin policies to work with both deleted and non-deleted events
DROP POLICY IF EXISTS "Organization admins can update events" ON events;
CREATE POLICY "Organization admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Allow admins to permanently delete events
DROP POLICY IF EXISTS "Organization admins can delete events" ON events;
CREATE POLICY "Organization admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Function to automatically delete events that have been soft deleted for more than 5 days
CREATE OR REPLACE FUNCTION delete_expired_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_event RECORD;
BEGIN
  -- Find all events that were deleted more than 5 days ago
  FOR expired_event IN
    SELECT id FROM events
    WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '5 days'
  LOOP
    -- Delete related presenter_access records
    DELETE FROM presenter_access WHERE event_id = expired_event.id;

    -- Delete related timer data
    DELETE FROM timer_messages WHERE timer_id IN (
      SELECT id FROM timers WHERE event_id = expired_event.id
    );

    DELETE FROM timer_logs WHERE timer_id IN (
      SELECT id FROM timers WHERE event_id = expired_event.id
    );

    DELETE FROM timer_sessions WHERE timer_id IN (
      SELECT id FROM timers WHERE event_id = expired_event.id
    );

    -- Delete timers associated with the event
    DELETE FROM timers WHERE event_id = expired_event.id;

    -- Finally, delete the event itself
    DELETE FROM events WHERE id = expired_event.id;

    -- Log the deletion (optional - you can add an audit table if needed)
    RAISE NOTICE 'Automatically deleted expired event: %', expired_event.id;
  END LOOP;
END;
$$;

-- Create a function to check expired events (can be called manually or via scheduled job)
CREATE OR REPLACE FUNCTION check_and_delete_expired_events()
RETURNS TABLE(deleted_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_before integer;
  count_after integer;
BEGIN
  SELECT COUNT(*) INTO count_before FROM events WHERE deleted_at IS NOT NULL;

  PERFORM delete_expired_events();

  SELECT COUNT(*) INTO count_after FROM events WHERE deleted_at IS NOT NULL;

  RETURN QUERY SELECT (count_before - count_after);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_expired_events() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_delete_expired_events() TO authenticated;
