import React from 'react'
import { Plus, Play, Trash2, Clock, Users } from 'lucide-react'
import { formatTime as formatTimeUtil } from '../lib/timerUtils'

export default function SingleTimersPage({
  timers,
  timerSessions,
  currentTime,
  onCreateTimer,
  onSelectTimer,
  onDeleteTimer,
  onStartTimer,
  selectedTimer
}) {
  const singleTimers = timers.filter(timer => timer.timer_type === 'single')

  const getTimerStatus = (timer) => {
    const session = timerSessions[timer.id]
    if (!session) return { status: 'Not Started', color: 'gray' }

    if (session.is_running) return { status: 'Running', color: 'green' }
    if (session.time_left <= 0) return { status: 'Finished', color: 'blue' }
    if (session.time_left < timer.duration) return { status: 'Paused', color: 'yellow' }
    return { status: 'Ready', color: 'gray' }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const calculateTimeLeft = (timer) => {
    const session = timerSessions[timer.id]
    if (!session) return timer.duration

    if (!session.is_running) {
      return session.time_left
    }

    const elapsed = Math.floor((currentTime - new Date(session.updated_at).getTime()) / 1000)
    return session.time_left - elapsed
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Single Timers</h1>
          <p className="text-gray-300">Create and manage standalone timers for individual presentations</p>
        </div>
        <button
          onClick={onCreateTimer}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Single Timer
        </button>
      </div>

      {singleTimers.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Single Timers Yet</h3>
          <p className="text-gray-400 mb-6">Create your first standalone timer to get started</p>
          <button
            onClick={onCreateTimer}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Single Timer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {singleTimers.map((timer) => {
            const timerStatus = getTimerStatus(timer)
            const timeLeft = calculateTimeLeft(timer)

            return (
              <div
                key={timer.id}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-lg border-2 transition-all hover:shadow-xl ${
                  selectedTimer?.id === timer.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/50'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 truncate">
                        {timer.name}
                      </h3>
                      {timer.presenter_name && (
                        <div className="flex items-center gap-2 text-gray-300 text-sm mb-3">
                          <Users className="w-4 h-4" />
                          <span>{timer.presenter_name}</span>
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      timerStatus.color === 'green' ? 'bg-green-900/50 text-green-300 border border-green-500' :
                      timerStatus.color === 'yellow' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500' :
                      timerStatus.color === 'blue' ? 'bg-blue-900/50 text-blue-300 border border-blue-500' :
                      'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {timerStatus.status}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-mono font-bold text-red-500 mb-2">
                      {formatTimeUtil(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Duration: {formatDuration(timer.duration)}
                    </div>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div
                      className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((timer.duration - timeLeft) / timer.duration) * 100))}%`
                      }}
                    ></div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectTimer(timer)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Control
                    </button>
                    <button
                      onClick={() => onStartTimer(timer.id)}
                      disabled={timerStatus.status === 'Running'}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTimer(timer.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {timer.description && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-sm text-gray-400">{timer.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const Settings = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
