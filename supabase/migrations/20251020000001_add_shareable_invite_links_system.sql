/*
  # Shareable Invite Links System

  ## Overview
  This migration adds comprehensive invite link functionality to enable easy team member
  onboarding through shareable URLs and QR codes alongside traditional email invitations.

  ## New Tables Created

  ### 1. organization_invite_links
  Permanent or temporary shareable invitation links for organizations
  - `id` (uuid, primary key) - Unique link identifier
  - `organization_id` (uuid, foreign key) - References organizations table
  - `token` (text, unique) - Secure token for the shareable link
  - `role` (text) - Role to assign when link is used ('admin' or 'presenter')
  - `created_by` (uuid, foreign key) - User who created the link
  - `expires_at` (timestamptz) - Optional expiration date (null = never expires)
  - `max_uses` (integer) - Maximum number of times link can be used (null = unlimited)
  - `current_uses` (integer) - Current number of times link has been used
  - `is_active` (boolean) - Whether the link is currently active
  - `label` (text) - Optional label/description for the link
  - `created_at` (timestamptz) - When link was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. invite_link_usage
  Tracks each time an invite link is used
  - `id` (uuid, primary key) - Unique usage record identifier
  - `invite_link_id` (uuid, foreign key) - References organization_invite_links
  - `user_id` (uuid, foreign key) - User who used the link (after account creation)
  - `email` (text) - Email of person who used the link
  - `ip_address` (text) - IP address for security tracking
  - `user_agent` (text) - Browser/device information
  - `accepted_at` (timestamptz) - When the invite was accepted
  - `created_at` (timestamptz) - When usage was recorded

  ## Modified Tables

  ### organization_invitations
  Added new columns to support QR codes and better tracking:
  - `invite_method` (text) - How invite was sent: 'email', 'link', 'qr', 'manual'
  - `invite_link_id` (uuid) - References organization_invite_links if from shareable link

  ## Security (Row Level Security)
  All tables have RLS enabled with appropriate policies:

  ### organization_invite_links
  - Organization owners and admins can view, create, update, and delete links
  - Public can view active, non-expired links for validation

  ### invite_link_usage
  - Organization owners and admins can view usage logs
  - System can insert usage records

  ## Indexes
  Created for optimal query performance on:
  - organization_invite_links (token, organization_id, is_active)
  - invite_link_usage (invite_link_id, user_id, email)

  ## Important Notes
  1. Tokens are generated using gen_random_uuid() for security
  2. Links can be set to never expire (expires_at = null)
  3. Links can have unlimited uses (max_uses = null)
  4. Usage tracking helps prevent abuse and provides analytics
  5. Links can be deactivated without deletion for audit purposes
*/

-- Create organization_invite_links table
CREATE TABLE IF NOT EXISTS organization_invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'presenter')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  max_uses integer,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  label text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invite_link_usage table
CREATE TABLE IF NOT EXISTS invite_link_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_link_id uuid REFERENCES organization_invite_links(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  ip_address text,
  user_agent text,
  accepted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add columns to organization_invitations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_invitations' AND column_name = 'invite_method'
  ) THEN
    ALTER TABLE organization_invitations ADD COLUMN invite_method text DEFAULT 'email' CHECK (invite_method IN ('email', 'link', 'qr', 'manual'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_invitations' AND column_name = 'invite_link_id'
  ) THEN
    ALTER TABLE organization_invitations ADD COLUMN invite_link_id uuid REFERENCES organization_invite_links(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON organization_invite_links(token);
CREATE INDEX IF NOT EXISTS idx_invite_links_org ON organization_invite_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_active ON organization_invite_links(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invite_link_usage_link ON invite_link_usage(invite_link_id);
CREATE INDEX IF NOT EXISTS idx_invite_link_usage_user ON invite_link_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_link_usage_email ON invite_link_usage(email);

-- Enable Row Level Security
ALTER TABLE organization_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_link_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_invite_links

-- Organization owners and admins can view their invite links
CREATE POLICY "Organization owners and admins can view invite links"
  ON organization_invite_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invite_links.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Public can view active links for validation (limited info)
CREATE POLICY "Public can view active invite links for validation"
  ON organization_invite_links FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  );

-- Organization owners and admins can create invite links
CREATE POLICY "Organization owners and admins can create invite links"
  ON organization_invite_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invite_links.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Organization owners and admins can update their invite links
CREATE POLICY "Organization owners and admins can update invite links"
  ON organization_invite_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invite_links.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invite_links.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Organization owners and admins can delete their invite links
CREATE POLICY "Organization owners and admins can delete invite links"
  ON organization_invite_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invite_links.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for invite_link_usage

-- Organization owners and admins can view usage logs
CREATE POLICY "Organization owners and admins can view invite link usage"
  ON invite_link_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_invite_links oil
      JOIN organization_members om ON om.organization_id = oil.organization_id
      WHERE oil.id = invite_link_usage.invite_link_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- System can insert usage records (authenticated users redeeming links)
CREATE POLICY "Authenticated users can create usage records"
  ON invite_link_usage FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Helper function to validate invite link
CREATE OR REPLACE FUNCTION validate_invite_link(link_token text)
RETURNS TABLE (
  is_valid boolean,
  link_id uuid,
  organization_id uuid,
  role text,
  organization_name text,
  error_message text
) AS $$
DECLARE
  link_record RECORD;
  org_record RECORD;
BEGIN
  SELECT * INTO link_record
  FROM organization_invite_links
  WHERE token = link_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::text, NULL::text, 'Invalid invitation link';
    RETURN;
  END IF;

  IF NOT link_record.is_active THEN
    RETURN QUERY SELECT false, link_record.id, link_record.organization_id, link_record.role, NULL::text, 'This invitation link has been deactivated';
    RETURN;
  END IF;

  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < now() THEN
    RETURN QUERY SELECT false, link_record.id, link_record.organization_id, link_record.role, NULL::text, 'This invitation link has expired';
    RETURN;
  END IF;

  IF link_record.max_uses IS NOT NULL AND link_record.current_uses >= link_record.max_uses THEN
    RETURN QUERY SELECT false, link_record.id, link_record.organization_id, link_record.role, NULL::text, 'This invitation link has reached its maximum number of uses';
    RETURN;
  END IF;

  SELECT name INTO org_record
  FROM organizations
  WHERE id = link_record.organization_id;

  RETURN QUERY SELECT true, link_record.id, link_record.organization_id, link_record.role, org_record.name, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment link usage
CREATE OR REPLACE FUNCTION increment_invite_link_usage(link_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE organization_invite_links
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organization_invite_links
DROP TRIGGER IF EXISTS update_invite_links_updated_at ON organization_invite_links;
CREATE TRIGGER update_invite_links_updated_at
  BEFORE UPDATE ON organization_invite_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
