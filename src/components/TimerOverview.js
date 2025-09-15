import React from 'react'
import { Clock, Users, Timer as TimerIcon, CheckCircle } from 'lucide-react'

export default function TimerOverview({ timers, onSelectTimer, selectedTimer, timerSessions }) {
  // Filter to only show event timers that are active or recently completed
  const eventTimers = timers.filter(timer => 
    timer.timer_type === 'event' && 
    (timer.status === 'active' || timer.status === 'finished_early')
  )

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimerStatus = (timer) => {
    const session = timerSessions?.[timer.id]
    
    if (timer.status === 'finished_early') {
      return {
        status: 'Completed',
        detail: session?.time_left !== undefined 
          ? `Completed in ${formatDuration(timer.duration - session.time_left)}`
          : 'Completed',
        isCompleted: true
      }
    }
    
    if (session?.is_running) {
      return {
        status: 'In Progress',
        detail: `${formatDuration(timer.duration)} allocated`,
        isCompleted: false
      }
    }
    
    return {
      status: 'Ready',
      detail: `${formatDuration(timer.duration)} allocated`,
      isCompleted: false
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Event Progress</h2>
      </div>

      {eventTimers.length === 0 ? (
        <div className="text-center py-12">
          <TimerIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No active events</h3>
          <p className="text-gray-500">Create event timers to track progress</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {eventTimers.map((timer) => {
            const timerStatus = getTimerStatus(timer)
            
            return (
              <div
                key={timer.id}
                className={`bg-gray-800 rounded-2xl p-6 border cursor-pointer transition-all duration-300 ${
                  selectedTimer?.id === timer.id
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                } ${timerStatus.isCompleted ? 'bg-green-900 bg-opacity-30 border-green-700' : ''}`}
                onClick={() => onSelectTimer?.(timer)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      timerStatus.isCompleted 
                        ? 'bg-green-600' 
                        : 'bg-blue-600'
                    }`}>
                      {timerStatus.isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Clock className="w-6 h-6 text-white" />
                      )}
                    </div>
                    
                    {/* Timer Info */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {timer.presenter_name} - {timer.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {timerStatus.detail}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    timerStatus.isCompleted
                      ? 'bg-green-600 bg-opacity-20 text-green-400 border border-green-600'
                      : timerStatus.status === 'In Progress'
                      ? 'bg-blue-600 bg-opacity-20 text-blue-400 border border-blue-600'
                      : 'bg-gray-600 bg-opacity-20 text-gray-400 border border-gray-600'
                  }`}>
                    {timerStatus.status}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}