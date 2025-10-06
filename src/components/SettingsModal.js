import React, { useState } from 'react'
import { X, Settings, Volume2, Vibrate, Clock, Monitor, RotateCcw, Crown, LogOut } from 'lucide-react'

export default function SettingsModal({ isOpen, onClose, onShowSubscriptionModal, onSignOut }) {
  // Settings state
  const [settings, setSettings] = useState({
    // Timer Preferences
    soundNotifications: true,
    vibrationFeedback: false,
    autoStartNext: false,
    
    // Display Preferences
    showSeconds: true,
    use24HourFormat: false,
    fullscreenOnStart: false,
    
    // Notification Preferences
    overtimeWarning: true,
    halfwayNotification: true,
    finalMinuteAlert: true
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = () => {
    // TODO: Implement settings persistence (localStorage or database)
    console.log('Saving settings:', settings)
    
    // For now, just close the modal
    onClose()
    
    // You could add a toast notification here
    // showToast('Settings saved successfully!')
  }

  const handleResetToDefaults = () => {
    setSettings({
      soundNotifications: true,
      vibrationFeedback: false,
      autoStartNext: false,
      showSeconds: true,
      use24HourFormat: false,
      fullscreenOnStart: false,
      overtimeWarning: true,
      halfwayNotification: true,
      finalMinuteAlert: true
    })
  }

  const handleModalClick = (e) => {
    // Prevent event bubbling that might cause page refresh
    e.stopPropagation()
  }

  const handleContentClick = (e) => {
    // Prevent any form submission or navigation
    e.preventDefault()
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6" onClick={handleContentClick}>
          {/* Timer Preferences Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Timer Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Sound Notifications</label>
                  <p className="text-gray-400 text-sm">Play sound when timer starts, pauses, or finishes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.soundNotifications}
                    onChange={(e) => handleSettingChange('soundNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-purple-400" />
                  <label className="text-white font-medium">Vibration Feedback</label>
                  </div>
                  <p className="text-gray-400 text-sm">Vibrate device on timer events (mobile only)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.vibrationFeedback}
                    onChange={(e) => handleSettingChange('vibrationFeedback', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Auto-start Next Timer</label>
                  <p className="text-gray-400 text-sm">Automatically start the next timer in sequence</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.autoStartNext}
                    onChange={(e) => handleSettingChange('autoStartNext', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Display Preferences Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-green-400" />
              Display Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Show Seconds</label>
                  <p className="text-gray-400 text-sm">Display seconds in timer countdown</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.showSeconds}
                    onChange={(e) => handleSettingChange('showSeconds', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">24-Hour Format</label>
                  <p className="text-gray-400 text-sm">Use 24-hour time format for timestamps</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.use24HourFormat}
                    onChange={(e) => handleSettingChange('use24HourFormat', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Fullscreen on Start</label>
                  <p className="text-gray-400 text-sm">Automatically enter fullscreen when timer starts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.fullscreenOnStart}
                    onChange={(e) => handleSettingChange('fullscreenOnStart', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Preferences Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-yellow-400" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Overtime Warning</label>
                  <p className="text-gray-400 text-sm">Show warning when timer goes into overtime</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.overtimeWarning}
                    onChange={(e) => handleSettingChange('overtimeWarning', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Halfway Notification</label>
                  <p className="text-gray-400 text-sm">Alert when timer reaches 50% completion</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.halfwayNotification}
                    onChange={(e) => handleSettingChange('halfwayNotification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Final Minute Alert</label>
                  <p className="text-gray-400 text-sm">Special alert when 1 minute remains</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={settings.finalMinuteAlert}
                    onChange={(e) => handleSettingChange('finalMinuteAlert', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Account & Subscription Section */}
        <div className="p-6 mb-8" onClick={handleContentClick}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Account & Subscription
          </h3>
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">SyncCue Pro</h4>
                  <p className="text-gray-400 text-sm">Unlock advanced features for professional presentations</p>
                </div>
                <button
                  onClick={() => {
                    onShowSubscriptionModal()
                    onClose()
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                • Remote presenter/admin sync • Custom stage cues • Indepth Reporting
              </div>
            </div>

            {/* Sign Out Section */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Account</h4>
                  <p className="text-gray-400 text-sm">Sign out of your account</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to sign out?')) {
                      onSignOut()
                      onClose()
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-900" onClick={handleContentClick}>
          <div className="flex justify-between items-center">
            <button
              onClick={handleResetToDefaults}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}