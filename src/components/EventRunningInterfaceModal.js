import React, { useState, useEffect } from 'react'
import { X, Clock, CircleCheck as CheckCircle, Play, Pause, Square, Plus } from 'lucide-react'

export default function EventRunningInterfaceModal({
  timers,
  timerSessions,
  bufferTimerState,
  autoStartNextEvent,
  onClose,
  onStartNextTimer,
  onExtendBuffer,
  onToggleAutoStart,
  onExtendTimer,
  onPauseTimer,
  onResumeTimer
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
            <div className="main-timer-section">
              <div className="current-presenter">
                {currentRunningTimer.presenter_name} - {currentRunningTimer.name}
              </div>
              <div className={`main-timer ${timerSessions[currentRunningTimer.id]?.time_left <= 120 ? 'timer-danger' : timerSessions[currentRunningTimer.id]?.time_left <= 300 ? 'timer-warning' : ''}`}>
                {formatDuration(timerSessions[currentRunningTimer.id]?.time_left || currentRunningTimer.duration)}
              </div>

              {/* Up Next Display */}
              {nextUpTimer && (
                <div className="next-presenter-preview" style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <div className="next-title">Up Next:</div>
                  <div className="next-name">
                    {nextUpTimer.presenter_name} - {nextUpTimer.name} ({formatDuration(nextUpTimer.duration)})
                  </div>
                </div>
              )}

              <div className="timer-controls">
                {timerSessions[currentRunningTimer.id]?.is_running ? (
                  <>
                    <button
                      className="btn btn-pause"
                      onClick={() => onPauseTimer && onPauseTimer(currentRunningTimer.id)}
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                    <button
                      className="btn btn-finish"
                      onClick={() => onStartNextTimer(nextUpTimer?.id)}
                    >
                      <Square className="w-4 h-4" />
                      Finish
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => onResumeTimer && onResumeTimer(currentRunningTimer.id)}
                      style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </button>
                    <button
                      className="btn btn-finish"
                      onClick={() => onStartNextTimer(nextUpTimer?.id)}
                    >
                      <Square className="w-4 h-4" />
                      Finish
                    </button>
                  </>
                )}
                <button className="btn btn-extend" onClick={() => onExtendTimer(currentRunningTimer.id, 5)}>
                  <Plus className="w-4 h-4" />
                  +5 Min
                </button>
              </div>
            </div>
          )}

          {/* Buffer Section */}
          {currentState === 'buffer' && bufferTimerState.isRunning && (
            <div className="buffer-section active">
              <div className="buffer-title">Transition Buffer</div>
              <div className="buffer-subtitle">
                Time between {completedTimers[completedTimers.length - 1]?.presenter_name} and {nextUpTimer?.presenter_name}
              </div>
              <div className="buffer-timer">
                {formatDuration(bufferTimerState.timeLeft)}
              </div>
              
              <div className="buffer-controls">
                <div
                  className={`auto-start-toggle ${autoStartNextEvent ? 'enabled' : ''}`}
                  onClick={() => onToggleAutoStart(!autoStartNextEvent)}
                >
                  <div className={`toggle-switch ${autoStartNextEvent ? 'enabled' : ''}`}>
                    <div className={`toggle-knob ${autoStartNextEvent ? 'enabled' : ''}`}></div>
                  </div>
                  <span>Auto-start next presenter</span>
                </div>
                
                <button className="btn btn-manual-start" onClick={() => onStartNextTimer(nextUpTimer?.id)}>Start Now</button>
                <button className="btn btn-extend-buffer" onClick={() => onExtendBuffer(1)}>+1 Min</button>
              </div>

              {nextUpTimer && (
                <div className="next-presenter-preview">
                  <div className="next-title">Next Up:</div>
                  <div className="next-name">
                    {nextUpTimer.presenter_name} - {nextUpTimer.name} ({formatDuration(nextUpTimer.duration)})
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Progress Section */}
          <div className="progress-section">
            <h3 className="progress-title">Event Progress</h3>
            {eventTimers.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No event timers found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventTimers.map((timer, index) => {
                  const timerStatus = getTimerStatus(timer)

                  return (
                    <div
                      key={timer.id}
                      className={`presenter-item ${
                        timerStatus.status === 'Completed' ? 'completed' :
                        timerStatus.status === 'Current' || timerStatus.status === 'Buffer' ? 'current' :
                        'upcoming'
                      }`}
                    >
                      <div className={`presenter-number ${timerStatus.numberBg}`}>
                        {timerStatus.numberText}
                      </div>
                      
                      <div className="presenter-info">
                        <div className="presenter-name">
                          {timer.presenter_name} - {timer.name}
                        </div>
                        <div className="presenter-duration">
                          {timerStatus.detail}
                        </div>
                      </div>
                      
                      <div className={`presenter-status ${
                        timerStatus.status === 'Completed' ? 'status-completed' :
                        timerStatus.status === 'Current' ? 'status-current' :
                        timerStatus.status === 'Buffer' ? 'status-current' : // Use current style for buffer status
                        'status-upcoming'
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