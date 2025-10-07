import React, { useState, useEffect } from 'react'
import { X, Monitor, Clock, Maximize, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function DisplayPreferencesModal({ isOpen, onClose, session, onSettingsChange }) {
  const [settings, setSettings] = useState({
    showSeconds: true,
    use24HourFormat: false,
    fullscreenOnStart: false
  })
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (isOpen && session?.user) {
      loadSettings()
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
          showSeconds: data.show_seconds,
          use24HourFormat: data.use_24_hour_format,
          fullscreenOnStart: data.fullscreen_on_start
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      setSaveMessage('')

      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const settingsData = {
        user_id: session.user.id,
        sound_notifications: currentSettings?.sound_notifications ?? true,
        vibration_feedback: currentSettings?.vibration_feedback ?? false,
        auto_start_next: currentSettings?.auto_start_next ?? false,
        show_seconds: settings.showSeconds,
        use_24_hour_format: settings.use24HourFormat,
        fullscreen_on_start: settings.fullscreenOnStart,
        overtime_warning: currentSettings?.overtime_warning ?? true,
        halfway_notification: currentSettings?.halfway_notification ?? true,
        final_minute_alert: currentSettings?.final_minute_alert ?? true
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData, { onConflict: 'user_id' })

      if (error) {
        console.error('Error saving settings:', error)
        setSaveMessage('Error saving settings. Please try again.')
        return
      }

      setSaveMessage('Settings saved successfully!')

      if (onSettingsChange) {
        onSettingsChange(settings)
      }

      setTimeout(() => {
        onClose()
        setSaveMessage('')
      }, 1500)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage('Error saving settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetToDefaults = () => {
    setSettings({
      showSeconds: true,
      use24HourFormat: false,
      fullscreenOnStart: false
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Monitor className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-white">Display Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <label className="text-white font-medium">Show Seconds</label>
                </div>
                <p className="text-gray-400 text-sm">Display seconds in timer countdown</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showSeconds}
                  onChange={(e) => handleSettingChange('showSeconds', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <label className="text-white font-medium">24-Hour Format</label>
                </div>
                <p className="text-gray-400 text-sm">Use 24-hour time format for timestamps</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.use24HourFormat}
                  onChange={(e) => handleSettingChange('use24HourFormat', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-green-400" />
                  <label className="text-white font-medium">Fullscreen on Start</label>
                </div>
                <p className="text-gray-400 text-sm">Automatically enter fullscreen when timer starts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fullscreenOnStart}
                  onChange={(e) => handleSettingChange('fullscreenOnStart', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-900">
          {saveMessage && (
            <div className={`mb-4 p-3 rounded-lg text-center font-medium ${
              saveMessage.includes('Error')
                ? 'bg-red-600/20 text-red-400 border border-red-600'
                : 'bg-green-600/20 text-green-400 border border-green-600'
            }`}>
              {saveMessage}
            </div>
          )}
          <div className="flex justify-between items-center">
            <button
              onClick={handleResetToDefaults}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
