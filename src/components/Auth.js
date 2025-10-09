import React, { useState } from 'react'
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`
          }
        })
        if (error) throw error
        setMessage('Account created successfully! You can now sign in.')
        setMessageType('success')
        setIsSignUp(false)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        if (rememberMe) {
          localStorage.setItem('synccue_remember_credentials', JSON.stringify({
            email,
            timestamp: Date.now()
          }))
        }

        if (data?.session) {
          console.log('Login successful, session established')
        }
      }
    } catch (error) {
      setMessage(error.message)
      setMessageType('error')
      setShowForgotPassword(error.message === 'Invalid login credentials')
      setIsSubmitting(false)
    } finally {
      setLoading(false)
      if (!isSignUp) {
        setTimeout(() => setIsSubmitting(false), 1000)
      } else {
        setIsSubmitting(false)
      }
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Please enter your email address first')
      setMessageType('error')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app`
      })
      if (error) throw error
      setMessage('Password reset email sent! Check your inbox.')
      setMessageType('success')
      setShowForgotPassword(false)
    } catch (error) {
      setMessage(error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 border border-gray-700">
        <div className="flex justify-center mb-10">
          <img 
            src={`${process.env.PUBLIC_URL}/907374B7-F3D5-4965-A884-959289F0B830.jpeg`}
            alt="SyncCue Logo" 
            className="h-25 object-contain"
            onError={(e) => {
              console.error('Logo failed to load:', e.target.src);
              e.target.style.display = 'none';
            }}
          />
        </div>
        
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            messageType === 'success' 
              ? 'bg-green-900 border border-green-700 text-green-100' 
              : 'bg-red-900 border border-red-700 text-red-100'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm">{message}</span>
            {showForgotPassword && messageType === 'error' && (
              <button
                onClick={handleForgotPassword}
                className="ml-2 text-blue-400 hover:text-blue-300 underline text-sm"
                disabled={loading}
              >
                Forgot password?
              </button>
            )}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                placeholder="••••••••"
                minLength={6}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {!isSignUp && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-300">
                Remember my credentials
              </label>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-6 py-3 rounded-lg font-medium text-white transition-colors"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}
