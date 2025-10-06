import React, { useState, useEffect } from 'react'
import { Calendar, Plus, Users, Clock, Play, CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2, Trash2, RotateCcw, TriangleAlert as AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { checkIsAdmin } from '../lib/adminUtils'

export default function EventsPage({ session, onEventSelect }) {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [deletedEvents, setDeletedEvents] = useState([])
  const [filter, setFilter] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmEventName, setConfirmEventName] = useState('')

  useEffect(() => {
    if (session?.user) {
      checkAdminStatus()
      loadEvents()
    }
  }, [session])

  const checkAdminStatus = async () => {
    if (session?.user) {
      const adminStatus = await checkIsAdmin(session.user.id)
      setIsAdmin(adminStatus)
    }
  }

  const loadEvents = async () => {
    setLoading(true)
    try {
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!memberData) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          timers (
            id,
            name,
            presenter_name,
            duration,
            status,
            presentation_order
          )
        `)
        .eq('organization_id', memberData.organization_id)
        .order('event_date', { ascending: false })

      if (error) throw error

      setEvents(data || [])

      if (memberData.role === 'admin') {
        const { data: deletedData, error: deletedError } = await supabase
          .from('events')
          .select(`
            *,
            deleted_by_user:deleted_by (
              email
            ),
            timers (
              id,
              name,
              presenter_name,
              duration
            )
          `)
          .eq('organization_id', memberData.organization_id)
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false })

        if (!deletedError) {
          setDeletedEvents(deletedData || [])
        }

        await checkAndDeleteExpired()
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAndDeleteExpired = async () => {
    try {
      const { data, error } = await supabase.rpc('check_and_delete_expired_events')
      if (error) {
        console.error('Error checking expired events:', error)
      } else if (data && data > 0) {
        console.log(`Automatically deleted ${data} expired events`)
        await loadEvents()
      }
    } catch (error) {
      console.error('Error in checkAndDeleteExpired:', error)
    }
  }

  const getEventStats = (event) => {
    const timers = event.timers || []
    const totalPresenters = timers.length
    const completedPresenters = timers.filter(t => t.status === 'completed' || t.status === 'finished_early').length
    const totalDuration = timers.reduce((sum, t) => sum + t.duration, 0)

    return {
      totalPresenters,
      completedPresenters,
      totalDuration: Math.floor(totalDuration / 60),
      progress: totalPresenters > 0 ? Math.round((completedPresenters / totalPresenters) * 100) : 0
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'text-blue-400 bg-blue-400/10'
      case 'in_progress': return 'text-green-400 bg-green-400/10'
      case 'completed': return 'text-gray-400 bg-gray-400/10'
      case 'cancelled': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4" />
      case 'in_progress': return <Play className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getDaysRemaining = (deletedAt) => {
    if (!deletedAt) return 0
    const now = new Date()
    const deleted = new Date(deletedAt)
    const diffTime = now - deleted
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, 5 - diffDays)
  }

  const getUrgencyColor = (daysRemaining) => {
    if (daysRemaining >= 4) return 'text-green-400 bg-green-400/10'
    if (daysRemaining >= 2) return 'text-yellow-400 bg-yellow-400/10'
    return 'text-red-400 bg-red-400/10'
  }

  const handleRestore = async () => {
    if (!selectedEvent) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('events')
        .update({
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', selectedEvent.id)

      if (error) throw error

      await loadEvents()
      setShowRestoreModal(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error restoring event:', error)
      alert('Failed to restore event: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (!selectedEvent) return
    if (confirmEventName !== selectedEvent.name) {
      alert('Event name does not match. Please type the exact event name to confirm.')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', selectedEvent.id)

      if (error) throw error

      await loadEvents()
      setShowDeleteModal(false)
      setSelectedEvent(null)
      setConfirmEventName('')
    } catch (error) {
      console.error('Error permanently deleting event:', error)
      alert('Failed to permanently delete event: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredEvents = filter === 'deleted' ? deletedEvents : events.filter(event => {
    if (filter === 'all') return true
    return event.status === filter
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Events</h1>
            <p className="text-gray-400">Manage your multi-presenter events</p>
          </div>
          <button
            onClick={() => onEventSelect('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
            ...(isAdmin ? [{ key: 'deleted', label: 'Recently Deleted' }] : [])
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filter === 'deleted' && isAdmin && deletedEvents.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Automatic Deletion Policy</p>
                <p>Events are automatically and permanently deleted 5 days after being moved to this section. All associated data including timers, sessions, and logs will be permanently removed.</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            {filter === 'deleted' ? (
              <>
                <Trash2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Deleted Events</h3>
                <p className="text-gray-400">
                  Events you delete will appear here for 5 days before permanent removal
                </p>
              </>
            ) : (
              <>
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
                <p className="text-gray-400 mb-6">
                  {filter === 'all'
                    ? 'Create your first event to get started'
                    : `No ${filter} events`
                  }
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => onEventSelect('create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Event
                  </button>
                )}
              </>
            )}
          </div>
        ) : filter === 'deleted' ? (
          <div className="space-y-4">
            {filteredEvents.map(event => {
              const daysRemaining = getDaysRemaining(event.deleted_at)
              const urgencyColor = getUrgencyColor(daysRemaining)
              const stats = getEventStats(event)

              return (
                <div
                  key={event.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                      {event.description && (
                        <p className="text-gray-400 text-sm mb-3">{event.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.event_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Deleted by: {event.deleted_by_user?.email || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Deleted: {formatDate(event.deleted_at)}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${urgencyColor}`}>
                      {daysRemaining === 0 ? (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          <span>Deleting today</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      {stats.totalPresenters} presenter{stats.totalPresenters === 1 ? '' : 's'} •
                      Status: <span className="capitalize">{event.status?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(event)
                          setShowRestoreModal(true)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(event)
                          setShowDeleteModal(true)
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              const stats = getEventStats(event)
              return (
                <div
                  key={event.id}
                  onClick={() => onEventSelect(event.id)}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {event.name}
                    </h3>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      <span className="capitalize">{event.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(event.event_date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Users className="w-4 h-4 text-gray-400" />
                      {stats.totalPresenters} {stats.totalPresenters === 1 ? 'Presenter' : 'Presenters'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {stats.totalDuration} minutes total
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Progress</span>
                      <span className="text-sm font-medium text-white">{stats.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {stats.completedPresenters} of {stats.totalPresenters} completed
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showRestoreModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Restore Event?</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to restore "<span className="font-semibold text-white">{selectedEvent.name}</span>"?
                The event will be moved back to your active events list with its original status.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRestore}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Restore Event
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRestoreModal(false)
                    setSelectedEvent(null)
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-red-700">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-white">Permanent Deletion</h3>
              </div>
              <p className="text-gray-300 mb-4">
                This action <span className="text-red-400 font-semibold">cannot be undone</span>.
                The event and all associated data will be permanently deleted, including:
              </p>
              <ul className="text-gray-400 text-sm mb-6 space-y-1 list-disc list-inside">
                <li>All timers and presenter information</li>
                <li>Timer sessions and logs</li>
                <li>Messages and access records</li>
                <li>Event history and reports</li>
              </ul>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type the event name to confirm: <span className="font-bold text-white">{selectedEvent.name}</span>
                </label>
                <input
                  type="text"
                  value={confirmEventName}
                  onChange={(e) => setConfirmEventName(e.target.value)}
                  placeholder="Enter event name"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePermanentDelete}
                  disabled={actionLoading || confirmEventName !== selectedEvent.name}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedEvent(null)
                    setConfirmEventName('')
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
