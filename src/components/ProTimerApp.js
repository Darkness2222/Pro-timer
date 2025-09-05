import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Play, Pause, Square, RotateCcw, Settings, MessageSquare, Plus, Minus, Clock, Users, Timer as TimerIcon } from 'lucide-react'

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
  const [quickMessages, setQuickMessages] = useState([
    { id: 1, text: '⏰ 5 minutes remaining', emoji: '⏰' },
    { id: 2, text: '⚡ Please wrap up', emoji: '⚡' },
    { id: 3, text: '🎯 Final slide please', emoji: '🎯' },
    { id: 4, text: '👏 Thank you!', emoji: '👏' }
  ])
  
  // Form states
  const [newTimerName, setNewTimerName] = useState('')
  const [newTimerPresenter, setNewTimerPresenter] = useState('')
  const [newTimerDuration, setNewTimerDuration] = useState(5)
  const [newMessage, setNewMessage] = useState('')
  
  const intervalRef = useRef(null)

  // Load timers on component mount
  useEffect(() => {
    loadTimers()
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

  const createTimer = async () => {
    if (!newTimerName.trim() || !newTimerPresenter.trim()) return

    try {
      const { data, error } = await supabase
        .from('timers')
        .insert([{
          name: newTimerName.trim(),
          presenter_name: newTimerPresenter.trim(),
          duration: newTimerDuration * 60, // Convert minutes to seconds
          user_id: session?.user?.id || null
        }])
        .select()
        .single()

      if (error) throw error

      setTimers(prev => [data, ...prev])
      setNewTimerName('')
      setNewTimerPresenter('')
      setNewTimerDuration(5)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating timer:', error)
      alert('Error creating timer: ' + error.message)
    }
  }

  const selectTimer = async (timer) => {
    setSelectedTimer(timer)
    setTimeLeft(timer.duration)
    setIsRunning(false)
    
    // Load existing session if any
    try {
      const { data } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('timer_id', timer.id)
        .single()
      
      if (data) {
        setTimeLeft(data.time_left)
        setIsRunning(data.is_running)
      }
    } catch (error) {
      // No existing session, use defaults
    }

    // Load messages for this timer
    loadMessages(timer.id)
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
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: timeLeft,
          is_running: true,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const pauseTimer = async () => {
    setIsRunning(false)
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: timeLeft,
          is_running: false,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const resetTimer = async () => {
    if (!selectedTimer) return
    
    setIsRunning(false)
    setTimeLeft(selectedTimer.duration)
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: selectedTimer.duration,
          is_running: false,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const adjustTime = async (seconds) => {
    const newTime = Math.max(0, timeLeft + seconds)
    setTimeLeft(newTime)
    
    // Update session in database
    if (selectedTimer) {
      try {
        await supabase
          .from('timer_sessions')
          .upsert({
            timer_id: selectedTimer.id,
            time_left: newTime,
            is_running: isRunning,
            updated_at: new Date().toISOString()
          })
      } catch (error) {
        console.error('Error updating session:', error)
      }
    }
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

  const getProgressPercentage = () => {
    if (!selectedTimer) return 0
    return ((selectedTimer.duration - timeLeft) / selectedTimer.duration) * 100
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timers.map((timer) => (
              <div
                key={timer.id}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border cursor-pointer transition-all ${
                  selectedTimer?.id === timer.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => selectTimer(timer)}
              >
                <h3 className="text-xl font-semibold text-white mb-2">{timer.name}</h3>
                <p className="text-gray-300 mb-4">Presenter: {timer.presenter_name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono text-blue-400">
                    {formatTime(timer.duration)}
                  </span>
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            ))}
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
                  onClick={resetTimer}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <Square className="w-5 h-5" />
                  Reset
                </button>
              </div>

              {/* Time Adjustment */}
              <div className="flex justify-center gap-2 mb-6">
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
          {/* Status Indicator */}
          <div className="absolute top-8 right-8">
            <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}></div>
          </div>

          {selectedTimer ? (
            <>
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
              {messages.length > 0 && (
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
                        {messages.length > 0 ? (
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
            {timers.map((timer) => (
              <div key={timer.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-2">{timer.name}</h3>
                <p className="text-gray-300 mb-4">Presenter: {timer.presenter_name}</p>
                <div className="text-3xl font-mono text-blue-400 mb-4">
                  {formatTime(timer.duration)}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            ))}
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
                  onChange={(e) => setNewTimerDuration(parseInt(e.target.value) || 5)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
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
                      🗑️
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