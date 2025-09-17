import React from 'react'
import { X, Clock, CheckCircle, Play, Users } from 'lucide-react'

export default function EventRunningInterfaceModal({ 
  timers, 
  timerSessions, 
  bufferTimerState,
  onClose, 
  onStartNextTimer 
}) {
  // Filter and sort event timers by creation time
  const eventTimers = timers
    .filter(timer => timer.timer_type === 'event')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  // Identify current running timer
  const currentRunningTimer = eventTimers.find(timer => 
    timerSessions[timer.id]?.is_running === true
  )

  // Identify completed timers
  const completedTimers = eventTimers.filter(timer => 
    timer.status === 'finished_early' || 
    (timerSessions[timer.id] && !timerSessions[timer.id].is_running && timerSessions[timer.id].time_left === 0)
  )

  // Identify next up timer (first timer that's not completed and not currently running)
  const nextUpTimer = eventTimers.find(timer => 
    timer.status === 'active' && 
    !timerSessions[timer.id]?.is_running &&
    !completedTimers.some(completed => completed.id === timer.id) &&
    timer.id !== currentRunningTimer?.id
  )

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimerStatus = (timer) => {
    const session = timerSessions[timer.id]
    
    if (timer.status === 'finished_early' || completedTimers.some(completed => completed.id === timer.id)) {
      return {
        status: 'Completed',
        detail: session?.time_left !== undefined 
          ? `Completed in ${formatDuration(timer.duration - session.time_left)}`
          : 'Completed',
        icon: CheckCircle,
        color: 'text-green-400',
        bgColor: 'bg-green-600 bg-opacity-20',
        borderColor: 'border-green-600'
      }
    }
    
    if (session?.is_running) {
      return {
        status: 'In Progress',
        detail: `${formatDuration(session.time_left || timer.duration)} remaining`,
        icon: Clock,
        color: 'text-blue-400',
        bgColor: 'bg-blue-600 bg-opacity-20',
        borderColor: 'border-blue-600'
      }
    }
    
    return {
      status: 'Allocated',
      detail: `${formatDuration(timer.duration)} allocated`,
      icon: Clock,
      color: 'text-gray-400',
      bgColor: 'bg-gray-600 bg-opacity-20',
      borderColor: 'border-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Event Timer - Running Interface</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Buffer Timer Section */}
          {bufferTimerState.isRunning && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Buffer Time:</h3>
              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-2xl font-bold text-yellow-300 mb-1">
                      {formatDuration(bufferTimerState.timeLeft)}
                    </h4>
                    <p className="text-yellow-200">
                      Transition time between presentations
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 rounded-full border-4 border-yellow-500 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>
                </div>
                {/* Progress bar for buffer */}
                <div className="mt-4">
                  <div className="w-full bg-yellow-900 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${((bufferTimerState.duration - bufferTimerState.timeLeft) / bufferTimerState.duration) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Up Section */}
          {nextUpTimer && !bufferTimerState.isRunning && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Next Up:</h3>
              <div className="bg-orange-500 bg-opacity-20 border border-orange-500 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-bold text-orange-300 mb-1">
                      {nextUpTimer.presenter_name} - {nextUpTimer.name}
                    </h4>
                    <p className="text-orange-200">
                      ({formatDuration(nextUpTimer.duration)})
                    </p>
                  </div>
                  <button
                    onClick={() => onStartNextTimer(nextUpTimer.id)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Next Up During Buffer */}
          {nextUpTimer && bufferTimerState.isRunning && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Starting After Buffer:</h3>
              <div className="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-bold text-blue-300 mb-1">
                      {nextUpTimer.presenter_name} - {nextUpTimer.name}
                    </h4>
                    <p className="text-blue-200">
                      ({formatDuration(nextUpTimer.duration)}) - Will start automatically
                    </p>
                  </div>
                  <button
                    onClick={() => onStartNextTimer(nextUpTimer.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Event Progress Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Event Progress</h3>
            {eventTimers.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No event timers found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventTimers.map((timer) => {
                  const timerStatus = getTimerStatus(timer)
                  const StatusIcon = timerStatus.icon
                  
                  return (
                    <div
                      key={timer.id}
                      className={`p-4 rounded-lg border ${timerStatus.bgColor} ${timerStatus.borderColor}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            timerStatus.status === 'Completed' 
                              ? 'bg-green-600' 
                              : timerStatus.status === 'In Progress'
                              ? 'bg-blue-600'
                              : 'bg-gray-600'
                          }`}>
                            <StatusIcon className="w-5 h-5 text-white" />
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-white">
                              {timer.presenter_name} - {timer.name}
                            </h4>
                            <p className="text-sm text-gray-300">
                              {timerStatus.detail}
                            </p>
                          </div>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${timerStatus.bgColor} ${timerStatus.color} border ${timerStatus.borderColor}`}>
                          {timerStatus.status}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Total Presentations: {eventTimers.length}</span>
            <span>Completed: {completedTimers.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}