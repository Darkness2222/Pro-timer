import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Play, Pause, Square, RotateCcw, Settings, MessageSquare, Plus, Minus, Clock, Users, Timer as TimerIcon, QrCode, ExternalLink, FileText } from 'lucide-react'

export default function ProTimerApp({ session, bypassAuth }) {
  const [currentView, setCurrentView] = useState('admin')
  const [selectedTimer, setSelectedTimer] = useState(null)
  const [timers, setTimers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messagesExpanded, setMessagesExpanded] = useState(false)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [messages, setMessages] = useState([])
  const [timerSessions, setTimerSessions] = useState({})
  const [timerLogs, setTimerLogs] = useState([])
  const [showQRModal, setShowQRModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [allTimerLogs, setAllTimerLogs] = useState([])
  const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' })
  const [quickMessages, setQuickMessages] = useState([
    { id: 1, text: '⏰ 5 minutes remaining', emoji: '⏰' },
    { id: 2, text: '⚡ Please wrap up', emoji: '⚡' },
    { id: 3, text: '🎯 Final slide please', emoji: '🎯' },
    { id: 4, text: '👏 Thank you!', emoji: '👏' }
  ])
  const [overrideTime, setOverrideTime] = useState('')
  const [showOverride, setShowOverride] = useState(false)
  
  // Form states
  const [newTimerName, setNewTimerName] = useState('')
  const [newTimerPresenter, setNewTimerPresenter] = useState('')
  const [newTimerDuration, setNewTimerDuration] = useState('')
  const [newMessage, setNewMessage] = useState('')
  
  const intervalRef = useRef(null)

  // Load timers on component mount
  useEffect(() => {
    loadTimers()
    loadAllTimerLogs()
    // Update timer sessions and current time every second
    const sessionInterval = setInterval(() => {
      updateTimerSessions()
      setCurrentTime(Date.now())
    }, 1000)
    
    return () => clearInterval(sessionInterval)
  }, [])

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft])

  // Update timer sessions for all timers
  const updateTimerSessions = async () => {
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

  const loadTimers = async () => {
    try {
      const { data, error } = await supabase
        .from('timers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTimers(data || [])
    } catch (error) {
      console.error('Error loading timers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTimerLogs = async (timerId) => {
    try {
      const { data, error } = await supabase
        .from('timer_logs')
        .select('*')
        .eq('timer_id', timerId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setTimerLogs(data || [])
    } catch (error) {
      console.error('Error loading timer logs:', error)
    }
  }

  const loadAllTimerLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_logs')
        .select(`
          *,
          timers (
            name,
            presenter_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      setAllTimerLogs(data || [])
    } catch (error) {
      console.error('Error loading all timer logs:', error)
    }
  }

  const logTimerAction = async (action, timeValue = null, durationChange = null, notes = null) => {
    if (!selectedTimer) return
    
    try {
      await supabase
        .from('timer_logs')
        .insert([{
          timer_id: selectedTimer.id,
          action,
          time_value: timeValue,
          duration_change: durationChange,
          notes
        }])
    } catch (error) {
      console.error('Error logging action:', error)
    }
    
    // Reload all logs for reports
    loadAllTimerLogs()
  }

  const createTimer = async () => {
    if (!newTimerName.trim() || !newTimerPresenter.trim() || !newTimerDuration) return

    try {
      const { data, error } = await supabase
        .from('timers')
        .insert([{
          name: newTimerName.trim(),
          presenter_name: newTimerPresenter.trim(),
          duration: parseInt(newTimerDuration) * 60, // Convert minutes to seconds
          user_id: session?.user?.id || null
        }])
        .select()
        .single()

      if (error) throw error

      setTimers(prev => [data, ...prev])
      setNewTimerName('')
      setNewTimerPresenter('')
      setNewTimerDuration('')
      setShowCreateModal(false)
      
      // Reload logs to include new timer
      loadAllTimerLogs()
    } catch (error) {
      console.error('Error creating timer:', error)
      alert('Error creating timer: ' + error.message)
    }
  }

  const selectTimer = async (timer) => {
    console.log('Timer clicked:', timer)
    setSelectedTimer(timer)
    setTimeLeft(timer.duration)
    setIsRunning(false)
    
    // Load existing session if any
    try {
      const { data } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('timer_id', timer.id)
        .maybeSingle()
      
      if (data) {
        setTimeLeft(data.time_left)
        setIsRunning(data.is_running)
      }
    } catch (error) {
      console.log('No existing session found, using defaults')
      // No existing session, use defaults - this is expected behavior
    }

    // Load messages and logs for this timer
    try {
      await loadMessages(timer.id)
      await loadTimerLogs(timer.id)
    } catch (error) {
      console.error('Error loading timer data:', error)
      // Don't throw the error, just log it
    }
  }

  const deleteTimer = async (timerId) => {
    if (!window.confirm('Are you sure you want to delete this timer? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', timerId)

      if (error) throw error

      setTimers(prev => prev.filter(timer => timer.id !== timerId))
      
      // If the deleted timer was selected, clear selection
      if (selectedTimer?.id === timerId) {
        setSelectedTimer(null)
        setTimeLeft(0)
        setIsRunning(false)
        setMessages([])
      }
      
      // Reload logs after deletion
      loadAllTimerLogs()
    } catch (error) {
  // Add error boundary to catch and handle errors
  const handleError = (error) => {
    console.error('ProTimerApp error:', error)
    // Don't redirect to auth on errors, just log them
  }

      console.error('Error deleting timer:', error)
      alert('Error deleting timer: ' + error.message)
    }
  }

  const loadMessages = async (timerId) => {
    try {
      const { data, error } = await supabase
        .from('timer_messages')
        .select('*')
        .eq('timer_id', timerId)
        .order('sent_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const startTimer = async () => {
    if (!selectedTimer) return
    
    setIsRunning(true)
    logTimerAction('start', timeLeft)
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: timeLeft,
          is_running: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'timer_id' })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const pauseTimer = async () => {
    setIsRunning(false)
    logTimerAction('pause', timeLeft)
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: timeLeft,
          is_running: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'timer_id' })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const stopTimer = async () => {
    setIsRunning(false)
    logTimerAction('stop', timeLeft)
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: timeLeft,
          is_running: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'timer_id' })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const resetTimer = async () => {
    if (!selectedTimer) return
    
    setIsRunning(false)
    setTimeLeft(selectedTimer.duration)
    logTimerAction('reset', selectedTimer.duration)
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: selectedTimer.duration,
          is_running: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'timer_id' })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const adjustTime = async (seconds) => {
    const newTime = Math.max(0, timeLeft + seconds)
    setTimeLeft(newTime)
    logTimerAction('adjust', newTime, seconds, `${seconds > 0 ? 'Added' : 'Removed'} ${Math.abs(seconds)} seconds`)
    
    // Update session in database
      if (!timer?.id) return
      
    if (selectedTimer) {
      try {
        try {
          const { data, error } = await supabase
      } catch (error) {
        console.error('Error selecting timer:', error)
      }
            .from('timer_sessions')
            .select('*')
            .eq('timer_id', timer.id)
            .single()

          if (data && !error) {
            setCurrentTime(data.time_left || timer.duration)
            setIsRunning(data.is_running || false)
          }
        } catch (error) {
          console.error('Error fetching timer session:', error)
        console.error('Error updating session:', error)
      }
    }
  }

  const overrideTimerDuration = async () => {
    if (!selectedTimer || !overrideTime) return
    
    const newDurationMinutes = parseInt(overrideTime)
    if (isNaN(newDurationMinutes) || newDurationMinutes <= 0) {
      alert('Please enter a valid number of minutes')
      return
    }
    
    const newDurationSeconds = newDurationMinutes * 60
    setTimeLeft(newDurationSeconds)
    logTimerAction('override', newDurationSeconds, newDurationSeconds - selectedTimer.duration, `Duration changed to ${newDurationMinutes} minutes`)
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: newDurationSeconds,
          is_running: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'timer_id' })
    } catch (error) {
      console.error('Error updating session:', error)
    }
    
    setOverrideTime('')
    setShowOverride(false)
  }

  const sendMessage = async (messageText) => {
    if (!selectedTimer || !messageText.trim()) return

    try {
      const { error } = await supabase
        .from('timer_messages')
        .insert([{
          timer_id: selectedTimer.id,
          message: messageText.trim()
        }])

      if (error) throw error

      // Reload messages
      loadMessages(selectedTimer.id)
      setNewMessage('')
      logTimerAction('message', null, null, `Sent: ${messageText.trim()}`)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message: ' + error.message)
    }
  }

  const addQuickMessage = () => {
    if (!newMessage.trim()) return
    
    const newQuickMsg = {
      id: Date.now(),
      text: newMessage.trim(),
      emoji: '💬'
    }
    
    setQuickMessages(prev => [...prev, newQuickMsg])
    setNewMessage('')
  }

  const removeQuickMessage = (id) => {
    setQuickMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const exportTimersCSV = () => {
    const csvData = []
    
    // Add headers
    csvData.push([
      'Timer Name',
      'Presenter',
      'Duration (minutes)',
      'Created At',
      'Action',
      'Time Value',
      'Duration Change',
      'Notes',
      'Action Date'
    ])
    
    // Filter logs by date range if specified
    let filteredLogs = allTimerLogs
    if (reportDateRange.start) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.created_at) >= new Date(reportDateRange.start)
      )
    }
    if (reportDateRange.end) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.created_at) <= new Date(reportDateRange.end + 'T23:59:59')
      )
    }
    
    // Add timer creation rows
    timers.forEach(timer => {
      csvData.push([
        timer.name,
        timer.presenter_name,
        Math.round(timer.duration / 60),
        new Date(timer.created_at).toLocaleString(),
        'Timer Created',
        '',
        '',
        '',
        new Date(timer.created_at).toLocaleString()
      ])
    })
    
    // Add log entries
    filteredLogs.forEach(log => {
      csvData.push([
        log.timers?.name || 'Unknown Timer',
        log.timers?.presenter_name || 'Unknown Presenter',
        '',
        '',
        log.action,
        log.time_value ? formatTime(log.time_value) : '',
        log.duration_change || '',
        log.notes || '',
        new Date(log.created_at).toLocaleString()
      ])
    })
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
    
    // Download file
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timer-reports-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const resetToDefaults = () => {
    setQuickMessages([
      { id: 1, text: '⏰ 5 minutes remaining', emoji: '⏰' },
      { id: 2, text: '⚡ Please wrap up', emoji: '⚡' },
      { id: 3, text: '🎯 Final slide please', emoji: '🎯' },
      { id: 4, text: '👏 Thank you!', emoji: '👏' }
    ])
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeFromSession = (session, originalDuration) => {
    if (!session) return formatTime(originalDuration)
    
    if (session.is_running) {
      // Calculate time based on when it was last updated
      const now = new Date(currentTime)
      const lastUpdate = new Date(session.updated_at)
      const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000)
      const calculatedTimeLeft = Math.max(0, session.time_left - elapsedSinceUpdate)
      return formatTime(calculatedTimeLeft)
          (payload) => {
            try {
              if (payload.new) {
                setCurrentTime(payload.new.time_left || timer.duration)
                setIsRunning(payload.new.is_running || false)
              }
            } catch (error) {
              console.error('Error handling timer session update:', error)
  const getProgressPercentage = () => {
    if (!selectedTimer) return 0
    return ((selectedTimer.duration - timeLeft) / selectedTimer.duration) * 100
  }

  const getProgressPercentageFromSession = (session, originalDuration) => {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing:', error)
        }
      } catch (error) {
        console.error('Error deleting timer:', error)
        alert('Failed to delete timer. Please try again.')
      }
    
    let currentTimeLeft = session.time_left
    if (session.is_running) {
      const now = new Date(currentTime)
      const lastUpdate = new Date(session.updated_at)
      const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000)
      currentTimeLeft = Math.max(0, session.time_left - elapsedSinceUpdate)
    }
    
    return ((originalDuration - currentTimeLeft) / originalDuration) * 100
  }

  const generatePresenterUrl = () => {
    if (!selectedTimer) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/app?presenter=${selectedTimer.id}&fullscreen=true`
  }

  const openPresenterView = () => {
    if (!selectedTimer) return
    const url = generatePresenterUrl()
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading timers...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentView('admin')}
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  currentView === 'admin'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </button>
              <button
                onClick={() => setCurrentView('presenter')}
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  currentView === 'presenter'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Presenter View
              </button>
              <button
                onClick={() => setCurrentView('overview')}
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  currentView === 'overview'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <TimerIcon className="w-4 h-4 mr-2" />
                Timer Overview
              </button>
              <button
                onClick={() => setCurrentView('reports')}
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  currentView === 'reports'
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Dashboard */}
      {currentView === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Create and manage presentation timers</p>
          </div>

          {/* Create Timer Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Timer
            </button>
          </div>

          {/* Timers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {timers.map((timer) => {
              const session = timerSessions[timer.id];
              return (
              <div
                key={timer.id}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border cursor-pointer transition-all aspect-square flex flex-col relative group ${
                  selectedTimer?.id === timer.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTimer(timer.id)
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
                >
                  ×
                </button>
                
                {/* Main clickable area */}
                <div className="flex-1 flex flex-col" onClick={() => selectTimer(timer)}>
                  {/* Status Indicator */}
                  <div className="flex justify-between items-start mb-2">
                    <div className={`w-2 h-2 rounded-full ${session?.is_running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 leading-tight">{timer.name}</h3>
                  <p className="text-gray-300 mb-2 text-xs truncate">Presenter: {timer.presenter_name}</p>
                  
                  <div className="mt-auto">
                    <div className="text-lg font-mono text-blue-400 mb-2">
                      {formatTimeFromSession(session, timer.duration)}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-1 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercentageFromSession(session, timer.duration)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Selected Timer Controls */}
          {selectedTimer && (
            <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                Control: {selectedTimer.name}
              </h2>
              
              {/* Timer Display */}
              <div className="text-center mb-6">
                <div className="text-6xl font-mono font-bold text-orange-400 mb-4">
                  {formatTime(timeLeft)}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <p className="text-gray-300">
                  {Math.round(getProgressPercentage())}% remaining
                </p>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={startTimer}
                  disabled={isRunning}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start
                </button>
                <button
                  onClick={pauseTimer}
                  disabled={!isRunning}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
                <button
                  onClick={stopTimer}
                  disabled={!isRunning}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
                <button
                  onClick={resetTimer}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>

              {/* Share and Logs */}
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Share Presenter View
                </button>
                <button
                  onClick={openPresenterView}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Presenter
                </button>
                <button
                  onClick={() => setShowLogsModal(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Logs
                </button>
              </div>

              {/* Time Adjustment */}
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => adjustTime(-60)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                >
                  <Minus className="w-4 h-4" />
                  1m
                </button>
                <button
                  onClick={() => adjustTime(-30)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                >
                  <Minus className="w-4 h-4" />
                  30s
                </button>
                <button
                  onClick={() => adjustTime(30)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  30s
                </button>
                <button
                  onClick={() => adjustTime(60)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  1m
                </button>
              </div>

              {/* Override Timer Duration */}
              <div className="flex justify-center mb-6">
                {!isRunning && !showOverride && (
                  <button
                    onClick={() => setShowOverride(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Override Duration
                  </button>
                )}
                
                {showOverride && (
                  <div className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-4">
                    <label className="text-white font-medium">New Duration:</label>
                    <input
                      type="text"
                      value={overrideTime}
                      onChange={(e) => setOverrideTime(e.target.value)}
                      className="w-20 p-2 bg-gray-600 border border-gray-500 rounded text-white text-center"
                      placeholder="20"
                    />
                    <span className="text-gray-300">minutes</span>
                    <button
                      onClick={overrideTimerDuration}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium"
                    >
                      Set
                    </button>
                    <button
                      onClick={() => {
                        setShowOverride(false)
                        setOverrideTime('')
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Messages */}
              <div className="border-t border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Quick Messages</h3>
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {quickMessages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => sendMessage(msg.text)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-left"
                    >
                      {msg.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Presenter View */}
      {currentView === 'presenter' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
          {selectedTimer ? (
            <>
             {/* Status Indicator */}
             <div className="absolute top-8 right-8">
               <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}></div>
             </div>

             {/* Timer Info */}
             <div className="text-center mb-8">
               <h1 className="text-4xl font-bold text-white mb-2">{selectedTimer.name}</h1>
               <p className="text-xl text-blue-300 flex items-center justify-center gap-2">
                 <Users className="w-6 h-6" />
                 {selectedTimer.presenter_name}
               </p>
             </div>

             {/* Large Timer Display */}
             <div className="text-center mb-8">
               <div className="text-8xl md:text-9xl font-mono font-bold text-orange-400 mb-6">
                 {formatTime(timeLeft)}
               </div>
               <div className="w-full max-w-4xl bg-gray-700 rounded-full h-6 mb-4">
                 <div
                   className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-6 rounded-full transition-all duration-1000"
                   style={{ width: `${getProgressPercentage()}%` }}
                 ></div>
               </div>
               <p className="text-2xl text-gray-300">
                 {Math.round(getProgressPercentage())}% remaining
               </p>
             </div>

             {/* Current Message Display */}
             {messages && messages.length > 0 && (
               <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6 mb-8 max-w-2xl">
                 <div className="text-center">
                   <div className="text-2xl mb-2">💬</div>
                   <p className="text-xl text-yellow-100 font-medium">
                     {messages[0].message}
                   </p>
                   <p className="text-sm text-yellow-200/70 mt-2">
                     {new Date(messages[0].sent_at).toLocaleTimeString()}
                   </p>
                 </div>
               </div>
             )}

             {/* Messages from Control - Floating Button */}
             <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
               <button
                 onClick={() => setMessagesExpanded(!messagesExpanded)}
                 className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 text-white px-6 py-3 rounded-full border border-gray-600 flex items-center gap-2 shadow-lg"
               >
                 <MessageSquare className="w-5 h-5" />
                 Messages from Control
                 <span className={`transform transition-transform ${messagesExpanded ? 'rotate-180' : ''}`}>
                   ▼
                 </span>
               </button>

               {/* Messages Popup */}
               {messagesExpanded && (
                 <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 w-96 bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-600 shadow-xl">
                   <div className="p-4">
                     <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                       <MessageSquare className="w-5 h-5" />
                       Messages from Control
                     </h3>
                     <div className="space-y-2 max-h-64 overflow-y-auto">
                       {messages && messages.length > 0 ? (
                         messages.slice(0, 5).map((message, index) => (
                           <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                             <div className="flex items-start gap-2">
                               <span className="text-lg">💬</span>
                               <div className="flex-1">
                                 <p className="text-white text-sm">{message.message}</p>
                                 <p className="text-gray-400 text-xs mt-1">
                                   {new Date(message.sent_at).toLocaleTimeString()}
                                 </p>
                               </div>
                             </div>
                           </div>
                         ))
                       ) : (
                         <p className="text-gray-400 text-center py-4">No messages yet</p>
                       )}
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </>
         ) : (
           <div className="text-center">
             <h1 className="text-4xl font-bold text-white mb-4">No Timer Selected</h1>
             <p className="text-xl text-gray-300">Please select a timer from the Admin Dashboard</p>
           </div>
         )}
       </div>
     )}

      {/* Timer Overview */}
      {currentView === 'overview' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Timer Overview</h1>
            <p className="text-gray-300">Monitor all active timers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timers.map((timer) => {
              const session = timerSessions[timer.id];
              return (
              <div key={timer.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                {/* Status Indicator */}
                <div className="flex justify-between items-start mb-3">
                  <div className={`w-3 h-3 rounded-full ${session?.is_running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{timer.name}</h3>
                <p className="text-gray-300 mb-4">Presenter: {timer.presenter_name}</p>
                <div className="text-3xl font-mono text-blue-400 mb-4">
                  {(() => {
                    if (!session) return formatTime(timer.duration);
                    
                    let timeLeft = session.time_left;
                    if (session.is_running) {
                      const now = new Date(currentTime);
                      const lastUpdate = new Date(session.updated_at);
                      const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000);
                      timeLeft = Math.max(0, session.time_left - elapsedSinceUpdate);
                    }
                    
                    return formatTime(timeLeft);
                  })()}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${getProgressPercentageFromSession(session, timer.duration)}%` }}
                  ></div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports View */}
      {currentView === 'reports' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Timer Reports</h1>
            <p className="text-gray-300">View all timer activity and export data</p>
          </div>

          {/* Export Controls */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-white">Export Data</h2>
              <div className="flex items-center gap-2">
                <label className="text-gray-300 text-sm">From:</label>
                <input
                  type="date"
                  value={reportDateRange.start}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-300 text-sm">To:</label>
                <input
                  type="date"
                  value={reportDateRange.end}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <button
                onClick={exportTimersCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              Export includes all timer creations and activity logs. Leave dates empty to export all data.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Total Timers</h3>
              <p className="text-3xl font-bold text-blue-400">{timers.length}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Total Actions</h3>
              <p className="text-3xl font-bold text-green-400">{allTimerLogs.length}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Active Sessions</h3>
              <p className="text-3xl font-bold text-orange-400">
                {Object.values(timerSessions).filter(session => session?.is_running).length}
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Total Presenters</h3>
              <p className="text-3xl font-bold text-purple-400">
                {new Set(timers.map(timer => timer.presenter_name)).size}
              </p>
            </div>
          </div>

          {/* Timers Table */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 mb-8">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">All Timers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Timer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Presenter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {timers.map((timer) => {
                    const session = timerSessions[timer.id];
                    return (
                      <tr key={timer.id} className="hover:bg-gray-700/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {timer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {timer.presenter_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {Math.round(timer.duration / 60)} minutes
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session?.is_running 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {session?.is_running ? 'Running' : 'Stopped'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(timer.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Timer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Time Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {allTimerLogs.slice(0, 100).map((log, index) => (
                    <tr key={index} className="hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {log.timers?.name || 'Unknown Timer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">
                        {log.time_value ? formatTime(log.time_value) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {log.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Timer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Timer</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timer Name
                </label>
                <input
                  type="text"
                  value={newTimerName}
                  onChange={(e) => setNewTimerName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="e.g., Keynote Presentation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Presenter Name
                </label>
                <input
                  type="text"
                  value={newTimerPresenter}
                  onChange={(e) => setNewTimerPresenter(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="e.g., John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={newTimerDuration}
                  onChange={(e) => setNewTimerDuration(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="5"
                  min="1"
                  max="180"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createTimer}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium"
              >
                Create Timer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedTimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <QrCode className="w-6 h-6" />
                Share Presenter View
              </h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-600">
                  QR Code for:<br/>
                  {generatePresenterUrl()}
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Scan this QR code or use the link below to open the presenter view on another device
              </p>
              <div className="bg-gray-700 p-3 rounded-lg mb-4">
                <code className="text-green-400 text-xs break-all">
                  {generatePresenterUrl()}
                </code>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(generatePresenterUrl())}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium"
              >
                Copy Link
              </button>
              <button
                onClick={openPresenterView}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium"
              >
                Open Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Logs Modal */}
      {showLogsModal && selectedTimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Timer Logs - {selectedTimer.name}
              </h2>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {timerLogs.length > 0 ? (
                <div className="space-y-2">
                  {timerLogs.map((log, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-white font-medium capitalize">{log.action}</span>
                          {log.time_value && (
                            <span className="text-blue-400 ml-2">
                              {formatTime(log.time_value)}
                            </span>
                          )}
                          {log.notes && (
                            <p className="text-gray-300 text-sm mt-1">{log.notes}</p>
                          )}
                        </div>
                        <span className="text-gray-400 text-xs">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No logs available for this timer</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Settings Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Message Settings
              </h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Add New Message */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Add New Quick Message</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="e.g., 🔔 2 minutes left"
                />
                <button
                  onClick={addQuickMessage}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Current Messages */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Current Quick Messages</h3>
              <div className="space-y-2">
                {quickMessages.map((msg) => (
                  <div key={msg.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                    <span className="text-white">{msg.text}</span>
                    <button
                      onClick={() => removeQuickMessage(msg.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetToDefaults}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}