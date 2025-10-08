import React from 'react'
import { X, Clock, Users, BarChart3, Bell, MessageSquare, Calendar, Zap, Shield, Globe, Timer, CheckCircle } from 'lucide-react'

export default function FeaturesModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Single & Event Timers',
      description: 'Create standalone single timers for quick presentations or multi-presenter events with automatic transitions. Flexible organization for any timing need.',
      color: 'blue'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Multi-Presenter Events',
      description: 'Organize events with multiple speakers. Each presenter gets their own timer with automatic transitions and buffer time management.',
      color: 'purple'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Real-Time Presenter Messaging',
      description: 'Send live messages to presenters during their presentation. Pre-configured quick messages and custom text support.',
      color: 'green'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Event Management',
      description: 'Create, organize, and track events. Assign multiple presenters, set durations, and manage everything from a single dashboard.',
      color: 'orange'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Advanced Analytics & Reports',
      description: 'Track presentation performance with detailed reports. Monitor overtime, timing accuracy, and export data to CSV for analysis.',
      color: 'cyan'
    },
    {
      icon: <Timer className="w-6 h-6" />,
      title: 'Buffer Time Management',
      description: 'Automatic transition buffers between presentations. Extend buffer time on-the-fly when needed.',
      color: 'yellow'
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Smart Notifications',
      description: 'Customizable alerts for halfway points, final minute warnings, and overtime. Sound and vibration feedback options.',
      color: 'red'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Presenter View',
      description: 'Dedicated fullscreen view for presenters. Large, clear timer display with progress indicators and message notifications.',
      color: 'indigo'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Quick Actions',
      description: 'Adjust time on-the-fly, override durations, finish presentations early, and control all timers from one interface.',
      color: 'pink'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Overtime Tracking',
      description: 'Automatic overtime detection and logging. Track exactly how long presenters go over their allocated time.',
      color: 'teal'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'PIN-Protected Presenter Access',
      description: 'Enterprise-grade security with flexible PIN authentication. Choose from no security, PIN optional, or PIN required modes for different event types.',
      color: 'violet'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Secure Presenter Assignment',
      description: 'Generate QR codes for presenter access with configurable expiration and usage limits. Track all access attempts with detailed audit logs.',
      color: 'emerald'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Flexible Security Levels',
      description: 'Adapt security to your needs: no security for internal events, PIN optional for balanced security, or PIN required for maximum protection.',
      color: 'indigo'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Automated Security Features',
      description: 'Account lockouts after failed PIN attempts, automatic session expiration, and PIN delivery via email or manual sharing.',
      color: 'cyan'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Invite team members, manage access levels, and collaborate on event management. Perfect for event organizers.',
      color: 'teal'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500',
    green: 'bg-green-500/20 text-green-400 border-green-500',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    red: 'bg-red-500/20 text-red-400 border-red-500',
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500',
    teal: 'bg-teal-500/20 text-teal-400 border-teal-500',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">SyncCue Features</h2>
            <p className="text-gray-400">Professional presentation timing and event management</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${colorClasses[feature.color]} rounded-xl p-5 border transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${colorClasses[feature.color]}`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-500/30">
            <h3 className="text-2xl font-bold text-white mb-3">Why SyncCue?</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              SyncCue is built for professional event organizers, conference planners, and presentation managers who need reliable,
              feature-rich timing solutions. Whether you're running a small meeting or a large multi-day conference, SyncCue provides
              the tools you need to keep your events running smoothly and on schedule.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">Real-Time</div>
                <div className="text-sm text-gray-400">Instant sync across all devices</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">Reliable</div>
                <div className="text-sm text-gray-400">Cloud-powered precision timing</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">Flexible</div>
                <div className="text-sm text-gray-400">Adapts to any event format</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-900">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
