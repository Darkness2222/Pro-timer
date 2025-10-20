import React, { useRef } from 'react'
import { X, Download, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { copyToClipboard } from '../lib/inviteUtils'

export default function InviteQRCodeModal({ isOpen, onClose, inviteUrl, organizationName, role }) {
  const [copied, setCopied] = React.useState(false)
  const qrRef = useRef(null)

  if (!isOpen) return null

  const handleCopyLink = async () => {
    const success = await copyToClipboard(inviteUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    canvas.width = 1000
    canvas.height = 1000

    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `invite-qr-${organizationName.replace(/\s+/g, '-').toLowerCase()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      })
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Invitation QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6 flex justify-center" ref={qrRef}>
          <QRCodeSVG
            value={inviteUrl}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="mb-6">
          <div className="text-center text-gray-300 mb-2">
            <p className="font-semibold text-white">{organizationName}</p>
            <p className="text-sm">Role: <span className="capitalize">{role}</span></p>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-400 mb-2">Invitation Link:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownloadQR}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>Share this QR code to invite team members.</p>
          <p>They can scan it with their phone camera.</p>
        </div>
      </div>
    </div>
  )
}
