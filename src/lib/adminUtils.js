import { supabase } from './supabase'

export async function checkIsAdmin(userId) {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return data?.role === 'admin'
  } catch (error) {
    console.error('Error in checkIsAdmin:', error)
    return false
  }
}

export async function getOrganizationId(userId) {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error getting organization ID:', error)
      return null
    }

    return data?.organization_id || null
  } catch (error) {
    console.error('Error in getOrganizationId:', error)
    return null
  }
}
