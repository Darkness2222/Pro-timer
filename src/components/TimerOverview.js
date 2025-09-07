import React from 'react'
import { Clock, Users, Timer as TimerIcon } from 'lucide-react'

export default function TimerOverview({ timers, onSelectTimer, selectedTimer }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Timer Overview</h2>
        <p className="text-gray-400">Manage and monitor your presentation timers</p>
      </div>

      {timers.length === 0 ? (
        <div className="text-center py-12">
          <TimerIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No timers yet</h3>
          <p className="text-gray-500">Create your first timer to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {timers.map((timer) => (
            <div
              key={timer.id}
              className={`bg-gray-800 rounded-lg p-4 border cursor-pointer transition-colors ${
                selectedTimer?.id === timer.id
                  ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onSelectTimer?.(timer)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-white font-medium">{timer.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{timer.presenter_name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono">
                    {Math.floor(timer.duration / 60)}:{(timer.duration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500">Duration</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}