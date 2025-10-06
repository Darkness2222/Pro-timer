import React, { useState, useEffect } from 'react'
import { ArrowLeft, Users, Clock, Play, Pause, RotateCcw, Plus, Minus, MessageSquare, Loader as Loader2, QrCode, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { calculateTimeLeft, formatTime as formatTimeUtil } from '../lib/timerUtils'
import QRCodeModal from './QRCodeModal'
import AccessManagement from './AccessManagement'
import { checkIsAdmin } from '../lib/adminUtils'

export default function EventDetail({ eventId, session, onBack }) {
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [timers, setTimers] = useState([])
  const [selectedTimer, setSelectedTimer] = useState(null)
  const [timerSessions, setTimerSessions] = useState({})
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [showQRModal, setShowQRModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (eventId && session?.user) {
      checkAdminStatus()
      loadEventDetail()
      const interval = setInterval(loadEventDetail, 2000)
      return () => clearInterval(interval)
    }
  }, [eventId, session])

  const checkAdminStatus = async () => {
    if (session?.user) {
      const adminStatus = await checkIsAdmin(session.user.id)
      setIsAdmin(adminStatus)
    }
  }

  const loadEventDetail = async () => {
    try {
      const [eventResult, timersResult] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase
          .from('timers')
          .select('*')
          .eq('event_id', eventId)
          .order('presentation_order', { ascending: true })
      ])

      if (eventResult.error) throw eventResult.error
      if (timersResult.error) throw timersResult.error

      setEvent(eventResult.data)
      setTimers(timersResult.data || [])

      const timerIds = timersResult.data?.map(t => t.id) || []
      if (timerIds.length > 0) {
        const { data: sessions } = await supabase
          .from('timer_sessions')
          .select('*')
          .in('timer_id', timerIds)

        const sessionMap = {}
        sessions?.forEach(s => {
          sessionMap[s.timer_id] = s
        })
        setTimerSessions(sessionMap)
      }
    } catch (error) {
      console.error('Error loading event detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimerControl = async (timerId, action) => {
    try {
      const session = timerSessions[timerId]

      if (action === 'start') {
        if (session) {
          await supabase
            .from('timer_sessions')
            .update({ is_running: true, updated_at: new Date().toISOString() })
            .eq('timer_id', timerId)
        } else {
          const timer = timers.find(t => t.id === timerId)
          await supabase
            .from('timer_sessions')
            .insert({
              timer_id: timerId,
              time_left: timer.duration,
              is_running: true
            })
        }

        await supabase.from('timer_logs').insert({
          timer_id: timerId,
          action: 'start',
          time_value: session?.time_left || 0
        })
      } else if (action === 'pause') {
        await supabase
          .from('timer_sessions')
          .update({ is_running: false, updated_at: new Date().toISOString() })
          .eq('timer_id', timerId)

        await supabase.from('timer_logs').insert({
          timer_id: timerId,
          action: 'pause',
          time_value: session?.time_left || 0
        })
      } else if (action === 'reset') {
        const timer = timers.find(t => t.id === timerId)
        await supabase
          .from('timer_sessions')
          .upsert({
            timer_id: timerId,
            time_left: timer.duration,
            is_running: false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'timer_id' })

        await supabase.from('timer_logs').insert({
          timer_id: timerId,
          action: 'reset',
          time_value: timer.duration
        })
      } else if (action === 'finish') {
        await supabase
          .from('timers')
          .update({ status: 'finished_early' })
          .eq('id', timerId)

        await supabase
          .from('timer_sessions')
          .update({ is_running: false, updated_at: new Date().toISOString() })
          .eq('timer_id', timerId)

        await supabase.from('timer_logs').insert({
          timer_id: timerId,
          action: 'finish',
          time_value: session?.time_left || 0
        })
      }

      await loadEventDetail()
    } catch (error) {
      console.error('Error controlling timer:', error)
    }
  }

  const handleTimeAdjust = async (timerId, change) => {
    try {
      const session = timerSessions[timerId]
      if (!session) return

      const newTimeLeft = Math.max(0, session.time_left + change)

      await supabase
        .from('timer_sessions')
        .update({ time_left: newTimeLeft, updated_at: new Date().toISOString() })
        .eq('timer_id', timerId)

      await supabase.from('timer_logs').insert({
        timer_id: timerId,
        action: change > 0 ? 'add_time' : 'subtract_time',
        time_value: newTimeLeft,
        duration_change: change
      })

      await loadEventDetail()
    } catch (error) {
      console.error('Error adjusting time:', error)
    }
  }

  const handleSendMessage = async (timerId, message) => {
    try {
      await supabase.from('timer_messages').insert({
        timer_id: timerId,
        message: message
      })

      await supabase.from('timer_logs').insert({
        timer_id: timerId,
        action: 'message_sent',
        notes: message
      })

      alert('Message sent!')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const handleDeleteEvent = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: session.user.id
        })
        .eq('id', eventId)

      if (error) throw error

      setShowDeleteModal(false)
      onBack()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event: ' + error.message)
    }
  }

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds) => {
    return formatTimeUtil(seconds)
  }

  const getStatusColor = (timer) => {
    const session = timerSessions[timer.id]
    if (timer.status === 'completed' || timer.status === 'finished_early') {
      return 'bg-green-500/20 border-green-500'
    }
    if (session?.is_running) {
      return 'bg-blue-500/20 border-blue-500'
    }
    return 'bg-gray-700 border-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Event not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Events
        </button>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
              {event.description && (
                <p className="text-gray-400">{event.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQRModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium capitalize">
                {event.status.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Presenters</div>
                <div className="text-lg font-semibold text-white">{timers.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Total Duration</div>
                <div className="text-lg font-semibold text-white">
                  {Math.floor(timers.reduce((sum, t) => sum + t.duration, 0) / 60)} min
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Buffer Time</div>
                <div className="text-lg font-semibold text-white">
                  {event.buffer_duration > 0 ? `${event.buffer_duration}s` : 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">Presenters</h2>
            <div className="space-y-2">
              {timers.map((timer, index) => {
                const session = timerSessions[timer.id]
                const isSelected = selectedTimer?.id === timer.id
                return (
                  <div
                    key={timer.id}
                    onClick={() => setSelectedTimer(timer)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : getStatusColor(timer)
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-white">
                        {index + 1}. {timer.presenter_name}
                      </div>
                      {session?.is_running && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{timer.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatTime(calculateTimeLeft(session, timer.duration, currentTime))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedTimer ? (
              <PresenterControl
                timer={selectedTimer}
                session={timerSessions[selectedTimer.id]}
                onTimerControl={handleTimerControl}
                onTimeAdjust={handleTimeAdjust}
                onSendMessage={handleSendMessage}
                formatTime={formatTime}
                currentTime={currentTime}
              />
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Presenter</h3>
                <p className="text-gray-400">Choose a presenter from the list to view and control their timer</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <AccessManagement eventId={eventId} />
        </div>
      </div>

      {showQRModal && (
        <QRCodeModal
          eventId={eventId}
          organizationId={event.organization_id}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Delete Event?</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this event? The event will be moved to "Recently Deleted" where it can be recovered within 5 days.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              After 5 days, the event and all associated data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteEvent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Event
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PresenterControl({ timer, session, onTimerControl, onTimeAdjust, onSendMessage, formatTime, currentTime }) {
  const [customMessage, setCustomMessage] = useState('')

  const quickMessages = [
    '5 minutes remaining',
    '2 minutes remaining',
    '1 minute remaining',
    'Please wrap up',
    'Time is up'
  ]

  const isRunning = session?.is_running || false
  const timeLeft = calculateTimeLeft(session, timer.duration, currentTime)
  const isFinished = timer.status === 'completed' || timer.status === 'finished_early'

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">{timer.presenter_name}</h2>
        <p className="text-gray-400">{timer.name}</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-8 mb-6 text-center">
        <div className={`text-6xl font-bold mb-2 ${timeLeft < 0 ? 'text-red-500' : 'text-white'}`}>
          {formatTime(timeLeft)}
        </div>
        {timeLeft < 0 && (
          <div className="text-red-400 font-medium">OVERTIME</div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => onTimerControl(timer.id, isRunning ? 'pause' : 'start')}
          disabled={isFinished}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => onTimerControl(timer.id, 'reset')}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={() => onTimerControl(timer.id, 'finish')}
          disabled={isFinished}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors col-span-2"
        >
          Finish Early
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Time Adjustments</h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onTimeAdjust(timer.id, -60)}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
          >
            <Minus className="w-3 h-3" />
            1m
          </button>
          <button
            onClick={() => onTimeAdjust(timer.id, -30)}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
          >
            <Minus className="w-3 h-3" />
            30s
          </button>
          <button
            onClick={() => onTimeAdjust(timer.id, 30)}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            30s
          </button>
          <button
            onClick={() => onTimeAdjust(timer.id, 60)}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            1m
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Send Message to Presenter
        </h3>
        <div className="space-y-2 mb-3">
          {quickMessages.map((msg, index) => (
            <button
              key={index}
              onClick={() => onSendMessage(timer.id, msg)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm text-left transition-colors"
            >
              {msg}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Custom message..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (customMessage.trim()) {
                onSendMessage(timer.id, customMessage)
                setCustomMessage('')
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
