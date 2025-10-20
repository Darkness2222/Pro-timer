import React, { useState } from 'react'
import { X, Mail, Link2, UserPlus, Copy, Check, QrCode, Loader as Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ROLES, getRoleDisplayName } from '../lib/roleUtils'
import { createInviteLink, generateInviteLinkUrl, copyToClipboard } from '../lib/inviteUtils'
import InviteQRCodeModal from './InviteQRCodeModal'

export default function EnhancedInviteModal({ organization, onClose, onInviteSent, session, planInfo }) {
  const [activeTab, setActiveTab] = useState('email')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLES.ADMIN)
  const [loading, setLoading] = useState(false)
  const [linkLabel, setLinkLabel] = useState('')
  const [linkExpires, setLinkExpires] = useState('never')
  const [linkMaxUses, setLinkMaxUses] = useState('unlimited')
  const [generatedLink, setGeneratedLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)

  const handleEmailInvite = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organization.id,
          email: email.toLowerCase().trim(),
          role: role,
          invited_by: session.user.id,
          invite_method: 'email'
        })

      if (error) throw error

      alert('Email invitation sent successfully!')
      setEmail('')
      onInviteSent()
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Failed to send invitation. The email may already be invited.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLink = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let expiresIn = null
      if (linkExpires === '24h') expiresIn = 24
      else if (linkExpires === '7d') expiresIn = 24 * 7
      else if (linkExpires === '30d') expiresIn = 24 * 30

      let maxUses = null
      if (linkMaxUses !== 'unlimited') {
        maxUses = parseInt(linkMaxUses)
      }

      const { data, error } = await createInviteLink(organization.id, role, {
        label: linkLabel || null,
        expiresIn,
        maxUses
      })

      if (error) throw error

      const inviteUrl = generateInviteLinkUrl(data.token)
      setGeneratedLink({ ...data, url: inviteUrl })
      onInviteSent()
    } catch (error) {
      console.error('Error generating invite link:', error)
      alert('Failed to generate invite link.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return
    const success = await copyToClipboard(generatedLink.url)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShowQR = () => {
    if (generatedLink) {
      setShowQRModal(true)
    }
  }

  const handleManualAdd = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()

      if (userError && userError.code !== 'PGRST116') throw userError

      if (!existingUser) {
        alert('No user found with that email address. Please invite them via email invitation instead.')
        setLoading(false)
        return
      }

      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (existingMember) {
        alert('This user is already a member of your organization.')
        setLoading(false)
        return
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: existingUser.id,
          role: role,
          invited_by: session.user.id,
          joined_at: new Date().toISOString()
        })

      if (memberError) throw memberError

      alert('Team member added successfully!')
      setEmail('')
      onInviteSent()
    } catch (error) {
      console.error('Error adding team member:', error)
      alert('Failed to add team member.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
        <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Invite Team Members</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> The organization owner does not count toward your user limit.
                Current usage: {planInfo.currentUsers} of {planInfo.maxUsers === -1 ? 'unlimited' : planInfo.maxUsers} users
              </p>
            </div>

            <div className="flex gap-2 mt-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('email')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email Invitation
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'link'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Link2 className="w-4 h-4" />
                Shareable Link
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Manual Add
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'email' && (
              <form onSubmit={handleEmailInvite} className="space-y-4">
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-300">
                    Send an email invitation to someone who isn't part of your organization yet. They'll receive an email with instructions to join.
                  </p>
                </div>

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
                      Send Email Invitation
                    </>
                  )}
                </button>
              </form>
            )}

            {activeTab === 'link' && (
              <form onSubmit={handleGenerateLink} className="space-y-4">
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-300">
                    Create a shareable link that anyone can use to join your organization. Perfect for sharing in chat, social media, or generating QR codes.
                  </p>
                </div>

                {!generatedLink ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Link Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={linkLabel}
                        onChange={(e) => setLinkLabel(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Conference Presenters, Team Members"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Help identify where this link is used
                      </p>
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
                        <option value={ROLES.ADMIN}>Admin</option>
                        <option value={ROLES.PRESENTER}>Presenter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Link Expiration
                      </label>
                      <select
                        value={linkExpires}
                        onChange={(e) => setLinkExpires(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="never">Never expires</option>
                        <option value="24h">24 hours</option>
                        <option value="7d">7 days</option>
                        <option value="30d">30 days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Maximum Uses
                      </label>
                      <select
                        value={linkMaxUses}
                        onChange={(e) => setLinkMaxUses(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="unlimited">Unlimited</option>
                        <option value="1">1 use</option>
                        <option value="5">5 uses</option>
                        <option value="10">10 uses</option>
                        <option value="25">25 uses</option>
                        <option value="50">50 uses</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Generate Shareable Link
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                      <p className="text-green-400 font-medium mb-2">Link Generated Successfully!</p>
                      <p className="text-sm text-gray-300">Share this link to invite team members.</p>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-2">Your Invitation Link:</p>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          value={generatedLink.url}
                          readOnly
                          className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={handleShowQR}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        Generate QR Code
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-700/30 rounded p-3">
                        <p className="text-gray-400 text-xs mb-1">Role</p>
                        <p className="text-white font-medium capitalize">{getRoleDisplayName(generatedLink.role)}</p>
                      </div>
                      <div className="bg-gray-700/30 rounded p-3">
                        <p className="text-gray-400 text-xs mb-1">Expires</p>
                        <p className="text-white font-medium">
                          {generatedLink.expires_at ? new Date(generatedLink.expires_at).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div className="bg-gray-700/30 rounded p-3">
                        <p className="text-gray-400 text-xs mb-1">Uses</p>
                        <p className="text-white font-medium">
                          {generatedLink.current_uses} / {generatedLink.max_uses || '∞'}
                        </p>
                      </div>
                      <div className="bg-gray-700/30 rounded p-3">
                        <p className="text-gray-400 text-xs mb-1">Status</p>
                        <p className="text-white font-medium">
                          {generatedLink.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setGeneratedLink(null)
                        setLinkLabel('')
                        setLinkExpires('never')
                        setLinkMaxUses('unlimited')
                      }}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Create Another Link
                    </button>
                  </div>
                )}
              </form>
            )}

            {activeTab === 'manual' && (
              <form onSubmit={handleManualAdd} className="space-y-4">
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-300">
                    Add an existing user to your organization by their email address. This only works for users who already have an account.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    User Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="existing.user@example.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Must be an email of someone who already has an account
                  </p>
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Team Member
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {showQRModal && generatedLink && (
        <InviteQRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          inviteUrl={generatedLink.url}
          organizationName={organization.name}
          role={generatedLink.role}
        />
      )}
    </>
  )
}
