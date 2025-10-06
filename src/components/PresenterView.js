import React, { useState, useEffect } from 'react'
import { Clock, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { calculateTimeLeft, formatTime as formatTimeUtil } from '../lib/timerUtils'

export default function PresenterView({ sessionToken }) {
  const [loading, setLoading] = useState(true)
  const [assignment, setAssignment] = useState(null)
  const [timer, setTimer] = useState(null)
  const [session, setSession] = useState(null)
  const [event, setEvent] = useState(null)
  const [messages, setMessages] = useState([])
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionToken) {
      loadPresenterData()
      const interval = setInterval(loadPresenterData, 2000)
      return () => clearInterval(interval)
    }
  }, [sessionToken])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadPresenterData = async () => {
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('event_presenter_assignments')
        .select('*')
        .eq('session_token', sessionToken)
        .maybeSingle()

      if (assignmentError) throw assignmentError

      if (!assignmentData) {
        setError('Invalid session. Please scan the QR code again.')
        setLoading(false)
        return
      }

      setAssignment(assignmentData)

      const [timerResult, eventResult, sessionResult, messagesResult] = await Promise.all([
        supabase
          .from('timers')
          .select('*')
          .eq('id', assignmentData.timer_id)
          .single(),
        supabase
          .from('events')
          .select('*')
          .eq('id', assignmentData.event_id)
          .single(),
        supabase
          .from('timer_sessions')
          .select('*')
          .eq('timer_id', assignmentData.timer_id)
          .maybeSingle(),
        supabase
          .from('timer_messages')
          .select('*')
          .eq('timer_id', assignmentData.timer_id)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      if (timerResult.data) setTimer(timerResult.data)
      if (eventResult.data) setEvent(eventResult.data)
      if (sessionResult.data) setSession(sessionResult.data)
      if (messagesResult.data) setMessages(messagesResult.data)

      setLoading(false)
    } catch (error) {
      console.error('Error loading presenter data:', error)
      setError('Failed to load timer information')
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    return formatTimeUtil(seconds)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your timer...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 border border-red-500 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  const timeLeft = calculateTimeLeft(session, timer?.duration, currentTime)
  const isRunning = session?.is_running || false
  const isFinished = timer?.status === 'completed' || timer?.status === 'finished_early'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-white mb-2">{assignment?.presenter_name}</h1>
            <p className="text-xl text-gray-400">{timer?.name}</p>
            {event && (
              <p className="text-sm text-gray-500 mt-2">{event.name}</p>
            )}
          </div>

          <div className="bg-gray-900 rounded-xl p-12 mb-6">
            <div className={`text-8xl font-bold text-center mb-4 ${timeLeft < 0 ? 'text-red-500' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </div>
            {timeLeft < 0 && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-lg font-semibold">
                  <Clock className="w-5 h-5" />
                  OVERTIME
                </div>
              </div>
            )}
            {isFinished && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-lg font-semibold">
                  Presentation Complete
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            {isRunning ? (
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">Timer Running</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-3 h-3 bg-gray-500 rounded-full" />
                <span className="font-medium">Timer Paused</span>
              </div>
            )}
          </div>
        </div>

        {messages.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Messages from Admin</h2>
            </div>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
                >
                  <p className="text-white font-medium mb-1">{msg.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Controlled by event administrator</p>
          <p className="mt-1">This page will update automatically</p>
        </div>
      </div>
    </div>
  )
}
