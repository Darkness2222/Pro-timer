import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Play, Pause, Square, RotateCcw, Clock, Users, BarChart3, MessageSquare, Send, Trash2 } from 'lucide-react'

export default function ProTimerApp({ session, bypassAuth }) {
  const [activeTab, setActiveTab] = useState('admin')
  const [timers, setTimers] = useState([])
  const [selectedTimer, setSelectedTimer] = useState(null)
  const [timerSessions, setTimerSessions] = useState({})
  const [messages, setMessages] = useState([])
  
  // Form states
  const [newTimerName, setNewTimerName] = useState('')
  const [newPresenterName, setNewPresenterName] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [overrideDuration, setOverrideDuration] = useState('')
  const [showOverride, setShowOverride] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  
  // Reports state
  const [logs, setLogs] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Load data on component mount
  useEffect(() => {
    loadTimers()
    loadLogs()
  }, [])

  // Real-time subscriptions
  useEffect(() => {
    const timersSubscription = supabase
      .channel('timers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timers' }, () => {
        loadTimers()
      })
      .subscribe()

    const sessionsSubscription = supabase
      .channel('timer_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_sessions' }, () => {
        loadTimerSessions()
      })
      .subscribe()

    const messagesSubscription = supabase
      .channel('timer_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_messages' }, () => {
        loadMessages()
      })
      .subscribe()

    const logsSubscription = supabase
      .channel('timer_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_logs' }, () => {
        loadLogs()
      })
      .subscribe()

    return () => {
      timersSubscription.unsubscribe()
      sessionsSubscription.unsubscribe()
      messagesSubscription.unsubscribe()
      logsSubscription.unsubscribe()
    }
  }, [])

  // Load timer sessions when timers change
  useEffect(() => {
    if (timers.length > 0) {
      loadTimerSessions()
      loadMessages()
    }
  }, [timers])

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

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_messages')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadLogs = async () => {
    try {
      let query = supabase
        .from('timer_logs')
        .select(`
          *,
          timers (name, presenter_name)
        `)
        .order('created_at', { ascending: false })

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59')
      }

      const { data, error } = await query
      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading logs:', error)
    }
  }

  const createTimer = async (e) => {
    e.preventDefault()
    if (!newTimerName.trim() || !newPresenterName.trim() || !newDuration) return

    try {
      const durationInSeconds = parseInt(newDuration) * 60
      
      const { data, error } = await supabase
        .from('timers')
        .insert([{
          name: newTimerName.trim(),
          presenter_name: newPresenterName.trim(),
          duration: durationInSeconds,
          user_id: session?.user?.id || null
        }])
        .select()
        .single()

      if (error) throw error

      // Create initial timer session
      await supabase
        .from('timer_sessions')
        .insert([{
          timer_id: data.id,
          time_left: durationInSeconds,
          is_running: false
        }])

      // Log the creation
      await supabase
        .from('timer_logs')
        .insert([{
          timer_id: data.id,
          action: 'created',
          time_value: durationInSeconds,
          notes: `Timer created: ${newTimerName} for ${newPresenterName}`
        }])

      setNewTimerName('')
      setNewPresenterName('')
      setNewDuration('')
      loadTimers()
    } catch (error) {
      console.error('Error creating timer:', error)
      alert('Error creating timer: ' + error.message)
    }
  }

  const selectTimer = (timerId) => {
    const timer = timers.find(t => t.id === timerId)
    setSelectedTimer(timer)
  }

  const deleteTimer = async (timerId, e) => {
    e.stopPropagation()
    
    if (!window.confirm('Are you sure you want to delete this timer? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', timerId)

      if (error) throw error

      // Clear selected timer if it was deleted
      if (selectedTimer?.id === timerId) {
        setSelectedTimer(null)
      }

      loadTimers()
    } catch (error) {
      console.error('Error deleting timer:', error)
      alert('Error deleting timer: ' + error.message)
    }
  }

  const controlTimer = async (action) => {
    if (!selectedTimer) return

    try {
      const session = timerSessions[selectedTimer.id]
      let updates = {}
      let logData = {
        timer_id: selectedTimer.id,
        action: action,
        time_value: session?.time_left || 0
      }

      switch (action) {
        case 'start':
          updates = { is_running: true }
          break
        case 'pause':
          updates = { is_running: false }
          break
        case 'stop':
          updates = { is_running: false }
          break
        case 'reset':
          updates = { 
            is_running: false, 
            time_left: selectedTimer.duration 
          }
          logData.time_value = selectedTimer.duration
          break
      }

      const { error } = await supabase
        .from('timer_sessions')
        .update(updates)
        .eq('timer_id', selectedTimer.id)

      if (error) throw error

      // Log the action
      await supabase
        .from('timer_logs')
        .insert([logData])

      loadTimerSessions()
    } catch (error) {
      console.error('Error controlling timer:', error)
    }
  }

  const adjustTimer = async (seconds) => {
    if (!selectedTimer) return

    try {
      const session = timerSessions[selectedTimer.id]
      const newTimeLeft = Math.max(0, (session?.time_left || 0) + seconds)

      const { error } = await supabase
        .from('timer_sessions')
        .update({ time_left: newTimeLeft })
        .eq('timer_id', selectedTimer.id)

      if (error) throw error

      // Log the adjustment
      await supabase
        .from('timer_logs')
        .insert([{
          timer_id: selectedTimer.id,
          action: 'adjust',
          time_value: newTimeLeft,
          duration_change: seconds,
          notes: `Adjusted by ${seconds > 0 ? '+' : ''}${seconds} seconds`
        }])

      loadTimerSessions()
    } catch (error) {
      console.error('Error adjusting timer:', error)
    }
  }

  const handleOverrideDuration = async () => {
    if (!selectedTimer || !overrideDuration) return

    try {
      const newDurationSeconds = parseInt(overrideDuration) * 60
      
      const { error } = await supabase
        .from('timer_sessions')
        .update({ 
          time_left: newDurationSeconds,
          is_running: false 
        })
        .eq('timer_id', selectedTimer.id)

      if (error) throw error

      // Log the override
      await supabase
        .from('timer_logs')
        .insert([{
          timer_id: selectedTimer.id,
          action: 'override',
          time_value: newDurationSeconds,
          notes: `Duration overridden to ${overrideDuration} minutes`
        }])

      setOverrideDuration('')
      setShowOverride(false)
      loadTimerSessions()
    } catch (error) {
      console.error('Error overriding duration:', error)
    }
  }

  const sendQuickMessage = async (message) => {
    if (!selectedTimer) return

    try {
      const { error } = await supabase
        .from('timer_messages')
        .insert([{
          timer_id: selectedTimer.id,
          message: message
        }])

      if (error) throw error

      // Log the message
      await supabase
        .from('timer_logs')
        .insert([{
          timer_id: selectedTimer.id,
          action: 'message',
          notes: `Message sent: ${message}`
        }])

      loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const sendCustomMessage = async (e) => {
    e.preventDefault()
    if (!selectedTimer || !customMessage.trim()) return

    try {
      const { error } = await supabase
        .from('timer_messages')
        .insert([{
          timer_id: selectedTimer.id,
          message: customMessage.trim()
        }])

      if (error) throw error

      // Log the message
      await supabase
        .from('timer_logs')
        .insert([{
          timer_id: selectedTimer.id,
          action: 'message',
          notes: `Custom message sent: ${customMessage.trim()}`
        }])

      setCustomMessage('')
      loadMessages()
    } catch (error) {
      console.error('Error sending custom message:', error)
    }
  }

  const exportCSV = () => {
    const csvData = []
    
    // Add headers
    csvData.push([
      'Date',
      'Timer Name',
      'Presenter',
      'Action',
      'Time Value (seconds)',
      'Duration Change',
      'Notes'
    ])

    // Add timer creation records
    timers.forEach(timer => {
      csvData.push([
        new Date(timer.created_at).toLocaleString(),
        timer.name,
        timer.presenter_name,
        'created',
        timer.duration,
        '',
        `Timer created with ${timer.duration / 60} minute duration`
      ])
    })

    // Add log records
    logs.forEach(log => {
      csvData.push([
        new Date(log.created_at).toLocaleString(),
        log.timers?.name || 'Unknown',
        log.timers?.presenter_name || 'Unknown',
        log.action,
        log.time_value || '',
        log.duration_change || '',
        log.notes || ''
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerStatus = (timer) => {
    const session = timerSessions[timer.id]
    if (!session) return 'stopped'
    return session.is_running ? 'running' : 'stopped'
  }

  const getProgressPercentage = (timer) => {
    const session = timerSessions[timer.id]
    if (!session) return 0
    return ((timer.duration - session.time_left) / timer.duration) * 100
  }

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      {/* Create New Timer */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Timer</h2>
        <form onSubmit={createTimer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timer Name
              </label>
              <input
                type="text"
                value={newTimerName}
                onChange={(e) => setNewTimerName(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., Keynote Speech"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Presenter Name
              </label>
              <input
                type="text"
                value={newPresenterName}
                onChange={(e) => setNewPresenterName(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., John Smith"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="text"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., 30"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create Timer
          </button>
        </form>
      </div>

      {/* Timer Controls */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Timer Controls</h2>
        
        {selectedTimer ? (
          <div className="space-y-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-white mb-2">{selectedTimer.name}</h3>
              <p className="text-gray-300">Presenter: {selectedTimer.presenter_name}</p>
              <p className="text-gray-300">
                Time: {formatTime(timerSessions[selectedTimer.id]?.time_left || selectedTimer.duration)}
              </p>
              <p className="text-gray-300">
                Status: <span className={`font-semibold ${
                  getTimerStatus(selectedTimer) === 'running' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {getTimerStatus(selectedTimer)}
                </span>
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => controlTimer('start')}
                disabled={getTimerStatus(selectedTimer) === 'running'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Play size={16} />
                Start
              </button>
              <button
                onClick={() => controlTimer('pause')}
                disabled={getTimerStatus(selectedTimer) !== 'running'}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Pause size={16} />
                Pause
              </button>
              <button
                onClick={() => controlTimer('stop')}
                disabled={getTimerStatus(selectedTimer) !== 'running'}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Square size={16} />
                Stop
              </button>
              <button
                onClick={() => controlTimer('reset')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            {/* Time Adjustments */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white">Quick Adjustments</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => adjustTimer(-300)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                >
                  -5 min
                </button>
                <button
                  onClick={() => adjustTimer(-60)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                >
                  -1 min
                </button>
                <button
                  onClick={() => adjustTimer(60)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                >
                  +1 min
                </button>
                <button
                  onClick={() => adjustTimer(300)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                >
                  +5 min
                </button>
              </div>
            </div>

            {/* Override Duration */}
            {getTimerStatus(selectedTimer) !== 'running' && (
              <div className="space-y-3">
                {!showOverride ? (
                  <button
                    onClick={() => setShowOverride(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                  >
                    Override Duration
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={overrideDuration}
                      onChange={(e) => setOverrideDuration(e.target.value)}
                      placeholder="Minutes"
                      className="w-32 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <button
                      onClick={handleOverrideDuration}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                    >
                      Set
                    </button>
                    <button
                      onClick={() => {
                        setShowOverride(false)
                        setOverrideDuration('')
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400">Select a timer to control it</p>
        )}
      </div>

      {/* Quick Messages */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Quick Messages</h2>
        {selectedTimer ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => sendQuickMessage('Wrap up')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
            >
              Wrap up
            </button>
            <button
              onClick={() => sendQuickMessage('5 minutes left')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
            >
              5 min left
            </button>
            <button
              onClick={() => sendQuickMessage('Speak louder')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Speak louder
            </button>
            <button
              onClick={() => sendQuickMessage('Slow down')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            >
              Slow down
            </button>
          </div>
        ) : (
          <p className="text-gray-400">Select a timer to send messages</p>
        )}
      </div>

      {/* Custom Messages */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Custom Messages</h2>
        {selectedTimer ? (
          <form onSubmit={sendCustomMessage} className="flex gap-3">
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your custom message..."
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendCustomMessage(e)
                }
              }}
            />
            <button
              type="submit"
              disabled={!customMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
          </form>
        ) : (
          <p className="text-gray-400">Select a timer to send custom messages</p>
        )}
      </div>

      {/* Timer Grid - Moved to Bottom */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Active Timers</h2>
        {timers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {timers.map((timer) => {
              const session = timerSessions[timer.id]
              const isSelected = selectedTimer?.id === timer.id
              const status = getTimerStatus(timer)
              const progress = getProgressPercentage(timer)
              
              return (
                <div
                  key={timer.id}
                  onClick={() => selectTimer(timer.id)}
                  className={`relative aspect-square p-3 rounded-lg border-2 cursor-pointer transition-all group ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-900/30' 
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => deleteTimer(timer.id, e)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 size={12} />
                  </button>
                  
                  <div className="h-full flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-sm truncate mb-1">
                        {timer.name}
                      </h3>
                      <p className="text-gray-300 text-xs truncate mb-2">
                        {timer.presenter_name}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-center">
                        <div className="text-lg font-mono text-white">
                          {formatTime(session?.time_left || timer.duration)}
                        </div>
                        <div className={`text-xs font-semibold ${
                          status === 'running' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {status.toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-400">No timers created yet</p>
        )}
      </div>
    </div>
  )

  const renderTimerOverview = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Timer Overview</h2>
      
      {timers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timers.map((timer) => {
            const session = timerSessions[timer.id]
            const status = getTimerStatus(timer)
            const progress = getProgressPercentage(timer)
            
            return (
              <div
                key={timer.id}
                onClick={() => selectTimer(timer.id)}
                className={`bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all ${
                  selectedTimer?.id === timer.id 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {timer.name}
                    </h3>
                    <p className="text-gray-300">
                      Presenter: {timer.presenter_name}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    status === 'running' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {status.toUpperCase()}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-mono font-bold text-white mb-2">
                      {formatTime(session?.time_left || timer.duration)}
                    </div>
                    <div className="text-gray-400">
                      of {formatTime(timer.duration)}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    Created: {new Date(timer.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock size={64} className="mx-auto text-gray-600 mb-4" />
          <p className="text-xl text-gray-400">No timers created yet</p>
          <p className="text-gray-500">Create your first timer in the Admin Dashboard</p>
        </div>
      )}
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Reports</h2>
        <button
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <BarChart3 size={20} />
          Export CSV
        </button>
      </div>

      {/* Date Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Filter by Date Range</h3>
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm text-gray-300 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <button
            onClick={loadLogs}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-6"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-400" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">{timers.length}</p>
              <p className="text-gray-400">Total Timers</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-green-400" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">{logs.length}</p>
              <p className="text-gray-400">Total Actions</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3">
            <Play className="text-yellow-400" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">
                {Object.values(timerSessions).filter(s => s.is_running).length}
              </p>
              <p className="text-gray-400">Active Sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="text-purple-400" size={24} />
            <div>
              <p className="text-2xl font-bold text-white">
                {new Set(timers.map(t => t.presenter_name)).size}
              </p>
              <p className="text-gray-400">Unique Presenters</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Timers Table */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">All Timers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-3 text-gray-300">Name</th>
                <th className="pb-3 text-gray-300">Presenter</th>
                <th className="pb-3 text-gray-300">Duration</th>
                <th className="pb-3 text-gray-300">Status</th>
                <th className="pb-3 text-gray-300">Created</th>
              </tr>
            </thead>
            <tbody>
              {timers.map((timer) => (
                <tr key={timer.id} className="border-b border-gray-700">
                  <td className="py-3 text-white">{timer.name}</td>
                  <td className="py-3 text-gray-300">{timer.presenter_name}</td>
                  <td className="py-3 text-gray-300">{formatTime(timer.duration)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      getTimerStatus(timer) === 'running' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {getTimerStatus(timer)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">
                    {new Date(timer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Activity Log</h3>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="border-b border-gray-700">
                <th className="pb-3 text-gray-300">Date</th>
                <th className="pb-3 text-gray-300">Timer</th>
                <th className="pb-3 text-gray-300">Action</th>
                <th className="pb-3 text-gray-300">Time Value</th>
                <th className="pb-3 text-gray-300">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-700">
                  <td className="py-2 text-gray-300 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 text-white text-sm">
                    {log.timers?.name || 'Unknown'}
                  </td>
                  <td className="py-2 text-gray-300 text-sm capitalize">
                    {log.action}
                  </td>
                  <td className="py-2 text-gray-300 text-sm">
                    {log.time_value ? formatTime(log.time_value) : '-'}
                  </td>
                  <td className="py-2 text-gray-300 text-sm">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admin'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200'
              }`}
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200'
              }`}
            >
              Timer Overview
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200'
              }`}
            >
              Reports
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'admin' && renderAdminDashboard()}
        {activeTab === 'overview' && renderTimerOverview()}
        {activeTab === 'reports' && renderReports()}
      </main>
    </div>
  )
}