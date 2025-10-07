import React, { useState, useEffect } from 'react'
import { X, Settings, Volume2, Clock, Monitor, Crown, LogOut, Users, Sparkles, Shield, Mic2, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FeaturesModal from './FeaturesModal'
import TimerPreferencesModal from './TimerPreferencesModal'
import DisplayPreferencesModal from './DisplayPreferencesModal'
import NotificationPreferencesModal from './NotificationPreferencesModal'
import { ROLES, isOwner, isOwnerOrAdmin, getRoleDisplayName } from '../lib/roleUtils'

export default function SettingsModal({ isOpen, onClose, onShowSubscriptionModal, onSignOut, onShowTeamManagement, session, onSettingsChange }) {
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
  const [loading, setLoading] = useState(false)
  const [showFeaturesModal, setShowFeaturesModal] = useState(false)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [showDisplayModal, setShowDisplayModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    if (isOpen && session?.user) {
      loadSettings()
      loadUserRole()
    }
  }, [isOpen, session?.user])

  const loadSettings = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error)
        return
      }

      if (data) {
        setSettings({
          soundNotifications: data.sound_notifications,
          vibrationFeedback: data.vibration_feedback,
          autoStartNext: data.auto_start_next,
          showSeconds: data.show_seconds,
          use24HourFormat: data.use_24_hour_format,
          fullscreenOnStart: data.fullscreen_on_start,
          overtimeWarning: data.overtime_warning,
          halfwayNotification: data.halfway_notification,
          finalMinuteAlert: data.final_minute_alert
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserRole = async () => {
    if (!session?.user) return

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('role, is_owner, counted_in_limit')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading user role:', error)
        return
      }

      setUserRole(data)
    } catch (error) {
      console.error('Error loading user role:', error)
    }
  }

  const handleSettingsUpdate = (updatedSettings) => {
    setSettings(prev => ({
      ...prev,
      ...updatedSettings
    }))
    if (onSettingsChange) {
      onSettingsChange(updatedSettings)
    }
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
          {/* Preferences Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Preferences
            </h3>
            <div className="space-y-4">
              {/* Timer Preferences Button */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-white font-medium">Timer Preferences</h4>
                      <p className="text-gray-400 text-sm">Sound, vibration, and auto-start settings</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTimerModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    Configure
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Display Preferences Button */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-green-400" />
                    <div>
                      <h4 className="text-white font-medium">Display Preferences</h4>
                      <p className="text-gray-400 text-sm">Time format and fullscreen options</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDisplayModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    Configure
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification Preferences Button */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-yellow-400" />
                    <div>
                      <h4 className="text-white font-medium">Notification Preferences</h4>
                      <p className="text-gray-400 text-sm">Alerts and notification timing</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    Configure
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
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
            {/* User Role Section */}
            {userRole && (
              <div className={`rounded-lg p-4 border ${
                userRole.is_owner
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : userRole.role === ROLES.ADMIN
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {userRole.is_owner ? (
                    <Crown className="w-6 h-6 text-yellow-500" />
                  ) : userRole.role === ROLES.ADMIN ? (
                    <Shield className="w-6 h-6 text-blue-500" />
                  ) : (
                    <Mic2 className="w-6 h-6 text-green-500" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      Your Role: {getRoleDisplayName(userRole.role)}
                      {userRole.is_owner && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                          Owner
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {userRole.is_owner
                        ? 'You own this organization and have full control. Your account does not count toward the user limit.'
                        : userRole.role === ROLES.ADMIN
                        ? 'You can manage events, team members, and organization settings but cannot present in events.'
                        : 'You can present in events but cannot access administrative features.'}
                    </p>
                    {!userRole.counted_in_limit && (
                      <p className="text-xs text-gray-500 mt-1">
                        Not counted toward subscription limit
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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

            {/* Features Section */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    All Features
                  </h4>
                  <p className="text-gray-400 text-sm">Discover everything SyncCue can do</p>
                </div>
                <button
                  onClick={() => {
                    setShowFeaturesModal(true)
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View Features
                </button>
              </div>
            </div>

            {/* Team Management Section */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Team Management</h4>
                  <p className="text-gray-400 text-sm">Invite team members and manage access</p>
                </div>
                <button
                  onClick={() => {
                    if (onShowTeamManagement) {
                      onShowTeamManagement()
                      onClose()
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Manage Team
                </button>
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
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Features Modal */}
      <FeaturesModal
        isOpen={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
      />

      {/* Timer Preferences Modal */}
      <TimerPreferencesModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        session={session}
        onSettingsChange={handleSettingsUpdate}
      />

      {/* Display Preferences Modal */}
      <DisplayPreferencesModal
        isOpen={showDisplayModal}
        onClose={() => setShowDisplayModal(false)}
        session={session}
        onSettingsChange={handleSettingsUpdate}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        session={session}
        onSettingsChange={handleSettingsUpdate}
      />
    </div>
  )
}