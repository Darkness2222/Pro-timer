import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import TimerOverview from './TimerOverview'
import { getProductByPriceId } from '../stripe-config'
import { Play, Pause, Square, RotateCcw, Settings, MessageSquare, Plus, Minus, Clock, Users, Timer as TimerIcon, QrCode, ExternalLink, FileText, Crown, LogOut, CircleCheck as CheckCircle, X, Calendar } from 'lucide-react'
import SubscriptionModal from './SubscriptionModal'
import ReportsPage from './ReportsPage'
import SuccessPage from './SuccessPage'
import CreateTimerModal from './CreateTimerModal'
import SettingsModal from './SettingsModal'
import EventRunningInterfaceModal from './EventRunningInterfaceModal'
import TeamManagement from './TeamManagement'
import EventsPage from './EventsPage'
import EventDetail from './EventDetail'
import CreateEventModal from './CreateEventModal'

export default function ProTimerApp({ session }) {
  const [currentView, setCurrentView] = useState('events')
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [showTeamManagement, setShowTeamManagement] = useState(false)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTimer, setSelectedTimer] = useState(null)
  const [timers, setTimers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messagesExpanded, setMessagesExpanded] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [autoStartNextEvent, setAutoStartNextEvent] = useState(true)
  const [bufferTimerState, setBufferTimerState] = useState({
    isRunning: false,
    timeLeft: 0,
    duration: 0
  })
  const [recentMessage, setRecentMessage] = useState('')
  const [showEventInterface, setShowEventInterface] = useState(false)

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

  // Buffer timer constants
  const DEFAULT_BUFFER_DURATION = 30 // 30 seconds
  
  // Form states
  const [newMessage, setNewMessage] = useState('')
  
  const intervalRef = useRef(null)
  const messageSubscriptionRef = useRef(null)

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

  // Real-time message subscription
  useEffect(() => {
    if (!selectedTimer) {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe()
        messageSubscriptionRef.current = null
      }
      setRecentMessage('')
      return
    }

    // Load the most recent message when timer is selected
    const loadRecentMessage = async () => {
      try {
        const { data, error } = await supabase
          .from('timer_messages')
          .select('*')
          .eq('timer_id', selectedTimer.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          setRecentMessage(data.message)
          setTimeout(() => {
            setRecentMessage('')
          }, 10000)
        }
      } catch (error) {
        console.error('Error loading recent message:', error)
      }
    }

    loadRecentMessage()

    // Set up real-time subscription
    const channel = supabase
      .channel(`timer_messages:${selectedTimer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'timer_messages',
          filter: `timer_id=eq.${selectedTimer.id}`
        },
        (payload) => {
          console.log('New message received:', payload)
          setRecentMessage(payload.new.message)
          setMessages(prev => [payload.new, ...prev])

          // Auto-clear message after 10 seconds
          setTimeout(() => {
            setRecentMessage('')
          }, 10000)
        }
      )
      .subscribe()

    messageSubscriptionRef.current = channel

    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe()
        messageSubscriptionRef.current = null
      }
    }
  }, [selectedTimer?.id])

  // Add session validation
  useEffect(() => {
    if (!session) {
      console.log('No session found, user should be redirected to auth')
      return
    }
  }, [session])

  // Buffer timer countdown effect
  useEffect(() => {
    let interval = null

    if (bufferTimerState.isRunning && bufferTimerState.timeLeft > 0) {
      interval = setInterval(() => {
        setBufferTimerState(prev => {
          const newTimeLeft = prev.timeLeft - 1

          if (newTimeLeft <= 0) {
            // Buffer finished, auto-start next timer if enabled
            if (autoStartNextEvent) {
              const eventTimers = timers
                .filter(timer => timer.timer_type === 'event')
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

              const nextUpTimer = eventTimers.find(timer =>
                timer.status === 'active' &&
                !timerSessions[timer.id]?.is_running &&
                timer.status !== 'finished_early'
              )

              if (nextUpTimer) {
                handleStartTimer(nextUpTimer.id)
              }
            }

            return {
              isRunning: false,
              timeLeft: 0,
              duration: 0
            }
          }

          return {
            ...prev,
            timeLeft: newTimeLeft
          }
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [bufferTimerState.isRunning, bufferTimerState.timeLeft, timers, timerSessions, autoStartNextEvent])

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
       .eq('status', 'active')
      
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

  const handleStartTimer = async (timerId) => {
    try {
      const timer = timers.find(t => t.id === timerId)
      if (!timer) return

      const { error } = await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: timerId,
          time_left: timer.duration,
          is_running: true,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      await loadTimerSessions()
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const handlePauseTimer = async (timerId) => {
    try {
      const { error } = await supabase
        .from('timer_sessions')
        .update({
          is_running: false,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId)

      if (error) throw error
      await loadTimerSessions()
    } catch (error) {
      console.error('Error pausing timer:', error)
    }
  }

  const handleStopTimer = async (timerId) => {
    try {
      const { error } = await supabase
        .from('timer_sessions')
        .update({
          is_running: false,
          time_left: 0,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId)

      if (error) throw error
      await loadTimerSessions()
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }

  const handleResetTimer = async (timerId) => {
    try {
      const timer = timers.find(t => t.id === timerId)
      if (!timer) return

      const { error } = await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: timerId,
          time_left: timer.duration,
          is_running: false,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      await loadTimerSessions()
    } catch (error) {
      console.error('Error resetting timer:', error)
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

  const createTimer = async (formData) => {
    try {
      if (formData.timerType === 'event') {
        // Calculate buffer duration in seconds
        const bufferDuration = (formData.bufferMinutes * 60) + formData.bufferSeconds

        // Create multiple timers for event
        for (let i = 0; i < formData.presenters.length; i++) {
          const presenter = formData.presenters[i]
          const duration = (presenter.minutes * 60) + presenter.seconds

          if (!presenter.name.trim() || duration <= 0) {
            console.error('Invalid presenter data:', presenter)
            continue
          }

          const { data, error } = await supabase
            .from('timers')
            .insert({
              name: formData.eventName,
              presenter_name: presenter.name,
              duration: duration,
              user_id: session?.user?.id || null,
              timer_type: 'event',
              buffer_duration: bufferDuration
            })
            .select()
            .single()

          if (error) {
            console.error('Error creating event timer:', error)
            throw error
          }

          // Create timer session
          const { error: sessionError } = await supabase
            .from('timer_sessions')
            .insert({
              timer_id: data.id,
              time_left: duration,
              is_running: false
            })

          if (sessionError) {
            console.error('Error creating timer session:', sessionError)
            throw sessionError
          }
        }
      } else {
        // Create single timer
        const duration = parseInt(formData.newTimerDuration) * 60
        
        if (!formData.newTimerName.trim() || !formData.newTimerPresenter.trim() || duration <= 0) {
          throw new Error('Invalid timer data provided')
        }
        
        const { data, error } = await supabase
          .from('timers')
          .insert({
            name: formData.newTimerName,
            presenter_name: formData.newTimerPresenter,
            duration: duration,
            user_id: session?.user?.id || null,
            timer_type: 'single'
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating timer:', error)
          throw error
        }

        // Create timer session
        const { error: sessionError } = await supabase
          .from('timer_sessions')
          .insert({
            timer_id: data.id,
            time_left: duration,
            is_running: false
          })

        if (sessionError) {
          console.error('Error creating timer session:', sessionError)
          throw sessionError
        }
      }

      // Reload timers and close modal
      await loadTimers()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error in createTimer:', error)
      // Don't close modal on error, let user try again
      // Could add error state here to show user what went wrong
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
     // Update timer status to 'archived' in database instead of deleting
     const { error: updateError } = await supabase
       .from('timers')
       .update({ status: 'archived' })
       .eq('id', timerId)
     
     if (updateError) {
       console.error('Error archiving timer:', updateError)
       return
     }
     
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
      
     const { error: updateError } = await supabase
       .from('timers')
       .update({ status: 'finished_early' })
       .eq('id', timerId)
     
     if (updateError) {
       console.error('Error updating timer status:', updateError)
       return
     }
     
      const timer = timers.find(t => t.id === timerId)
      if (!timer) return

      const remainingTime = timerSessions[timerId]?.time_left || 0
      
      // Update timer session to finished state
      await updateTimerSession(timerId, {
        time_left: 0,
        is_running: false
      })
      
      // Update timer status in database
     // Remove timer from local state (no longer active)
     // Log the archive action
     const { error: logError } = await supabase
       .from('timer_logs')
       .insert({
         timer_id: timerId,
         action: 'archive',
         time_value: 0,
         notes: 'Timer archived by user'
       })

     if (logError) {
       console.error('Error logging archive action:', logError)
     }

     // Remove timer from local state (no longer active)
     setTimers(prev => prev.filter(timer => timer.id !== timerId))
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

  // NEW: Finish timer function
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

  const handleFinishTimer = async (timerId) => {
    try {
      const session = timerSessions[timerId]
      const finishedTimer = timers.find(t => t.id === timerId)

      // Update timer status to finished_early in database
      const { error: updateError } = await supabase
        .from('timers')
        .update({ status: 'finished_early' })
        .eq('id', timerId)

      if (updateError) {
        console.error('Error updating timer status:', updateError)
        return
      }

      // Update timer session to finished state
      const { error: sessionError } = await supabase
        .from('timer_sessions')
        .update({
          time_left: 0,
          is_running: false,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId)

      if (sessionError) {
        console.error('Error updating timer session:', sessionError)
      }

      // Log the finish action
      const { error: logError } = await supabase
        .from('timer_logs')
        .insert({
          timer_id: timerId,
          action: 'finish',
          time_value: session?.time_left || 0,
          notes: 'Timer finished early by user'
        })

      if (logError) {
        console.error('Error logging finish action:', logError)
      }

      // Clear selected timer if it was the one that finished
      if (selectedTimer?.id === timerId) {
        setSelectedTimer(null)
        setTimeLeft(0)
        setIsRunning(false)
      }

      // Reload timers to reflect the status change
      await loadTimers()
      await updateTimerSessions()

      // Check if this is an event timer and start buffer if there's a next timer
      if (finishedTimer?.timer_type === 'event') {
        // Get fresh list of timers after reload
        const { data: freshTimers } = await supabase
          .from('timers')
          .select('*')
          .eq('status', 'active')
          .eq('timer_type', 'event')
          .order('created_at', { ascending: true })

        const nextUpTimer = freshTimers?.[0]

        if (nextUpTimer) {
          // Use the stored buffer duration from the timer
          const bufferDuration = nextUpTimer.buffer_duration || DEFAULT_BUFFER_DURATION

          console.log('Starting buffer timer:', bufferDuration, 'seconds')

          // Start buffer countdown
          setBufferTimerState({
            isRunning: true,
            timeLeft: bufferDuration,
            duration: bufferDuration
          })
        }
      }
    } catch (error) {
      console.error('Error finishing timer:', error)
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

  const handleStartNextEventTimer = async (timerId) => {
    try {
      // Stop buffer timer if running
      if (bufferTimerState.isRunning) {
        setBufferTimerState({
          isRunning: false,
          timeLeft: 0,
          duration: 0
        })
      }

      // Find currently running event timer and finish it
      const eventTimers = timers.filter(timer => timer.timer_type === 'event')
      const currentRunningTimer = eventTimers.find(timer =>
        timerSessions[timer.id]?.is_running
      )

      if (currentRunningTimer) {
        await handleFinishTimer(currentRunningTimer.id)
      }

      // Start the next timer
      if (timerId) {
        await handleStartTimer(timerId)
      }
    } catch (error) {
      console.error('Error starting next event timer:', error)
    }
  }

  const handleExtendBuffer = (minutes) => {
    setBufferTimerState(prev => ({
      ...prev,
      timeLeft: prev.timeLeft + (minutes * 60),
      duration: prev.duration + (minutes * 60)
    }))
  }

  const handleResumeTimer = async (timerId) => {
    try {
      const session = timerSessions[timerId]
      if (!session) return

      const { error } = await supabase
        .from('timer_sessions')
        .update({
          is_running: true,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId)

      if (error) throw error

      // Log the resume action
      await supabase
        .from('timer_logs')
        .insert({
          timer_id: timerId,
          action: 'start',
          time_value: session.time_left,
          notes: 'Timer resumed'
        })

      await updateTimerSessions()
    } catch (error) {
      console.error('Error resuming timer:', error)
    }
  }

  const handleExtendTimer = async (timerId, minutes) => {
    try {
      const session = timerSessions[timerId]
      if (!session) return

      const additionalTime = minutes * 60
      const newTimeLeft = session.time_left + additionalTime

      const { error } = await supabase
        .from('timer_sessions')
        .update({
          time_left: newTimeLeft,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId)

      if (error) throw error

      // Log the extension
      await supabase
        .from('timer_logs')
        .insert({
          timer_id: timerId,
          action: 'extend',
          time_value: newTimeLeft,
          duration_change: additionalTime,
          notes: `Extended timer by ${minutes} minutes`
        })

      await updateTimerSessions()
    } catch (error) {
      console.error('Error extending timer:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      
      console.log('Timer reset successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      // Don't re-throw the error to prevent auth issues
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
            <div className="text-sm text-gray-300">
              {loading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <>
                  {getSubscriptionDisplayName()}
                  {isProUser() && (
                    <span className="ml-2 px-2 py-1 bg-yellow-600 text-yellow-100 rounded-full text-xs">
                      PRO
                    </span>
                  )}
                </>
              )}
            </div>
              <button
                onClick={() => { setCurrentView('events'); setSelectedEventId(null); }}
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  currentView === 'events' && !selectedEventId
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Events
              </button>
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
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Presenter View
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
                onClick={() => setShowTeamManagement(true)}
                className="px-4 py-2 rounded-lg transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Team
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 rounded-lg transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                ⚙️ Settings
              </button>
            </div>
            <div className="flex items-center">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/app'
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Presenter View */}
      {currentView === 'presenter' && (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
          {bufferTimerState.isRunning ? (
            <div className="text-center w-full max-w-4xl px-8">
              {/* Buffer Timer Display */}
              <h1 className="text-5xl md:text-6xl font-bold mb-8 text-orange-400">
                Transition Buffer
              </h1>

              <div className="text-[180px] md:text-[220px] font-mono font-bold leading-none mb-8 text-orange-400">
                {formatTime(bufferTimerState.timeLeft)}
              </div>

              <div className="text-3xl text-orange-200 mb-12">
                Preparing for next presenter...
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-3xl mx-auto bg-gray-700/50 rounded-full h-4 mb-8">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${((bufferTimerState.duration - bufferTimerState.timeLeft) / bufferTimerState.duration) * 100}%` }}
                ></div>
              </div>

              {/* Finish Buffer Button */}
              <button
                onClick={() => {
                  setBufferTimerState({
                    isRunning: false,
                    timeLeft: 0,
                    duration: 0
                  })
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors flex items-center gap-3 mx-auto"
              >
                <CheckCircle className="w-6 h-6" />
                Finish Buffer
              </button>
            </div>
          ) : selectedTimer ? (
            <div className="text-center w-full max-w-4xl px-8">
              {/* Timer Title */}
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                {selectedTimer.name}
              </h1>

              {/* Presenter Name with Icon */}
              <div className="flex items-center justify-center gap-3 mb-12 text-xl md:text-2xl text-blue-200">
                <Users className="w-6 h-6" />
                <span>{selectedTimer.presenter_name}</span>
              </div>

              {/* Main Timer Display */}
              <div className={`text-[180px] md:text-[220px] font-mono font-bold leading-none mb-8 ${
                (() => {
                  const session = timerSessions[selectedTimer.id]
                  let currentTimeLeft = session?.time_left || selectedTimer.duration
                  if (session?.is_running) {
                    const now = new Date(currentTime)
                    const lastUpdate = new Date(session.updated_at)
                    const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000)
                    currentTimeLeft = session.time_left - elapsedSinceUpdate
                  }
                  return currentTimeLeft <= 0
                    ? 'text-red-500 animate-pulse'
                    : currentTimeLeft <= 60
                    ? 'text-red-400'
                    : 'text-red-500'
                })()
              }`}>
                {formatTimeFromSession(timerSessions[selectedTimer.id], selectedTimer.duration)}
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-3xl mx-auto bg-gray-700/50 rounded-full h-4 mb-8">
                <div
                  className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, getProgressPercentageFromSession(timerSessions[selectedTimer.id], selectedTimer.duration))}%` }}
                ></div>
              </div>

              {/* Percentage Remaining */}
              <div className="text-2xl text-blue-200 mb-12">
                {Math.max(0, Math.round(100 - getProgressPercentageFromSession(timerSessions[selectedTimer.id], selectedTimer.duration)))}% remaining
              </div>

              {/* Overtime Warning */}
              {(() => {
                const session = timerSessions[selectedTimer.id]
                let currentTimeLeft = session?.time_left || selectedTimer.duration
                if (session?.is_running) {
                  const now = new Date(currentTime)
                  const lastUpdate = new Date(session.updated_at)
                  const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000)
                  currentTimeLeft = session.time_left - elapsedSinceUpdate
                }
                return currentTimeLeft <= 0 && (
                  <div className="text-3xl text-red-400 font-bold mb-8 animate-pulse">
                    ⚠️ OVERTIME ⚠️
                  </div>
                )
              })()}

              {/* Recent Message Display */}
              {recentMessage && (
                <div className="text-2xl bg-yellow-600/30 border-2 border-yellow-500 rounded-xl p-6 max-w-2xl mx-auto mb-8 animate-pulse">
                  {recentMessage}
                </div>
              )}

              {/* Messages from Control Dropdown */}
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-8">
                <button
                  onClick={() => setMessagesExpanded(!messagesExpanded)}
                  className="w-full bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm text-white px-6 py-4 rounded-lg font-medium transition-all border border-gray-600 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Messages from Control</span>
                  <span className={`transform transition-transform ${messagesExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* Message History Panel */}
                {messagesExpanded && (
                  <div className="mt-2 bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-600 max-h-64 overflow-y-auto">
                    {messages.length > 0 ? (
                      <div className="p-4 space-y-3">
                        {messages.map((msg) => (
                          <div key={msg.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                            <div className="text-white text-lg mb-1">{msg.message}</div>
                            <div className="text-gray-400 text-sm">
                              {new Date(msg.sent_at).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-400">
                        No messages yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold mb-4 text-gray-300">No Timer Selected</div>
              <p className="text-gray-400">Start a timer from the Admin Dashboard to see it here</p>
            </div>
          )}
        </div>
      )}

      {/* Admin Dashboard */}
      {currentView === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Create and manage presentation timers</p>
          </div>

          {/* Create Timer and Event Interface Buttons */}
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Timer
            </button>
            <button
              onClick={() => setShowEventInterface(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Event Interface
            </button>
          </div>

          {/* Buffer Timer Display */}
          {bufferTimerState.isRunning && (
            <div className="mb-4">
              <div className="bg-orange-900/50 backdrop-blur-sm rounded-xl p-4 border border-orange-600/50 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Buffer Time</h3>
                <p className="text-gray-300 mb-2 text-xs">Transition Period</p>
                <div className="text-lg font-mono text-orange-400 mb-2">
                  {formatTime(bufferTimerState.timeLeft)}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-orange-500 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, (bufferTimerState.timeLeft / bufferTimerState.duration) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Timers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {timers.map((timer, index) => {
              const session = timerSessions[timer.id];
              // Get event timers sorted by creation time to determine presenter number
              const eventTimers = timers
                .filter(t => t.timer_type === 'event')
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              const presenterNumber = timer.timer_type === 'event'
                ? eventTimers.findIndex(t => t.id === timer.id) + 1
                : null;

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
                  <p className="text-gray-300 mb-2 text-xs truncate">
                    {presenterNumber ? `Presenter ${presenterNumber.toString().padStart(2, '0')}` : 'Presenter'}: {timer.presenter_name}
                  </p>
                  
                  <div className="mt-auto">
                    <div className="text-lg font-mono text-red-500 mb-2">
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
            <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                Control: {selectedTimer.name}
              </h2>
              
              {/* Timer Display */}
              <div className="text-center mb-6">
                <div className={`text-6xl font-mono font-bold mb-4 ${
                  timeLeft < 0 ? 'text-red-500 animate-pulse' : 'text-red-500'
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
                  onClick={() => handleFinishTimer(selectedTimer.id)}
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
                      type="number"
                      value={overrideTime}
                      onChange={(e) => setOverrideTime(e.target.value)}
                      className="p-2 bg-gray-600 border border-gray-500 rounded text-white w-20"
                      placeholder="15"
                      min="1"
                      max="180"
                    />
                    <span className="text-white">minutes</span>
                    <button
                      onClick={overrideTimerDuration}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                    >
                      Set
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

              {/* Quick Messages */}
              <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Send Message to Presenter
                  </h3>
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="text-gray-300 hover:text-white"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {quickMessages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => sendMessage(msg.text)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium text-left"
                    >
                      {msg.text}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                    placeholder="Type custom message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
                  />
                  <button
                    onClick={() => sendMessage(newMessage)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timer Overview */}
      {currentView === 'overview' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Timer Overview</h1>
              <p className="text-gray-300">Monitor all active timers</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayAll}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play All
              </button>
              <button
                onClick={handlePauseAll}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timers.map((timer) => {
              const session = timerSessions[timer.id];
              // Get event timers sorted by creation time to determine presenter number
              const eventTimers = timers
                .filter(t => t.timer_type === 'event')
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              const presenterNumber = timer.timer_type === 'event'
                ? eventTimers.findIndex(t => t.id === timer.id) + 1
                : null;

              return (
                <div
                  key={timer.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
                  onClick={() => {
                    setSelectedTimer(timer)
                    setCurrentView('admin')
                  }}
                >
                  {/* Status Indicator */}
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-3 h-3 rounded-full ${session?.is_running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{timer.name}</h3>
                  <p className="text-gray-300 mb-4">
                    {presenterNumber ? `Presenter ${presenterNumber.toString().padStart(2, '0')}` : 'Presenter'}: {timer.presenter_name}
                  </p>
                  <div className="text-3xl font-mono text-red-500 mb-4">
                    {(() => {
                      if (!session) return formatTime(timer.duration);
                      
                      let timeLeft = session.time_left;
                      if (session.is_running) {
                        const now = new Date(currentTime);
                        const lastUpdate = new Date(session.updated_at);
                        const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000);
                        timeLeft = session.time_left - elapsedSinceUpdate;
                      }
                      
                      return formatTime(timeLeft);
                    })()}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, getProgressPercentageFromSession(session, timer.duration))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events View */}
      {currentView === 'events' && !selectedEventId && (
        <EventsPage
          session={session}
          onEventSelect={(eventId) => {
            if (eventId === 'create') {
              setShowCreateEventModal(true)
            } else {
              setSelectedEventId(eventId)
            }
          }}
        />
      )}

      {/* Event Detail View */}
      {currentView === 'events' && selectedEventId && (
        <EventDetail
          eventId={selectedEventId}
          session={session}
          onBack={() => setSelectedEventId(null)}
        />
      )}

      {/* Reports View */}
      {currentView === 'reports' && (
        <ReportsPage
          timers={timers}
          timerLogs={allTimerLogs}
          reportStartDate={reportDateRange.start}
          reportEndDate={reportDateRange.end}
          onStartDateChange={(date) => setReportDateRange(prev => ({ ...prev, start: date }))}
          onEndDateChange={(date) => setReportDateRange(prev => ({ ...prev, end: date }))}
          onExportCSV={exportTimersCSV}
        />
      )}

      {/* Create Timer Modal */}
      <CreateTimerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createTimer}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onShowSubscriptionModal={() => setShowSubscriptionModal(true)}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        session={session}
      />

      {/* Team Management Modal */}
      <TeamManagement
        isOpen={showTeamManagement}
        onClose={() => setShowTeamManagement(false)}
        session={session}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        session={session}
        onEventCreated={() => {
          setShowCreateEventModal(false)
          setCurrentView('events')
          setSelectedEventId(null)
        }}
      />

      {/* Event Running Interface Modal */}
      {showEventInterface && (
        <EventRunningInterfaceModal
          timers={timers}
          timerSessions={timerSessions}
          bufferTimerState={bufferTimerState}
          autoStartNextEvent={autoStartNextEvent}
          onClose={() => setShowEventInterface(false)}
          onStartNextTimer={handleStartNextEventTimer}
          onExtendBuffer={handleExtendBuffer}
          onToggleAutoStart={setAutoStartNextEvent}
          onExtendTimer={handleExtendTimer}
          onPauseTimer={handlePauseTimer}
          onResumeTimer={handleResumeTimer}
        />
      )}
    </div>
  )
}