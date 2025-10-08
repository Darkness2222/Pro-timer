/*
  # Create Comprehensive Feedback System

  ## Overview
  This migration creates a dual feedback system supporting both admin internal feedback
  and attendee public feedback for presenter evaluations.

  ## New Tables

  ### 1. `feedback_tags`
  Stores predefined core tags and organization-specific custom tags for categorizing feedback.
  - `id` (uuid, primary key)
  - `organization_id` (uuid, foreign key to organizations)
  - `tag_name` (text) - The display name of the tag
  - `tag_type` (text) - 'strength' or 'improvement'
  - `is_core_tag` (boolean) - True for fixed system tags, false for custom org tags
  - `created_at` (timestamptz)

  ### 2. `admin_feedback`
  Stores detailed internal feedback given by admins/organizers to presenters.
  - `id` (uuid, primary key)
  - `timer_id` (uuid, foreign key to timers)
  - `event_id` (uuid, foreign key to events, nullable)
  - `organization_id` (uuid, foreign key to organizations)
  - `presenter_id` (uuid, foreign key to users) - The presenter receiving feedback
  - `submitted_by_id` (uuid, foreign key to users) - The admin giving feedback
  - `overall_rating` (integer) - 1-5 star rating
  - `selected_tags` (jsonb) - Array of tag IDs selected
  - `comment` (text) - Public feedback comment
  - `private_notes` (text) - Admin-only private notes
  - `allocated_time_seconds` (integer) - Time allocated for presentation
  - `actual_time_seconds` (integer) - Actual time taken
  - `time_variance_seconds` (integer) - Difference between allocated and actual
  - `feedback_status` (text) - 'submitted', 'pending_approval', 'approved', 'skipped'
  - `approved_at` (timestamptz)
  - `approved_by_id` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `attendee_feedback`
  Stores public feedback submitted by event attendees/audience members.
  - `id` (uuid, primary key)
  - `event_id` (uuid, foreign key to events)
  - `timer_id` (uuid, foreign key to timers, nullable) - Specific presenter/timer
  - `organization_id` (uuid, foreign key to organizations)
  - `presenter_id` (uuid, foreign key to users, nullable)
  - `is_anonymous` (boolean) - Whether submitter chose to remain anonymous
  - `attendee_name` (text, nullable) - Name if not anonymous
  - `attendee_email` (text, nullable) - Email if not anonymous
  - `overall_rating` (integer) - 1-5 star rating
  - `comment` (text, nullable) - Feedback comment
  - `is_flagged` (boolean) - Flagged for moderation
  - `flagged_reason` (text, nullable)
  - `is_event_level` (boolean) - True if feedback is for entire event vs specific presenter
  - `created_at` (timestamptz)
  - `ip_address` (text, nullable) - For spam prevention

  ### 4. `event_feedback_settings`
  Stores per-event configuration for attendee feedback collection.
  - `id` (uuid, primary key)
  - `event_id` (uuid, foreign key to events, unique)
  - `organization_id` (uuid, foreign key to organizations)
  - `is_enabled` (boolean) - Whether attendee feedback is enabled for this event
  - `require_name` (boolean) - Require attendee name
  - `require_email` (boolean) - Require attendee email
  - `allow_anonymous` (boolean) - Allow anonymous submissions
  - `custom_intro_message` (text, nullable) - Custom message shown to attendees
  - `feedback_link_token` (text, unique) - Unique token for shareable link
  - `link_expires_at` (timestamptz, nullable) - Optional expiration for feedback link
  - `is_closed` (boolean) - Manually close feedback collection
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `feedback_approval_settings`
  Organization-level settings for admin feedback approval workflow.
  - `id` (uuid, primary key)
  - `organization_id` (uuid, foreign key to organizations, unique)
  - `require_approval` (boolean) - If true, admin feedback requires approval before visible to presenters
  - `auto_approve` (boolean) - If true, automatically approve all admin feedback
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Admin feedback: Admins can create/view all, presenters can view their own approved feedback
  - Attendee feedback: Anyone with link can create, admins can view all, presenters can view their own
  - Settings: Only admins/owners can manage
  - Tags: Admins can create custom tags, everyone can view org tags

  ## Indexes
  - Index on timer_id, event_id, organization_id for fast queries
  - Index on feedback_link_token for quick attendee access
  - Index on created_at for chronological queries
*/

-- Create feedback_tags table
CREATE TABLE IF NOT EXISTS feedback_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  tag_type text NOT NULL CHECK (tag_type IN ('strength', 'improvement')),
  is_core_tag boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create admin_feedback table
