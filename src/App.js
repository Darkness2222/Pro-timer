import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import ProTimerApp from './components/ProTimerApp'
import PresenterJoinPage from './components/PresenterJoinPage'
import PresenterView from './components/PresenterView'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const initialLoadComplete = useRef(false)
  const sessionRef = useRef(null)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        if (mounted) {
          sessionRef.current = session
          setSession(session)
          setLoading(false)
          initialLoadComplete.current = true
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
          initialLoadComplete.current = true
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted || !initialLoadComplete.current) return

      console.log('Auth state changed:', _event, session)

      if (_event === 'SIGNED_IN') {
        if (sessionRef.current?.user?.id !== session?.user?.id) {
          sessionRef.current = session
          setSession(session)
        }
      } else if (_event === 'SIGNED_OUT') {
        sessionRef.current = null
        setSession(null)
      } else if (_event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
        sessionRef.current = session
        setSession(session)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const pathname = window.location.pathname

  if (pathname.startsWith('/event/join/')) {
    const token = pathname.split('/event/join/')[1]
    return <PresenterJoinPage token={token} />
  }

  if (pathname.startsWith('/presenter/')) {
    const sessionToken = pathname.split('/presenter/')[1]
    return <PresenterView sessionToken={sessionToken} />
  }

  // Show bypass option on auth screen
  if (!session) {
    return (
      <Auth />
    )
  }

  return (
    <div className="App">
      <ProTimerApp session={session} />
    </div>
  )
}

export default App