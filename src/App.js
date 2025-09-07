import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import ProTimerApp from './components/ProTimerApp'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bypassAuth, setBypassAuth] = useState(false)

  useEffect(() => {
    if (bypassAuth) {
      setLoading(false)
      return
    }

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
  }, [bypassAuth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Show bypass option on auth screen
  if (!session && !bypassAuth) {
    return (
      <div>
        <Auth />
        <div className="fixed bottom-4 left-4">
          <button
            onClick={() => setBypassAuth(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Skip Auth (Testing)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      <ProTimerApp session={session} bypassAuth={bypassAuth} />
    </div>
  )
}

export default App