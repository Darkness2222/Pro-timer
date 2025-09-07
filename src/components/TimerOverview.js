import React from 'react'
import { Play, Pause, Square, RotateCcw, Clock, User, FileText } from 'lucide-react'

export default function TimerOverview({ 
  timers, 
  timerSessions, 
  onStartTimer, 
  onPauseTimer, 
  onStopTimer, 
  onResetTimer,
  onViewLogs 
}) {
  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerStatus = (session) => {
    if (!session) return 'stopped'
    return session.is_running ? 'running' : (session.time_left > 0 ? 'paused' : 'stopped')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'paused': return 'text-yellow-400'
      case 'stopped': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getProgressPercentage = (timer, session) => {
    if (!session || timer.duration <= 0) return 0
    const elapsed = timer.duration - session.time_left
    return Math.min(100, Math.max(0, (elapsed / timer.duration) * 100))
  }

  if (!timers || timers.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
        <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Timers Yet</h3>
        <p className="text-gray-400">Create your first timer to get started with the overview.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Timer Overview</h2>
        <div className="text-sm text-gray-400">
          {timers.length} timer{timers.length !== 1 ? 's' : ''} total
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {timers.map((timer) => {
          const session = timerSessions[timer.id]
          const status = getTimerStatus(session)
          const timeLeft = session?.time_left || timer.duration
          const progress = getProgressPercentage(timer, session)

          return (
            <div
              key={timer.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Timer Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {timer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400 truncate">
                      {timer.presenter_name}
                    </span>
                  </div>
                </div>
                <div className={`text-sm font-medium capitalize ${getStatusColor(status)}`}>
                  {status}
                </div>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-4">
                <div className="text-3xl font-mono font-bold text-white mb-2">
                  {formatTime(timeLeft)}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-400">
                  {formatTime(timer.duration)} total
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-2 mb-3">
                {status === 'running' ? (
                  <button
                    onClick={() => onPauseTimer(timer.id)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => onStartTimer(timer.id)}
                    disabled={timeLeft <= 0}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </button>
                )}
                
                <button
                  onClick={() => onStopTimer(timer.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <Square className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onResetTimer(timer.id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* View Logs Button */}
              <button
                onClick={() => onViewLogs(timer.id)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Logs
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}