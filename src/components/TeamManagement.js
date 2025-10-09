import React, { useState, useEffect } from 'react'
import { X, UserPlus, Mail, Crown, Users, Trash2, Loader as Loader2, Shield, Mic2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { products } from '../stripe-config'
import { ROLES, isOwner, isOwnerOrAdmin, getRoleDisplayName, updateUserRole, validateRoleChange } from '../lib/roleUtils'

export default function TeamManagement({ isOpen, onClose, session }) {
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState(null)
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)

  useEffect(() => {
    if (isOpen && session?.user) {
      loadTeamData()
    }
  }, [isOpen, session])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      console.log('[TeamManagement] Loading team data for user:', session.user.id)

      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, role, is_owner')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (memberError) {
        console.error('[TeamManagement] Error loading user membership:', memberError)
        alert('Failed to load your organization membership. Please try again.')
        setLoading(false)
        return
      }

      if (!memberData) {
        console.warn('[TeamManagement] User is not a member of any organization')
        alert('You are not a member of any organization. Please contact support.')
        setLoading(false)
        return
      }

      console.log('[TeamManagement] User membership data:', memberData)
      const orgId = memberData.organization_id

      const [orgResult, membersResult, invitesResult, subResult] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', orgId).single(),
        supabase
          .from('organization_members')
          .select(`
            *,
            user:user_id (
              id,
              email
            )
          `)
          .eq('organization_id', orgId)
          .order('is_owner', { ascending: false })
          .order('role'),
        supabase
          .from('organization_invitations')
          .select('*')
          .eq('organization_id', orgId)
          .is('accepted_at', null),
        supabase
          .from('stripe_subscriptions')
          .select('*, stripe_customers!inner(user_id)')
          .eq('stripe_customers.user_id', session.user.id)
          .maybeSingle()
      ])

      if (orgResult.error) {
        console.error('[TeamManagement] Error loading organization:', orgResult.error)
      }
      if (membersResult.error) {
        console.error('[TeamManagement] Error loading members:', membersResult.error)
      }
      if (invitesResult.error) {
        console.error('[TeamManagement] Error loading invitations:', invitesResult.error)
      }

      setOrganization(orgResult.data)
      setMembers(membersResult.data || [])
      setInvitations(invitesResult.data || [])
      setSubscriptionInfo(subResult.data)

      console.log('[TeamManagement] Loaded data:', {
        organization: orgResult.data,
        memberCount: membersResult.data?.length || 0,
        invitationCount: invitesResult.data?.length || 0,
        hasSubscription: !!subResult.data
      })
    } catch (error) {
      console.error('[TeamManagement] Error loading team data:', error)
      alert('Failed to load team data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPlanInfo = () => {
    const countedMembers = members.filter(m => m.counted_in_limit === true)

    if (!subscriptionInfo?.price_id) {
      return {
        name: 'Trial',
        maxUsers: 5,
        currentUsers: countedMembers.length,
        totalUsers: members.length
      }
    }

    const product = products.find(p => p.priceId === subscriptionInfo.price_id)
    if (!product) {
      return {
        name: 'Pro',
        maxUsers: 5,
        currentUsers: countedMembers.length,
        totalUsers: members.length
      }
    }

    return {
      name: product.name,
      maxUsers: product.maxUsers,
      currentUsers: countedMembers.length,
      totalUsers: members.length,
      canAddUsers: product.maxUsers === -1 || countedMembers.length < product.maxUsers
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    const validation = validateRoleChange(member, newRole)
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    const confirmMessage = `Change ${member.user?.email}'s role to ${getRoleDisplayName(newRole)}?\n\nThis will ${newRole === ROLES.ADMIN ? 'grant admin privileges and remove presentation access' : 'remove admin privileges and grant presentation access'}.`

    if (!window.confirm(confirmMessage)) return

    const result = await updateUserRole(memberId, newRole)
    if (result.success) {
      await loadTeamData()
    } else {
      alert(`Failed to update role: ${result.error}`)
    }
  }

  const handleRemoveMember = async (memberId, member) => {
    if (isOwner(member)) {
      alert('Cannot remove the organization owner')
      return
    }

    if (!window.confirm('Are you sure you want to remove this member?')) return

    if (member.user_id === session.user.id) {
      alert('You cannot remove yourself from the organization')
      return
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      await loadTeamData()
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    }
  }

  const handleCancelInvitation = async (inviteId) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', inviteId)

      if (error) throw error

      await loadTeamData()
    } catch (error) {
      console.error('Error canceling invitation:', error)
      alert('Failed to cancel invitation')
    }
  }

  if (!isOpen) return null

  const planInfo = getPlanInfo()
  const currentMember = members.find(m => m.user_id === session?.user?.id)
  const canManage = isOwnerOrAdmin(currentMember)

  console.log('[TeamManagement] Render state:', {
    currentUserId: session?.user?.id,
    currentMember: currentMember,
    canManage: canManage,
    memberCount: members.length,
    planInfo: planInfo
  })

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-white">Team Management</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-400">Current Plan</div>
                      <div className="text-xl font-bold text-white">{planInfo.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Counted Users</div>
                      <div className="text-xl font-bold text-white">
                        {planInfo.currentUsers}
                        {planInfo.maxUsers > 0 && ` / ${planInfo.maxUsers}`}
                        {planInfo.maxUsers === -1 && ' / Unlimited'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {planInfo.totalUsers} total (owner not counted)
                      </div>
                    </div>
                  </div>
                </div>

                {canManage ? (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowInviteModal(true)}
                      disabled={!planInfo.canAddUsers}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {planInfo.canAddUsers ? 'Invite Team Member' : 'Upgrade to add more users'}
                    </button>
                  </div>
                ) : (
                  <div className="mb-6 bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                    <p className="text-gray-300 text-sm text-center">
                      Only organization owners and admins can invite team members.
                    </p>
                  </div>
                )}

                {invitations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Pending Invitations</h3>
                    <div className="space-y-2">
                      {invitations.map(invite => (
                        <div key={invite.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-white">{invite.email}</div>
                              <div className="text-sm text-gray-400 capitalize">{getRoleDisplayName(invite.role)}</div>
                            </div>
                          </div>
                          {canManage && (
                            <button
                              onClick={() => handleCancelInvitation(invite.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Team Members</h3>
                  <div className="space-y-2">
                    {members.map(member => {
                      const roleIcon = member.is_owner ? 'crown' : member.role === 'admin' ? 'shield' : 'mic'
                      const roleColor = member.is_owner ? 'text-yellow-500' : member.role === 'admin' ? 'text-blue-500' : 'text-green-500'
                      return (
                        <div key={member.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-3 flex-1">
                            {roleIcon === 'crown' ? (
                              <Crown className={`w-5 h-5 ${roleColor}`} />
                            ) : roleIcon === 'shield' ? (
                              <Shield className={`w-5 h-5 ${roleColor}`} />
                            ) : (
                              <Mic2 className={`w-5 h-5 ${roleColor}`} />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white">{member.user?.email || 'Unknown'}</span>
                                {member.is_owner && (
                                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                    Owner
                                  </span>
                                )}
                                {!member.counted_in_limit && !member.is_owner && (
                                  <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded">
                                    Not Counted
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400 capitalize">{getRoleDisplayName(member.role)}</div>
                            </div>
                            {canManage && !member.is_owner && (
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                className="bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="admin">Admin</option>
                                <option value="presenter">Presenter</option>
                              </select>
                            )}
                          </div>
                          {canManage && member.user_id !== session?.user?.id && !member.is_owner && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member)}
                              className="text-red-400 hover:text-red-300 transition-colors ml-3"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <InviteModal
          organization={organization}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={loadTeamData}
          session={session}
          planInfo={planInfo}
        />
      )}
    </>
  )
}

function InviteModal({ organization, onClose, onInviteSent, session, planInfo }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLES.ADMIN)
  const [loading, setLoading] = useState(false)

  const handleInvite = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organization.id,
          email: email.toLowerCase().trim(),
          role: role,
          invited_by: session.user.id
        })

      if (error) throw error

      alert('Invitation sent successfully!')
      onInviteSent()
      onClose()
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Failed to send invitation. The email may already be invited.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> The organization owner does not count toward your user limit.
            Current usage: {planInfo.currentUsers} of {planInfo.maxUsers === -1 ? 'unlimited' : planInfo.maxUsers} users
          </p>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="colleague@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ROLES.ADMIN}>Admin - Manage events and team</option>
              <option value={ROLES.PRESENTER}>Presenter - Present in events only</option>
            </select>
            <p className="text-xs text-gray-400 mt-2">
              {role === ROLES.ADMIN
                ? 'Admins can create events, manage the team, but cannot present.'
                : 'Presenters can only present in events and cannot access admin features.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Invitation
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
