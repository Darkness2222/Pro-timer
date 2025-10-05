/*
  # Multi-User Events System Migration

  ## Overview
  This migration creates the complete infrastructure for multi-user organizations,
  team collaboration, and event management with multiple presenters.

  ## New Tables Created

  ### 1. organizations
  Represents a company or team account that can have multiple users
  - `id` (uuid, primary key) - Unique organization identifier
  - `name` (text) - Organization/company name
  - `created_at` (timestamptz) - When organization was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. organization_members
  Links users to organizations with role-based access
  - `id` (uuid, primary key) - Unique membership record identifier
  - `organization_id` (uuid, foreign key) - References organizations table
  - `user_id` (uuid, foreign key) - References auth.users table
  - `role` (text) - User role: 'admin' or 'presenter'
  - `invited_by` (uuid) - User who sent the invitation
  - `joined_at` (timestamptz) - When user accepted invitation
  - `created_at` (timestamptz) - When invitation was created

  ### 3. organization_invitations
  Manages pending invitations to join organizations
  - `id` (uuid, primary key) - Unique invitation identifier
  - `organization_id` (uuid, foreign key) - References organizations table
  - `email` (text) - Email address of invited user
  - `role` (text) - Role to assign when invitation is accepted
  - `invited_by` (uuid, foreign key) - User who created the invitation
  - `token` (text, unique) - Secure token for invitation link
  - `expires_at` (timestamptz) - Expiration date for invitation
  - `accepted_at` (timestamptz) - When invitation was accepted (null if pending)
  - `created_at` (timestamptz) - When invitation was created

  ### 4. events
  Represents multi-presenter events
  - `id` (uuid, primary key) - Unique event identifier
  - `organization_id` (uuid, foreign key) - References organizations table
  - `name` (text) - Event name/title
  - `description` (text) - Optional event description
  - `event_date` (timestamptz) - Scheduled date and time for event
  - `buffer_duration` (integer) - Time in seconds between presenters
  - `auto_start_next` (boolean) - Automatically start next presenter after buffer
  - `status` (text) - Event status: 'upcoming', 'in_progress', 'completed', 'cancelled'
  - `created_by` (uuid, foreign key) - User who created the event
  - `created_at` (timestamptz) - When event was created
  - `updated_at` (timestamptz) - Last update timestamp

  ## Modified Tables

  ### timers
  Added new columns to support event associations:
  - `event_id` (uuid, foreign key) - References events table (null for standalone timers)
  - `presentation_order` (integer) - Order of presenter in the event sequence

  ### profiles
  Added new columns to track subscription tier:
  - `subscription_tier` (text) - 'trial', 'pro', or 'enterprise'
  - `trial_ends_at` (timestamptz) - When trial period expires

  ### stripe_subscriptions
  Added column to track subscription plan:
  - `plan_type` (text) - 'pro' or 'enterprise'

  ## Security (Row Level Security)

  All tables have RLS enabled with appropriate policies:
  
  ### organizations
  - Users can view organizations they are members of
  - Organization admins can update their organization

  ### organization_members
  - Users can view members of organizations they belong to
  - Organization admins can manage (insert/update/delete) memberships
  
  ### organization_invitations
  - Users can view invitations for organizations they are admins of
  - Organization admins can create and manage invitations

  ### events
  - Users can view events from organizations they are members of
  - Organization admins can create, update, and delete events

  ## Indexes
  Created for optimal query performance on:
  - organization_members (organization_id, user_id)
  - organization_invitations (token, email)
  - events (organization_id, status, event_date)
  - timers (event_id)

  ## Important Notes
  1. All existing users get a default organization created automatically
  2. Existing timers remain as standalone timers (event_id = null)
  3. Default role for first organization member is 'admin'
  4. Invitation tokens are generated using gen_random_uuid()
  5. Trial period defaults to 14 days from account creation
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'presenter')),
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'presenter')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  event_date timestamptz,
  buffer_duration integer DEFAULT 0,
  auto_start_next boolean DEFAULT false,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add event_id and presentation_order to timers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timers' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE timers ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timers' AND column_name = 'presentation_order'
  ) THEN
    ALTER TABLE timers ADD COLUMN presentation_order integer;
  END IF;
END $$;

-- Add subscription tier tracking to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier text DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'pro', 'enterprise'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_ends_at timestamptz DEFAULT (now() + interval '14 days');
  END IF;
END $$;

-- Add plan_type to stripe_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN plan_type text CHECK (plan_type IN ('pro', 'enterprise'));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_timers_event ON timers(event_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they are members of"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can insert members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_members.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

CREATE POLICY "Organization admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Organization admins can delete members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- RLS Policies for organization_invitations
CREATE POLICY "Organization admins can view invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

CREATE POLICY "Organization admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

CREATE POLICY "Organization admins can update invitations"
  ON organization_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

CREATE POLICY "Organization admins can delete invitations"
  ON organization_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- RLS Policies for events
CREATE POLICY "Organization members can view events"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

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

-- Update timers RLS policies to support event-based access
DROP POLICY IF EXISTS "Users can view their own timers" ON timers;
CREATE POLICY "Users can view their own timers and event timers"
  ON timers FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = timers.event_id
      AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own timers" ON timers;
CREATE POLICY "Users can insert their own timers and admins can create event timers"
  ON timers FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (
      event_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM events e
        JOIN organization_members om ON om.organization_id = e.organization_id
        WHERE e.id = timers.event_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own timers" ON timers;
CREATE POLICY "Users can update their own timers and admins can update event timers"
  ON timers FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = timers.event_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = timers.event_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete their own timers" ON timers;
CREATE POLICY "Users can delete their own timers and admins can delete event timers"
  ON timers FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = timers.event_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Create function to automatically create organization for new users
CREATE OR REPLACE FUNCTION create_default_organization_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create a default organization for the user
  INSERT INTO organizations (name)
  VALUES (COALESCE(NEW.email, 'My Organization'))
  RETURNING id INTO new_org_id;

  -- Add user as admin of their organization
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create organization for new users
DROP TRIGGER IF EXISTS on_auth_user_created_create_org ON auth.users;
CREATE TRIGGER on_auth_user_created_create_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_organization_for_user();

-- Migrate existing users to have organizations
DO $$
DECLARE
  user_record RECORD;
  new_org_id uuid;
BEGIN
  FOR user_record IN SELECT id, email FROM auth.users LOOP
    -- Check if user already has an organization
    IF NOT EXISTS (
      SELECT 1 FROM organization_members WHERE user_id = user_record.id
    ) THEN
      -- Create organization
      INSERT INTO organizations (name)
      VALUES (COALESCE(user_record.email, 'My Organization'))
      RETURNING id INTO new_org_id;

      -- Add user as admin
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES (new_org_id, user_record.id, 'admin');
    END IF;
  END LOOP;
END $$;