import React, { useEffect } from 'react'
import { Users, ArrowRight } from 'lucide-react'

export default function PresentersPage({ onNavigate }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onNavigate) {
        onNavigate('settings')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [onNavigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <Users className="w-24 h-24 text-blue-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Presenter Management Has Moved!
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            All team members including presenters and admins are now managed in one place through Team Management.
          </p>
          <p className="text-gray-400 mb-8">
            You'll be automatically redirected in a few seconds, or click the button below to go there now.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('settings')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-medium transition-colors inline-flex items-center gap-2 text-lg"
          >
            Go to Team Management
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">What's New:</h3>
            <ul className="text-sm text-gray-300 space-y-2 text-left max-w-md mx-auto">
              <li>• Unified user management for both admins and presenters</li>
              <li>• Easy role switching between Admin and Presenter</li>
              <li>• Owner role that doesn't count toward subscription limits</li>
              <li>• Better visibility of your team structure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
