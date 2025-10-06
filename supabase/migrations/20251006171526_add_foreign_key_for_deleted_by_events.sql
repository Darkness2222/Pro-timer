/*
  # Add Foreign Key for deleted_by in events table

  ## Overview
  This migration adds a foreign key constraint to enable Supabase to automatically
  join the events.deleted_by column with the profiles table to get user email.

  ## Changes Made

  1. Foreign Key Constraint
    - Add foreign key constraint from events.deleted_by to profiles.id
    - Enables automatic join in Supabase queries
    - Allows queries like: deleted_by_user:deleted_by(email)

  ## Purpose
  - Fixes the "Could not find a relationship" error when querying deleted events
  - Enables the Recently Deleted Events page to show who deleted an event
  - Maintains referential integrity in the database
*/

-- Add foreign key constraint from events.deleted_by to profiles.id
DO $$
BEGIN
  -- Check if the foreign key constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_deleted_by_fkey' 
    AND table_name = 'events'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE events 
    ADD CONSTRAINT events_deleted_by_fkey 
    FOREIGN KEY (deleted_by) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL;
  END IF;
END $$;
