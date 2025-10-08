import React, { useState, useEffect } from 'react'
import { Star, Send, Check, AlertCircle, User, Mail, MessageSquare } from 'lucide-react'
import { feedbackUtils } from '../lib/feedbackUtils'

export default function AttendeeFeedbackPage() {
  const [loading, setLoading] = useState(true)
  const [eventSettings, setEventSettings] = useState(null)
  const [presenters, setPresenters] = useState([])
  const [feedbackData, setFeedbackData] = useState({})
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [attendeeName, setAttendeeName] = useState('')
  const [attendeeEmail, setAttendeeEmail] = useState('')
  const [eventComment, setEventComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadEventData()
  }, [])

  const loadEventData = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    if (!token) {
      setError('Invalid feedback link')
      setLoading(false)
      return
    }

    const { data: settings, error: settingsError } = await feedbackUtils.getEventFeedbackSettingsByToken(token)

    if (settingsError || !settings) {
      setError(settingsError?.message || 'Event feedback is not available')
      setLoading(false)
      return
    }

    if (settings.is_closed) {
      setError('Feedback collection has been closed for this event')
      setLoading(false)
      return
    }

    setEventSettings(settings)

    const { data: presenterData } = await feedbackUtils.getEventPresentersForFeedback(settings.event.id)

    if (presenterData) {
      setPresenters(presenterData.filter(p => p.timer))
    }

    setLoading(false)
  }

  const handleRatingChange = (presenterId, rating) => {
    setFeedbackData(prev => ({
      ...prev,
      [presenterId]: {
        ...prev[presenterId],
        rating
      }
    }))
  }

  const handleCommentChange = (presenterId, comment) => {
    setFeedbackData(prev => ({
      ...prev,
      [presenterId]: {
        ...prev[presenterId],
        comment
      }
    }))
  }

  const validateForm = () => {
    if (!eventSettings.allow_anonymous && !isAnonymous) {
      if (eventSettings.require_name && !attendeeName.trim()) {
        alert('Please enter your name')
        return false
      }
      if (eventSettings.require_email && !attendeeEmail.trim()) {
        alert('Please enter your email')
        return false
      }
      if (eventSettings.require_email && !attendeeEmail.includes('@')) {
        alert('Please enter a valid email address')
        return false
      }
    }

    const hasAnyRating = Object.values(feedbackData).some(data => data?.rating > 0)
    if (!hasAnyRating) {
      alert('Please rate at least one presenter')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    const feedbackPromises = []

    Object.entries(feedbackData).forEach(([presenterId, data]) => {
      if (data?.rating) {
        const presenter = presenters.find(p => p.presenter_id === presenterId)

        feedbackPromises.push(
          feedbackUtils.submitAttendeeFeedback({
            event_id: eventSettings.event.id,
            timer_id: presenter?.timer_id,
            organization_id: eventSettings.organization_id,
            presenter_id: presenterId,
            is_anonymous: isAnonymous,
            attendee_name: isAnonymous ? null : attendeeName.trim() || null,
            attendee_email: isAnonymous ? null : attendeeEmail.trim() || null,
            overall_rating: data.rating,
            comment: data.comment?.trim() || null,
            is_event_level: false
          })
        )
      }
    })

    if (eventComment.trim()) {
      feedbackPromises.push(
        feedbackUtils.submitAttendeeFeedback({
          event_id: eventSettings.event.id,
          timer_id: null,
          organization_id: eventSettings.organization_id,
          presenter_id: null,
          is_anonymous: isAnonymous,
          attendee_name: isAnonymous ? null : attendeeName.trim() || null,
          attendee_email: isAnonymous ? null : attendeeEmail.trim() || null,
          overall_rating: 5,
          comment: eventComment.trim(),
          is_event_level: true
        })
      )
    }

    try {
      await Promise.all(feedbackPromises)
      setSubmitSuccess(true)
    } catch (error) {
      alert('Error submitting feedback. Please try again.')
      console.error('Error submitting feedback:', error)
    }

    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Feedback</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">
            Your feedback has been submitted successfully. Your input helps presenters improve and grow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">{eventSettings.event.name}</h1>
            <p className="text-blue-100">Share your feedback to help our presenters improve</p>
            {eventSettings.custom_intro_message && (
              <p className="mt-4 text-sm bg-blue-700 bg-opacity-50 rounded p-3">
                {eventSettings.custom_intro_message}
              </p>
            )}
          </div>

          <div className="p-6 space-y-6">
            {eventSettings.allow_anonymous && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Submit feedback anonymously
                  </span>
                </label>
              </div>
            )}

            {!isAnonymous && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Your Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name {eventSettings.require_name && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email {eventSettings.require_email && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rate Each Presenter</h3>
              <div className="space-y-6">
                {presenters.map(presenter => (
                  <div key={presenter.presenter_id} className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900">{presenter.timer.presenter_name}</h4>
                      <p className="text-sm text-gray-600">{presenter.timer.name}</p>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(presenter.presenter_id, star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= (feedbackData[presenter.presenter_id]?.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={feedbackData[presenter.presenter_id]?.comment || ''}
                      onChange={(e) => handleCommentChange(presenter.presenter_id, e.target.value)}
                      placeholder="Share your thoughts (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span>Overall Event Feedback (Optional)</span>
              </label>
              <textarea
                value={eventComment}
                onChange={(e) => setEventComment(e.target.value)}
                placeholder="Share your thoughts about the event as a whole..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
