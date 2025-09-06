import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import ProTimerApp from './components/ProTimerApp'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bypassAuth, setBypassAuth] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

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
      setInitialLoad(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialLoad) {
        setSession(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [bypassAuth, initialLoad])

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
      {/* Add logout/reset button */}
      <button
        onClick={() => {
          if (session) {
            supabase.auth.signOut()
          } else {
            setBypassAuth(false)
          }
        }}
        className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm z-50"
      >
        {session ? 'Sign Out' : 'Back to Auth'}
      </button>
    </div>
  )
}

export default App