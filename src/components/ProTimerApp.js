import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Clock, Play, Pause, Square, RotateCcw, Trash2, Plus, Users, BarChart3, LogOut } from 'lucide-react'

export default function ProTimerApp({ session, bypassAuth }) {
  const [timers, setTimers] = useState([])
  const [activeView, setActiveView] = useState('overview')
  const [selectedTimer, setSelectedTimer] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [originalDuration, setOriginalDuration] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTimer, setNewTimer] = useState({
    name: '',
    presenter_name: '',
    duration: 5
  })

  // Load timers on component mount
  useEffect(() => {
    loadTimers()
  }, [])

  // Timer countdown effect
  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const handleLogout = () => {
    if (session) {
      supabase.auth.signOut()
    } else {
      // For bypassed auth, reload the page to return to auth screen
      window.location.reload()
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
    }
  }

  const createTimer = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('timers')
        .insert([{
          name: newTimer.name,
          presenter_name: newTimer.presenter_name,
          duration: newTimer.duration * 60, // Convert minutes to seconds
          user_id: session?.user?.id || null
        }])
        .select()
      
      if (error) throw error
      
      setTimers([data[0], ...timers])
      setNewTimer({ name: '', presenter_name: '', duration: 5 })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating timer:', error)
      alert('Error creating timer: ' + error.message)
    }
  }

  const deleteTimer = async (timerId) => {
    try {
      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', timerId)
      
      if (error) throw error
      
      setTimers(timers.filter(t => t.id !== timerId))
    } catch (error) {
      console.error('Error deleting timer:', error)
      alert('Error deleting timer: ' + error.message)
    }
  }

  const startTimer = (timer) => {
    setSelectedTimer(timer)
    setTimeLeft(timer.duration)
    setOriginalDuration(timer.duration)
    setActiveView('countdown')
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setTimeLeft(originalDuration)
    setIsRunning(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    if (originalDuration === 0) return 0
    return ((originalDuration - timeLeft) / originalDuration) * 100
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Timer Overview</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          New Timer
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Timer</h3>
          <form onSubmit={createTimer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timer Name
              </label>
              <input
                type="text"
                value={newTimer.name}
                onChange={(e) => setNewTimer({...newTimer, name: e.target.value})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., Morning Presentation"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Presenter Name
              </label>
              <input
                type="text"
                value={newTimer.presenter_name}
                onChange={(e) => setNewTimer({...newTimer, presenter_name: e.target.value})}
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
                type="number"
                value={newTimer.duration}
                onChange={(e) => setNewTimer({...newTimer, duration: parseInt(e.target.value)})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                min="1"
                max="180"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create Timer
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {timers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No timers created yet. Click "New Timer" to get started.</p>
          </div>
        ) : (
          timers.map((timer) => (
            <div key={timer.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{timer.name}</h3>
                  <div className="flex items-center gap-4 text-gray-300 mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>{timer.presenter_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{Math.floor(timer.duration / 60)} minutes</span>
                    </div>
                  </div>
                  <button
                    onClick={() => startTimer(timer)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Play size={16} />
                    Start Timer
                  </button>
                </div>
                <button
                  onClick={() => deleteTimer(timer.id)}
                  className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderCountdown = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{selectedTimer?.name}</h2>
        <p className="text-gray-300">Presenter: {selectedTimer?.presenter_name}</p>
      </div>

      <div className="text-center">
        <div className="text-8xl font-mono font-bold text-orange-400 mb-8">
          {formatTime(timeLeft)}
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-4 mb-8">
          <div 
            className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full transition-all duration-1000"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        <div className="text-gray-300 mb-8">
          {getProgressPercentage().toFixed(0)}% elapsed
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={toggleTimer}
            className={`${isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          
          <button
            onClick={resetTimer}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={20} />
            Reset
          </button>
          
          <button
            onClick={() => setActiveView('overview')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Square size={20} />
            Stop
          </button>
        </div>
      </div>
    </div>
  )

  const renderPresenter = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center text-white p-8">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">{selectedTimer?.name || 'Testing'}</h1>
          <div className="flex items-center justify-center gap-2 text-xl text-blue-200">
            <Users size={24} />
            <span>{selectedTimer?.presenter_name || 'Drako'}</span>
          </div>
        </div>

        <div className="text-9xl font-mono font-bold text-orange-400 tracking-wider">
          {formatTime(timeLeft)}
        </div>

        <div className="w-full max-w-2xl">
          <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-full transition-all duration-1000"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="text-2xl text-gray-300 mt-4">
            {getProgressPercentage().toFixed(0)}% elapsed
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-600">
          <div className="flex items-center gap-3 text-lg">
            <div className="w-6 h-6 border-2 border-gray-400 rounded"></div>
            <span>Messages from Control</span>
            <div className="text-gray-400">▼</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
        <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400">Reports and analytics coming soon...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900">
      {activeView === 'presenter' ? (
        renderPresenter()
      ) : (
        <>
          <nav className="bg-gray-800 border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveView('overview')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      activeView === 'overview'
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveView('presenter')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      activeView === 'presenter'
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                    }`}
                  >
                    Presenter
                  </button>
                  <button
                    onClick={() => setActiveView('reports')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      activeView === 'reports'
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                    }`}
                  >
                    Reports
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-gray-300 hover:text-red-400 hover:border-red-400 text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} className="mr-1" />
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {activeView === 'overview' && renderOverview()}
              {activeView === 'countdown' && renderCountdown()}
              {activeView === 'reports' && renderReports()}
            </div>
          </main>
        </>
      )}
    </div>
  )
}