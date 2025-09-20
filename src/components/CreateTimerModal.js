import React, { useState } from 'react'
import { X, Plus, Clock, Users, Timer as TimerIcon } from 'lucide-react'

export default function CreateTimerModal({ isOpen, onClose, onCreate }) {
  const [timerType, setTimerType] = useState('single')
  const [newTimerName, setNewTimerName] = useState('')
  const [newTimerPresenter, setNewTimerPresenter] = useState('')
  const [newTimerDuration, setNewTimerDuration] = useState('')
  const [eventName, setEventName] = useState('')
  const [presenters, setPresenters] = useState([
    { id: 1, name: '', minutes: 15, seconds: 0 }
  ])
  const [bufferMinutes, setBufferMinutes] = useState(2)
  const [bufferSeconds, setBufferSeconds] = useState(0)

  const resetForm = () => {
    setTimerType('single')
    setNewTimerName('')
    setNewTimerPresenter('')
    setNewTimerDuration('')
    setEventName('')
    setPresenters([{ id: 1, name: '', minutes: 15, seconds: 0 }])
    setBufferMinutes(2)
    setBufferSeconds(0)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleCreate = () => {
    const formData = {
      timerType,
      newTimerName,
      newTimerPresenter,
      newTimerDuration,
      eventName,
      presenters,
      bufferMinutes,
      bufferSeconds
    }
    
    try {
      onCreate(formData)
      resetForm()
    } catch (error) {
      console.error('Error creating timer:', error)
      // Don't reset form on error so user doesn't lose data
    }
  }

  const addPresenter = () => {
    if (presenters.length < 8) {
      setPresenters(prev => [...prev, {
        id: Date.now(),
        name: '',
        minutes: 10,
        seconds: 0
      }])
    }
  }

  const removePresenter = (id) => {
    if (presenters.length > 1) {
      setPresenters(prev => prev.filter(p => p.id !== id))
    }
  }

  const updatePresenter = (id, field, value) => {
    setPresenters(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const calculateEventTotalTime = () => {
    const presenterTime = presenters.reduce((total, presenter) => 
      total + (presenter.minutes * 60) + presenter.seconds, 0
    )
    const bufferTime = (presenters.length - 1) * ((bufferMinutes * 60) + bufferSeconds)
    return Math.ceil((presenterTime + bufferTime) / 60) // Return in minutes
  }

  const isFormValid = () => {
    if (timerType === 'single') {
      return newTimerName.trim() && newTimerPresenter.trim() && newTimerDuration
    } else {
      return eventName.trim() && presenters.every(p => p.name.trim())
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Create New Timer</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Timer Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Timer Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTimerType('single')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  timerType === 'single'
                    ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <TimerIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h4 className="text-white font-medium mb-1">Single Timer</h4>
                  <p className="text-gray-400 text-sm">One presenter, one timer</p>
                </div>
              </button>
              
              <button
                onClick={() => setTimerType('event')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  timerType === 'event'
                    ? 'border-purple-500 bg-purple-500 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h4 className="text-white font-medium mb-1">Event Timer</h4>
                  <p className="text-gray-400 text-sm">Multiple presenters, sequential</p>
                </div>
              </button>
            </div>
          </div>

          {/* Single Timer Form */}
          {timerType === 'single' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Timer Name</label>
                <input
                  type="text"
                  value={newTimerName}
                  onChange={(e) => setNewTimerName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="e.g., Opening Keynote"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Presenter Name</label>
                <input
                  type="text"
                  value={newTimerPresenter}
                  onChange={(e) => setNewTimerPresenter(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="e.g., John Smith"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={newTimerDuration}
                  onChange={(e) => setNewTimerDuration(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="15"
                  min="1"
                  max="180"
                />
              </div>
            </div>
          )}

          {/* Event Timer Form */}
          {timerType === 'event' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="e.g., Tech Conference 2025"
                />
              </div>

              {/* Presenters */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-medium">Presenters</h4>
                  <button
                    onClick={addPresenter}
                    disabled={presenters.length >= 8}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Presenter
                  </button>
                </div>
                
                <div className="space-y-3">
                  {presenters.map((presenter, index) => (
                    <div key={presenter.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-white font-medium">Presenter {index + 1}</h5>
                        {presenters.length > 1 && (
                          <button
                            onClick={() => removePresenter(presenter.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={presenter.name}
                          onChange={(e) => updatePresenter(presenter.id, 'name', e.target.value)}
                          className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                          placeholder="Presenter name"
                        />
                        
                        <div className="flex items-center gap-2">
                          <label className="text-gray-300 text-sm">Duration:</label>
                          <input
                            type="number"
                            value={presenter.minutes}
                            onChange={(e) => updatePresenter(presenter.id, 'minutes', parseInt(e.target.value) || 0)}
                            className="p-2 bg-gray-600 border border-gray-500 rounded text-white w-16"
                            min="0"
                            max="180"
                          />
                          <span className="text-gray-300 text-sm">min</span>
                          <input
                            type="number"
                            value={presenter.seconds}
                            onChange={(e) => updatePresenter(presenter.id, 'seconds', parseInt(e.target.value) || 0)}
                            className="p-2 bg-gray-600 border border-gray-500 rounded text-white w-16"
                            min="0"
                            max="59"
                          />
                          <span className="text-gray-300 text-sm">sec</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buffer Time */}
              <div>
                <h4 className="text-white font-medium mb-3">Buffer Time Between Presentations</h4>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-sm">Buffer duration:</label>
                    <input
                      type="number"
                      value={bufferMinutes}
                      onChange={(e) => setBufferMinutes(parseInt(e.target.value) || 0)}
                      className="p-2 bg-gray-600 border border-gray-500 rounded text-white w-16"
                      min="0"
                      max="10"
                    />
                    <span className="text-gray-300 text-sm">min</span>
                    <input
                      type="number"
                      value={bufferSeconds}
                      onChange={(e) => setBufferSeconds(parseInt(e.target.value) || 0)}
                      className="p-2 bg-gray-600 border border-gray-500 rounded text-white w-16"
                      min="0"
                      max="59"
                    />
                    <span className="text-gray-300 text-sm">sec</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Time between each presentation for setup and transitions
                  </p>
                </div>
              </div>

              {/* Event Summary */}
              <div className="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Event Summary
                </h4>
                <div className="text-sm text-blue-200">
                  <p>Total Presentations: {presenters.length}</p>
                  <p>Estimated Total Time: ~{calculateEventTotalTime()} minutes</p>
                  <p>Includes buffer time between presentations</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-900">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!isFormValid()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Create Timer{timerType === 'event' ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}