import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Settings, 
  Users, 
  Clock, 
  BarChart3, 
  Plus, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Crown,
  LogOut
} from 'lucide-react'
import SubscriptionModal from './SubscriptionModal'
import SuccessPage from './SuccessPage'

export default function ProTimerApp({ session, bypassAuth }) {
  const [activeTab, setActiveTab] = useState('admin')
  const [timers, setTimers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showSuccessPage, setShowSuccessPage] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [isCreatingTimer, setIsCreatingTimer] = useState(false)
  const [newTimerName, setNewTimerName] = useState('')
  const [newTimerPresenter, setNewTimerPresenter] = useState('')
  const [newTimerDuration, setNewTimerDuration] = useState(5)

  // Check for success parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setShowSuccessPage(true)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const fetchSubscription = useCallback(async () => {
    if (bypassAuth) return

    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error)
      } else {
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [bypassAuth])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const fetchTimers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('timers')
        .select(`
          *,
          timer_sessions (
            time_left,
            is_running,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTimers(data || [])
    } catch (error) {
      console.error('Error fetching timers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTimers()
  }, [fetchTimers])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const createTimer = async () => {
    if (!newTimerName.trim() || !newTimerPresenter.trim()) return

    setIsCreatingTimer(true)
    try {
      const { data, error } = await supabase
        .from('timers')
        .insert({
          name: newTimerName.trim(),
          presenter_name: newTimerPresenter.trim(),
          duration: newTimerDuration * 60, // Convert minutes to seconds
          user_id: session?.user?.id || null
        })
        .select()
        .single()

      if (error) throw error

      // Create initial timer session
      const { error: sessionError } = await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: data.id,
          time_left: newTimerDuration * 60,
          is_running: false
        }, {
          onConflict: 'timer_id'
        })

      if (sessionError) throw sessionError

      // Reset form
      setNewTimerName('')
      setNewTimerPresenter('')
      setNewTimerDuration(5)
      
      // Refresh timers
      fetchTimers()
    } catch (error) {
      console.error('Error creating timer:', error)
    } finally {
      setIsCreatingTimer(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerStatus = (timer) => {
    const session = timer.timer_sessions?.[0]
    if (!session) return { status: 'stopped', timeLeft: timer.duration }
    
    return {
      status: session.is_running ? 'running' : 'paused',
      timeLeft: session.time_left
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      default: return 'bg-red-500'
    }
  }

  if (showSuccessPage) {
    return <SuccessPage onContinue={() => setShowSuccessPage(false)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-white">SyncCue Pro</h1>
            </div>
            
            {/* Navigation */}
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
              
              <button
                onClick={() => setActiveTab('presenter')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'presenter'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Presenter View</span>
              </button>
              
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Timer Overview</span>
              </button>
              
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'admin' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h2>
              <p className="text-gray-300">Create and manage presentation timers</p>
            </div>

            {/* Create New Timer */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Create New Timer</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Timer Name"
                  value={newTimerName}
                  onChange={(e) => setNewTimerName(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Presenter Name"
                  value={newTimerPresenter}
                  onChange={(e) => setNewTimerPresenter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                />
                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newTimerDuration}
                  onChange={(e) => setNewTimerDuration(parseInt(e.target.value) || 5)}
                  min="1"
                  max="120"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                />
                <button
                  onClick={createTimer}
                  disabled={isCreatingTimer || !newTimerName.trim() || !newTimerPresenter.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingTimer ? 'Creating...' : 'Create New Timer'}</span>
                </button>
              </div>
            </div>

            {/* Timers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {timers.map((timer) => {
                const { status, timeLeft } = getTimerStatus(timer)
                return (
                  <div key={timer.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                      <button className="text-gray-400 hover:text-white">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-2">{timer.name}</h3>
                    <p className="text-gray-400 mb-4">Presenter: {timer.presenter_name}</p>
                    
                    <div className="text-center mb-4">
                      <div className="text-4xl font-mono font-bold text-blue-400 mb-2">
                        {formatTime(timeLeft)}
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${((timer.duration - timeLeft) / timer.duration) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center space-x-2">
                      <button className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-colors">
                        <Pause className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors">
                        <Square className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {timers.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No timers yet</h3>
                <p className="text-gray-500">Create your first presentation timer to get started</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'presenter' && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Presenter View</h3>
            <p className="text-gray-500">Full-screen timer display for presentations</p>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Timer Overview</h3>
            <p className="text-gray-500">Monitor all active timers at once</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Reports</h3>
            <p className="text-gray-500">Analytics and usage statistics</p>
          </div>
        )}
      </main>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        session={session}
      />
    </div>
  )
}