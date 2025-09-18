import React, { useState, useEffect } from 'react'
import { X, Clock, CheckCircle, Play, Users, Plus, Settings } from 'lucide-react'

export default function EventRunningInterfaceModal({ 
  timers, 
  timerSessions, 
  bufferTimerState,
  autoStartNextEvent,
  onClose, 
  onStartNextTimer,
  onExtendBuffer,
  onToggleAutoStart,
  onExtendTimer
}) {
  const [currentState, setCurrentState] = useState('presenter') // presenter, buffer, final

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

  // Determine current state based on timer states
  useEffect(() => {
    if (bufferTimerState.isRunning) {
      setCurrentState('buffer')
    } else if (currentRunningTimer) {
      setCurrentState('presenter')
    } else if (eventTimers.length > 0 && completedTimers.length === eventTimers.length) {
      setCurrentState('final')
    } else {
      setCurrentState('presenter')
    }
  }, [bufferTimerState.isRunning, currentRunningTimer, eventTimers.length, completedTimers.length])

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
        borderColor: 'border-green-600',
        numberBg: 'bg-green-600',
        numberText: '✓'
      }
    }
    
    if (session?.is_running) {
      return {
        status: 'Current',
        detail: `${formatDuration(session.time_left || timer.duration)} remaining`,
        icon: Clock,
        color: 'text-blue-400',
        bgColor: 'bg-blue-600 bg-opacity-20',
        borderColor: 'border-blue-600',
        numberBg: 'bg-gradient-to-br from-blue-500 to-purple-600',
        numberText: eventTimers.findIndex(t => t.id === timer.id) + 1
      }
    }

    if (bufferTimerState.isRunning && timer.id === nextUpTimer?.id) {
      return {
        status: 'Buffer',
        detail: `${formatDuration(timer.duration)} allocated`,
        icon: Clock,
        color: 'text-orange-400',
        bgColor: 'bg-orange-600 bg-opacity-20',
        borderColor: 'border-orange-600',
        numberBg: 'bg-gradient-to-br from-blue-500 to-purple-600',
        numberText: eventTimers.findIndex(t => t.id === timer.id) + 1
      }
    }
    
    return {
      status: 'Upcoming',
      detail: `${formatDuration(timer.duration)} allocated`,
      icon: Clock,
      color: 'text-gray-400',
      bgColor: 'bg-gray-600 bg-opacity-20',
      borderColor: 'border-gray-600',
      numberBg: 'bg-gray-600 bg-opacity-40',
      numberText: eventTimers.findIndex(t => t.id === timer.id) + 1
    }
  }

  const getEventTitle = () => {
    if (eventTimers.length === 0) return 'Event Timer'
    return eventTimers[0].name || 'Event Timer'
  }

  const getEventStatus = () => {
    const totalPresenters = eventTimers.length
    const completedCount = completedTimers.length
    const currentPresenterIndex = currentRunningTimer ? eventTimers.findIndex(t => t.id === currentRunningTimer.id) + 1 : completedCount + 1
    
    if (currentState === 'final') {
      return `Event Completed • ${totalPresenters} presentations finished`
    }
    
    if (currentState === 'buffer') {
      return `Presenter ${currentPresenterIndex} of ${totalPresenters} • Buffer time`
    }
    
    const remainingTime = eventTimers
      .filter(timer => !completedTimers.some(completed => completed.id === timer.id))
      .reduce((total, timer) => {
        const session = timerSessions[timer.id]
        return total + (session?.time_left || timer.duration)
      }, 0)
    
    return `Presenter ${currentPresenterIndex} of ${totalPresenters} • ${formatDuration(remainingTime)} remaining`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              {getEventTitle()}
            </h1>
            <p className="text-lg text-gray-300">
              {getEventStatus()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Main Timer Section (Presenter Active) */}
          {currentState === 'presenter' && currentRunningTimer && (
            <div className="bg-white bg-opacity-10 backdrop-blur-xl rounded-3xl p-10 mb-8 text-center border border-white border-opacity-20">
              <div className="text-2xl font-semibold text-blue-300 mb-4">
                {currentRunningTimer.presenter_name} - {currentRunningTimer.name}
              </div>
              <div className="text-7xl font-bold font-mono mb-6 text-shadow-lg">
                {formatDuration(timerSessions[currentRunningTimer.id]?.time_left || currentRunningTimer.duration)}
              </div>
              <div className="flex gap-5 justify-center">
                <button
                  onClick={() => onStartNextTimer(nextUpTimer?.id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all transform hover:-translate-y-1 hover:shadow-lg"
                >
                  Finish Presenter
                </button>
                <button
                  onClick={() => onExtendTimer(currentRunningTimer.id, 5)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all transform hover:-translate-y-1 hover:shadow-lg"
                >
                  +5 Min
                </button>
              </div>
            </div>
          )}

          {/* Buffer Section */}
          {currentState === 'buffer' && bufferTimerState.isRunning && (
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-10 mb-8 text-center text-white">
              <div className="text-3xl font-bold mb-2">Transition Buffer</div>
              <div className="text-lg opacity-90 mb-6">
                Time between {completedTimers[completedTimers.length - 1]?.presenter_name} and {nextUpTimer?.presenter_name}
              </div>
              <div className="text-6xl font-bold font-mono mb-8">
                {formatDuration(bufferTimerState.timeLeft)}
              </div>
              
              <div className="flex gap-5 justify-center items-center mb-8">
                <div 
                  className={`auto-start-toggle ${autoStartNextEvent ? 'enabled' : ''} bg-white bg-opacity-20 border-2 border-white border-opacity-30 rounded-xl px-5 py-3 flex items-center gap-3 cursor-pointer transition-all hover:bg-opacity-30`}
                  onClick={() => onToggleAutoStart(!autoStartNextEvent)}
                >
                  <div className={`toggle-switch ${autoStartNextEvent ? 'enabled' : ''} w-10 h-5 bg-white bg-opacity-30 rounded-full relative transition-all ${autoStartNextEvent ? 'bg-green-500' : ''}`}>
                    <div className={`toggle-knob w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${autoStartNextEvent ? 'left-5' : 'left-0.5'}`}></div>
                  </div>
                  <span className="font-medium">Auto-start next presenter</span>
                </div>
                
                <button
                  onClick={() => onStartNextTimer(nextUpTimer?.id)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all transform hover:-translate-y-1"
                >
                  Start Now
                </button>
                <button
                  onClick={() => onExtendBuffer(1)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-4 rounded-2xl font-semibold border-2 border-white border-opacity-30 transition-all"
                >
                  +1 Min
                </button>
              </div>

              {nextUpTimer && (
                <div className="bg-blue-600 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-xl p-4">
                  <div className="text-sm opacity-80 mb-2">Next Up:</div>
                  <div className="text-xl font-semibold text-blue-200">
                    {nextUpTimer.presenter_name} - {nextUpTimer.name} ({formatDuration(nextUpTimer.duration)})
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Progress Section */}
          <div className="bg-white bg-opacity-10 backdrop-blur-xl rounded-2xl p-8 border border-white border-opacity-20">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Event Progress</h3>
            {eventTimers.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No event timers found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventTimers.map((timer, index) => {
                  const timerStatus = getTimerStatus(timer)
                  const StatusIcon = timerStatus.icon
                  
                  return (
                    <div
                      key={timer.id}
                      className={`presenter-item flex items-center p-4 rounded-xl transition-all duration-300 ${
                        timerStatus.status === 'Completed' ? 'completed bg-green-600 bg-opacity-20 border border-green-600 border-opacity-30' :
                        timerStatus.status === 'Current' || timerStatus.status === 'Buffer' ? 'current bg-blue-600 bg-opacity-20 border border-blue-600 border-opacity-40 transform scale-105' :
                        'upcoming bg-white bg-opacity-5 border border-white border-opacity-10 opacity-70'
                      }`}
                    >
                      <div className={`presenter-number w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm mr-4 ${timerStatus.numberBg} text-white`}>
                        {timerStatus.numberText}
                      </div>
                      
                      <div className="presenter-info flex-1">
                        <div className="presenter-name font-semibold text-white mb-1">
                          {timer.presenter_name} - {timer.name}
                        </div>
                        <div className="presenter-duration text-sm opacity-70">
                          {timerStatus.detail}
                        </div>
                      </div>
                      
                      <div className={`presenter-status px-3 py-1 rounded-full text-sm font-semibold ml-3 ${
                        timerStatus.status === 'Completed' ? 'status-completed bg-green-600 bg-opacity-30 text-green-300' :
                        timerStatus.status === 'Current' ? 'status-current bg-blue-600 bg-opacity-30 text-blue-300' :
                        timerStatus.status === 'Buffer' ? 'status-buffer bg-orange-600 bg-opacity-30 text-orange-300' :
                        'status-upcoming bg-white bg-opacity-10 text-gray-300'
                      }`}>
                        {timerStatus.status}
                      </div>

                      {/* Extend Timer Button for Current Timer */}
                      {timerStatus.status === 'Current' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onExtendTimer(timer.id, 5)
                          }}
                          className="ml-3 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          5 Min
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Final State Message */}
          {currentState === 'final' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Event Completed!</h3>
              <p className="text-gray-300">All presentations have finished successfully.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Total Presentations: {eventTimers.length}</span>
            <span>Completed: {completedTimers.length}</span>
            <span>
              {currentState === 'buffer' ? 'Buffer Time Active' : 
               currentState === 'final' ? 'Event Complete' : 
               currentRunningTimer ? 'Presentation In Progress' : 'Ready to Start'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}