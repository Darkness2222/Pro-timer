import React, { useState, useEffect } from 'react'
import { Users, Clock, Calendar, Check, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PresenterJoinPage({ token }) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tokenData, setTokenData] = useState(null)
  const [event, setEvent] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [selectedPresenter, setSelectedPresenter] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      loadEventData()
    }
  }, [token])

  const loadEventData = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: tokenResult, error: tokenError } = await supabase
        .from('event_access_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle()

      if (tokenError) throw tokenError

      if (!tokenResult) {
        setError('Invalid or expired access link')
        setLoading(false)
        return
      }

      if (tokenResult.expires_at && new Date(tokenResult.expires_at) < new Date()) {
        setError('This access link has expired')
        setLoading(false)
        return
      }

      if (tokenResult.max_uses && tokenResult.current_uses >= tokenResult.max_uses) {
        setError('This access link has reached its maximum number of uses')
        setLoading(false)
        return
      }

      setTokenData(tokenResult)

      const [eventResult, assignmentsResult] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .eq('id', tokenResult.event_id)
          .single(),
        supabase
          .from('event_presenter_assignments')
          .select('*')
          .eq('event_id', tokenResult.event_id)
          .order('presenter_name')
      ])

      if (eventResult.error) throw eventResult.error
      if (assignmentsResult.error) throw assignmentsResult.error

      setEvent(eventResult.data)
      setAssignments(assignmentsResult.data || [])

      await supabase
        .from('event_access_logs')
        .insert({
          token_id: tokenResult.id,
          action: 'viewed',
          device_info: navigator.userAgent
        })
    } catch (error) {
      console.error('Error loading event data:', error)
      setError('Failed to load event information')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!selectedPresenter) {
      setError('Please select your name')
      return
    }

    const assignment = assignments.find(a => a.presenter_name === selectedPresenter)
    if (!assignment) {
      setError('Selected presenter not found')
      return
    }

    if (assignment.assigned_at) {
      setError('This presenter slot has already been claimed')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const sessionToken = crypto.randomUUID()

      const { error: updateError } = await supabase
        .from('event_presenter_assignments')
        .update({
          assigned_at: new Date().toISOString(),
          session_token: sessionToken,
          device_info: navigator.userAgent
        })
        .eq('id', assignment.id)
        .is('assigned_at', null)

      if (updateError) {
        if (updateError.code === '23505') {
          setError('This presenter slot has already been claimed by someone else')
        } else {
          throw updateError
        }
        setSubmitting(false)
        return
      }

      await supabase
        .from('event_access_tokens')
        .update({
          current_uses: tokenData.current_uses + 1
        })
        .eq('id', tokenData.id)

      await supabase
        .from('event_access_logs')
        .insert({
          token_id: tokenData.id,
          presenter_name: selectedPresenter,
          action: 'assigned',
          device_info: navigator.userAgent
        })

      setSuccess(true)

      setTimeout(() => {
        window.location.href = `/presenter/${sessionToken}`
      }, 2000)
    } catch (error) {
      console.error('Error claiming presenter slot:', error)
      setError('Failed to claim presenter slot. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading event information...</p>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 border border-red-500 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 border border-green-500 rounded-xl p-8 max-w-md w-full text-center">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
          <p className="text-gray-400 mb-4">Presenter slot claimed successfully</p>
          <p className="text-sm text-gray-500">Redirecting to your timer view...</p>
        </div>
      </div>
    )
  }

  const availableAssignments = assignments.filter(a => !a.assigned_at)
  const claimedAssignments = assignments.filter(a => a.assigned_at)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">{event.name}</h1>
              <p className="text-gray-400">Select your presenter name</p>
            </div>
          </div>

          {event.description && (
            <p className="text-gray-300 mb-6">{event.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
            {event.event_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(event.event_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {assignments.length} {assignments.length === 1 ? 'Presenter' : 'Presenters'}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Who are you?</h2>

          {availableAssignments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-400">All presenter slots have been claimed</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                {availableAssignments.map((assignment) => (
                  <label
                    key={assignment.id}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPresenter === assignment.presenter_name
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="presenter"
                      value={assignment.presenter_name}
                      checked={selectedPresenter === assignment.presenter_name}
                      onChange={(e) => {
                        setSelectedPresenter(e.target.value)
                        setError('')
                      }}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{assignment.presenter_name}</div>
                      <div className="text-sm text-gray-400">Available</div>
                    </div>
                    {selectedPresenter === assignment.presenter_name && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={handleJoin}
                disabled={!selectedPresenter || submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Claiming slot...
                  </>
                ) : (
                  <>
                    Continue as {selectedPresenter || 'Presenter'}
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {claimedAssignments.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Already Claimed</h3>
            <div className="space-y-2">
              {claimedAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center p-3 rounded-lg bg-gray-700 border border-gray-600"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-400">{assignment.presenter_name}</div>
                    <div className="text-xs text-gray-500">
                      Claimed {new Date(assignment.assigned_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
