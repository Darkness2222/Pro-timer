import React, { useState, useEffect } from 'react'
import { X, Calendar, Search, Check, Filter } from 'lucide-react'

export default function EventFilterModal({
  isOpen,
  onClose,
  events = [],
  selectedEventIds = [],
  dateRange = { start: '', end: '' },
  onApply
}) {
  const [localSelectedIds, setLocalSelectedIds] = useState(selectedEventIds)
  const [localDateRange, setLocalDateRange] = useState(dateRange)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(selectedEventIds)
      setLocalDateRange(dateRange)
      setSearchQuery('')
    }
  }, [isOpen, selectedEventIds, dateRange])

  const handleToggleEvent = (eventId) => {
    if (localSelectedIds.includes(eventId)) {
      setLocalSelectedIds(localSelectedIds.filter(id => id !== eventId))
    } else {
      setLocalSelectedIds([...localSelectedIds, eventId])
    }
  }

  const handleSelectAll = () => {
    const filtered = getFilteredEvents()
    setLocalSelectedIds(filtered.map(e => e.id))
  }

  const handleClearAll = () => {
    setLocalSelectedIds([])
  }

  const handleQuickDateRange = (range) => {
    const now = new Date()
    let startDate = new Date()

    switch(range) {
      case 'last7':
        startDate.setDate(now.getDate() - 7)
        break
      case 'last30':
        startDate.setDate(now.getDate() - 30)
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'lastQuarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'all':
        setLocalDateRange({ start: '', end: '' })
        return
      default:
        return
    }

    setLocalDateRange({
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    })
  }

  const handleApply = () => {
    onApply(localSelectedIds, localDateRange)
    onClose()
  }

  const getFilteredEvents = () => {
    let filtered = events

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query))
      )
    }

    return filtered
  }

  const getEventsByStatus = (status) => {
    return getFilteredEvents().filter(e => e.status === status)
  }

  if (!isOpen) return null

  const filteredEvents = getFilteredEvents()
  const upcomingEvents = getEventsByStatus('upcoming')
  const inProgressEvents = getEventsByStatus('in_progress')
  const completedEvents = getEventsByStatus('completed')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Select Events & Date Range</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Date Range Filter</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={localDateRange.start}
                    onChange={(e) => setLocalDateRange({ ...localDateRange, start: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={localDateRange.end}
                    onChange={(e) => setLocalDateRange({ ...localDateRange, end: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDateRange('last7')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDateRange('last30')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDateRange('thisMonth')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDateRange('lastQuarter')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
                >
                  Last Quarter
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDateRange('all')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
                >
                  All Time
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {localSelectedIds.length} event{localSelectedIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
              <p className="text-gray-400">
                {searchQuery ? 'Try adjusting your search query' : 'Create your first event to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {inProgressEvents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    In Progress ({inProgressEvents.length})
                  </h3>
                  <div className="space-y-2">
                    {inProgressEvents.map(event => (
                      <EventCheckboxItem
                        key={event.id}
                        event={event}
                        isSelected={localSelectedIds.includes(event.id)}
                        onToggle={handleToggleEvent}
                      />
                    ))}
                  </div>
                </div>
              )}

              {upcomingEvents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Upcoming ({upcomingEvents.length})
                  </h3>
                  <div className="space-y-2">
                    {upcomingEvents.map(event => (
                      <EventCheckboxItem
                        key={event.id}
                        event={event}
                        isSelected={localSelectedIds.includes(event.id)}
                        onToggle={handleToggleEvent}
                      />
                    ))}
                  </div>
                </div>
              )}

              {completedEvents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    Completed ({completedEvents.length})
                  </h3>
                  <div className="space-y-2">
                    {completedEvents.map(event => (
                      <EventCheckboxItem
                        key={event.id}
                        event={event}
                        isSelected={localSelectedIds.includes(event.id)}
                        onToggle={handleToggleEvent}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 p-6 bg-gray-800">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply Filters ({localSelectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EventCheckboxItem({ event, isSelected, onToggle }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'No date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-400/10 text-blue-400 border-blue-400/30'
      case 'in_progress': return 'bg-green-400/10 text-green-400 border-green-400/30'
      case 'completed': return 'bg-gray-400/10 text-gray-400 border-gray-400/30'
      case 'cancelled': return 'bg-red-400/10 text-red-400 border-red-400/30'
      default: return 'bg-gray-400/10 text-gray-400 border-gray-400/30'
    }
  }

  return (
    <div
      onClick={() => onToggle(event.id)}
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-blue-500 border-blue-500'
            : 'bg-gray-800 border-gray-600'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-white font-semibold truncate">{event.name}</h4>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${getStatusColor(event.status)}`}>
              {event.status?.replace('_', ' ')}
            </span>
          </div>

          {event.description && (
            <p className="text-gray-400 text-sm mb-2 line-clamp-1">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(event.event_date)}
            </div>
            {event.timers && (
              <div>
                {event.timers.length} presenter{event.timers.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
