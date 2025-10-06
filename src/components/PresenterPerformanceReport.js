import React, { useState, useEffect } from 'react'
import { User, TrendingUp, TrendingDown, Award, Clock, Target, BarChart3, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PresenterPerformanceReport({ session, onBack }) {
  const [loading, setLoading] = useState(true)
  const [presenters, setPresenters] = useState([])
  const [selectedPresenter, setSelectedPresenter] = useState(null)
  const [presenterHistory, setPresenterHistory] = useState([])
  const [organizationId, setOrganizationId] = useState(null)

  useEffect(() => {
    if (session?.user) {
      loadPresenterStats()
    }
  }, [session])

  useEffect(() => {
    if (selectedPresenter && organizationId) {
      loadPresenterHistory()
    }
  }, [selectedPresenter, organizationId])

  const loadPresenterStats = async () => {
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

      setOrganizationId(memberData.organization_id)

      const { data: presenterNames } = await supabase
        .from('timers')
        .select('presenter_name, event_id')
        .not('event_id', 'is', null)
        .neq('presenter_name', '')

      if (!presenterNames) {
        setLoading(false)
        return
      }

      const uniquePresenters = [...new Set(presenterNames.map(p => p.presenter_name))]

      for (const name of uniquePresenters) {
        await supabase.rpc('calculate_presenter_stats', {
          p_organization_id: memberData.organization_id,
          p_presenter_name: name
        })
      }

      const { data: stats, error } = await supabase
        .from('presenter_performance_stats')
        .select('*')
        .eq('organization_id', memberData.organization_id)
        .order('total_presentations', { ascending: false })

      if (error) throw error

      setPresenters(stats || [])
    } catch (error) {
      console.error('Error loading presenter stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPresenterHistory = async () => {
    try {
      const { data: timers } = await supabase
        .from('timers')
        .select(`
          *,
          event:events(id, name, event_date, status)
        `)
        .eq('presenter_name', selectedPresenter.presenter_name)
        .not('event_id', 'is', null)
        .order('created_at', { ascending: false })

      if (!timers) return

      const history = await Promise.all(
        timers.map(async (timer) => {
          const { data: logs } = await supabase
            .from('timer_logs')
            .select('*')
            .eq('timer_id', timer.id)
            .in('action', ['finished', 'expired', 'overtime'])

          const finishLog = logs?.find(l => l.action === 'finished' || l.action === 'expired')
          const overtimeLogs = logs?.filter(l => l.overtime_seconds && l.overtime_seconds > 0) || []
          const maxOvertime = Math.max(0, ...overtimeLogs.map(l => l.overtime_seconds))

          let actualTime = timer.duration
          if (finishLog && finishLog.time_value !== null) {
            actualTime = timer.duration - finishLog.time_value
          }

          const variance = actualTime - timer.duration

          return {
            event: timer.event,
            timerName: timer.name,
            plannedTime: timer.duration,
            actualTime,
            variance,
            overtime: maxOvertime,
            status: timer.status,
            createdAt: timer.created_at
          }
        })
      )

      setPresenterHistory(history)
    } catch (error) {
      console.error('Error loading presenter history:', error)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const getPerformanceColor = (variance) => {
    if (variance < -30) return 'text-green-400'
    if (variance > 30) return 'text-red-400'
    return 'text-blue-400'
  }

  const getConsistencyRating = (score) => {
    if (score >= 90) return { rating: 'Excellent', color: 'text-green-400' }
    if (score >= 75) return { rating: 'Good', color: 'text-blue-400' }
    if (score >= 60) return { rating: 'Fair', color: 'text-yellow-400' }
    return { rating: 'Needs Work', color: 'text-red-400' }
  }

  const calculateOnTimePercentage = (presenter) => {
    const total = presenter.early_finish_count + presenter.on_time_count + presenter.overtime_count
    if (total === 0) return 0
    return Math.round(((presenter.early_finish_count + presenter.on_time_count) / total) * 100)
  }

  if (selectedPresenter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setSelectedPresenter(null)}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to All Presenters
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">{selectedPresenter.presenter_name}</h1>
            </div>
            <p className="text-gray-400">Complete performance analysis and history</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Total Presentations</h3>
              </div>
              <p className="text-3xl font-bold text-blue-400">{selectedPresenter.total_presentations}</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">On-Time Rate</h3>
              </div>
              <p className="text-3xl font-bold text-green-400">
                {calculateOnTimePercentage(selectedPresenter)}%
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Avg Variance</h3>
              </div>
              <p className={`text-3xl font-bold ${getPerformanceColor(selectedPresenter.average_variance_seconds)}`}>
                {selectedPresenter.average_variance_seconds > 0 ? '+' : ''}
                {formatDuration(Math.abs(selectedPresenter.average_variance_seconds))}
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Consistency</h3>
              </div>
              <p className={`text-3xl font-bold ${getConsistencyRating(selectedPresenter.consistency_score).color}`}>
                {getConsistencyRating(selectedPresenter.consistency_score).rating}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Early Finishes</span>
                  <span className="text-green-400 font-bold">{selectedPresenter.early_finish_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">On Time</span>
                  <span className="text-blue-400 font-bold">{selectedPresenter.on_time_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Overtime</span>
                  <span className="text-red-400 font-bold">{selectedPresenter.overtime_count}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Time Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Planned</span>
                  <span className="text-white font-medium">{formatDuration(selectedPresenter.total_planned_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Actual</span>
                  <span className="text-white font-medium">{formatDuration(selectedPresenter.total_actual_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Net Difference</span>
                  <span className={getPerformanceColor(selectedPresenter.total_actual_time - selectedPresenter.total_planned_time)}>
                    {selectedPresenter.total_actual_time > selectedPresenter.total_planned_time ? '+' : ''}
                    {formatDuration(Math.abs(selectedPresenter.total_actual_time - selectedPresenter.total_planned_time))}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">History</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">First Presentation</span>
                  <span className="text-white font-medium">
                    {selectedPresenter.first_presentation_date
                      ? new Date(selectedPresenter.first_presentation_date).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Last Presentation</span>
                  <span className="text-white font-medium">
                    {selectedPresenter.last_presentation_date
                      ? new Date(selectedPresenter.last_presentation_date).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Events</span>
                  <span className="text-white font-medium">{presenterHistory.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-6">Presentation History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-400 font-medium">Event</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Date</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Timer Name</th>
                    <th className="text-right p-3 text-gray-400 font-medium">Planned</th>
                    <th className="text-right p-3 text-gray-400 font-medium">Actual</th>
                    <th className="text-right p-3 text-gray-400 font-medium">Variance</th>
                    <th className="text-right p-3 text-gray-400 font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {presenterHistory.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-3 text-white">{item.event?.name || 'Unknown Event'}</td>
                      <td className="p-3 text-gray-300">
                        {item.event?.event_date
                          ? new Date(item.event.event_date).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="p-3 text-gray-300">{item.timerName}</td>
                      <td className="p-3 text-right text-gray-300">{formatDuration(item.plannedTime)}</td>
                      <td className="p-3 text-right text-gray-300">{formatDuration(item.actualTime)}</td>
                      <td className={`p-3 text-right font-medium ${getPerformanceColor(item.variance)}`}>
                        {item.variance > 0 ? '+' : ''}{formatDuration(Math.abs(item.variance))}
                      </td>
                      <td className="p-3 text-right">
                        {item.variance < -30 ? (
                          <span className="flex items-center justify-end gap-1 text-green-400">
                            <TrendingDown className="w-4 h-4" />
                            Early
                          </span>
                        ) : item.variance > 30 || item.overtime > 0 ? (
                          <span className="flex items-center justify-end gap-1 text-red-400">
                            <TrendingUp className="w-4 h-4" />
                            Over
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1 text-blue-400">
                            <Target className="w-4 h-4" />
                            On Time
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-white mb-2">Presenter Performance Analysis</h1>
          <p className="text-gray-400">Individual performance metrics and history</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : presenters.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Presenter Data</h3>
            <p className="text-gray-400">Complete some events to see presenter performance analytics</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presenters.map((presenter) => {
              const onTimePercentage = calculateOnTimePercentage(presenter)
              const consistencyInfo = getConsistencyRating(presenter.consistency_score)

              return (
                <div
                  key={presenter.id}
                  onClick={() => setSelectedPresenter(presenter)}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-blue-400" />
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {presenter.presenter_name}
                      </h3>
                    </div>
                    <Award className={`w-5 h-5 ${consistencyInfo.color}`} />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Presentations</span>
                      <span className="text-white font-bold">{presenter.total_presentations}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">On-Time Rate</span>
                      <span className="text-green-400 font-bold">{onTimePercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Avg Variance</span>
                      <span className={`font-bold ${getPerformanceColor(presenter.average_variance_seconds)}`}>
                        {presenter.average_variance_seconds > 0 ? '+' : ''}
                        {Math.round(presenter.average_variance_seconds)}s
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Consistency</span>
                      <span className={`font-medium ${consistencyInfo.color}`}>{consistencyInfo.rating}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center p-2 bg-green-500/10 rounded">
                      <div className="text-green-400 font-bold">{presenter.early_finish_count}</div>
                      <div className="text-gray-500 text-xs">Early</div>
                    </div>
                    <div className="text-center p-2 bg-blue-500/10 rounded">
                      <div className="text-blue-400 font-bold">{presenter.on_time_count}</div>
                      <div className="text-gray-500 text-xs">On Time</div>
                    </div>
                    <div className="text-center p-2 bg-red-500/10 rounded">
                      <div className="text-red-400 font-bold">{presenter.overtime_count}</div>
                      <div className="text-gray-500 text-xs">Over</div>
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
