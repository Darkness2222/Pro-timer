/*
  # Allow Admins to Also Be Presenters - Remove Email Uniqueness Constraint

  1. Changes
    - Remove any email-based unique constraints from organization_presenters
    - Add notes explaining that admins can exist in both organization_members AND organization_presenters
    - Email is now optional and not unique within an organization
    - Unique constraint remains only on (organization_id, presenter_name)

  2. Rationale
    - Admins may need to be presenters in their own events
    - An admin with email "admin@example.com" can also be added as a presenter with the same email
    - The presenter_name field is the unique identifier within an organization
    - organization_members (for admins/team) and organization_presenters (for event presenters) are separate tables

  3. Security
    - No RLS changes needed - existing policies remain in effect
    - Admins still need to explicitly add themselves as presenters if they want to present
    - This does not grant automatic presenter access to admins

  4. Important Notes
    - This change allows the same email to appear in both organization_members and organization_presenters
    - Presenter names must still be unique within an organization
    - This is intentional design to support admins who also present
*/

-- No structural changes needed! 
-- The existing schema already supports this use case.
-- The UNIQUE constraint is only on (organization_id, presenter_name), not email.
-- Email is already nullable and not unique.

-- Add a comment to the table to document this behavior
COMMENT ON TABLE organization_presenters IS 
'Stores presenter information for events. Presenters are separate from organization_members. 
An admin (in organization_members) can also be a presenter (in organization_presenters) with the same email.
Only presenter_name must be unique within an organization.';

COMMENT ON COLUMN organization_presenters.email IS 
'Optional email for the presenter. Can be the same as an admin user email - this is allowed and expected when admins also present.';
