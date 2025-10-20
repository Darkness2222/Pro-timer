import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader as Loader2, Users, Shield, Mic2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { validateInviteLink, acceptInviteLinkAndJoinOrganization } from '../lib/inviteUtils'
import { getRoleDisplayName } from '../lib/roleUtils'

export default function InviteAcceptPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(true)
  const [inviteInfo, setInviteInfo] = useState(null)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkAuth()
    validateToken()
  }, [token])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  const validateToken = async () => {
    setValidating(true)
    const result = await validateInviteLink(token)

    if (!result.isValid) {
      setError(result.error || 'Invalid invitation link')
      setValidating(false)
      return
    }

    setInviteInfo(result)
    setValidating(false)
  }

  const handleAcceptInvite = async () => {
    if (!user) {
      localStorage.setItem('pendingInviteToken', token)
      navigate('/auth?redirect=/invite/' + token)
      return
    }

    if (!inviteInfo) return

    setAccepting(true)

    try {
      const result = await acceptInviteLinkAndJoinOrganization(
        inviteInfo.linkId,
        inviteInfo.organizationId,
        inviteInfo.role,
        user.id,
        user.email
      )

      if (!result.success) {
        setError(result.error)
        setAccepting(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/app')
      }, 2000)
    } catch (err) {
      console.error('Error accepting invite:', err)
      setError('Failed to accept invitation. Please try again.')
      setAccepting(false)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-12 h-12 text-blue-500" />
      case 'presenter':
        return <Mic2 className="w-12 h-12 text-green-500" />
      default:
        return <Users className="w-12 h-12 text-gray-500" />
    }
  }

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Admins can create and manage events, invite team members, and access all administrative features.'
      case 'presenter':
        return 'Presenters can join events and use presentation timers but cannot access administrative features.'
      default:
        return 'Join this organization as a team member.'
    }
  }

  if (validating || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Validating Invitation</h2>
          <p className="text-gray-300">Please wait while we check your invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-red-700 text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-green-700 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Team!</h2>
          <p className="text-gray-300 mb-4">
            You've successfully joined <strong className="text-white">{inviteInfo.organizationName}</strong>
          </p>
          <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {getRoleIcon(inviteInfo.role)}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">You're Invited!</h1>
          <p className="text-xl text-gray-300">
            Join <strong className="text-white">{inviteInfo.organizationName}</strong>
          </p>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-900/50 rounded-lg p-3">
              {getRoleIcon(inviteInfo.role)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Role: <span className="capitalize">{getRoleDisplayName(inviteInfo.role)}</span>
              </h3>
              <p className="text-sm text-gray-300">
                {getRoleDescription(inviteInfo.role)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!user ? (
          <div className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">
                You need to sign in or create an account to accept this invitation.
              </p>
            </div>
            <button
              onClick={handleAcceptInvite}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Sign In to Accept Invitation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4 mb-2">
              <p className="text-sm text-gray-400 mb-1">Signed in as:</p>
              <p className="text-white font-medium">{user.email}</p>
            </div>

            <button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining Organization...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Accept Invitation
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
            >
              Decline
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            By accepting, you agree to join this organization and follow its guidelines.
          </p>
        </div>
      </div>
    </div>
  )
}
