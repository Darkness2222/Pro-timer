import React, { useState, useEffect, memo } from 'react'
import { Calendar, ArrowLeft, TrendingUp, TrendingDown, Minus, ChartBar as BarChart2, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import EventFilterModal from './EventFilterModal'

function EventComparisonReport({ session, onBack, preselectedEventIds = [], preselectedDateRange = { start: '', end: '' } }) {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [selectedEvents, setSelectedEvents] = useState(preselectedEventIds)
  const [dateRangeFilter, setDateRangeFilter] = useState(preselectedDateRange)
  const [showEventFilterModal, setShowEventFilterModal] = useState(false)
  const [comparisonData, setComparisonData] = useState(null)
  const [viewMode, setViewMode] = useState('comparison')

  useEffect(() => {
    if (session?.user) {
      loadEvents()
    }
  }, [session])

  useEffect(() => {
    if (selectedEvents.length > 0) {
      generateComparison()
    } else {
      setComparisonData(null)
    }
  }, [selectedEvents])

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

      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          timers(
            id,
            name,
            presenter_name,
            duration,
            status
          )
        `)
        .eq('organization_id', memberData.organization_id)
        .is('deleted_at', null)
        .in('status', ['completed', 'in_progress'])
        .order('event_date', { ascending: false })

      if (error) throw error

      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateComparison = async () => {
    try {
      const comparisons = await Promise.all(
        selectedEvents.map(async (eventId) => {
          const event = events.find(e => e.id === eventId)
          if (!event) return null

          const { data: logs } = await supabase
            .from('timer_logs')
            .select('*')
            .in('timer_id', event.timers.map(t => t.id))

          const completedTimers = event.timers.filter(t =>
            t.status === 'completed' || t.status === 'finished_early' || t.status === 'expired'
          )

          let totalPlanned = 0
          let totalActual = 0
          let earlyCount = 0
          let onTimeCount = 0
          let overtimeCount = 0
          let timeSaved = 0
          let timeLost = 0

          completedTimers.forEach(timer => {
            totalPlanned += timer.duration

            const finishLog = logs?.find(log =>
              log.timer_id === timer.id &&
              (log.action === 'finished' || log.action === 'expired')
            )

            const overtimeLogs = logs?.filter(log =>
              log.timer_id === timer.id &&
              log.overtime_seconds && log.overtime_seconds > 0
            ) || []

            const maxOvertime = Math.max(0, ...overtimeLogs.map(l => l.overtime_seconds))

            let actualTime = timer.duration
            if (finishLog && finishLog.time_value !== null) {
              actualTime = timer.duration - finishLog.time_value
            }

            totalActual += actualTime

            const variance = actualTime - timer.duration

            if (variance < -30) {
              earlyCount++
              timeSaved += Math.abs(variance)
            } else if (variance > 30 || maxOvertime > 0) {
              overtimeCount++
              timeLost += variance > 0 ? variance : maxOvertime
            } else {
              onTimeCount++
            }
          })

          const netEfficiency = timeSaved - timeLost
          let efficiencyRating = 'Good'
          if (netEfficiency > 300) efficiencyRating = 'Excellent'
          else if (netEfficiency > 0) efficiencyRating = 'Good'
          else if (netEfficiency > -300) efficiencyRating = 'Fair'
          else efficiencyRating = 'Needs Improvement'

          return {
            event,
            stats: {
              totalPresenters: event.timers.length,
              completedPresenters: completedTimers.length,
              totalPlanned,
              totalActual,
              earlyCount,
              onTimeCount,
              overtimeCount,
              timeSaved,
              timeLost,
              netEfficiency,
              efficiencyRating,
              completionRate: event.timers.length > 0
                ? (completedTimers.length / event.timers.length) * 100
                : 0
            }
          }
        })
      )

      setComparisonData(comparisons.filter(c => c !== null))
    } catch (error) {
      console.error('Error generating comparison:', error)
    }
  }

  const handleApplyFilters = (eventIds, dateRange) => {
    setSelectedEvents(eventIds)
    setDateRangeFilter(dateRange)
  }

  const getFilterSummary = () => {
    const parts = []

    if (selectedEvents.length === 0) {
      parts.push('No events selected')
    } else if (selectedEvents.length === 1) {
      const event = events.find(e => e.id === selectedEvents[0])
      parts.push(event?.name || '1 Event')
    } else {
      parts.push(`${selectedEvents.length} Events`)
    }

    if (dateRangeFilter.start && dateRangeFilter.end) {
      const start = new Date(dateRangeFilter.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const end = new Date(dateRangeFilter.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      parts.push(`${start} - ${end}`)
    } else if (dateRangeFilter.start) {
      parts.push(`From ${new Date(dateRangeFilter.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
    } else if (dateRangeFilter.end) {
      parts.push(`Until ${new Date(dateRangeFilter.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
    }

    return parts.join(' • ')
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${secs}s`
  }

  const getEfficiencyColor = (rating) => {
    switch (rating) {
      case 'Excellent': return 'text-green-400'
      case 'Good': return 'text-blue-400'
      case 'Fair': return 'text-yellow-400'
      case 'Needs Improvement': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getComparisonIcon = (currentValue, previousValue) => {
    if (!previousValue) return <Minus className="w-4 h-4 text-gray-400" />
    if (currentValue > previousValue) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (currentValue < previousValue) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getPercentageChange = (currentValue, previousValue) => {
    if (!previousValue || previousValue === 0) return null
    const change = ((currentValue - previousValue) / previousValue) * 100
    return change.toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Reports
          </button>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Event Comparison</h1>
          <p className="text-gray-400">Compare performance metrics across multiple events</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Event Selection & Filters</h2>
            {(selectedEvents.length > 0 || dateRangeFilter.start || dateRangeFilter.end) && (
              <button
                onClick={() => {
                  setSelectedEvents([])
                  setDateRangeFilter({ start: '', end: '' })
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <button
            onClick={() => setShowEventFilterModal(true)}
            className="w-full p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-blue-500 rounded-lg text-left transition-colors group mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                <div>
                  <div className="text-white font-medium mb-1">{getFilterSummary()}</div>
                  <div className="text-sm text-gray-400">
                    Click to select events and date range for comparison
                  </div>
                </div>
              </div>
              <div className="text-gray-400 group-hover:text-blue-400 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </button>

          {selectedEvents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedEvents.map((eventId, index) => {
                const event = events.find(e => e.id === eventId)
                if (!event) return null
                return (
                  <div
                    key={eventId}
                    className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-2"
                  >
                    <span className="text-xs font-bold text-blue-400">#{index + 1}</span>
                    <span className="text-sm text-white">{event.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {comparisonData && comparisonData.length > 0 && (
          <>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">View Mode</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('comparison')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'comparison'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setViewMode('aggregate')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'aggregate'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Combined Totals
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'aggregate' && (
              <AggregateView comparisonData={comparisonData} formatDuration={formatDuration} />
            )}

            {viewMode === 'comparison' && (
            <>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
              <h2 className="text-xl font-semibold text-white mb-6">Comparison Overview</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-3 text-gray-400 font-medium">Metric</th>
                      {comparisonData.map((data, index) => (
                        <th key={index} className="text-right p-3 text-gray-400 font-medium">
                          Event {index + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 text-white font-medium">Event Name</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-gray-300">
                          {data.event.name}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 text-white font-medium">Event Date</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-gray-300">
                          {data.event.event_date
                            ? new Date(data.event.event_date).toLocaleDateString()
                            : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700 bg-gray-700/20">
                      <td className="p-3 text-white font-medium">Total Presenters</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-white font-bold">
                          {data.stats.totalPresenters}
                          {index > 0 && (
                            <span className="ml-2 text-sm text-gray-400">
                              {getComparisonIcon(
                                data.stats.totalPresenters,
                                comparisonData[index - 1].stats.totalPresenters
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 text-white font-medium">Completion Rate</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-white font-bold">
                          {data.stats.completionRate.toFixed(0)}%
                          {index > 0 && getPercentageChange(
                            data.stats.completionRate,
                            comparisonData[index - 1].stats.completionRate
                          ) && (
                            <span className="ml-2 text-sm text-gray-400">
                              ({getPercentageChange(
                                data.stats.completionRate,
                                comparisonData[index - 1].stats.completionRate
                              )}%)
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700 bg-gray-700/20">
                      <td className="p-3 text-white font-medium">Total Planned Time</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-blue-400 font-bold">
                          {formatDuration(data.stats.totalPlanned)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 text-white font-medium">Total Actual Time</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-green-400 font-bold">
                          {formatDuration(data.stats.totalActual)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700 bg-gray-700/20">
                      <td className="p-3 text-white font-medium">Early Finishes</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-green-400 font-bold">
                          {data.stats.earlyCount}
                          {index > 0 && (
                            <span className="ml-2">
                              {getComparisonIcon(
                                data.stats.earlyCount,
                                comparisonData[index - 1].stats.earlyCount
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 text-white font-medium">On Time</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-blue-400 font-bold">
                          {data.stats.onTimeCount}
                          {index > 0 && (
                            <span className="ml-2">
                              {getComparisonIcon(
                                data.stats.onTimeCount,
                                comparisonData[index - 1].stats.onTimeCount
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700 bg-gray-700/20">
                      <td className="p-3 text-white font-medium">Overtime</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-red-400 font-bold">
                          {data.stats.overtimeCount}
                          {index > 0 && (
                            <span className="ml-2">
                              {getComparisonIcon(
                                comparisonData[index - 1].stats.overtimeCount,
                                data.stats.overtimeCount
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 text-white font-medium">Time Saved</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-green-400 font-bold">
                          {formatDuration(data.stats.timeSaved)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700 bg-gray-700/20">
                      <td className="p-3 text-white font-medium">Time Lost</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className="p-3 text-right text-red-400 font-bold">
                          {formatDuration(data.stats.timeLost)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 text-white font-medium">Net Efficiency</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className={`p-3 text-right font-bold ${
                          data.stats.netEfficiency > 0 ? 'text-green-400' :
                          data.stats.netEfficiency < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {data.stats.netEfficiency > 0 ? '+' : ''}
                          {formatDuration(Math.abs(data.stats.netEfficiency))}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-700/20">
                      <td className="p-3 text-white font-medium">Overall Rating</td>
                      {comparisonData.map((data, index) => (
                        <td key={index} className={`p-3 text-right font-bold ${getEfficiencyColor(data.stats.efficiencyRating)}`}>
                          {data.stats.efficiencyRating}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-blue-400" />
                Performance Visualization
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Completion Breakdown</h3>
                  <div className="space-y-4">
                    {comparisonData.map((data, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Event {index + 1}</span>
                          <span className="text-sm text-gray-400">
                            {data.stats.completedPresenters}/{data.stats.totalPresenters}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-green-500/20 rounded p-2 text-center">
                            <div className="text-green-400 font-bold">{data.stats.earlyCount}</div>
                            <div className="text-xs text-gray-500">Early</div>
                          </div>
                          <div className="bg-blue-500/20 rounded p-2 text-center">
                            <div className="text-blue-400 font-bold">{data.stats.onTimeCount}</div>
                            <div className="text-xs text-gray-500">On Time</div>
                          </div>
                          <div className="bg-red-500/20 rounded p-2 text-center">
                            <div className="text-red-400 font-bold">{data.stats.overtimeCount}</div>
                            <div className="text-xs text-gray-500">Over</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Efficiency Comparison</h3>
                  <div className="space-y-4">
                    {comparisonData.map((data, index) => {
                      const maxEfficiency = Math.max(...comparisonData.map(d =>
                        Math.abs(d.stats.netEfficiency)
                      ))
                      const barWidth = maxEfficiency > 0
                        ? (Math.abs(data.stats.netEfficiency) / maxEfficiency) * 100
                        : 0

                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300">Event {index + 1}</span>
                            <span className={`text-sm font-bold ${
                              data.stats.netEfficiency > 0 ? 'text-green-400' :
                              data.stats.netEfficiency < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {data.stats.netEfficiency > 0 ? '+' : ''}
                              {formatDuration(Math.abs(data.stats.netEfficiency))}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                data.stats.netEfficiency > 0
                                  ? 'bg-gradient-to-r from-green-600 to-green-400'
                                  : 'bg-gradient-to-r from-red-600 to-red-400'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </>
        )}

        <EventFilterModal
          isOpen={showEventFilterModal}
          onClose={() => setShowEventFilterModal(false)}
          events={events}
          selectedEventIds={selectedEvents}
          dateRange={dateRangeFilter}
          onApply={handleApplyFilters}
        />
      </div>
    </div>
  )
}

function AggregateView({ comparisonData, formatDuration }) {
  const calculateAggregateTotals = () => {
    const totals = {
      totalEvents: comparisonData.length,
      totalPresenters: 0,
      totalCompleted: 0,
      totalPlanned: 0,
      totalActual: 0,
      totalEarly: 0,
      totalOnTime: 0,
      totalOvertime: 0,
      totalTimeSaved: 0,
      totalTimeLost: 0,
      avgCompletionRate: 0,
      avgNetEfficiency: 0
    }

    comparisonData.forEach(data => {
      totals.totalPresenters += data.stats.totalPresenters
      totals.totalCompleted += data.stats.completedPresenters
      totals.totalPlanned += data.stats.totalPlanned
      totals.totalActual += data.stats.totalActual
      totals.totalEarly += data.stats.earlyCount
      totals.totalOnTime += data.stats.onTimeCount
      totals.totalOvertime += data.stats.overtimeCount
      totals.totalTimeSaved += data.stats.timeSaved
      totals.totalTimeLost += data.stats.timeLost
      totals.avgCompletionRate += data.stats.completionRate
    })

    totals.avgCompletionRate = totals.avgCompletionRate / comparisonData.length
    totals.avgNetEfficiency = totals.totalTimeSaved - totals.totalTimeLost

    return totals
  }

  const totals = calculateAggregateTotals()
  const completionPercentage = totals.totalPresenters > 0
    ? (totals.totalCompleted / totals.totalPresenters) * 100
    : 0

  return (
    <div className="space-y-8">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">Combined Event Totals</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Total Events</div>
            <div className="text-3xl font-bold text-white">{totals.totalEvents}</div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Total Presenters</div>
            <div className="text-3xl font-bold text-blue-400">{totals.totalPresenters}</div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Completed</div>
            <div className="text-3xl font-bold text-green-400">{totals.totalCompleted}</div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Completion Rate</div>
            <div className="text-3xl font-bold text-purple-400">{completionPercentage.toFixed(0)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Total Planned Time</div>
            <div className="text-2xl font-bold text-blue-400">{formatDuration(totals.totalPlanned)}</div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Total Actual Time</div>
            <div className="text-2xl font-bold text-green-400">{formatDuration(totals.totalActual)}</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Breakdown</h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{totals.totalEarly}</div>
              <div className="text-sm text-gray-400">Early Finishes</div>
              <div className="text-xs text-gray-500 mt-1">
                {totals.totalCompleted > 0 ? ((totals.totalEarly / totals.totalCompleted) * 100).toFixed(0) : 0}%
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{totals.totalOnTime}</div>
              <div className="text-sm text-gray-400">On Time</div>
              <div className="text-xs text-gray-500 mt-1">
                {totals.totalCompleted > 0 ? ((totals.totalOnTime / totals.totalCompleted) * 100).toFixed(0) : 0}%
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">{totals.totalOvertime}</div>
              <div className="text-sm text-gray-400">Overtime</div>
              <div className="text-xs text-gray-500 mt-1">
                {totals.totalCompleted > 0 ? ((totals.totalOvertime / totals.totalCompleted) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>

          <div className="relative h-48 flex items-end gap-4 bg-gray-900/50 rounded-lg p-6">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                <div
                  className="bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-1000 flex items-end justify-center pb-2"
                  style={{ height: `${totals.totalCompleted > 0 ? (totals.totalEarly / totals.totalCompleted) * 100 : 0}%` }}
                >
                  <span className="text-white font-bold text-sm">{totals.totalEarly}</span>
                </div>
              </div>
              <span className="text-gray-300 text-sm font-medium">Early</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                <div
                  className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-1000 flex items-end justify-center pb-2"
                  style={{ height: `${totals.totalCompleted > 0 ? (totals.totalOnTime / totals.totalCompleted) * 100 : 0}%` }}
                >
                  <span className="text-white font-bold text-sm">{totals.totalOnTime}</span>
                </div>
              </div>
              <span className="text-gray-300 text-sm font-medium">On Time</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                <div
                  className="bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg transition-all duration-1000 flex items-end justify-center pb-2"
                  style={{ height: `${totals.totalCompleted > 0 ? (totals.totalOvertime / totals.totalCompleted) * 100 : 0}%` }}
                >
                  <span className="text-white font-bold text-sm">{totals.totalOvertime}</span>
                </div>
              </div>
              <span className="text-gray-300 text-sm font-medium">Overtime</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Time Saved</h3>
          <div className="text-4xl font-bold text-green-400 mb-2">
            {formatDuration(totals.totalTimeSaved)}
          </div>
          <p className="text-gray-400 text-sm mb-4">Total time saved from early finishes</p>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (totals.totalTimeSaved / (totals.totalTimeSaved + totals.totalTimeLost || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Time Lost</h3>
          <div className="text-4xl font-bold text-red-400 mb-2">
            {formatDuration(totals.totalTimeLost)}
          </div>
          <p className="text-gray-400 text-sm mb-4">Total time lost to overtime</p>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (totals.totalTimeLost / (totals.totalTimeSaved + totals.totalTimeLost || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Net Efficiency</h3>
        <div className={`text-5xl font-bold mb-2 ${
          totals.avgNetEfficiency > 0 ? 'text-green-400' :
          totals.avgNetEfficiency < 0 ? 'text-red-400' : 'text-gray-400'
        }`}>
          {totals.avgNetEfficiency > 0 ? '+' : ''}{formatDuration(Math.abs(totals.avgNetEfficiency))}
        </div>
        <p className="text-gray-400">
          {totals.avgNetEfficiency > 0 ? 'Net time saved across all events' :
           totals.avgNetEfficiency < 0 ? 'Net time lost across all events' : 'Perfectly balanced'}
        </p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Individual Event Performance</h3>
        <div className="space-y-3">
          {comparisonData.map((data, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-blue-400 bg-blue-400/20 w-6 h-6 rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <div>
                  <div className="text-white font-medium">{data.event.name}</div>
                  <div className="text-sm text-gray-400">
                    {data.stats.completedPresenters}/{data.stats.totalPresenters} presenters completed
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  data.stats.netEfficiency > 0 ? 'text-green-400' :
                  data.stats.netEfficiency < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {data.stats.netEfficiency > 0 ? '+' : ''}{formatDuration(Math.abs(data.stats.netEfficiency))}
                </div>
                <div className="text-xs text-gray-500">net efficiency</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(EventComparisonReport)
