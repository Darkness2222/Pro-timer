import { supabase } from './supabase'

export async function createInviteLink(organizationId, role, options = {}) {
  const {
    label = null,
    expiresIn = null,
    maxUses = null
  } = options

  let expires_at = null
  if (expiresIn) {
    const expirationDate = new Date()
    expirationDate.setHours(expirationDate.getHours() + expiresIn)
    expires_at = expirationDate.toISOString()
  }

  const { data, error } = await supabase
    .from('organization_invite_links')
    .insert({
      organization_id: organizationId,
      role,
      label,
      expires_at,
      max_uses: maxUses
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating invite link:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

export async function validateInviteLink(token) {
  const { data, error } = await supabase
    .rpc('validate_invite_link', { link_token: token })

  if (error) {
    console.error('Error validating invite link:', error)
    return { isValid: false, error: error.message }
  }

  if (data && data.length > 0) {
    const result = data[0]
    return {
      isValid: result.is_valid,
      linkId: result.link_id,
      organizationId: result.organization_id,
      role: result.role,
      organizationName: result.organization_name,
      error: result.error_message
    }
  }

  return { isValid: false, error: 'Invalid response from server' }
}

export async function getOrganizationInviteLinks(organizationId) {
  const { data, error } = await supabase
    .from('organization_invite_links')
    .select(`
      *,
      created_by_user:created_by (
        email
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invite links:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

export async function deactivateInviteLink(linkId) {
  const { error } = await supabase
    .from('organization_invite_links')
    .update({ is_active: false })
    .eq('id', linkId)

  if (error) {
    console.error('Error deactivating invite link:', error)
    return { success: false, error }
  }

  return { success: true, error: null }
}

export async function deleteInviteLink(linkId) {
  const { error } = await supabase
    .from('organization_invite_links')
    .delete()
    .eq('id', linkId)

  if (error) {
    console.error('Error deleting invite link:', error)
    return { success: false, error }
  }

  return { success: true, error: null }
}

export async function getInviteLinkUsage(linkId) {
  const { data, error } = await supabase
    .from('invite_link_usage')
    .select(`
      *,
      user:user_id (
        email
      )
    `)
    .eq('invite_link_id', linkId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invite link usage:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

export async function recordInviteLinkUsage(linkId, email, userId = null) {
  const { error } = await supabase
    .from('invite_link_usage')
    .insert({
      invite_link_id: linkId,
      user_id: userId,
      email,
      ip_address: null,
      user_agent: navigator.userAgent
    })

  if (error) {
    console.error('Error recording invite link usage:', error)
    return { success: false, error }
  }

  await supabase.rpc('increment_invite_link_usage', { link_id: linkId })

  return { success: true, error: null }
}

export async function acceptInviteLinkAndJoinOrganization(linkId, organizationId, role, userId, email) {
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingMember) {
    return { success: false, error: 'You are already a member of this organization' }
  }

  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role: role,
      joined_at: new Date().toISOString()
    })

  if (memberError) {
    console.error('Error adding member:', memberError)
    return { success: false, error: memberError.message }
  }

  await recordInviteLinkUsage(linkId, email, userId)

  return { success: true, error: null }
}

export function generateInviteLinkUrl(token) {
  const baseUrl = window.location.origin
  return `${baseUrl}/invite/${token}`
}

export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false)
  } else {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      textArea.remove()
      return Promise.resolve(true)
    } catch (err) {
      textArea.remove()
      return Promise.resolve(false)
    }
  }
}
