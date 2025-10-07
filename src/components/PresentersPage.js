import React, { useState, useEffect } from 'react'
import { Users, Plus, Archive, CreditCard as Edit2, Mail, Phone, Loader as Loader2, CircleAlert as AlertCircle, Shield, Key, Copy, Check, Send, RefreshCw, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PresentersPage({ session }) {
  const [loading, setLoading] = useState(true)
  const [presenters, setPresenters] = useState([])
  const [organization, setOrganization] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPresenter, setEditingPresenter] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.user) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!memberData) {
        setLoading(false)
        return
      }

      const [orgResult, presentersResult] = await Promise.all([
        supabase
          .from('organizations')
          .select('*')
          .eq('id', memberData.organization_id)
          .single(),
        supabase
          .from('organization_presenters')
          .select('*')
          .eq('organization_id', memberData.organization_id)
          .eq('is_archived', false)
          .order('presenter_name')
      ])

      if (orgResult.data) setOrganization(orgResult.data)
      if (presentersResult.data) setPresenters(presentersResult.data)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load presenters')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPresenter = () => {
    if (!organization) return

    const activeCount = presenters.length
    if (activeCount >= organization.max_event_presenters) {
      alert(`You have reached your limit of ${organization.max_event_presenters} presenters. Please upgrade your subscription to add more.`)
      return
    }

    setEditingPresenter(null)
    setShowAddModal(true)
  }

  const handleEditPresenter = (presenter) => {
    setEditingPresenter(presenter)
    setShowAddModal(true)
  }

  const handleDeletePresenter = async (presenterId) => {
    if (!window.confirm('Are you sure you want to archive this presenter? They will no longer appear in your roster.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('organization_presenters')
        .update({ is_archived: true })
        .eq('id', presenterId)

      if (error) throw error

      await loadData()
    } catch (error) {
      console.error('Error archiving presenter:', error)
      alert('Failed to archive presenter')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const activeCount = presenters.length
  const maxCount = organization?.max_event_presenters || 3
  const percentUsed = Math.round((activeCount / maxCount) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Presentation Team</h1>
          <p className="text-gray-400">Manage your organization's presenter roster</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Presenter Slots</h2>
              <p className="text-sm text-gray-400">Organization admins are not counted in this limit</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{activeCount} / {maxCount}</div>
              <div className="text-sm text-gray-400">Active Presenters</div>
            </div>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                percentUsed >= 100 ? 'bg-red-500' : percentUsed >= 80 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>

          {percentUsed >= 80 && (
            <p className="text-sm text-yellow-400 mt-2">
              {percentUsed >= 100
                ? 'You have reached your presenter limit. Upgrade to add more presenters.'
                : 'You are approaching your presenter limit.'}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-400">
            {activeCount} {activeCount === 1 ? 'presenter' : 'presenters'}
          </div>
          <button
            onClick={handleAddPresenter}
            disabled={activeCount >= maxCount}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Presenter
          </button>
        </div>

        {presenters.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No presenters yet</h3>
            <p className="text-gray-400 mb-6">Add your first presenter to get started</p>
            <button
              onClick={handleAddPresenter}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Presenter
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Phone</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Times Used</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Last Used</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {presenters.map((presenter) => (
                  <tr key={presenter.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-white">{presenter.presenter_name}</div>
                        {presenter.access_pin && (
                          <Shield className="w-4 h-4 text-green-500" title="PIN Protected" />
                        )}
                        {presenter.pin_locked_until && new Date(presenter.pin_locked_until) > new Date() && (
                          <Lock className="w-4 h-4 text-red-500" title="Account Locked" />
                        )}
                      </div>
                      {presenter.notes && (
                        <div className="text-sm text-gray-400 mt-1">{presenter.notes}</div>
                      )}
                    </td>
                    <td className="p-4">
                      {presenter.email ? (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {presenter.email}
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {presenter.phone ? (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {presenter.phone}
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-300">{presenter.times_used}</td>
                    <td className="p-4 text-gray-300">
                      {presenter.last_used_at
                        ? new Date(presenter.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditPresenter(presenter)}
                          className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditPresenter(presenter)}
                          className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                          title="Manage PIN"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePresenter(presenter.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <PresenterModal
          presenter={editingPresenter}
          organizationId={organization?.id}
          onClose={() => {
            setShowAddModal(false)
            setEditingPresenter(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingPresenter(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}

function PresenterModal({ presenter, organizationId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    presenter_name: presenter?.presenter_name || '',
    email: presenter?.email || '',
    phone: presenter?.phone || '',
    notes: presenter?.notes || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPinSection, setShowPinSection] = useState(false)
  const [pinConfig, setPinConfig] = useState({
    pin: '',
    deliveryMethod: 'manual',
    expirationPolicy: 'never'
  })
  const [generatedPin, setGeneratedPin] = useState(presenter?.access_pin || '')
  const [pinCopied, setPinCopied] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    setGeneratedPin(pin)
    setPinConfig({ ...pinConfig, pin })
  }

  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(generatedPin)
    setPinCopied(true)
    setTimeout(() => setPinCopied(false), 2000)
  }

  const handleSendPinEmail = async (presenterId) => {
    if (!formData.email) {
      setError('Email address is required to send PIN')
      return
    }

    setSendingEmail(true)
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-presenter-pin`
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presenterId,
          pin: generatedPin,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send PIN email')
      }

      alert('PIN email sent successfully!')
    } catch (error) {
      console.error('Error sending PIN email:', error)
      setError('Failed to send PIN email')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleResetPin = async () => {
    if (!presenter?.id) return

    if (!window.confirm('Reset PIN? This will generate a new PIN and lock out the old one.')) {
      return
    }

    try {
      const newPin = Math.floor(1000 + Math.random() * 9000).toString()

      const { error } = await supabase
        .from('organization_presenters')
        .update({
          access_pin: newPin,
          pin_failed_attempts: 0,
          pin_locked_until: null,
          pin_created_at: new Date().toISOString(),
          pin_reset_count: (presenter.pin_reset_count || 0) + 1
        })
        .eq('id', presenter.id)

      if (error) throw error

      setGeneratedPin(newPin)
      setPinConfig({ ...pinConfig, pin: newPin })
      alert('PIN reset successfully!')
    } catch (error) {
      console.error('Error resetting PIN:', error)
      setError('Failed to reset PIN')
    }
  }

  const handleUnlockAccount = async () => {
    if (!presenter?.id) return

    try {
      const { error } = await supabase
        .from('organization_presenters')
        .update({
          pin_failed_attempts: 0,
          pin_locked_until: null
        })
        .eq('id', presenter.id)

      if (error) throw error

      alert('Account unlocked successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error unlocking account:', error)
      setError('Failed to unlock account')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.presenter_name.trim()) {
      setError('Presenter name is required')
      return
    }

    setSaving(true)
    try {
      let presenterId = presenter?.id

      if (presenter) {
        const { error } = await supabase
          .from('organization_presenters')
          .update({
            presenter_name: formData.presenter_name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            notes: formData.notes.trim() || null
          })
          .eq('id', presenter.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('organization_presenters')
          .insert({
            organization_id: organizationId,
            presenter_name: formData.presenter_name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            notes: formData.notes.trim() || null
          })
          .select()
          .single()

        if (error) throw error
        presenterId = data.id
      }

      if (generatedPin && showPinSection) {
        const pinUpdateData = {
          access_pin: generatedPin,
          pin_delivery_method: pinConfig.deliveryMethod,
          pin_expiration_policy: pinConfig.expirationPolicy,
          pin_created_at: new Date().toISOString(),
          pin_failed_attempts: 0,
          pin_locked_until: null
        }

        const { error: pinError } = await supabase
          .from('organization_presenters')
          .update(pinUpdateData)
          .eq('id', presenterId)

        if (pinError) throw pinError

        if (pinConfig.deliveryMethod === 'email' || pinConfig.deliveryMethod === 'both') {
          await handleSendPinEmail(presenterId)
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving presenter:', error)
      if (error.code === '23505') {
        setError('A presenter with this name already exists in your organization')
      } else {
        setError('Failed to save presenter')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          {presenter ? 'Edit Presenter' : 'Add Presenter'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Presenter Name *
            </label>
            <input
              type="text"
              value={formData.presenter_name}
              onChange={(e) => setFormData({ ...formData, presenter_name: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              Note: Admins can be added as presenters with their same email address
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="555-1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          {presenter && presenter.pin_locked_until && new Date(presenter.pin_locked_until) > new Date() && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-400">Account Locked</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Too many failed PIN attempts. Locked until {new Date(presenter.pin_locked_until).toLocaleString()}
              </p>
              <button
                type="button"
                onClick={handleUnlockAccount}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
              >
                Unlock Account
              </button>
            </div>
          )}

          <div className="border-t border-gray-700 pt-4">
            <button
              type="button"
              onClick={() => setShowPinSection(!showPinSection)}
              className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Shield className="w-4 h-4" />
              {presenter?.access_pin ? 'Manage PIN Security' : 'Add PIN Security (Optional)'}
            </button>

            {showPinSection && (
              <div className="mt-4 space-y-4 bg-gray-700/50 rounded-lg p-4">
                {presenter?.access_pin && (
                  <div className="bg-green-500/10 border border-green-500 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
                      <Shield className="w-4 h-4" />
                      PIN Protection Active
                    </div>
                    <div className="text-xs text-gray-400">
                      Created: {presenter.pin_created_at ? new Date(presenter.pin_created_at).toLocaleDateString() : 'Unknown'}
                      {presenter.pin_last_used_at && ` • Last used: ${new Date(presenter.pin_last_used_at).toLocaleDateString()}`}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleResetPin}
                        className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reset PIN
                      </button>
                      {presenter.email && (
                        <button
                          type="button"
                          onClick={() => handleSendPinEmail(presenter.id)}
                          disabled={sendingEmail}
                          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-3 py-1 rounded transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          {sendingEmail ? 'Sending...' : 'Email PIN'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!presenter?.access_pin && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Generate PIN
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={generatedPin}
                          onChange={(e) => setGeneratedPin(e.target.value)}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="----"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={generatePin}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Key className="w-4 h-4" />
                          Generate
                        </button>
                      </div>
                    </div>

                    {generatedPin && (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={copyPinToClipboard}
                            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {pinCopied ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy PIN
                              </>
                            )}
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">
                            PIN Delivery Method
                          </label>
                          <select
                            value={pinConfig.deliveryMethod}
                            onChange={(e) => setPinConfig({ ...pinConfig, deliveryMethod: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="manual">Manual (Copy & Share)</option>
                            <option value="email">Email Only</option>
                            <option value="both">Both (Email + Manual)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">
                            PIN Expiration Policy
                          </label>
                          <select
                            value={pinConfig.expirationPolicy}
                            onChange={(e) => setPinConfig({ ...pinConfig, expirationPolicy: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="never">Never Expire</option>
                            <option value="on_first_use">Expire After First Use</option>
                            <option value="on_event_end">Expire When Event Ends</option>
                          </select>
                        </div>

                        <div className="text-xs text-gray-400 bg-blue-500/10 border border-blue-500/30 rounded p-2">
                          <strong>Note:</strong> PIN will be saved when you click "{presenter ? 'Update' : 'Add'}" below.
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : presenter ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
