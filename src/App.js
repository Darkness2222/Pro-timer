import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import ProTimerApp from './components/ProTimerApp'
import PresenterJoinPage from './components/PresenterJoinPage'
import PresenterView from './components/PresenterView'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session)
      setSession(session)
    })

    return () => subscription.unsubscribe()
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