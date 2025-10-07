import { supabase } from './supabase'

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  PRESENTER: 'presenter'
}

export const isOwner = (member) => {
  return member?.role === ROLES.OWNER || member?.is_owner === true
}

export const isAdmin = (member) => {
  return member?.role === ROLES.ADMIN
}

export const isPresenter = (member) => {
  return member?.role === ROLES.PRESENTER
}

export const isOwnerOrAdmin = (member) => {
  return isOwner(member) || isAdmin(member)
}

export const canManageTeam = (member) => {
  return isOwnerOrAdmin(member)
}

export const canPresent = (member) => {
  return isPresenter(member)
}

export const canCreateEvents = (member) => {
  return isOwnerOrAdmin(member)
}

export const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLES.OWNER:
      return 'Owner'
    case ROLES.ADMIN:
      return 'Admin'
    case ROLES.PRESENTER:
      return 'Presenter'
    default:
      return role
  }
}

export const getRoleIcon = (role) => {
  switch (role) {
    case ROLES.OWNER:
      return 'crown'
    case ROLES.ADMIN:
      return 'shield'
    case ROLES.PRESENTER:
      return 'mic'
    default:
      return 'user'
  }
}

export const getRoleColor = (role) => {
  switch (role) {
    case ROLES.OWNER:
      return 'yellow'
    case ROLES.ADMIN:
      return 'blue'
    case ROLES.PRESENTER:
      return 'green'
    default:
      return 'gray'
  }
}

export const getCountedUserCount = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('counted_in_limit', true)

    if (error) throw error

    return data || 0
  } catch (error) {
    console.error('Error getting counted user count:', error)
    return 0
  }
}

export const canAddUserToOrganization = async (organizationId, maxUsers) => {
  if (maxUsers === -1) return true

  const currentCount = await getCountedUserCount(organizationId)
  return currentCount < maxUsers
}

export const getCurrentUserRole = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, is_owner, organization_id, counted_in_limit')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

export const getUsersForOrganization = async (organizationId, includeCounted = true) => {
  try {
    const query = supabase
      .from('organization_members')
      .select(`
        *,
        user:user_id (
          id,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .order('is_owner', { ascending: false })
      .order('role')
      .order('created_at')

    if (includeCounted) {
      query.eq('counted_in_limit', true)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting users for organization:', error)
    return []
  }
}

export const getPresentersForOrganization = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        user:user_id (
          id,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('role', ROLES.PRESENTER)
      .order('created_at')

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting presenters for organization:', error)
    return []
  }
}

export const updateUserRole = async (memberId, newRole) => {
  if (newRole === ROLES.OWNER) {
    throw new Error('Cannot change user to owner role')
  }

  try {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('is_owner', false)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }
}

export const validateRoleChange = (currentMember, newRole) => {
  if (isOwner(currentMember)) {
    return {
      valid: false,
      message: 'Cannot change the owner role'
    }
  }

  if (newRole === ROLES.OWNER) {
    return {
      valid: false,
      message: 'Cannot assign owner role to other users'
    }
  }

  if (currentMember.role === newRole) {
    return {
      valid: false,
      message: 'User already has this role'
    }
  }

  return { valid: true }
}

export const getRolePermissions = (role) => {
  const permissions = {
    [ROLES.OWNER]: {
      canManageTeam: true,
      canManageSubscription: true,
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: true,
      canViewReports: true,
      canPresent: false,
      canBeRemoved: false,
      canChangeRole: false,
      countedInLimit: false
    },
    [ROLES.ADMIN]: {
      canManageTeam: true,
      canManageSubscription: false,
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: true,
      canViewReports: true,
      canPresent: false,
      canBeRemoved: true,
      canChangeRole: true,
      countedInLimit: true
    },
    [ROLES.PRESENTER]: {
      canManageTeam: false,
      canManageSubscription: false,
      canCreateEvents: false,
      canEditEvents: false,
      canDeleteEvents: false,
      canViewReports: false,
      canPresent: true,
      canBeRemoved: true,
      canChangeRole: true,
      countedInLimit: true
    }
  }

  return permissions[role] || permissions[ROLES.PRESENTER]
}
