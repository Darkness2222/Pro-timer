import React, { useState, useEffect } from 'react'
import { BarChart3, Clock, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ReportsPage({ session }) {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState({
    totalPlannedTime: 0,
    totalActualTime: 0,
    averageVariance: 0,
    finishedEarlyCount: 0,
    completedOnTimeCount: 0,
    overtimeCount: 0,
    totalAnalyzedTimers: 0,
    percentageFinishedEarly: 0,
    percentageCompletedOnTime: 0,
    percentageOvertime: 0,
    timeSaved: 0,
    timeOverrun: 0
  })
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  })

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch timers that have reached a final state within the date range
      const { data: timers, error: timersError } = await supabase
        .from('timers')
        .select('id, name, presenter_name, duration, status, created_at')
        .in('status', ['finished_early', 'completed', 'archived'])
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59.999Z')
        .order('created_at', { ascending: false })

      if (timersError) throw timersError

      if (!timers || timers.length === 0) {
        setReportData({
          totalPlannedTime: 0,
          totalActualTime: 0,
          averageVariance: 0,
          finishedEarlyCount: 0,
          completedOnTimeCount: 0,
          overtimeCount: 0,
          totalAnalyzedTimers: 0,
          percentageFinishedEarly: 0,
          percentageCompletedOnTime: 0,
          percentageOvertime: 0,
          timeSaved: 0,
          timeOverrun: 0
        })
        setLoading(false)
        return
      }

      // Fetch timer sessions for actual time calculations
      const timerIds = timers.map(timer => timer.id)
      const { data: sessions, error: sessionsError } = await supabase
        .from('timer_sessions')
        .select('timer_id, time_left')
        .in('timer_id', timerIds)

      if (sessionsError) throw sessionsError

      // Fetch timer logs for additional context
      const { data: logs, error: logsError } = await supabase
        .from('timer_logs')
        .select('timer_id, action, time_value, created_at')
        .in('timer_id', timerIds)
        .in('action', ['finished_early', 'expired', 'overtime'])
        .order('created_at', { ascending: false })

      if (logsError) throw logsError

      // Create lookup maps
      const sessionMap = {}
      sessions?.forEach(session => {
        sessionMap[session.timer_id] = session
      })

      const logMap = {}
      logs?.forEach(log => {
        if (!logMap[log.timer_id]) {
          logMap[log.timer_id] = []
        }
        logMap[log.timer_id].push(log)
      })

      // Calculate metrics
      let totalPlannedTime = 0
      let totalActualTime = 0
      let totalVariance = 0
      let finishedEarlyCount = 0
      let completedOnTimeCount = 0
      let overtimeCount = 0
      let timeSaved = 0
      let timeOverrun = 0

      timers.forEach(timer => {
        const session = sessionMap[timer.id]
        const timerLogs = logMap[timer.id] || []
        
        totalPlannedTime += timer.duration

        let actualTime = timer.duration
        let variance = 0

        if (timer.status === 'finished_early') {
          // Timer was finished early - calculate actual time from remaining time
          if (session && session.time_left !== null) {
            actualTime = timer.duration - session.time_left
            variance = session.time_left // positive variance = time saved
            timeSaved += variance
          }
          finishedEarlyCount++
        } else if (timer.status === 'completed') {
          // Timer completed naturally - check for overtime
          const overtimeLog = timerLogs.find(log => log.action === 'overtime')
          if (overtimeLog && overtimeLog.time_value) {
            actualTime = timer.duration + overtimeLog.time_value
            variance = -overtimeLog.time_value // negative variance = overtime
            timeOverrun += overtimeLog.time_value
            overtimeCount++
          } else {
            // Completed exactly on time
            actualTime = timer.duration
            variance = 0
            completedOnTimeCount++
          }
        } else if (timer.status === 'archived') {
          // Archived timers - treat as completed for analysis
          actualTime = timer.duration
          variance = 0
          completedOnTimeCount++
        }

        totalActualTime += actualTime
        totalVariance += variance
      })

      const totalAnalyzedTimers = timers.length
      const averageVariance = totalAnalyzedTimers > 0 ? totalVariance / totalAnalyzedTimers : 0
      const percentageFinishedEarly = totalAnalyzedTimers > 0 ? (finishedEarlyCount / totalAnalyzedTimers) * 100 : 0
      const percentageCompletedOnTime = totalAnalyzedTimers > 0 ? (completedOnTimeCount / totalAnalyzedTimers) * 100 : 0
      const percentageOvertime = totalAnalyzedTimers > 0 ? (overtimeCount / totalAnalyzedTimers) * 100 : 0

      setReportData({
        totalPlannedTime,
        totalActualTime,
        averageVariance,
        finishedEarlyCount,
        completedOnTimeCount,
        overtimeCount,
        totalAnalyzedTimers,
        percentageFinishedEarly,
        percentageCompletedOnTime,
        percentageOvertime,
        timeSaved,
        timeOverrun
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
      setError('Failed to load report data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  const formatVariance = (seconds) => {
    if (seconds > 0) {
      return `+${formatDuration(seconds)} saved`
    } else if (seconds < 0) {
      return `${formatDuration(Math.abs(seconds))} overtime`
    } else {
      return 'On time'
    }
  }

  const getVarianceColor = (variance) => {
    if (variance > 0) return 'text-green-400'
    if (variance < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getEfficiencyRating = () => {
    if (reportData.totalAnalyzedTimers === 0) return { rating: 'No Data', color: 'text-gray-400' }
    
    const efficiency = (reportData.timeSaved - reportData.timeOverrun) / reportData.totalPlannedTime
    
    if (efficiency > 0.1) return { rating: 'Excellent', color: 'text-green-400' }
    if (efficiency > 0.05) return { rating: 'Good', color: 'text-blue-400' }
    if (efficiency > -0.05) return { rating: 'Average', color: 'text-yellow-400' }
    if (efficiency > -0.1) return { rating: 'Below Average', color: 'text-orange-400' }
    return { rating: 'Needs Improvement', color: 'text-red-400' }
  }

  const efficiencyRating = getEfficiencyRating()

  return (
    <div className="min-h-screen w-full bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Timer Efficiency Report</h1>
          </div>
          <p className="text-gray-400">
            Analyze how well your timers adhere to planned durations and identify efficiency trends.
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Date Range</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Update Report
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading report data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-700 rounded-xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-100">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Planned Time */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Total Planned</h3>
                </div>
                <p className="text-3xl font-bold text-blue-400">{formatDuration(reportData.totalPlannedTime)}</p>
                <p className="text-gray-400 text-sm mt-1">{reportData.totalAnalyzedTimers} timers analyzed</p>
              </div>

              {/* Total Actual Time */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Total Actual</h3>
                </div>
                <p className="text-3xl font-bold text-purple-400">{formatDuration(reportData.totalActualTime)}</p>
                <p className="text-gray-400 text-sm mt-1">Time actually used</p>
              </div>

              {/* Average Variance */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  {reportData.averageVariance >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  )}
                  <h3 className="text-lg font-semibold text-white">Avg Variance</h3>
                </div>
                <p className={`text-3xl font-bold ${getVarianceColor(reportData.averageVariance)}`}>
                  {formatVariance(reportData.averageVariance)}
                </p>
                <p className="text-gray-400 text-sm mt-1">Per timer average</p>
              </div>

              {/* Efficiency Rating */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Efficiency</h3>
                </div>
                <p className={`text-3xl font-bold ${efficiencyRating.color}`}>
                  {efficiencyRating.rating}
                </p>
                <p className="text-gray-400 text-sm mt-1">Overall performance</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timer Completion Breakdown */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  Timer Completion Breakdown
                </h3>
                
                <div className="space-y-4">
                  {/* Finished Early */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-white">Finished Early</span>
                    </div>
                    <div className="text-right">
                      <span className="text-green-400 font-bold">{reportData.finishedEarlyCount}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({reportData.percentageFinishedEarly.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${reportData.percentageFinishedEarly}%` }}
                    ></div>
                  </div>

                  {/* Completed On Time */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-white">Completed On Time</span>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-400 font-bold">{reportData.completedOnTimeCount}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({reportData.percentageCompletedOnTime.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${reportData.percentageCompletedOnTime}%` }}
                    ></div>
                  </div>

                  {/* Overtime */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-white">Went Overtime</span>
                    </div>
                    <div className="text-right">
                      <span className="text-red-400 font-bold">{reportData.overtimeCount}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({reportData.percentageOvertime.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${reportData.percentageOvertime}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Time Savings Analysis */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  Time Savings Analysis
                </h3>
                
                <div className="space-y-6">
                  {/* Time Saved */}
                  <div className="bg-green-900 bg-opacity-30 rounded-lg p-4 border border-green-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-300 font-medium">Time Saved</span>
                      <span className="text-green-400 font-bold text-xl">
                        {formatDuration(reportData.timeSaved)}
                      </span>
                    </div>
                    <p className="text-green-200 text-sm">
                      From {reportData.finishedEarlyCount} timers finished early
                    </p>
                  </div>

                  {/* Time Overrun */}
                  <div className="bg-red-900 bg-opacity-30 rounded-lg p-4 border border-red-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-300 font-medium">Time Overrun</span>
                      <span className="text-red-400 font-bold text-xl">
                        {formatDuration(reportData.timeOverrun)}
                      </span>
                    </div>
                    <p className="text-red-200 text-sm">
                      From {reportData.overtimeCount} timers that went overtime
                    </p>
                  </div>

                  {/* Net Efficiency */}
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">Net Efficiency</span>
                      <span className={`font-bold text-xl ${
                        reportData.timeSaved > reportData.timeOverrun ? 'text-green-400' : 
                        reportData.timeSaved < reportData.timeOverrun ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {reportData.timeSaved > reportData.timeOverrun ? '+' : ''}
                        {formatDuration(reportData.timeSaved - reportData.timeOverrun)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Overall time saved vs. time overrun
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Insights */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-yellow-400" />
                Key Insights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Performance Summary</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="text-gray-300">
                      • <span className="text-blue-400 font-medium">{reportData.totalAnalyzedTimers}</span> timers analyzed in selected period
                    </li>
                    <li className="text-gray-300">
                      • <span className={efficiencyRating.color + " font-medium"}>{efficiencyRating.rating}</span> overall efficiency rating
                    </li>
                    <li className="text-gray-300">
                      • <span className="text-purple-400 font-medium">{formatDuration(reportData.totalActualTime)}</span> total presentation time
                    </li>
                    {reportData.averageVariance !== 0 && (
                      <li className="text-gray-300">
                        • <span className={getVarianceColor(reportData.averageVariance) + " font-medium"}>
                          {formatVariance(reportData.averageVariance)}
                        </span> average per timer
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Recommendations</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {reportData.percentageFinishedEarly > 50 && (
                      <li>• Consider reducing default timer durations</li>
                    )}
                    {reportData.percentageOvertime > 25 && (
                      <li>• Add buffer time or extend timer durations</li>
                    )}
                    {reportData.percentageCompletedOnTime > 70 && (
                      <li>• Great timing consistency! Keep it up</li>
                    )}
                    {reportData.totalAnalyzedTimers < 5 && (
                      <li>• More data needed for reliable insights</li>
                    )}
                    {reportData.timeSaved > reportData.timeOverrun && (
                      <li>• Excellent time management efficiency</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* No Data State */}
            {reportData.totalAnalyzedTimers === 0 && (
              <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">No Timer Data</h3>
                <p className="text-gray-500 mb-4">
                  No completed timers found in the selected date range.
                </p>
                <p className="text-gray-400 text-sm">
                  Create and complete some timers to see efficiency metrics here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}