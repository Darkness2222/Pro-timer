import React, { useState, useEffect } from 'react'
import { Users, Plus, Archive, CreditCard as Edit2, Trash2, Mail, Phone, FileText, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react'
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
                      <div className="font-medium text-white">{presenter.presenter_name}</div>
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.presenter_name.trim()) {
      setError('Presenter name is required')
      return
    }

    setSaving(true)
    try {
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
        const { error } = await supabase
          .from('organization_presenters')
          .insert({
            organization_id: organizationId,
            presenter_name: formData.presenter_name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            notes: formData.notes.trim() || null
          })

        if (error) throw error
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6">
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
