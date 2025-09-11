import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import TimerOverview from './TimerOverview'
import { getProductByPriceId } from '../stripe-config'
import { Play, Pause, Square, RotateCcw, Settings, MessageSquare, Plus, Minus, Clock, Users, Timer as TimerIcon, QrCode, ExternalLink, FileText, Crown, User, LogOut, CheckCircle, X, DollarSign, TrendingUp, TrendingDown, BarChart3, Calendar, Download } from 'lucide-react'
import SubscriptionModal from './SubscriptionModal'
import SuccessPage from './SuccessPage'

export default function ProTimerApp({ session }) {
  const [currentView, setCurrentView] = useState('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTimer, setSelectedTimer] = useState(null)
  const [timers, setTimers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [timerType, setTimerType] = useState('single')
  const [eventName, setEventName] = useState('')
  const [presenters, setPresenters] = useState([
    { id: 1, name: '', minutes: 15, seconds: 0 }
  ])
  const [bufferMinutes, setBufferMinutes] = useState(2)
  const [bufferSeconds, setBufferSeconds] = useState(0)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messagesExpanded, setMessagesExpanded] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Enhanced reporting states
  const [avgHourlyRate, setAvgHourlyRate] = useState(60)
  const [estimatedAttendees, setEstimatedAttendees] = useState(20)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Check for success parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setShowSuccess(true)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const fetchSubscription = useCallback(async () => {
    if (!session?.user) return
    
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
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const [userProfile, setUserProfile] = useState(null)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [messages, setMessages] = useState([])
  const [timerSessions, setTimerSessions] = useState([])
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
  const [overrideDuration, setOverrideDuration] = useState(0)
  
  // Form states
  const [newTimerName, setNewTimerName] = useState('')
  const [newTimerPresenter, setNewTimerPresenter] = useState('')
  const [newTimerDuration, setNewTimerDuration] = useState('')
  const [newMessage, setNewMessage] = useState('')
  
  const intervalRef = useRef(null)

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    if (!session?.user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116' && error.status !== 406) {
        console.error('Error loading profile:', error)
      } else if (data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }, [session?.user])

  useEffect(() => {
    loadUserProfile()
  }, [loadUserProfile])

  // Add session validation
  useEffect(() => {
    if (!session) {
      console.log('No session found, user should be redirected to auth')
      return
    }
  }, [session])

  // Load timers on component mount
  useEffect(() => {
    loadTimers()
    loadTimerSessions()
    loadAllTimerLogs()
    // Update timer sessions and current time every second
    const sessionInterval = setInterval(() => {
      updateTimerSessions()
      setCurrentTime(Date.now())
    }, 1000)
    
    return () => clearInterval(sessionInterval)
  }, [])

  // Timer countdown effect with overtime tracking
  useEffect(() => {
    if (isRunning && timeLeft >= 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer expired - log overtime
            if (selectedTimer) {
              logTimerAction('expired', 0, null, 'Timer reached 00:00 - presenter went over time')
            }
            return prev - 1 // Allow negative values for overtime
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft, selectedTimer])

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

  const loadTimerSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')

      if (error) throw error
      setTimerSessions(data || [])
    } catch (error) {
      console.error('Error loading timer sessions:', error)
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
    if (timerType === 'single') {
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
        resetCreateForm()
        setShowCreateModal(false)
        
        // Reload logs to include new timer
        loadAllTimerLogs()
      } catch (error) {
        console.error('Error creating timer:', error)
        alert('Error creating timer: ' + error.message)
      }
    } else {
      // Event Timer - create multiple timers
      if (!eventName.trim() || presenters.length === 0) return

      try {
        const timersToCreate = presenters.map((presenter, index) => ({
          name: `${eventName.trim()} - ${presenter.name.trim() || `Presenter ${index + 1}`}`,
          presenter_name: presenter.name.trim() || `Presenter ${index + 1}`,
          duration: (presenter.minutes * 60) + presenter.seconds,
          user_id: session?.user?.id || null
        }))

        const { data, error } = await supabase
          .from('timers')
          .insert(timersToCreate)
          .select()

        if (error) throw error

        setTimers(prev => [...data, ...prev])
        resetCreateForm()
        setShowCreateModal(false)
        
        // Reload logs to include new timers
        loadAllTimerLogs()
      } catch (error) {
        console.error('Error creating event timers:', error)
        alert('Error creating event timers: ' + error.message)
      }
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
        .maybeSingle()
      
      if (data) {
        setTimeLeft(data.time_left)
        setIsRunning(data.is_running)
      }
    } catch (error) {
      console.log('No existing session found, using defaults')
    }

    // Load messages and logs for this timer
    try {
      await loadMessages(timer.id)
      await loadTimerLogs(timer.id)
    } catch (error) {
      console.error('Error loading timer data:', error)
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

  const updateTimerSession = async (timerId, updates) => {
    try {
      const { error } = await supabase
        .from('timer_sessions')
        .update(updates)
        .eq('timer_id', timerId)
      
      if (error) {
        console.error('Error updating timer session:', error)
      }
    } catch (error) {
      console.error('Error updating timer session:', error)
    }
  }

  const handleFinishTimer = async (timerId) => {
    try {
      const timer = timers.find(t => t.id === timerId)
      if (!timer) return

      const remainingTime = timerSessions[timerId]?.time_left || 0
      
      // Update timer session to finished state
      await updateTimerSession(timerId, {
        time_left: 0,
        is_running: false,
        updated_at: new Date().toISOString()
      })
      
      // Update timer status in database
      await supabase
        .from('timers')
        .update({ status: 'finished_early' })
        .eq('id', timerId)
      
      // Log the finish action with correct parameters
      if (selectedTimer && selectedTimer.id === timerId) {
        await logTimerAction('finished', remainingTime, 0, `Timer finished early with ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')} remaining`)
      }
      
      // Update local state if this is the selected timer
      if (selectedTimer && selectedTimer.id === timerId) {
        setTimeLeft(0)
        setIsRunning(false)
      }
      
      // Refresh timer sessions
      await updateTimerSessions()
      
      console.log(`Timer ${timerId} finished early`)
    } catch (error) {
      console.error('Error finishing timer:', error)
    }
  }

  const finishTimer = async () => {
    if (!selectedTimer) return
    
    setIsRunning(false)
    const remainingTime = Math.max(0, timeLeft)
    setTimeLeft(0)
    logTimerAction('finished', remainingTime, null, `Timer completed early with ${formatTime(remainingTime)} remaining`)
    
    // Update session in database
    try {
      await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: selectedTimer.id,
          time_left: 0,
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
    if (selectedTimer) {
      try {
        await supabase
          .from('timer_sessions')
          .upsert({
            timer_id: selectedTimer.id,
            time_left: newTime,
            is_running: isRunning,
            updated_at: new Date().toISOString()
          }, { onConflict: 'timer_id' })
      } catch (error) {
        console.error('Error updating session:', error)
      }
    }
  }

  const handleOverrideDuration = async () => {
    if (!selectedTimer || !overrideDuration) return
    
    const newDurationMinutes = parseInt(overrideDuration)
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
    
    setOverrideDuration(0)
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

  const resetToDefaults = () => {
    setQuickMessages([
      { id: 1, text: '⏰ 5 minutes remaining', emoji: '⏰' },
      { id: 2, text: '⚡ Please wrap up', emoji: '⚡' },
      { id: 3, text: '🎯 Final slide please', emoji: '🎯' },
      { id: 4, text: '👏 Thank you!', emoji: '👏' }
    ])
  }

  const resetCreateForm = () => {
    setNewTimerName('')
    setNewTimerPresenter('')
    setNewTimerDuration('')
    setTimerType('single')
    setEventName('')
    setPresenters([{ id: 1, name: '', minutes: 15, seconds: 0 }])
    setBufferMinutes(2)
    setBufferSeconds(0)
  }

  const addPresenter = () => {
    if (presenters.length < 8) {
      setPresenters(prev => [...prev, {
        id: Date.now(),
        name: '',
        minutes: 10,
        seconds: 0
      }])
    }
  }

  const removePresenter = (id) => {
    if (presenters.length > 1) {
      setPresenters(prev => prev.filter(p => p.id !== id))
    }
  }

  const updatePresenter = (id, field, value) => {
    setPresenters(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const calculateEventTotalTime = () => {
    const presenterTime = presenters.reduce((total, presenter) => 
      total + (presenter.minutes * 60) + presenter.seconds, 0
    )
    const bufferTime = (presenters.length - 1) * ((bufferMinutes * 60) + bufferSeconds)
    return Math.ceil((presenterTime + bufferTime) / 60) // Return in minutes
  }

  const handlePauseAll = async () => {
    // Pause all running timers
    const runningTimers = Object.entries(timerSessions).filter(([_, session]) => session?.is_running)
    
    for (const [timerId, session] of runningTimers) {
      console.log('Pausing timer:', timerId)
      
      // Calculate current time left for running timers
      let currentTimeLeft = session.time_left
      if (session.is_running) {
        const now = new Date(currentTime)
        const lastUpdate = new Date(session.updated_at)
        const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000)
        currentTimeLeft = session.time_left - elapsedSinceUpdate
      }
      
      try {
        await supabase
          .from('timer_sessions')
          .upsert(
            {
              timer_id: timerId,
              time_left: currentTimeLeft,
              is_running: false,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'timer_id' }
          )
      } catch (error) {
        console.error('Error pausing timer:', error)
      }
    }
    
    // Update timer sessions
    await updateTimerSessions()
  }

  const handlePlayAll = async () => {
    // Start all timers that are currently paused (have time_left > 0 but not running)
    const pausedTimers = Object.entries(timerSessions).filter(([_, session]) => 
      session && !session.is_running && session.time_left > 0
    )
    
    for (const [timerId, session] of pausedTimers) {
      console.log('Starting timer:', timerId)
      // Skip if timer_id is null or invalid
      if (!session.timer_id) {
        console.warn('Skipping session with invalid timer_id:', session)
        continue
      }
      
      try {
        await supabase
          .from('timer_sessions')
          .upsert(
            {
              timer_id: timerId,
              time_left: session.time_left,
              is_running: true,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'timer_id' }
          )
      } catch (error) {
        console.error('Error starting timer:', error)
      }
    }
    
    // Update timer sessions
    updateTimerSessions()
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      console.log('Timer reset successfully')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSuccessContinue = () => {
    setShowSuccess(false)
    fetchSubscription() // Refresh subscription data
  }

  const getSubscriptionDisplayName = () => {
    if (!subscription?.price_id) return 'Free Plan'
    
    const product = getProductByPriceId(subscription.price_id)
    return product ? `${product.name} Plan` : 'Pro Plan'
  }

  const isProUser = () => {
    return subscription?.subscription_status === 'active' || 
           subscription?.subscription_status === 'trialing'
  }

  if (showSuccess) {
    return <SuccessPage onContinue={handleSuccessContinue} />
  }

  const formatTime = (seconds) => {
    const isNegative = seconds < 0
    const absSeconds = Math.abs(seconds)
    const mins = Math.floor(absSeconds / 60)
    const secs = absSeconds % 60
    const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return isNegative ? `-${timeString}` : timeString
  }

  const formatTimeFromSession = (session, originalDuration) => {
    if (!session) return formatTime(originalDuration)
    
    if (session.is_running) {
      // Calculate time based on when it was last updated
      const now = new Date(currentTime)
      const lastUpdate = new Date(session.updated_at)
      const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000)
      const calculatedTimeLeft = session.time_left - elapsedSinceUpdate
      return formatTime(calculatedTimeLeft)
    }
    
    return formatTime(session.time_left)
  }

  const getProgressPercentage = () => {
    if (!selectedTimer) return 0
    return ((selectedTimer.duration - timeLeft) / selectedTimer.duration) * 100
  }

  const getProgressPercentageFromSession = (session, originalDuration) => {
    if (!session) return 0
    
    let currentTimeLeft = session.time_left
    if (session.is_running) {
      const now = new Date(currentTime)
      const lastUpdate = new Date(session.updated_at)
      const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000)
      currentTimeLeft = session.time_left - elapsedSinceUpdate
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
    <div className="min-h-screen w-full bg-gray-900">
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
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 rounded-lg transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                ⚙️ Settings
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="text-sm text-white">
                  {session?.user?.email || 'Guest'}
                  {userProfile?.is_pro && (
                    <Crown className="w-4 h-4 text-yellow-500 inline ml-1" />
                  )}
                </span>
              </div>
              {!userProfile?.is_pro && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              )}
              {session && (
                <button
                  onClick={handleSignOut}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Timer Overview */}
      {currentView === 'overview' && (
        <div className="min-h-screen w-full bg-gray-900 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Timer Overview</h2>
            <p className="text-gray-400">Manage and monitor your presentation timers</p>
          </div>

          {/* Bulk Controls */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={handlePauseAll}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <Pause className="w-5 h-5" />
              Pause All
            </button>
            <button
              onClick={handlePlayAll}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Play All
            </button>
          </div>

          {timers.length === 0 ? (
            <div className="text-center py-12">
              <TimerIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">No timers yet</h3>
              <p className="text-gray-500">Create your first timer to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {timers.map((timer) => {
                const session = timerSessions[timer.id];
                return (
                  <div
                    key={timer.id}
                    className={`bg-gray-800 rounded-lg p-4 border cursor-pointer transition-colors ${
                      selectedTimer?.id === timer.id
                        ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => {
                      selectTimer(timer);
                      setCurrentView('admin');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <div>
                          <h3 className="text-white font-medium">{timer.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{timer.presenter_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">
                          {formatTimeFromSession(session, timer.duration)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {session?.is_running ? 'Running' : 'Paused'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Admin Dashboard */}
      {currentView === 'admin' && (
        <div className="min-h-screen w-full bg-gray-900 p-6">
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
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
                          style={{ width: `${Math.min(100, getProgressPercentageFromSession(session, timer.duration))}%` }}
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
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                Control: {selectedTimer.name}
              </h2>
              
              {/* Timer Display */}
              <div className="text-center mb-6">
                <div className={`text-6xl font-mono font-bold mb-4 ${
                  timeLeft < 0 ? 'text-red-500 animate-pulse' : 'text-orange-400'
                }`}>
                  {formatTime(timeLeft)}
                </div>
                {timeLeft < 0 && (
                  <div className="text-2xl font-bold text-red-500 mb-2">
                    ⚠️ OVERTIME ⚠️
                  </div>
                )}
                <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, getProgressPercentage())}%` }}
                  ></div>
                </div>
                <p className="text-gray-300">
                  {timeLeft < 0 ? 'PRESENTER IS OVER TIME' : `${Math.round(getProgressPercentage())}% elapsed`}
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
                  onClick={finishTimer}
                  disabled={timeLeft <= 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Finish
                </button>
                <button
                  onClick={resetTimer}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
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
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={overrideDuration}
                      onChange={(e) => setOverrideDuration(parseInt(e.target.value) || 0)}
                      className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 w-20"
                      placeholder="Min"
                    />
                    <span className="text-white">minutes</span>
                    <button
                      onClick={handleOverrideDuration}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setShowOverride(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Presenter View */}
      {currentView === 'presenter' && (
        <div className="min-h-screen w-full bg-black flex items-center justify-center">
          {selectedTimer ? (
            <div className="text-center">
              <div className={`text-9xl font-mono font-bold mb-8 ${
                timeLeft < 0 ? 'text-red-500 animate-pulse' : 'text-white'
              }`}>
                {formatTime(timeLeft)}
              </div>
              {timeLeft < 0 && (
                <div className="text-4xl font-bold text-red-500 mb-4">
                  ⚠️ OVERTIME ⚠️
                </div>
              )}
              <div className="text-2xl text-gray-300 mb-8">
                {selectedTimer.name}
              </div>
              <div className="w-96 bg-gray-800 rounded-full h-6">
                <div
                  className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-6 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, getProgressPercentage())}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl text-gray-500 mb-4">No Timer Selected</div>
              <div className="text-xl text-gray-400">Select a timer from the Admin Dashboard</div>
            </div>
          )}
        </div>
      )}

      {/* Reports View */}
      {currentView === 'reports' && (
        <div className="min-h-screen w-full bg-gray-900 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
            <p className="text-gray-300">Track timer usage and performance</p>
          </div>

          {/* Date Range Filter */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-4">Filter by Date Range</h3>
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                />
              </div>
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg mt-6"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{timers.length}</div>
              <div className="text-gray-400">Total Timers</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{allTimerLogs.length}</div>
              <div className="text-gray-400">Total Actions</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">
                {Object.keys(timerSessions).filter(id => timerSessions[id]?.is_running).length}
              </div>
              <div className="text-gray-400">Active Sessions</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">
                {new Set(timers.map(t => t.presenter_name)).size}
              </div>
              <div className="text-gray-400">Unique Presenters</div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Activity Log</h3>
              <button
                onClick={() => {
                  const csvData = []
                  csvData.push(['Date', 'Timer', 'Presenter', 'Action', 'Notes'])
                  
                  const filteredLogs = allTimerLogs.filter(log => {
                    if (startDate && new Date(log.created_at) < new Date(startDate)) return false
                    if (endDate && new Date(log.created_at) > new Date(endDate + 'T23:59:59')) return false
                    return true
                  })
                  
                  filteredLogs.forEach(log => {
                    csvData.push([
                      new Date(log.created_at).toLocaleDateString(),
                      log.timers?.name || 'Unknown',
                      log.timers?.presenter_name || 'Unknown',
                      log.action,
                      log.notes || ''
                    ])
                  })
                  
                  const csvString = csvData.map(row => 
                    row.map(field => `"${field}"`).join(',')
                  ).join('\n')
                  
                  const blob = new Blob([csvString], { type: 'text/csv' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `timer-activity-${new Date().toISOString().split('T')[0]}.csv`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(url)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-2 text-gray-300">Date</th>
                    <th className="pb-2 text-gray-300">Timer</th>
                    <th className="pb-2 text-gray-300">Presenter</th>
                    <th className="pb-2 text-gray-300">Action</th>
                    <th className="pb-2 text-gray-300">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allTimerLogs
                    .filter(log => {
                      if (startDate && new Date(log.created_at) < new Date(startDate)) return false
                      if (endDate && new Date(log.created_at) > new Date(endDate + 'T23:59:59')) return false
                      return true
                    })
                    .slice(0, 50)
                    .map((log, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-2 text-gray-300">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-white">{log.timers?.name || 'Unknown Timer'}</td>
                      <td className="py-2 text-gray-300">{log.timers?.presenter_name || 'Unknown'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.action === 'start' ? 'bg-green-600 text-white' :
                          log.action === 'pause' ? 'bg-yellow-600 text-white' :
                          log.action === 'stop' ? 'bg-red-600 text-white' :
                          log.action === 'finished' ? 'bg-blue-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400 text-sm">{log.notes || '-'}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Timer</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Timer Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Timer Type</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setTimerType('single')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    timerType === 'single'
                      ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-400'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Single Timer
                </button>
                <button
                  onClick={() => setTimerType('event')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    timerType === 'event'
                      ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-400'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Event Timer (Multiple Presenters)
                </button>
              </div>
            </div>

            {timerType === 'single' ? (
              // Single Timer Form
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timer Name</label>
                  <input
                    type="text"
                    value={newTimerName}
                    onChange={(e) => setNewTimerName(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Opening Keynote"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Presenter Name</label>
                  <input
                    type="text"
                    value={newTimerPresenter}
                    onChange={(e) => setNewTimerPresenter(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newTimerDuration}
                    onChange={(e) => setNewTimerDuration(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., 15"
                    min="1"
                  />
                </div>
              </div>
            ) : (
              // Event Timer Form
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Tech Conference 2024"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-300">Presenters</label>
                    <button
                      onClick={addPresenter}
                      disabled={presenters.length >= 8}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Presenter
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {presenters.map((presenter, index) => (
                      <div key={presenter.id} className="flex gap-3 items-center bg-gray-700 p-3 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={presenter.name}
                            onChange={(e) => updatePresenter(presenter.id, 'name', e.target.value)}
                            className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                            placeholder={`Presenter ${index + 1} name`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={presenter.minutes}
                            onChange={(e) => updatePresenter(presenter.id, 'minutes', parseInt(e.target.value) || 0)}
                            className="w-16 bg-gray-600 text-white px-2 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-center"
                            min="0"
                            max="999"
                          />
                          <span className="text-gray-300 py-2">m</span>
                          <input
                            type="number"
                            value={presenter.seconds}
                            onChange={(e) => updatePresenter(presenter.id, 'seconds', parseInt(e.target.value) || 0)}
                            className="w-16 bg-gray-600 text-white px-2 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-center"
                            min="0"
                            max="59"
                          />
                          <span className="text-gray-300 py-2">s</span>
                        </div>
                        {presenters.length > 1 && (
                          <button
                            onClick={() => removePresenter(presenter.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Event Summary</h4>
                  <div className="text-gray-300 text-sm">
                    <div>Total Presenters: {presenters.length}</div>
                    <div>Estimated Total Time: ~{calculateEventTotalTime()} minutes</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTimer}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Create Timer{timerType === 'event' ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Timer Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-300">Sound notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-300">Vibration feedback</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-300">Auto-start next timer</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Display Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-300">Show seconds</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-300">24-hour format</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-300">Fullscreen on start</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        session={session}
      />
    </div>
  )
}