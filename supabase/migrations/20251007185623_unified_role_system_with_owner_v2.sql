/*
  # Unified Role System with Owner Tracking v2

  Restructures the user role system to have three distinct roles with owner exemption from limits.
*/

-- Step 1: Add owner_id to organizations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN owner_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'counted_user_count'
  ) THEN
    ALTER TABLE organizations ADD COLUMN counted_user_count integer DEFAULT 0;
  END IF;
END $$;

-- Step 2: Extend organization_members table with presenter fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'is_owner'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN is_owner boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'counted_in_limit'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN counted_in_limit boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'phone'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'notes'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'access_pin'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN access_pin text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'pin_delivery_method'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN pin_delivery_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'pin_expiration_policy'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN pin_expiration_policy text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'pin_created_at'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN pin_created_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'pin_last_used_at'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN pin_last_used_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'pin_failed_attempts'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN pin_failed_attempts integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'pin_locked_until'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN pin_locked_until timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'pin_reset_count'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN pin_reset_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN last_used_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'times_used'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN times_used integer DEFAULT 0;
  END IF;
END $$;

-- Step 3: Update role constraint
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('owner', 'admin', 'presenter'));

-- Step 4: Set owner_id for existing organizations
UPDATE organizations o
SET owner_id = (
  SELECT om.user_id
  FROM organization_members om
  WHERE om.organization_id = o.id
    AND om.role = 'admin'
  ORDER BY om.created_at ASC
  LIMIT 1
)
WHERE owner_id IS NULL;

-- Step 5: Mark the owner
UPDATE organization_members om
SET
  is_owner = true,
  counted_in_limit = false,
  role = 'owner'
FROM organizations o
WHERE om.organization_id = o.id
  AND om.user_id = o.owner_id
  AND om.role = 'admin';

-- Step 6: Ensure non-owners counted
UPDATE organization_members
SET counted_in_limit = true
WHERE is_owner = false AND counted_in_limit IS NULL;

-- Step 7: Update counted_user_count
UPDATE organizations o
SET counted_user_count = (
  SELECT COUNT(*)
  FROM organization_members om
  WHERE om.organization_id = o.id
    AND om.counted_in_limit = true
);

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_owner ON organization_members(organization_id, is_owner) WHERE is_owner = true;
CREATE INDEX IF NOT EXISTS idx_organization_members_counted ON organization_members(organization_id, counted_in_limit) WHERE counted_in_limit = true;
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_members_unique_owner ON organization_members(organization_id) WHERE is_owner = true;

-- Step 9: Update RLS policies
DROP POLICY IF EXISTS "Organization admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can delete members" ON organization_members;

CREATE POLICY "Organization owners and admins can insert members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization owners and admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
    AND (
      organization_members.is_owner = false
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.is_owner = true
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
    AND (
      organization_members.is_owner = false
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.is_owner = true
      )
    )
  );

CREATE POLICY "Organization owners and admins can delete members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
    AND organization_members.is_owner = false
  );

-- Step 10: Update other policies
DROP POLICY IF EXISTS "Organization admins can update their organization" ON organizations;

CREATE POLICY "Organization owners and admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Organization admins can view invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Organization admins can create invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Organization admins can update invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Organization admins can delete invitations" ON organization_invitations;

CREATE POLICY "Organization owners and admins can view invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization owners and admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization owners and admins can update invitations"
  ON organization_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization owners and admins can delete invitations"
  ON organization_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Organization admins can create events" ON events;
DROP POLICY IF EXISTS "Organization admins can update events" ON events;
DROP POLICY IF EXISTS "Organization admins can delete events" ON events;

CREATE POLICY "Organization owners and admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization owners and admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization owners and admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Step 11: Update auto-create function
CREATE OR REPLACE FUNCTION create_default_organization_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO organizations (name, owner_id, counted_user_count)
  VALUES (COALESCE(NEW.email, 'My Organization'), NEW.id, 0)
  RETURNING id INTO new_org_id;

  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_owner,
    counted_in_limit
  )
  VALUES (new_org_id, NEW.id, 'owner', true, false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Helper functions
CREATE OR REPLACE FUNCTION get_counted_user_count(org_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM organization_members
    WHERE organization_id = org_id
      AND counted_in_limit = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION can_add_user_to_organization(org_id uuid, max_users integer)
RETURNS boolean AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT get_counted_user_count(org_id) INTO current_count;
  IF max_users = -1 THEN
    RETURN true;
  END IF;
  RETURN current_count < max_users;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION update_organization_counted_users()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE organizations
    SET counted_user_count = get_counted_user_count(NEW.organization_id)
    WHERE id = NEW.organization_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizations
    SET counted_user_count = get_counted_user_count(OLD.organization_id)
    WHERE id = OLD.organization_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_counted_users ON organization_members;
CREATE TRIGGER trigger_update_counted_users
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_counted_users();
