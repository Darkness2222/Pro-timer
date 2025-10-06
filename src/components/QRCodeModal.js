import React, { useState, useEffect } from 'react'
import { X, QrCode, Download, Copy, Check, Loader as Loader2, RefreshCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'

export default function QRCodeModal({ eventId, organizationId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [token, setToken] = useState(null)
  const [copied, setCopied] = useState(false)
  const [expiresIn, setExpiresIn] = useState(24)
  const [maxUses, setMaxUses] = useState(null)

  useEffect(() => {
    loadExistingToken()
  }, [eventId])

  const loadExistingToken = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('event_access_tokens')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setToken(data)
      }
    } catch (error) {
      console.error('Error loading token:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateToken = async () => {
    setGenerating(true)
    try {
      const randomToken = crypto.randomUUID() + '-' + Date.now().toString(36)

      const expiresAt = expiresIn > 0
        ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
        : null

      const { data, error } = await supabase
        .from('event_access_tokens')
        .insert({
          token: randomToken,
          event_id: eventId,
          organization_id: organizationId,
          created_by: (await supabase.auth.getUser()).data.user.id,
          max_uses: maxUses,
          expires_at: expiresAt,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setToken(data)
    } catch (error) {
      console.error('Error generating token:', error)
      alert('Failed to generate QR code')
    } finally {
      setGenerating(false)
    }
  }

  const regenerateToken = async () => {
    if (!window.confirm('This will invalidate the current QR code. Continue?')) {
      return
    }

    setGenerating(true)
    try {
      if (token) {
        await supabase
          .from('event_access_tokens')
          .update({ is_active: false })
          .eq('id', token.id)
      }

      await generateToken()
    } catch (error) {
      console.error('Error regenerating token:', error)
      alert('Failed to regenerate QR code')
    } finally {
      setGenerating(false)
    }
  }

  const getJoinUrl = () => {
    if (!token) return ''
    return `${window.location.origin}/event/join/${token.token}`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getJoinUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = 'event-qr-code.png'
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Presenter Access QR Code</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!token ? (
          <div className="space-y-4">
            <p className="text-gray-300">
              Generate a QR code that presenters can scan to select their name and access their timer view.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expires In (hours)
              </label>
              <input
                type="number"
                value={expiresIn}
                onChange={(e) => setExpiresIn(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="24"
              />
              <p className="text-xs text-gray-400 mt-1">Set to 0 for no expiration</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Uses (optional)
              </label>
              <input
                type="number"
                value={maxUses || ''}
                onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : null)}
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unlimited"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty for unlimited uses</p>
            </div>

            <button
              onClick={generateToken}
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              {generating ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg flex items-center justify-center">
              <QRCodeSVG
                id="qr-code-svg"
                value={getJoinUrl()}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getJoinUrl()}
                  readOnly
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-400">Uses</div>
                <div className="text-lg font-semibold text-white">
                  {token.current_uses} {token.max_uses ? `/ ${token.max_uses}` : ''}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-400">Expires</div>
                <div className="text-lg font-semibold text-white">
                  {token.expires_at
                    ? new Date(token.expires_at).toLocaleDateString()
                    : 'Never'}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadQRCode}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={regenerateToken}
                disabled={generating}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Share this QR code with presenters. They will select their name from a list after scanning.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
