import React, { useState, useEffect } from 'react'
import { X, Copy, Download, ExternalLink, Check, RefreshCw } from 'lucide-react'
import QRCode from 'qrcode.react'
import { feedbackUtils } from '../lib/feedbackUtils'

export default function ShareAttendeeFeedbackModal({ isOpen, onClose, event, organizationId }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [feedbackUrl, setFeedbackUrl] = useState('')

  useEffect(() => {
    if (isOpen && event) {
      loadSettings()
    }
  }, [isOpen, event])

  const loadSettings = async () => {
    setLoading(true)
    const { data } = await feedbackUtils.getEventFeedbackSettings(event.id)

    if (data) {
      setSettings(data)
      const url = `${window.location.origin}/attendee-feedback?token=${data.feedback_link_token}`
      setFeedbackUrl(url)
    } else {
      const newSettings = {
        event_id: event.id,
        organization_id: organizationId,
        is_enabled: true,
        allow_anonymous: true,
        require_name: false,
        require_email: false
      }

      const { data: created } = await feedbackUtils.createOrUpdateEventFeedbackSettings(newSettings)
      if (created) {
        setSettings(created)
        const url = `${window.location.origin}/attendee-feedback?token=${created.feedback_link_token}`
        setFeedbackUrl(url)
      }
    }
    setLoading(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(feedbackUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    const canvas = document.getElementById('feedback-qr-code')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${event.name}-feedback-qr.png`
      link.href = url
      link.click()
    }
  }

  const handleRegenerateLink = async () => {
    if (!window.confirm('Regenerating will invalidate the current link. Continue?')) {
      return
    }

    setLoading(true)

    const newSettings = {
      ...settings,
      feedback_link_token: Math.random().toString(36).substring(2) + Date.now().toString(36)
    }

    const { data } = await feedbackUtils.createOrUpdateEventFeedbackSettings(newSettings)
    if (data) {
      setSettings(data)
      const url = `${window.location.origin}/attendee-feedback?token=${data.feedback_link_token}`
      setFeedbackUrl(url)
    }

    setLoading(false)
  }

  const handleCloseCollection = async () => {
    if (!window.confirm('This will stop accepting new feedback. Continue?')) {
      return
    }

    const updated = { ...settings, is_closed: true }
    const { data } = await feedbackUtils.createOrUpdateEventFeedbackSettings(updated)
    if (data) {
      setSettings(data)
      alert('Feedback collection closed')
      onClose()
    }
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Share Attendee Feedback</h2>
            <p className="text-sm text-gray-600 mt-1">{event.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {settings?.is_closed && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">
                Feedback collection is closed for this event
              </p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How It Works</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Share the QR code or link with event attendees</li>
              <li>Attendees scan the QR code or click the link</li>
              <li>They fill out a simple feedback form at the end of the event</li>
              <li>Feedback appears in your reports and presenter views</li>
            </ol>
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-4">Scan to Give Feedback</h3>
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCode
                id="feedback-qr-code"
                value={feedbackUrl}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
            <button
              onClick={handleDownloadQR}
              className="mt-4 flex items-center space-x-2 mx-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download QR Code</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shareable Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={feedbackUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Anonymous allowed:</span>
                <span className="font-medium">{settings?.allow_anonymous ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Name required:</span>
                <span className="font-medium">{settings?.require_name ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email required:</span>
                <span className="font-medium">{settings?.require_email ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Edit these settings when creating or editing the event
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleRegenerateLink}
              disabled={settings?.is_closed}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Regenerate Link</span>
            </button>
            <button
              onClick={handleCloseCollection}
              disabled={settings?.is_closed}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Close Feedback
            </button>
          </div>

          <a
            href={feedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Preview Feedback Form</span>
          </a>
        </div>
      </div>
    </div>
  )
}
