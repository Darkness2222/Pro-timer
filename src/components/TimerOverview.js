import React from 'react'
import { Clock, Users, Timer as TimerIcon } from 'lucide-react'

export default function TimerOverview({ timers, onSelectTimer, selectedTimer }) {
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00'
    }
    const mins = Math.floor(Math.abs(seconds) / 60)
    const secs = Math.abs(seconds) % 60
    const sign = seconds < 0 ? '-' : ''
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = (timeLeft, duration) => {
    if (typeof timeLeft !== 'number' || typeof duration !== 'number' || duration === 0) {
      return 0
    }
    if (duration === 0) return 0
    const elapsed = duration - timeLeft
    const percentage = (elapsed / duration) * 100
    return Math.min(Math.max(percentage, 0), 100) // Clamp between 0-100%
  }

  return (
    <div className="p-6">
      {/* Add error handling wrapper */}
      {!timers ? (
        <div className="text-white">Loading timers...</div>
      ) : (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Timer Overview</h2>
        <p className="text-gray-400">Manage and monitor your presentation timers</p>
      </div>

      {timers.length === 0 ? (
        <div className="text-center py-12">
          <TimerIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No timers yet</h3>
          <p className="text-gray-500">Create your first timer to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {timers.map((timer) => (
            <div key={timer.id}>
              {/* Add safety check for timer data */}
              {timer && timer.id ? (
            <div
              key={timer.id}
              className={`bg-gray-800 rounded-lg p-4 border cursor-pointer transition-colors ${
                selectedTimer?.id === timer.id
                  ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onSelectTimer?.(timer)}
            >
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-white font-medium">{timer.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{timer.presenter_name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono">
                      {formatTime(timer.timeLeft ?? timer.duration ?? 0)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {timer.timeLeft < 0 ? 'Overtime' : 'Remaining'}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${
                    timer.timeLeft < 0 
                      ? 'bg-red-500' 
                      : timer.timeLeft <= timer.duration * 0.1 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ 
                      width: `${getProgressPercentage(timer.timeLeft ?? timer.duration ?? 0, timer.duration ?? 1)}%` 
                  }}
                />
              </div>
              
              {/* Status indicator */}
              {timer.timeLeft < 0 && (
                <div className="text-xs text-red-400 mt-1 text-center">
                  ⚠️ OVERTIME
                </div>
              )}
              </div>
              ) : (
                <div className="text-red-400">Invalid timer data</div>
              )}
            </div>
          ))}
        </div>
      )}
        </div>
      )}
    </div>
  )
}