CREATE TABLE IF NOT EXISTS admin_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timer_id uuid REFERENCES timers(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  presenter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  selected_tags jsonb DEFAULT '[]'::jsonb,
  comment text,
  private_notes text,
  allocated_time_seconds integer,
  actual_time_seconds integer,
  time_variance_seconds integer,
  feedback_status text DEFAULT 'submitted' CHECK (feedback_status IN ('submitted', 'pending_approval', 'approved', 'skipped')),
  approved_at timestamptz,
  approved_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendee_feedback table
CREATE TABLE IF NOT EXISTS attendee_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  timer_id uuid REFERENCES timers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  presenter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_anonymous boolean DEFAULT true,
  attendee_name text,
  attendee_email text,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  comment text,
  is_flagged boolean DEFAULT false,
  flagged_reason text,
  is_event_level boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  ip_address text
);

-- Create event_feedback_settings table
CREATE TABLE IF NOT EXISTS event_feedback_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT false,
  require_name boolean DEFAULT false,
  require_email boolean DEFAULT false,
  allow_anonymous boolean DEFAULT true,
  custom_intro_message text,
  feedback_link_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  link_expires_at timestamptz,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create feedback_approval_settings table
CREATE TABLE IF NOT EXISTS feedback_approval_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  require_approval boolean DEFAULT false,
  auto_approve boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_tags_organization ON feedback_tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_timer ON admin_feedback(timer_id);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_event ON admin_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_organization ON admin_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_presenter ON admin_feedback(presenter_id);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_created ON admin_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendee_feedback_event ON attendee_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_attendee_feedback_timer ON attendee_feedback(timer_id);
CREATE INDEX IF NOT EXISTS idx_attendee_feedback_organization ON attendee_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendee_feedback_presenter ON attendee_feedback(presenter_id);
CREATE INDEX IF NOT EXISTS idx_attendee_feedback_created ON attendee_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_feedback_settings_token ON event_feedback_settings(feedback_link_token);
CREATE INDEX IF NOT EXISTS idx_event_feedback_settings_event ON event_feedback_settings(event_id);

-- Enable Row Level Security
ALTER TABLE feedback_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_approval_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_tags
CREATE POLICY "Users can view tags for their organization"
  ON feedback_tags FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) OR organization_id IS NULL
  );

CREATE POLICY "Admins can create custom tags"
  ON feedback_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete custom tags"
  ON feedback_tags FOR DELETE
  TO authenticated
  USING (
    is_core_tag = false AND
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for admin_feedback
CREATE POLICY "Admins can view all admin feedback"
  ON admin_feedback FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Presenters can view their own approved feedback"
  ON admin_feedback FOR SELECT
  TO authenticated
  USING (
    presenter_id = auth.uid() AND
    feedback_status = 'approved'
  );

CREATE POLICY "Admins can create admin feedback"
  ON admin_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update admin feedback"
  ON admin_feedback FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for attendee_feedback
CREATE POLICY "Anyone can submit attendee feedback"
  ON attendee_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all attendee feedback"
  ON attendee_feedback FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Presenters can view their own attendee feedback"
  ON attendee_feedback FOR SELECT
  TO authenticated
  USING (
    presenter_id = auth.uid()
  );

CREATE POLICY "Admins can update attendee feedback for moderation"
  ON attendee_feedback FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for event_feedback_settings
CREATE POLICY "Admins can manage event feedback settings"
  ON event_feedback_settings FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Anyone can view event feedback settings by token"
  ON event_feedback_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for feedback_approval_settings
CREATE POLICY "Admins can manage approval settings"
  ON feedback_approval_settings FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Insert core feedback tags (these apply to all organizations)
INSERT INTO feedback_tags (organization_id, tag_name, tag_type, is_core_tag) VALUES
  (NULL, 'Clear Communication', 'strength', true),
  (NULL, 'Strong Content', 'strength', true),
  (NULL, 'Engaging Delivery', 'strength', true),
  (NULL, 'Good Timing', 'strength', true),
  (NULL, 'Effective Visuals', 'strength', true),
  (NULL, 'Confident Presence', 'strength', true),
  (NULL, 'Pacing', 'improvement', true),
  (NULL, 'Clarity', 'improvement', true),
  (NULL, 'Time Management', 'improvement', true),
  (NULL, 'Audience Engagement', 'improvement', true),
  (NULL, 'Slide Design', 'improvement', true),
  (NULL, 'Volume/Projection', 'improvement', true)
ON CONFLICT DO NOTHING;
