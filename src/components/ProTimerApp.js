import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ProTimerApp({ session, bypassAuth }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTimer, setSelectedTimer] = useState(null)
  const [timers, setTimers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timerSessions, setTimerSessions] = useState({})
  const [logs, setLogs] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Load timers on component mount
  useEffect(() => {
    loadTimers()
  }, [])

  // Subscribe to timer sessions changes
  useEffect(() => {
    const subscription = supabase
      .channel('timer_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_sessions' }, (payload) => {
        console.log('Timer session change:', payload)
        loadTimerSessions()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Load timer sessions when timers change
  useEffect(() => {
    if (timers.length > 0) {
      loadTimerSessions()
    }
  }, [timers])

  const loadTimers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('timers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTimers(data || [])
    } catch (error) {
      console.error('Error loading timers:', error)
      setError('Failed to load timers')
    } finally {
      setLoading(false)
    }
  }

  const loadTimerSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')

      if (error) throw error
      
      const sessionsMap = {}
      data?.forEach(session => {
        sessionsMap[session.timer_id] = session
      })
      setTimerSessions(sessionsMap)
    } catch (error) {
      console.error('Error loading timer sessions:', error)
    }
  }

  const handleTimerClick = (timer) => {
    console.log('Timer clicked:', timer)
    setSelectedTimer(timer)
    setActiveTab('admin')
  }

  const deleteTimer = async (timerId) => {
    if (!window.confirm('Are you sure you want to delete this timer?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', timerId)

      if (error) throw error
      
      // Remove from local state
      setTimers(timers.filter(t => t.id !== timerId))
      
      // Clear selection if deleted timer was selected
      if (selectedTimer?.id === timerId) {
        setSelectedTimer(null)
      }
    } catch (error) {
      console.error('Error deleting timer:', error)
      alert('Failed to delete timer')
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const renderTimerOverview = () => {
    if (loading) {
      return <div className="text-center py-8">Loading timers...</div>
    }

    if (timers.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No timers created yet</p>
          <button
            onClick={() => setActiveTab('admin')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Your First Timer
          </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timers.map((timer) => {
          const session = timerSessions[timer.id]
          const timeLeft = session?.time_left ?? timer.duration
          const isRunning = session?.is_running ?? false

          return (
            <div
              key={timer.id}
              onClick={() => handleTimerClick(timer)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{timer.name}</h3>
                  <p className="text-sm text-gray-600">by {timer.presenter_name}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTimer(timer.id)
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-mono font-bold mb-2 ${isRunning ? 'text-green-600' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-500">
                  {isRunning ? 'Running' : 'Stopped'} • {formatTime(timer.duration)} total
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderAdminDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>
          {selectedTimer ? (
            <div>
              <p className="text-gray-600">Selected Timer: <span className="font-semibold">{selectedTimer.name}</span></p>
              <p className="text-sm text-gray-500">Presenter: {selectedTimer.presenter_name}</p>
              <p className="text-sm text-gray-500">Duration: {formatTime(selectedTimer.duration)}</p>
            </div>
          ) : (
            <p className="text-gray-500">No timer selected. Click on a timer from the overview to edit it.</p>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => {
              setError(null)
              loadTimers()
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Timer Overview
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Admin Dashboard
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && renderTimerOverview()}
            {activeTab === 'admin' && renderAdminDashboard()}
          </div>
        </div>
      </div>
    </div>
  )
}