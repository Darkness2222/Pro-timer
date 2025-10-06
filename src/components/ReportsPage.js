import React, { useState, useEffect } from 'react'
import { FileText, TrendingUp, Clock, Target, Award, AlertTriangle } from 'lucide-react'

export default function ReportsPage({ 
  timers = [], 
  timerLogs = [], 
  reportStartDate = '', 
  reportEndDate = '', 
  onStartDateChange, 
  onEndDateChange, 
  onExportCSV 
}) {
  const [filteredLogs, setFilteredLogs] = useState([])
  const [allTimers, setAllTimers] = useState([])

  // Update allTimers when timers prop changes
  useEffect(() => {
    setAllTimers(timers)
  }, [timers])

  // Filter logs based on date range
  useEffect(() => {
    let filtered = timerLogs
    
    if (reportStartDate) {
      filtered = filtered.filter(log => 
        new Date(log.created_at) >= new Date(reportStartDate)
      )
    }
    
    if (reportEndDate) {
      filtered = filtered.filter(log => 
        new Date(log.created_at) <= new Date(reportEndDate + 'T23:59:59')
      )
    }
    
    setFilteredLogs(filtered)
  }, [timerLogs, reportStartDate, reportEndDate])

  // Calculate efficiency metrics
  const calculateEfficiencyMetrics = () => {
    const completedTimers = allTimers.filter(timer =>
      timer.status === 'finished_early' || timer.status === 'completed'
    )

    if (completedTimers.length === 0) {
      return {
        totalPlannedTime: 0,
        totalActualTime: 0,
        averageVariance: 0,
        earlyFinishCount: 0,
        onTimeCount: 0,
        overtimeCount: 0,
        timeSaved: 0,
        timeLost: 0,
        netEfficiency: 0,
        efficiencyRating: 'No Data',
        overtimeDetails: []
      }
    }

    let totalPlannedTime = 0
    let totalActualTime = 0
    let earlyFinishCount = 0
    let onTimeCount = 0
    let overtimeCount = 0
    let timeSaved = 0
    let timeLost = 0
    const overtimeDetails = []

    completedTimers.forEach(timer => {
      const plannedDuration = timer.duration
      totalPlannedTime += plannedDuration

      // Find finish log to determine actual time
      const finishLog = filteredLogs.find(log =>
        log.timer_id === timer.id &&
        (log.action === 'finished' || log.action === 'expired')
      )

      // Find all overtime logs for this timer
      const overtimeLogs = filteredLogs.filter(log =>
        log.timer_id === timer.id &&
        (log.action === 'overtime' || log.action === 'expired' ||
         (log.overtime_seconds !== null && log.overtime_seconds > 0))
      )

      // Get the maximum overtime for this timer
      let maxOvertime = 0
      overtimeLogs.forEach(log => {
        if (log.overtime_seconds && log.overtime_seconds > maxOvertime) {
          maxOvertime = log.overtime_seconds
        }
      })

      let actualTime = plannedDuration
      if (finishLog && finishLog.time_value !== null) {
        actualTime = plannedDuration - finishLog.time_value
      }

      totalActualTime += actualTime

      const variance = actualTime - plannedDuration
      if (variance < -30) { // Finished more than 30 seconds early
        earlyFinishCount++
        timeSaved += Math.abs(variance)
      } else if (variance > 30 || maxOvertime > 0) { // Went more than 30 seconds over
        overtimeCount++
        timeLost += variance > 0 ? variance : maxOvertime
        if (maxOvertime > 0 || variance > 30) {
          overtimeDetails.push({
            timerName: timer.name,
            presenterName: timer.presenter_name,
            overtimeSeconds: maxOvertime > 0 ? maxOvertime : variance,
            timerId: timer.id
          })
        }
      } else {
        onTimeCount++
      }
    })

    const averageVariance = (totalActualTime - totalPlannedTime) / completedTimers.length
    const netEfficiency = timeSaved - timeLost

    let efficiencyRating = 'Good'
    if (netEfficiency > 300) efficiencyRating = 'Excellent'
    else if (netEfficiency > 0) efficiencyRating = 'Good'
    else if (netEfficiency > -300) efficiencyRating = 'Fair'
    else efficiencyRating = 'Needs Improvement'

    return {
      totalPlannedTime,
      totalActualTime,
      averageVariance,
      earlyFinishCount,
      onTimeCount,
      overtimeCount,
      timeSaved,
      timeLost,
      netEfficiency,
      efficiencyRating,
      totalCompleted: completedTimers.length,
      overtimeDetails: overtimeDetails.sort((a, b) => b.overtimeSeconds - a.overtimeSeconds)
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

  const metrics = calculateEfficiencyMetrics()

  const getRecommendations = () => {
    const recommendations = []
    
    if (metrics.overtimeCount > metrics.earlyFinishCount) {
      recommendations.push("Consider adding buffer time to presentations to prevent overtime")
    }
    
    if (metrics.earlyFinishCount > metrics.totalCompleted * 0.5) {
      recommendations.push("Many timers finish early - consider reducing allocated time")
    }
    
    if (metrics.averageVariance > 120) {
      recommendations.push("High variance detected - review time estimates for better accuracy")
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Timer usage is well-balanced - keep up the good work!")
    }
    
    return recommendations
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Timer Efficiency Report</h1>
        <p className="text-gray-300">Analyze timer performance and optimize your presentations</p>
      </div>

      {/* Export Controls */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-white">Export Data</h2>
          <div className="flex items-center gap-2">
            <label className="text-gray-300 text-sm">From:</label>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-300 text-sm">To:</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
          <button
            onClick={onExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-4">
          <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium">Presenter Activity Only</p>
            <p className="text-blue-400/80">These reports show presenter performance data. Admin actions are excluded.</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Total Planned</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400">{formatDuration(metrics.totalPlannedTime)}</p>
          <p className="text-gray-400 text-sm">Allocated presentation time</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Total Actual</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">{formatDuration(metrics.totalActualTime)}</p>
          <p className="text-gray-400 text-sm">Actual presentation time</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Avg Variance</h3>
          </div>
          <p className={`text-3xl font-bold ${metrics.averageVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {metrics.averageVariance > 0 ? '+' : ''}{formatDuration(Math.abs(metrics.averageVariance))}
          </p>
          <p className="text-gray-400 text-sm">Average time difference</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Efficiency</h3>
          </div>
          <p className={`text-3xl font-bold ${
            metrics.efficiencyRating === 'Excellent' ? 'text-green-400' :
            metrics.efficiencyRating === 'Good' ? 'text-blue-400' :
            metrics.efficiencyRating === 'Fair' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {metrics.efficiencyRating}
          </p>
          <p className="text-gray-400 text-sm">Overall performance</p>
        </div>
      </div>

      {/* Completion Breakdown */}
      {metrics.totalCompleted > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Completion Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {Math.round((metrics.earlyFinishCount / metrics.totalCompleted) * 100)}%
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${(metrics.earlyFinishCount / metrics.totalCompleted) * 100}%` }}
                ></div>
              </div>
              <p className="text-gray-300 text-sm">Early Finish</p>
              <p className="text-gray-400 text-xs">{metrics.earlyFinishCount} timers</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {Math.round((metrics.onTimeCount / metrics.totalCompleted) * 100)}%
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${(metrics.onTimeCount / metrics.totalCompleted) * 100}%` }}
                ></div>
              </div>
              <p className="text-gray-300 text-sm">On Time</p>
              <p className="text-gray-400 text-xs">{metrics.onTimeCount} timers</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 mb-2">
                {Math.round((metrics.overtimeCount / metrics.totalCompleted) * 100)}%
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${(metrics.overtimeCount / metrics.totalCompleted) * 100}%` }}
                ></div>
              </div>
              <p className="text-gray-300 text-sm">Overtime</p>
              <p className="text-gray-400 text-xs">{metrics.overtimeCount} timers</p>
            </div>
          </div>
        </div>
      )}

      {/* Time Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Time Savings</h3>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {formatDuration(metrics.timeSaved)}
          </div>
          <p className="text-gray-400 text-sm mb-4">Time saved from early finishes</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (metrics.timeSaved / (metrics.timeSaved + metrics.timeLost || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Time Lost</h3>
          <div className="text-3xl font-bold text-red-400 mb-2">
            {formatDuration(metrics.timeLost)}
          </div>
          <p className="text-gray-400 text-sm mb-4">Time lost to overtime</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (metrics.timeLost / (metrics.timeSaved + metrics.timeLost || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Net Efficiency */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Net Efficiency</h3>
        <div className={`text-4xl font-bold mb-2 ${
          metrics.netEfficiency > 0 ? 'text-green-400' : 
          metrics.netEfficiency < 0 ? 'text-red-400' : 'text-gray-400'
        }`}>
          {metrics.netEfficiency > 0 ? '+' : ''}{formatDuration(Math.abs(metrics.netEfficiency))}
        </div>
        <p className="text-gray-400 text-sm">
          {metrics.netEfficiency > 0 ? 'Time saved overall' : 
           metrics.netEfficiency < 0 ? 'Time lost overall' : 'Perfectly balanced'}
        </p>
      </div>

      {/* Overtime Analysis */}
      {metrics.overtimeDetails && metrics.overtimeDetails.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-red-700/50 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Overtime Analysis
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {metrics.overtimeDetails.length} presenter{metrics.overtimeDetails.length !== 1 ? 's' : ''} went over their allocated time
          </p>
          <div className="space-y-3">
            {metrics.overtimeDetails.map((detail, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">{detail.presenterName}</p>
                    <p className="text-gray-400 text-sm">{detail.timerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold text-lg">
                    +{formatDuration(detail.overtimeSeconds)}
                  </p>
                  <p className="text-gray-400 text-xs">overtime</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Recommendations */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Smart Recommendations
        </h3>
        <div className="space-y-3">
          {getRecommendations().map((recommendation, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-300 text-sm">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Total Timers</h3>
          <p className="text-3xl font-bold text-blue-400">{timers.length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Total Actions</h3>
          <p className="text-3xl font-bold text-green-400">{filteredLogs.length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Active Sessions</h3>
          <p className="text-3xl font-bold text-orange-400">
            {timers.filter(timer => timer.status === 'active').length}
          </p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Total Presenters</h3>
          <p className="text-3xl font-bold text-purple-400">
            {new Set(timers.map(timer => timer.presenter_name)).size}
          </p>
        </div>
      </div>
    </div>
  )
}