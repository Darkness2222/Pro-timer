import React, { useState, useEffect } from 'react'
import { Calendar, Plus, Users, Clock, Play, CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function EventsPage({ session, onEventSelect }) {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (session?.user) {
      loadEvents()
    }
  }, [session])

  const loadEvents = async () => {
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
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
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

  const filteredEvents = events.filter(event => {
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
            onClick={() => {
              console.log('Create Event button clicked')
              alert('Button clicked!')
              onEventSelect('create')
            }}
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
            { key: 'completed', label: 'Completed' }
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
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
      </div>
    </div>
  )
}
