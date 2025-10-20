import React, { useState, useEffect } from 'react'
import { X, Settings, Volume2, Clock, Monitor, Crown, LogOut, Users, Sparkles, Shield, Mic2, ChevronRight, BookOpen, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FeaturesModal from './FeaturesModal'
import TimerPreferencesModal from './TimerPreferencesModal'
import DisplayPreferencesModal from './DisplayPreferencesModal'
import NotificationPreferencesModal from './NotificationPreferencesModal'
import HowToGuidesModal from './HowToGuidesModal'
import PrivacyPolicy from './PrivacyPolicy'
import { ROLES, getRoleDisplayName } from '../lib/roleUtils'

export default function SettingsModal({ isOpen, onClose, onShowSubscriptionModal, onSignOut, onShowTeamManagement, session, onSettingsChange }) {
  const [showFeaturesModal, setShowFeaturesModal] = useState(false)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [showDisplayModal, setShowDisplayModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showHowToGuidesModal, setShowHowToGuidesModal] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    if (isOpen && session?.user) {
      loadUserRole()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session?.user])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      // Prevent Enter key from triggering default actions
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

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


  const handleModalClick = (e) => {
    // Prevent event bubbling that might cause page refresh
    e.stopPropagation()
  }

  const handleContentClick = (e) => {
    // Only prevent default for non-button elements to avoid interfering with button clicks
    if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
      e.preventDefault()
    }
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
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6" onClick={handleContentClick}>
          {/* Preferences Section */}
          <div className="mb-10">
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
                    type="button"
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
                    type="button"
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
                    type="button"
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

          {/* Divider */}
          <div className="border-t border-gray-700 mb-10"></div>

          {/* Help & Resources Section */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              Help & Resources
            </h3>
            <div className="space-y-4">
              {/* How to Guides Section */}
              <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-400" />
                      How to Guides
                    </h4>
                    <p className="text-gray-400 text-sm">Step-by-step instructions for all features</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHowToGuidesModal(true)
                    }}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Guides
                  </button>
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
                    type="button"
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

              {/* Privacy Policy Section */}
              <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 rounded-lg p-4 border border-gray-600/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      Privacy Policy
                    </h4>
                    <p className="text-gray-400 text-sm">Learn how we protect your data</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrivacyPolicy(true)
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Policy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 mb-10"></div>

          {/* Account & Organization Section */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Account & Organization
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

              {/* Team Management Section - Prominent for Owner/Admin */}
              {userRole && (userRole.is_owner || userRole.role === ROLES.ADMIN) && (
                <div className="bg-gradient-to-r from-blue-800/40 to-blue-900/40 rounded-lg p-4 border border-blue-500/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="text-white font-medium flex items-center gap-2">
                          Team Management
                          {userRole.is_owner && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              Full Access
                            </span>
                          )}
                        </h4>
                        <p className="text-gray-400 text-sm">Invite team members and manage access</p>
                      </div>
                    </div>
                    <button
                      type="button"
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
              )}

              {/* SyncCue Pro */}
              <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      SyncCue Pro
                    </h4>
                    <p className="text-gray-400 text-sm">Unlock advanced features for professional presentations</p>
                  </div>
                  <button
                    type="button"
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
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 mb-10"></div>

          {/* Account Actions Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-gray-400" />
              Account Actions
            </h3>
            <div className="space-y-4">
              {/* Sign Out Section */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-red-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Sign Out</h4>
                    <p className="text-gray-400 text-sm">Sign out of your account</p>
                  </div>
                  <button
                    type="button"
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-900" onClick={handleContentClick}>
          <div className="flex justify-end">
            <button
              type="button"
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
        onSettingsChange={onSettingsChange}
      />

      {/* Display Preferences Modal */}
      <DisplayPreferencesModal
        isOpen={showDisplayModal}
        onClose={() => setShowDisplayModal(false)}
        session={session}
        onSettingsChange={onSettingsChange}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        session={session}
        onSettingsChange={onSettingsChange}
      />

      {/* How to Guides Modal */}
      <HowToGuidesModal
        isOpen={showHowToGuidesModal}
        onClose={() => setShowHowToGuidesModal(false)}
      />

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-[60]">
          <PrivacyPolicy />
          <button
            onClick={() => setShowPrivacyPolicy(false)}
            className="fixed top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg shadow-lg transition-colors z-[70] flex items-center gap-2 border border-gray-600"
          >
            <X className="w-5 h-5" />
            Close
          </button>
        </div>
      )}
    </div>
  )
}