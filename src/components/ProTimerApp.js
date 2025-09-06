import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Timer, Play, Pause, Square, RotateCcw, Maximize, Settings, LogOut } from 'lucide-react'

export default function ProTimerApp({ session, bypassAuth }) {
  const [activeTab, setActiveTab] = useState('mainTimer')
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
    }
  }, [session])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error)
  }

  const tabs = [
    { id: 'mainTimer', label: '⏱️ Main Timer', icon: Timer },
    { id: 'pomodoro', label: '🍅 Pomodoro', icon: Timer },
    { id: 'stopwatch', label: '⏱️ Stopwatch', icon: Timer },
    { id: 'proTimer', label: '🎯 Pro Timer', icon: Timer }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/synccue-logo.png" 
                alt="SyncCue" 
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold">SyncCue Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-300">
                  {user.email}
                </span>
              )}
              {!bypassAuth && (
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'mainTimer' && <MainTimer />}
        {activeTab === 'pomodoro' && <PomodoroTimer />}
        {activeTab === 'stopwatch' && <Stopwatch />}
        {activeTab === 'proTimer' && <ProTimer />}
      </main>
    </div>
  )
}

// Main Timer Component
function MainTimer() {
  const [time, setTime] = useState(300) // 5 minutes in seconds
  const [initialTime, setInitialTime] = useState(300)
  const [isRunning, setIsRunning] = useState(false)
  const [inputValue, setInputValue] = useState('5:00')

  useEffect(() => {
    let interval = null
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1)
      }, 1000)
    } else if (time === 0) {
      setIsRunning(false)
    }
    return () => clearInterval(interval)
  }, [isRunning, time])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleStop = () => {
    setIsRunning(false)
    setTime(initialTime)
  }
  const handleReset = () => {
    setIsRunning(false)
    setTime(initialTime)
  }

  const handleSetTime = () => {
    const [mins, secs] = inputValue.split(':').map(Number)
    const totalSeconds = (mins || 0) * 60 + (secs || 0)
    setTime(totalSeconds)
    setInitialTime(totalSeconds)
  }

  const progress = initialTime > 0 ? ((initialTime - time) / initialTime) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-8 shadow-lg">
        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold text-red-500 mb-4">
            {formatTime(time)}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
            <div 
              className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            <Play size={20} />
            <span>Start</span>
          </button>
          <button
            onClick={handlePause}
            disabled={!isRunning}
            className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            <Pause size={20} />
            <span>Pause</span>
          </button>
          <button
            onClick={handleStop}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Square size={20} />
            <span>Stop</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw size={20} />
            <span>Reset</span>
          </button>
        </div>

        {/* Time Input */}
        <div className="flex justify-center items-center space-x-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="mm:ss"
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-center font-mono"
          />
          <button
            onClick={handleSetTime}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Set
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="flex justify-center space-x-2 mt-4 flex-wrap gap-2">
          {[30, 60, 120, 300, 600, 900, 1200].map((seconds) => (
            <button
              key={seconds}
              onClick={() => {
                setTime(seconds)
                setInitialTime(seconds)
                setInputValue(formatTime(seconds))
              }}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
            >
              {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Pomodoro Timer Component
function PomodoroTimer() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-8 shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">🍅 Pomodoro Timer</h2>
        <p className="text-gray-400">Pomodoro timer functionality coming soon...</p>
      </div>
    </div>
  )
}

// Stopwatch Component
function Stopwatch() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-8 shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">⏱️ Stopwatch</h2>
        <p className="text-gray-400">Stopwatch functionality coming soon...</p>
      </div>
    </div>
  )
}

// Pro Timer Component
function ProTimer() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">🎯 Pro Timer</h2>
          <p className="text-gray-400 text-lg">Professional presentation timers with admin control</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Presenter Mode</h3>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-red-500 mb-4">05:00</div>
              <div className="w-full bg-gray-600 rounded-full h-3 mb-4">
                <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full w-full"></div>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">
                <Maximize size={20} className="inline mr-2" />
                Fullscreen
              </button>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Admin Control</h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <button className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded transition-colors">Start</button>
                <button className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-2 rounded transition-colors">Pause</button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded transition-colors">Stop</button>
              </div>
              <div className="space-y-2">
                <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded transition-colors">Send "Wrap up"</button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded transition-colors">Send "5 minutes left"</button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded transition-colors">Send Custom Message</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400">Pro Timer features are in development. This will include real-time sync between presenter and admin devices.</p>
        </div>
      </div>
    </div>
  )
}