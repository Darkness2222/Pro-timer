import React from 'react'
import { Play, Pause, Square, RotateCcw, Clock, User } from 'lucide-react'

export default function TimerOverview({ timers, timerSessions, onStartTimer, onPauseTimer, onStopTimer, onResetTimer }) {
  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = (timeLeft, duration) => {
    if (duration <= 0) return 0
    const elapsed = duration - timeLeft
    return Math.min(100, Math.max(0, (elapsed / duration) * 100))
  }

  const getProgressColor = (percentage) => {
    if (percentage < 50) return '#10b981' // green
    if (percentage < 80) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const getTimerStatus = (session) => {
    if (!session) return { text: 'Not Started', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    if (session.is_running) return { text: 'Running', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (session.time_left > 0) return { text: 'Paused', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { text: 'Finished', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  if (!timers || timers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Timers Created</h3>
        <p className="text-gray-500 mb-6">Create your first timer to get started with the overview.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Timer Overview</h2>
        <p className="text-gray-600">Manage all your timers from one central dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timers.map((timer) => {
          const session = timerSessions.find(s => s.timer_id === timer.id)
          const status = getTimerStatus(session)
          const timeLeft = session?.time_left || timer.duration
          const progressPercentage = getProgressPercentage(timeLeft, timer.duration)
          const progressColor = getProgressColor(progressPercentage)

          return (
            <div key={timer.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              {/* Timer Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{timer.name}</h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <User className="w-4 h-4 mr-1" />
                  {timer.presenter_name}
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                  {status.text}
                </div>
              </div>

              {/* Time Display */}
              <div className="mb-4">
                <div className="text-3xl font-mono font-bold text-gray-800 mb-2">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-500">
                  Duration: {formatTime(timer.duration)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${progressPercentage}%`,
                      backgroundColor: progressColor
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(progressPercentage)}% complete
                </div>
              </div>

              {/* Quick Controls */}
              <div className="flex gap-2">
                {!session?.is_running ? (
                  <button
                    onClick={() => onStartTimer(timer.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </button>
                ) : (
                  <button
                    onClick={() => onPauseTimer(timer.id)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                
                <button
                  onClick={() => onStopTimer(timer.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
                
                <button
                  onClick={() => onResetTimer(timer.id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}