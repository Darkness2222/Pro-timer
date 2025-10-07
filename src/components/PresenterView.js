import React, { useState, useEffect } from 'react'
import { Clock, MessageSquare, Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react'
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
  const [nextPresenter, setNextPresenter] = useState(null)
  const [newMessage, setNewMessage] = useState(null)
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null)
  const [finishing, setFinishing] = useState(false)

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
      if (messagesResult.data) {
        const latestMessage = messagesResult.data[0]
        if (latestMessage && (!lastMessageTimestamp || new Date(latestMessage.created_at).getTime() > lastMessageTimestamp)) {
          setNewMessage(latestMessage)
          setLastMessageTimestamp(new Date(latestMessage.created_at).getTime())
          setTimeout(() => setNewMessage(null), 5000)
        }
        setMessages(messagesResult.data)
      }

      if (assignmentData.event_id && timerResult.data) {
        const { data: nextPresenterData } = await supabase
          .from('event_presenter_assignments')
          .select('presenter_name, timers(name, duration)')
          .eq('event_id', assignmentData.event_id)
          .gt('order_index', assignmentData.order_index)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (nextPresenterData) {
          setNextPresenter(nextPresenterData)
        } else {
          setNextPresenter(null)
        }
      }

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

  const handleFinishPresentation = async () => {
    if (!timer || finishing) return

    setFinishing(true)
    try {
      await supabase
        .from('timers')
        .update({ status: 'finished_early' })
        .eq('id', timer.id)

      await supabase
        .from('timer_sessions')
        .update({
          time_left: 0,
          is_running: false,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timer.id)

      await supabase.from('timer_logs').insert({
        timer_id: timer.id,
        action: 'finish',
        notes: 'Finished by presenter',
        time_value: session?.time_left || 0
      })

      await loadPresenterData()
    } catch (error) {
      console.error('Error finishing presentation:', error)
      alert('Failed to finish presentation. Please try again.')
    } finally {
      setFinishing(false)
    }
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
        {/* New Message Notification */}
        {newMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 border-2 border-blue-400 rounded-xl p-4 shadow-2xl animate-sparkle">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-white animate-pulse" />
                <div>
                  <p className="text-white font-bold text-lg">New Message from Admin</p>
                  <p className="text-blue-100 font-medium">{newMessage.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Presenter Mode Indicator */}
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30">
            <Clock className="w-4 h-4" />
            Presenter View
          </span>
        </div>

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
              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-lg font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  Presentation Complete
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
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

            {!isFinished && (
              <button
                onClick={handleFinishPresentation}
                disabled={finishing}
                className="w-full max-w-md bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-6 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-2xl hover:shadow-green-500/50 active:scale-95 border-2 border-green-500"
              >
                <CheckCircle className="w-7 h-7" />
                {finishing ? 'Finishing...' : 'Finish Presentation'}
              </button>
            )}
          </div>
        </div>

{messages.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
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

        {event && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Event Information</h2>
            {nextPresenter ? (
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 rounded-full p-2">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Up Next</p>
                    <p className="text-white font-bold text-lg">{nextPresenter.presenter_name}</p>
                    {nextPresenter.timers && (
                      <p className="text-gray-300 text-sm">
                        {nextPresenter.timers.name} ({formatTime(nextPresenter.timers.duration)})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-600 rounded-full p-2">
                    <CheckCircle className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium">You are the final presenter</p>
                    <p className="text-gray-400 text-sm">No more presentations after yours</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Controlled by event administrator</p>
          <p className="mt-1">This page will update automatically</p>
          <p className="mt-4 text-xs text-gray-600">You are in Presenter Mode - navigation is restricted to this view only</p>
        </div>
      </div>
    </div>
  )
}
