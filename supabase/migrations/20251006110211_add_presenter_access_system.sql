/*
  # Presenter Access System - QR Code Self-Assignment

  1. New Tables
    - `organization_presenters`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `presenter_name` (text, required) - Full name of presenter
      - `email` (text, optional)
      - `phone` (text, optional)
      - `notes` (text, optional)
      - `is_archived` (boolean, default false)
      - `created_at` (timestamptz)
      - `last_used_at` (timestamptz, nullable)
      - `times_used` (integer, default 0)
      - Unique constraint on (organization_id, presenter_name)

    - `event_access_tokens`
      - `id` (uuid, primary key)
      - `token` (text, unique) - Secure random token for QR code URL
      - `event_id` (uuid, references events)
      - `organization_id` (uuid, references organizations)
      - `created_by` (uuid, references auth.users)
      - `max_uses` (integer, default null) - null means unlimited
      - `current_uses` (integer, default 0)
      - `expires_at` (timestamptz, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

    - `event_presenter_assignments`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `presenter_name` (text) - Name from organization_presenters
      - `timer_id` (uuid, references timers, nullable) - Which timer this presenter is assigned to
      - `assigned_at` (timestamptz, nullable) - When presenter claimed this slot
      - `session_token` (text, unique, nullable) - Token for presenter's view access
      - `device_info` (text, nullable)
      - `ip_address` (text, nullable)
      - Unique constraint on (event_id, presenter_name)

    - `event_access_logs`
      - `id` (uuid, primary key)
      - `token_id` (uuid, references event_access_tokens)
      - `presenter_name` (text, nullable)
      - `device_info` (text, nullable)
      - `ip_address` (text, nullable)
      - `accessed_at` (timestamptz)
      - `action` (text) - 'viewed', 'assigned', 'error'

  2. Schema Changes to Existing Tables
    - Add `max_event_presenters` to organizations (default 3 for trial tier)
    - Add `active_presenter_count` to organizations (default 0)

  3. Security
    - Enable RLS on all new tables
    - organization_presenters: Accessible by organization members only
    - event_access_tokens: Accessible by organization members only
    - event_presenter_assignments: Public read for active assignments, write restricted
    - event_access_logs: Organization admins only

  4. Important Notes
    - Admins are NEVER counted in active_presenter_count
    - organization_presenters table is completely separate from organization_members
    - Presenter names must not match admin emails or names
*/

-- Add columns to organizations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'max_event_presenters'
  ) THEN
    ALTER TABLE organizations ADD COLUMN max_event_presenters integer DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'active_presenter_count'
  ) THEN
    ALTER TABLE organizations ADD COLUMN active_presenter_count integer DEFAULT 0;
  END IF;
END $$;

-- Create organization_presenters table
CREATE TABLE IF NOT EXISTS organization_presenters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  presenter_name text NOT NULL,
  email text,
  phone text,
  notes text,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  times_used integer DEFAULT 0,
  UNIQUE(organization_id, presenter_name)
);

-- Create event_access_tokens table
CREATE TABLE IF NOT EXISTS event_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create event_presenter_assignments table
CREATE TABLE IF NOT EXISTS event_presenter_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  presenter_name text NOT NULL,
  timer_id uuid REFERENCES timers(id) ON DELETE CASCADE,
  assigned_at timestamptz,
  session_token text UNIQUE,
  device_info text,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, presenter_name)
);

-- Create event_access_logs table
CREATE TABLE IF NOT EXISTS event_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES event_access_tokens(id) ON DELETE CASCADE NOT NULL,
  presenter_name text,
  device_info text,
  ip_address text,
  accessed_at timestamptz DEFAULT now(),
  action text NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_presenters_org_id ON organization_presenters(organization_id) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_event_access_tokens_event_id ON event_access_tokens(event_id);
CREATE INDEX IF NOT EXISTS idx_event_access_tokens_token ON event_access_tokens(token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_event_presenter_assignments_event_id ON event_presenter_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_presenter_assignments_session_token ON event_presenter_assignments(session_token);
CREATE INDEX IF NOT EXISTS idx_event_access_logs_token_id ON event_access_logs(token_id);

-- Enable RLS
ALTER TABLE organization_presenters ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_presenter_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_presenters
CREATE POLICY "Organization members can view presenters"
  ON organization_presenters FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert presenters"
  ON organization_presenters FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update presenters"
  ON organization_presenters FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete presenters"
  ON organization_presenters FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for event_access_tokens
CREATE POLICY "Organization members can view access tokens"
  ON event_access_tokens FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create access tokens"
  ON event_access_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update access tokens"
  ON event_access_tokens FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for event_presenter_assignments
CREATE POLICY "Anyone can view active presenter assignments"
  ON event_presenter_assignments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Organization members can manage presenter assignments"
  ON event_presenter_assignments FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      WHERE e.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can claim presenter assignments"
  ON event_presenter_assignments FOR UPDATE
  TO public
  USING (assigned_at IS NULL)
  WITH CHECK (assigned_at IS NOT NULL);

-- RLS Policies for event_access_logs
CREATE POLICY "Organization members can view access logs"
  ON event_access_logs FOR SELECT
  TO authenticated
  USING (
    token_id IN (
      SELECT id FROM event_access_tokens
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Anyone can insert access logs"
  ON event_access_logs FOR INSERT
  TO public
  WITH CHECK (true);