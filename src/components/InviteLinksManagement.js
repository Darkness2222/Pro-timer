import React, { useState, useEffect } from 'react'
import { Link2, Trash2, X, Copy, Check, QrCode, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { getOrganizationInviteLinks, deactivateInviteLink, deleteInviteLink, generateInviteLinkUrl, copyToClipboard, getInviteLinkUsage } from '../lib/inviteUtils'
import { getRoleDisplayName } from '../lib/roleUtils'
import InviteQRCodeModal from './InviteQRCodeModal'

export default function InviteLinksManagement({ organizationId, organizationName }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [usageData, setUsageData] = useState([])
  const [loadingUsage, setLoadingUsage] = useState(false)

  useEffect(() => {
    loadLinks()
  }, [organizationId])

  const loadLinks = async () => {
    setLoading(true)
    const { data, error } = await getOrganizationInviteLinks(organizationId)
    if (!error && data) {
      setLinks(data)
    }
    setLoading(false)
  }

  const handleCopyLink = async (link) => {
    const url = generateInviteLinkUrl(link.token)
    const success = await copyToClipboard(url)
    if (success) {
      setCopied(link.id)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handleDeactivate = async (linkId) => {
    if (!window.confirm('Are you sure you want to deactivate this invite link?')) return

    const { success } = await deactivateInviteLink(linkId)
    if (success) {
      loadLinks()
    } else {
      alert('Failed to deactivate link')
    }
  }

  const handleDelete = async (linkId) => {
    if (!window.confirm('Are you sure you want to permanently delete this invite link? This cannot be undone.')) return

    const { success } = await deleteInviteLink(linkId)
    if (success) {
      loadLinks()
    } else {
      alert('Failed to delete link')
    }
  }

  const handleShowQR = (link) => {
    setSelectedLink(link)
    setShowQRModal(true)
  }

  const handleShowUsage = async (link) => {
    setSelectedLink(link)
    setShowUsageModal(true)
    setLoadingUsage(true)
    const { data } = await getInviteLinkUsage(link.id)
    if (data) {
      setUsageData(data)
    }
    setLoadingUsage(false)
  }

  const isExpired = (link) => {
    return link.expires_at && new Date(link.expires_at) < new Date()
  }

  const isMaxedOut = (link) => {
    return link.max_uses && link.current_uses >= link.max_uses
  }

  if (loading) {
    return (
      <div className="bg-gray-700/30 rounded-lg p-6">
        <p className="text-gray-300 text-center">Loading invite links...</p>
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className="bg-gray-700/30 rounded-lg p-6">
        <p className="text-gray-300 text-center">No shareable invite links yet.</p>
        <p className="text-gray-400 text-sm text-center mt-2">Create one using the "Shareable Link" tab above.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {links.map((link) => {
          const url = generateInviteLinkUrl(link.token)
          const expired = isExpired(link)
          const maxedOut = isMaxedOut(link)
          const inactive = !link.is_active || expired || maxedOut

          return (
            <div
              key={link.id}
              className={`bg-gray-700/50 rounded-lg p-4 border ${
                inactive ? 'border-gray-600 opacity-60' : 'border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">
                      {link.label || 'Unnamed Link'}
                    </h4>
                    {inactive && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                        {!link.is_active ? 'Inactive' : expired ? 'Expired' : 'Max Uses Reached'}
                      </span>
                    )}
                    {link.is_active && !expired && !maxedOut && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 capitalize">
                    Role: {getRoleDisplayName(link.role)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {link.is_active && !expired && !maxedOut && (
                    <>
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Copy link"
                      >
                        {copied === link.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleShowQR(link)}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                        title="Show QR code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleShowUsage(link)}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                    title="View usage"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {link.is_active && (
                    <button
                      onClick={() => handleDeactivate(link.id)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="Deactivate"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <p className="text-gray-400">Uses</p>
                  <p className="text-white font-medium">
                    {link.current_uses} / {link.max_uses || '∞'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Expires</p>
                  <p className="text-white font-medium">
                    {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Created</p>
                  <p className="text-white font-medium">
                    {new Date(link.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-600/50 rounded px-3 py-2 text-xs">
                <p className="text-gray-300 truncate">{url}</p>
              </div>
            </div>
          )
        })}
      </div>

      {showQRModal && selectedLink && (
        <InviteQRCodeModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false)
            setSelectedLink(null)
          }}
          inviteUrl={generateInviteLinkUrl(selectedLink.token)}
          organizationName={organizationName}
          role={selectedLink.role}
        />
      )}

      {showUsageModal && selectedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Link Usage History</h3>
                <button
                  onClick={() => {
                    setShowUsageModal(false)
                    setSelectedLink(null)
                    setUsageData([])
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                {selectedLink.label || 'Unnamed Link'} - {selectedLink.current_uses} total uses
              </p>
            </div>

            <div className="p-6">
              {loadingUsage ? (
                <p className="text-gray-300 text-center">Loading usage data...</p>
              ) : usageData.length === 0 ? (
                <p className="text-gray-300 text-center">No one has used this link yet.</p>
              ) : (
                <div className="space-y-3">
                  {usageData.map((usage) => (
                    <div key={usage.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium">{usage.email}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(usage.accepted_at).toLocaleString()}
                          </p>
                        </div>
                        {usage.user && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            Joined
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
