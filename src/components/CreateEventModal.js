import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Users, Loader as Loader2, CircleAlert as AlertCircle, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function CreateEventModal({ isOpen, onClose, session, onEventCreated }) {
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState(null)
  const [organizationPresenters, setOrganizationPresenters] = useState([])
  const [maxPresenters, setMaxPresenters] = useState(3)
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [bufferDuration, setBufferDuration] = useState(0)
  const [autoStartNext, setAutoStartNext] = useState(false)
  const [presenters, setPresenters] = useState([
    { name: '', topic: '', duration: 5 }
  ])
  const [showAddNewPresenter, setShowAddNewPresenter] = useState(false)
  const [newPresenterName, setNewPresenterName] = useState('')

  useEffect(() => {
    if (isOpen && session?.user) {
      loadOrganization()
    }
  }, [isOpen, session])

  const loadOrganization = async () => {
    if (!session?.user?.id) {
      console.error('No user session')
      return
    }

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading organization:', error)
        alert('Error loading organization: ' + error.message)
        return
      }

      if (data) {
        console.log('Organization loaded:', data.organization_id)
        setOrganizationId(data.organization_id)

        const [orgResult, presentersResult] = await Promise.all([
          supabase
            .from('organizations')
            .select('max_event_presenters')
            .eq('id', data.organization_id)
            .single(),
          supabase
            .from('organization_presenters')
            .select('*')
            .eq('organization_id', data.organization_id)
            .eq('is_archived', false)
            .order('presenter_name')
        ])

        if (orgResult.data) {
          setMaxPresenters(orgResult.data.max_event_presenters || 3)
        }
        if (presentersResult.data) {
          setOrganizationPresenters(presentersResult.data)
        }
      } else {
        console.error('No organization found for user')
        alert('No organization found. Please contact support.')
      }
    } catch (error) {
      console.error('Error loading organization:', error)
      alert('Error loading organization: ' + error.message)
    }
  }

  const handleAddNewPresenterToOrg = async () => {
    if (!newPresenterName.trim()) {
      alert('Please enter a presenter name')
      return
    }

    if (organizationPresenters.length >= maxPresenters) {
      alert(`You have reached your limit of ${maxPresenters} presenters. Please upgrade your subscription.`)
      return
    }

    try {
      const { data, error } = await supabase
        .from('organization_presenters')
        .insert({
          organization_id: organizationId,
          presenter_name: newPresenterName.trim()
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          alert('A presenter with this name already exists')
        } else {
          throw error
        }
        return
      }

      setOrganizationPresenters([...organizationPresenters, data])
      setNewPresenterName('')
      setShowAddNewPresenter(false)
      alert('Presenter added to your organization roster!')
    } catch (error) {
      console.error('Error adding presenter:', error)
      alert('Failed to add presenter')
    }
  }

  const handleAddPresenter = () => {
    setPresenters([...presenters, { name: '', topic: '', duration: 5 }])
  }

  const handleRemovePresenter = (index) => {
    if (presenters.length > 1) {
      setPresenters(presenters.filter((_, i) => i !== index))
    }
  }

  const handlePresenterChange = (index, field, value) => {
    const updated = [...presenters]
    updated[index][field] = value
    setPresenters(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (presenters.some(p => !p.name || !p.topic)) {
      alert('Please fill in all presenter details')
      return
    }

    setLoading(true)

    try {
      // Get organization ID fresh if not loaded
      let orgId = organizationId
      if (!orgId) {
        console.log('Organization ID not in state, fetching...')
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (error || !data) {
          throw new Error('Organization not found')
        }
        orgId = data.organization_id
      }

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          organization_id: orgId,
          name: eventName,
          description: eventDescription,
          event_date: eventDate || null,
          buffer_duration: bufferDuration,
          auto_start_next: autoStartNext,
          status: 'upcoming',
          created_by: session.user.id
        })
        .select()
        .single()

      if (eventError) throw eventError

      const timersToInsert = presenters.map((presenter, index) => ({
        name: presenter.topic,
        presenter_name: presenter.name,
        duration: presenter.duration * 60,
        user_id: session.user.id,
        event_id: eventData.id,
        presentation_order: index + 1,
        timer_type: 'event',
        status: 'active'
      }))

      const { data: timersData, error: timersError } = await supabase
        .from('timers')
        .insert(timersToInsert)
        .select()

      if (timersError) throw timersError

      const assignmentsToInsert = presenters.map((presenter, index) => ({
        event_id: eventData.id,
        presenter_name: presenter.name,
        timer_id: timersData[index].id
      }))

      const { error: assignmentsError } = await supabase
        .from('event_presenter_assignments')
        .insert(assignmentsToInsert)

      if (assignmentsError) throw assignmentsError

      alert('Event created successfully!')
      onEventCreated()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEventName('')
    setEventDescription('')
    setEventDate('')
    setBufferDuration(0)
    setAutoStartNext(false)
    setPresenters([{ name: '', topic: '', duration: 5 }])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Create Event</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                }
              }}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Annual Conference 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the event..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Date & Time
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buffer Time (seconds)
              </label>
              <input
                type="number"
                value={bufferDuration}
                onChange={(e) => setBufferDuration(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                  }
                }}
                min="0"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-400 mt-1">Time between presenters</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <input
                  type="checkbox"
                  checked={autoStartNext}
                  onChange={(e) => setAutoStartNext(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
                Auto-start next presenter
              </label>
              <p className="text-xs text-gray-400 mt-1">Automatically start the next presenter after buffer</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Presenters *
              </label>
              <button
                type="button"
                onClick={handleAddPresenter}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Presenter
              </button>
            </div>

            <div className="space-y-4">
              {presenters.map((presenter, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-gray-300">Presenter {index + 1}</div>
                    {presenters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePresenter(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Presenter Name</label>
                      <select
                        value={presenter.name}
                        onChange={(e) => handlePresenterChange(index, 'name', e.target.value)}
                        required
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select presenter...</option>
                        {organizationPresenters.map((p) => (
                          <option key={p.id} value={p.presenter_name}>
                            {p.presenter_name}
                          </option>
                        ))}
                      </select>
                      {organizationPresenters.length === 0 && (
                        <p className="text-xs text-yellow-400 mt-1">
                          No presenters in roster. Add one below or go to Presenters page.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Topic/Title</label>
                      <input
                        type="text"
                        value={presenter.topic}
                        onChange={(e) => handlePresenterChange(index, 'topic', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                          }
                        }}
                        required
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Opening Keynote"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        value={presenter.duration}
                        onChange={(e) => handlePresenterChange(index, 'duration', parseInt(e.target.value) || 5)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                          }
                        }}
                        required
                        min="1"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <button
              type="button"
              onClick={() => setShowAddNewPresenter(!showAddNewPresenter)}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add new presenter to organization roster
            </button>

            {showAddNewPresenter && (
              <div className="mt-3 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <p className="text-sm text-gray-300">
                    Adding to organization roster ({organizationPresenters.length}/{maxPresenters} used)
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresenterName}
                    onChange={(e) => setNewPresenterName(e.target.value)}
                    placeholder="Enter presenter name..."
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNewPresenterToOrg()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewPresenterToOrg}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
