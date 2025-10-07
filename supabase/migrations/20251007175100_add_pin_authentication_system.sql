/*
  # PIN Authentication System for Presenter Access Control

  1. Schema Changes to organization_presenters Table
    - `access_pin` (text, nullable) - Hashed PIN for presenter authentication
    - `pin_expires_at` (timestamptz, nullable) - When PIN expires
    - `pin_delivery_method` (text, nullable) - How PIN was/will be delivered: 'manual', 'email', 'both'
    - `pin_expiration_policy` (text, nullable) - When PIN expires: 'on_first_use', 'on_event_end', 'never'
    - `pin_failed_attempts` (integer, default 0) - Track failed authentication attempts
    - `pin_locked_until` (timestamptz, nullable) - Temporary lockout timestamp
    - `pin_last_used_at` (timestamptz, nullable) - Last successful PIN use
    - `pin_created_at` (timestamptz, nullable) - When PIN was generated
    - `pin_reset_count` (integer, default 0) - Number of times PIN has been reset

  2. Schema Changes to events Table
    - `security_level` (text, default 'pin_optional') - Security mode: 'none', 'pin_optional', 'pin_required', 'email_verification'

  3. Schema Changes to event_presenter_assignments Table
    - `session_expires_at` (timestamptz, nullable) - When presenter session expires
    - `pin_verified_at` (timestamptz, nullable) - When PIN was successfully verified

  4. New Tables
    - `presenter_pin_audit_logs`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `presenter_id` (uuid, references organization_presenters, nullable)
      - `event_id` (uuid, references events, nullable)
      - `action` (text) - 'generated', 'verified', 'failed', 'reset', 'locked', 'unlocked'
      - `success` (boolean)
      - `ip_address` (text, nullable)
      - `device_info` (text, nullable)
      - `details` (jsonb, nullable) - Additional context
      - `created_at` (timestamptz, default now())

  5. Security
    - Enable RLS on presenter_pin_audit_logs
    - Add policies for organization members to view their audit logs
    - Add public policy for logging authentication attempts

  6. Indexes
    - Index on presenter_id for fast audit log lookups
    - Index on event_id for event-specific security monitoring
    - Index on created_at for time-based queries
    - Index on action for filtering by action type

  7. Important Notes
    - PINs are stored hashed, never in plain text
    - Failed attempts trigger automatic lockouts after 5 attempts
    - Sessions can expire based on event configuration
    - Complete audit trail for compliance and security monitoring
*/

-- Add columns to organization_presenters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'access_pin'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN access_pin text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'pin_expires_at'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN pin_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'pin_delivery_method'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN pin_delivery_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'pin_expiration_policy'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN pin_expiration_policy text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'pin_failed_attempts'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN pin_failed_attempts integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'pin_locked_until'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN pin_locked_until timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'pin_last_used_at'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN pin_last_used_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'pin_created_at'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN pin_created_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_presenters' AND column_name = 'pin_reset_count'
  ) THEN
    ALTER TABLE organization_presenters ADD COLUMN pin_reset_count integer DEFAULT 0;
  END IF;
END $$;

-- Add columns to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'security_level'
  ) THEN
    ALTER TABLE events ADD COLUMN security_level text DEFAULT 'pin_optional';
  END IF;
END $$;

-- Add columns to event_presenter_assignments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_presenter_assignments' AND column_name = 'session_expires_at'
  ) THEN
    ALTER TABLE event_presenter_assignments ADD COLUMN session_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_presenter_assignments' AND column_name = 'pin_verified_at'
  ) THEN
    ALTER TABLE event_presenter_assignments ADD COLUMN pin_verified_at timestamptz;
  END IF;
END $$;

-- Create presenter_pin_audit_logs table
CREATE TABLE IF NOT EXISTS presenter_pin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  presenter_id uuid REFERENCES organization_presenters(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  action text NOT NULL,
  success boolean NOT NULL,
  ip_address text,
  device_info text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_presenter_id ON presenter_pin_audit_logs(presenter_id);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_event_id ON presenter_pin_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_created_at ON presenter_pin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_action ON presenter_pin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_organization_id ON presenter_pin_audit_logs(organization_id);

-- Enable RLS
ALTER TABLE presenter_pin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presenter_pin_audit_logs
CREATE POLICY "Organization members can view their audit logs"
  ON presenter_pin_audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert audit logs"
  ON presenter_pin_audit_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- Add check constraints for valid enum values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'presenter_pin_delivery_method_check'
  ) THEN
    ALTER TABLE organization_presenters 
    ADD CONSTRAINT presenter_pin_delivery_method_check 
    CHECK (pin_delivery_method IN ('manual', 'email', 'both') OR pin_delivery_method IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'presenter_pin_expiration_policy_check'
  ) THEN
    ALTER TABLE organization_presenters 
    ADD CONSTRAINT presenter_pin_expiration_policy_check 
    CHECK (pin_expiration_policy IN ('on_first_use', 'on_event_end', 'never') OR pin_expiration_policy IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'event_security_level_check'
  ) THEN
    ALTER TABLE events 
    ADD CONSTRAINT event_security_level_check 
    CHECK (security_level IN ('none', 'pin_optional', 'pin_required', 'email_verification'));
  END IF;
END $$;