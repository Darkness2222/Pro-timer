import React, { useState, useEffect } from 'react'
import { Calendar, ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function EventComparisonReport({ session, onBack }) {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [selectedEvents, setSelectedEvents] = useState([])
  const [comparisonData, setComparisonData] = useState(null)

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

  const toggleEventSelection = (eventId) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter(id => id !== eventId))
    } else {
      if (selectedEvents.length >= 4) {
        alert('You can compare up to 4 events at a time')
        return
      }
      setSelectedEvents([...selectedEvents, eventId])
    }
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
          <h2 className="text-xl font-semibold text-white mb-4">Select Events to Compare</h2>
          <p className="text-gray-400 text-sm mb-4">Choose up to 4 events for comparison</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <div
                key={event.id}
                onClick={() => toggleEventSelection(event.id)}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedEvents.includes(event.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold">{event.name}</h3>
                  {selectedEvents.includes(event.id) && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {selectedEvents.indexOf(event.id) + 1}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {event.event_date
                    ? new Date(event.event_date).toLocaleDateString()
                    : 'No date'}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {event.timers.length} presenter{event.timers.length === 1 ? '' : 's'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {comparisonData && comparisonData.length > 0 && (
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
      </div>
    </div>
  )
}
