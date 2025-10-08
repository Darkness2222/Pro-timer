import React, { useState, useEffect } from 'react'
import { X, Star, ThumbsUp, AlertTriangle, Lock, Unlock, Check, SkipForward } from 'lucide-react'
import { feedbackUtils } from '../lib/feedbackUtils'

export default function AdminFeedbackModal({
  isOpen,
  onClose,
  timer,
  event,
  presenterId,
  organizationId,
  onSubmitSuccess,
  onSkip
}) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selectedStrengthTags, setSelectedStrengthTags] = useState([])
  const [selectedImprovementTags, setSelectedImprovementTags] = useState([])
  const [comment, setComment] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [showPrivateNotes, setShowPrivateNotes] = useState(false)
  const [strengthTags, setStrengthTags] = useState([])
  const [improvementTags, setImprovementTags] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const maxCommentLength = 1000
  const maxPrivateNotesLength = 1000

  useEffect(() => {
    if (isOpen && organizationId) {
      loadTags()
    }
  }, [isOpen, organizationId])

  const loadTags = async () => {
    const { data } = await feedbackUtils.getFeedbackTags(organizationId)
    if (data) {
      setStrengthTags(data.filter(tag => tag.tag_type === 'strength'))
      setImprovementTags(data.filter(tag => tag.tag_type === 'improvement'))
    }
  }

  const calculateTimeVariance = () => {
    if (!timer) return null
    const allocatedSeconds = timer.duration
    const actualSeconds = timer.actual_duration || 0
    return actualSeconds - allocatedSeconds
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60)
    const secs = Math.abs(seconds) % 60
    const sign = seconds < 0 ? '-' : '+'
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating before submitting')
      return
    }

    setIsSubmitting(true)

    const allSelectedTags = [...selectedStrengthTags, ...selectedImprovementTags]
    const timeVariance = calculateTimeVariance()

    const feedbackData = {
      timer_id: timer.id,
      event_id: event?.id || null,
      organization_id: organizationId,
      presenter_id: presenterId,
      overall_rating: rating,
      selected_tags: allSelectedTags,
      comment: comment.trim() || null,
      private_notes: privateNotes.trim() || null,
      allocated_time_seconds: timer.duration,
      actual_time_seconds: timer.actual_duration || 0,
      time_variance_seconds: timeVariance
    }

    const { data, error } = await feedbackUtils.submitAdminFeedback(feedbackData)

    setIsSubmitting(false)

    if (error) {
      alert('Error submitting feedback: ' + error.message)
      return
    }

    setSubmitSuccess(true)
    setTimeout(() => {
      onSubmitSuccess && onSubmitSuccess(data)
      resetForm()
      onClose()
    }, 1500)
  }

  const handleSkip = () => {
    onSkip && onSkip()
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setRating(0)
    setHoveredRating(0)
    setSelectedStrengthTags([])
    setSelectedImprovementTags([])
    setComment('')
    setPrivateNotes('')
    setShowPrivateNotes(false)
    setSubmitSuccess(false)
  }

  const toggleStrengthTag = (tagId) => {
    setSelectedStrengthTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const toggleImprovementTag = (tagId) => {
    setSelectedImprovementTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  if (!isOpen) return null

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h3>
          <p className="text-gray-600">Thank you for providing feedback to help improve presentations.</p>
        </div>
      </div>
    )
  }

  const timeVariance = calculateTimeVariance()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Provide Feedback</h2>
            <p className="text-sm text-gray-600 mt-1">
              {timer?.presenter_name} - {timer?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {timeVariance !== null && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Time Performance</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600">Allocated</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.floor(timer.duration / 60)}:{(timer.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Actual</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.floor((timer.actual_duration || 0) / 60)}:{((timer.actual_duration || 0) % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Variance</p>
                  <p className={`text-lg font-bold ${timeVariance > 0 ? 'text-red-600' : timeVariance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {formatTime(timeVariance)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-4 text-sm text-gray-600">
                  {rating === 5 && 'Outstanding'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Needs Improvement'}
                  {rating === 1 && 'Poor'}
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <label className="text-sm font-semibold text-gray-700">Strengths</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengthTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleStrengthTag(tag.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedStrengthTags.includes(tag.id)
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {tag.tag_name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <label className="text-sm font-semibold text-gray-700">Areas for Improvement</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {improvementTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleImprovementTag(tag.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedImprovementTags.includes(tag.id)
                      ? 'bg-orange-100 text-orange-800 border-2 border-orange-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {tag.tag_name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, maxCommentLength))}
              placeholder="Share specific feedback, suggestions, or observations..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="4"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/{maxCommentLength}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowPrivateNotes(!showPrivateNotes)}
              className="flex items-center space-x-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2"
            >
              {showPrivateNotes ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Private Notes (Admin Only)</span>
            </button>
            {showPrivateNotes && (
              <>
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value.slice(0, maxPrivateNotesLength))}
                  placeholder="Add private notes visible only to admins..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-yellow-50"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {privateNotes.length}/{maxPrivateNotesLength}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip for Now</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
