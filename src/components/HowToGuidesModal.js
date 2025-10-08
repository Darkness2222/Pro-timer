import React, { useState } from 'react'
import { X, BookOpen, Users, Calendar, QrCode, Settings, BarChart3, Shield, Clock, Search, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function HowToGuidesModal({ isOpen, onClose }) {
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  if (!isOpen) return null

  const guides = [
    {
      id: 'getting-started',
      category: 'Getting Started',
      title: 'Getting Started with SyncCue',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'blue',
      difficulty: 'Beginner',
      content: {
        overview: 'Welcome to SyncCue! This guide will help you get started with the application and understand the basic concepts.',
        steps: [
          {
            title: 'Understanding Your Account',
            description: 'When you create an account, you automatically become the Owner of a new organization. The owner account does not count toward your user limit.',
            tip: 'Your role and plan information are visible in Settings > Account & Subscription section.'
          },
          {
            title: 'Explore the Navigation',
            description: 'Use the navigation bar to access different sections: Events (manage your events), Presenters (view your team), Reports (analytics), and Settings (preferences and team management).',
            tip: 'Click on the SyncCue logo at any time to return to the main timer overview.'
          },
          {
            title: 'Try the Free Trial',
            description: 'Your free trial includes access to all features with a limit of 5 users (excluding the owner). This is perfect for testing the app with your team.',
            tip: 'Upgrade to Pro for unlimited users and continued access to all features.'
          },
          {
            title: 'Next Steps',
            description: 'Start by inviting team members (Settings > Manage Team), then create your first event (Events > Create Event).',
            tip: 'Use these guides as a reference whenever you need help with a specific feature.'
          }
        ]
      }
    },
    {
      id: 'team-management',
      category: 'User Management',
      title: 'Adding Users, Admins, and Presenters',
      icon: <Users className="w-6 h-6" />,
      color: 'purple',
      difficulty: 'Beginner',
      content: {
        overview: 'Learn how to build your team by inviting members and assigning roles.',
        steps: [
          {
            title: 'Open Team Management',
            description: 'Click the Settings icon in the navigation bar, then click the "Manage Team" button in the Account & Subscription section.',
            tip: 'Only Owners and Admins can access Team Management.'
          },
          {
            title: 'Understanding Roles',
            description: 'There are three roles: Owner (full control, not counted in limit), Admin (manage events and team, cannot present), and Presenter (can only present in events).',
            tip: 'Admins and Presenters count toward your subscription user limit.'
          },
          {
            title: 'Invite a Team Member',
            description: 'Click "Invite Team Member", enter their email address, select a role (Admin or Presenter), and click "Send Invitation".',
            tip: 'Invitations are sent via email. The invited person will need to create an account to join your organization.'
          },
          {
            title: 'Managing Existing Members',
            description: 'View all team members in the Team Members section. You can change roles using the dropdown menu or remove members with the trash icon.',
            tip: 'You cannot remove the organization owner or remove yourself from the organization.'
          },
          {
            title: 'Monitor Your User Limit',
            description: 'The top section shows your current plan and user count. Counted Users tracks users against your subscription limit.',
            tip: 'Upgrade your plan if you need to add more users beyond your current limit.'
          }
        ]
      }
    },
    {
      id: 'create-event',
      category: 'Events',
      title: 'Creating and Setting Up Events',
      icon: <Calendar className="w-6 h-6" />,
      color: 'green',
      difficulty: 'Beginner',
      content: {
        overview: 'Create professional multi-presenter events with timers, buffer periods, and automatic transitions.',
        steps: [
          {
            title: 'Navigate to Events',
            description: 'Click "Events" in the navigation bar at the top of the page.',
            tip: 'You can also click the "Create Event" button from the main dashboard.'
          },
          {
            title: 'Click Create Event',
            description: 'Click the blue "Create Event" button in the top-right corner of the Events page.',
            tip: 'Only Admins and Owners can create events. Presenters do not have this access.'
          },
          {
            title: 'Fill in Event Details',
            description: 'Enter the event name (required), description (optional), and event date/time. These help you organize and identify your events.',
            tip: 'Use descriptive names like "Annual Conference 2025" or "Monthly Team Meeting".'
          },
          {
            title: 'Configure Buffer Time',
            description: 'Set buffer time (in seconds) between presenters for transitions, Q&A, or breaks. Enable "Auto-start next presenter" to automatically begin the next timer after the buffer.',
            tip: 'Common buffer times: 30 seconds for quick transitions, 60-120 seconds for Q&A sessions.'
          },
          {
            title: 'Choose Security Level',
            description: 'Select your security preference: No Security (anyone with link), PIN Optional (balanced security), PIN Required (maximum protection), or Email Verification (coming soon).',
            tip: 'Use PIN Required for public events where you want to verify presenter identities.'
          },
          {
            title: 'Add Presenters',
            description: 'For each presenter, select their name from your organization roster, enter their topic/title, and set their presentation duration in minutes. Use the "Add Presenter" button to add more.',
            tip: 'Make sure to add presenters to your team first (Settings > Manage Team) before creating an event.'
          },
          {
            title: 'Review and Create',
            description: 'Double-check all details, then click "Create Event". Your event will appear in the Events list and you can start managing it immediately.',
            tip: 'You can edit event details later by clicking on the event card.'
          }
        ]
      }
    },
    {
      id: 'qr-code-setup',
      category: 'QR Code Access',
      title: 'Using QR Code for Presenter Access',
      icon: <QrCode className="w-6 h-6" />,
      color: 'orange',
      difficulty: 'Intermediate',
      content: {
        overview: 'Generate secure QR codes that presenters can scan to access their timer view.',
        steps: [
          {
            title: 'Open Event Details',
            description: 'From the Events page, click on an event card to open the Event Detail view.',
            tip: 'Make sure your event has presenters assigned before generating a QR code.'
          },
          {
            title: 'Generate QR Code',
            description: 'Click the "QR Code" button in the event controls section. This opens the QR Code modal.',
            tip: 'Each event has its own unique QR code for security purposes.'
          },
          {
            title: 'Configure QR Code Settings',
            description: 'Set expiration time in hours (0 for no expiration) and maximum uses (leave empty for unlimited). These security features help control access.',
            tip: 'For same-day events, use 24-hour expiration. For multi-day conferences, set a longer expiration or use 0.'
          },
          {
            title: 'Click Generate QR Code',
            description: 'Click the blue "Generate QR Code" button. The QR code will be displayed along with a shareable link.',
            tip: 'You can only have one active QR code per event. Generating a new one invalidates the old one.'
          },
          {
            title: 'Share with Presenters',
            description: 'Use the "Download" button to save the QR code as an image, or use the "Copy" button to copy the link. Display the QR code at your event venue or send it to presenters.',
            tip: 'Print the QR code and place it in a common area where presenters can easily scan it.'
          },
          {
            title: 'Presenter Scans QR Code',
            description: 'When a presenter scans the QR code with their phone, they are taken to a page where they select their name from a list of assigned presenters.',
            tip: 'Presenters do not need a SyncCue account to access their timer view.'
          },
          {
            title: 'Monitor Access',
            description: 'Return to the Event Detail page and scroll to the Access Management section to see QR code scans, presenter claims, and recent activity.',
            tip: 'Use the "Regenerate" button if you need to invalidate the current QR code and create a new one.'
          }
        ]
      }
    },
    {
      id: 'presenter-claiming',
      category: 'QR Code Access',
      title: 'How Presenters Claim Their Timer',
      icon: <Shield className="w-6 h-6" />,
      color: 'violet',
      difficulty: 'Beginner',
      content: {
        overview: 'Understand how presenters use QR codes to access their personalized timer view.',
        steps: [
          {
            title: 'Scan the QR Code',
            description: 'Presenters use their smartphone camera or QR code scanner app to scan the event QR code displayed at the venue or sent via email/message.',
            tip: 'Most modern smartphones can scan QR codes directly from the camera app without additional software.'
          },
          {
            title: 'View Presenter List',
            description: 'After scanning, presenters see a list of all assigned presenters for the event. They select their name from this list.',
            tip: 'Names appear in the order they were added to the event.'
          },
          {
            title: 'Enter PIN (if required)',
            description: 'Depending on the event security level, presenters may need to enter a 6-digit PIN. If PIN Optional is set, they can skip this step.',
            tip: 'Admins can send PINs to presenters via the "Send PIN" button in the Presenters page or Team Management.'
          },
          {
            title: 'Access Timer View',
            description: 'Once verified, presenters are taken to their personalized timer view showing their name, topic, allocated time, and timer controls.',
            tip: 'The timer view is fullscreen-ready and optimized for visibility on mobile devices.'
          },
          {
            title: 'Session is Active',
            description: 'The presenter session remains active on their device. They can start/pause their timer and receive messages from event coordinators.',
            tip: 'Sessions expire after a period of inactivity for security. Presenters can scan the QR code again if needed.'
          }
        ]
      }
    },
    {
      id: 'timer-control',
      category: 'Events',
      title: 'Managing Timers During Events',
      icon: <Clock className="w-6 h-6" />,
      color: 'cyan',
      difficulty: 'Intermediate',
      content: {
        overview: 'Control presentation timers, manage buffer time, and handle timing adjustments during live events.',
        steps: [
          {
            title: 'Open Event Running Interface',
            description: 'From the Event Detail page, click "Run Event" to open the event running interface where you can control all timers.',
            tip: 'This is the main control panel for managing your live event.'
          },
          {
            title: 'Start a Timer',
            description: 'Click the "Start" button next to a presenter to begin their timer. The timer counts down from their allocated time.',
            tip: 'Timers automatically sync with the presenter view in real-time.'
          },
          {
            title: 'Pause and Resume',
            description: 'Use the "Pause" button to temporarily stop a timer (useful for technical difficulties or questions). Click "Resume" to continue.',
            tip: 'Paused time does not count toward the presentation duration.'
          },
          {
            title: 'Adjust Time On-the-Fly',
            description: 'Use the time adjustment controls to add or subtract minutes from a running timer if the schedule changes.',
            tip: 'Time adjustments are reflected immediately on the presenter view.'
          },
          {
            title: 'Finish Early',
            description: 'If a presenter finishes before their time is up, click "Finish Early" to mark them complete and move to the buffer period.',
            tip: 'This is useful when presentations run shorter than expected.'
          },
          {
            title: 'Manage Buffer Time',
            description: 'After each presentation, the buffer countdown begins automatically. You can extend buffer time if needed using the controls.',
            tip: 'If "Auto-start next presenter" is enabled, the next timer starts automatically after the buffer.'
          },
          {
            title: 'Monitor Progress',
            description: 'The interface shows all presenters, their status (upcoming, active, completed), and overall event progress.',
            tip: 'Use the progress indicators to keep your event on schedule.'
          }
        ]
      }
    },
    {
      id: 'settings-preferences',
      category: 'Settings',
      title: 'Customizing Timer and Display Settings',
      icon: <Settings className="w-6 h-6" />,
      color: 'yellow',
      difficulty: 'Beginner',
      content: {
        overview: 'Personalize your SyncCue experience with custom timer, display, and notification preferences.',
        steps: [
          {
            title: 'Open Settings',
            description: 'Click the Settings icon in the navigation bar to open the App Settings modal.',
            tip: 'Settings are saved per user and apply across all your devices.'
          },
          {
            title: 'Configure Timer Preferences',
            description: 'Click "Configure" on the Timer Preferences card. Here you can enable sound alerts, vibration feedback, and auto-start timers.',
            tip: 'Enable vibration on mobile devices for silent notifications.'
          },
          {
            title: 'Adjust Display Preferences',
            description: 'Click "Configure" on the Display Preferences card to set time format (MM:SS or HH:MM:SS) and configure fullscreen options.',
            tip: 'Choose the time format that best matches your event duration (MM:SS for short presentations, HH:MM:SS for longer ones).'
          },
          {
            title: 'Set Notification Preferences',
            description: 'Click "Configure" on the Notification Preferences card to customize alerts for halfway point, final minute warnings, and overtime.',
            tip: 'Set notification timing to match your presentation style and event format.'
          },
          {
            title: 'Save Your Changes',
            description: 'Changes are saved automatically when you adjust settings. Close the preferences modals when done.',
            tip: 'Your settings apply immediately to all timers and views.'
          }
        ]
      }
    },
    {
      id: 'reports-analytics',
      category: 'Reports',
      title: 'Viewing Event Performance Reports',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'teal',
      difficulty: 'Intermediate',
      content: {
        overview: 'Access detailed analytics and performance reports for your events.',
        steps: [
          {
            title: 'Navigate to Reports',
            description: 'Click "Reports" in the navigation bar to open the Reports page.',
            tip: 'Reports are only available to Admins and Owners, not Presenters.'
          },
          {
            title: 'Select an Event',
            description: 'Choose an event from the dropdown menu to view its analytics. Only completed or in-progress events show detailed reports.',
            tip: 'Reports are most useful after an event is completed.'
          },
          {
            title: 'Review Presenter Performance',
            description: 'The Presenter Performance Report shows each presenter, their scheduled time vs actual time, overtime tracking, and timing accuracy.',
            tip: 'Use this data to improve time management in future events.'
          },
          {
            title: 'Compare Events',
            description: 'Use the Event Comparison Report to compare multiple events side-by-side and identify trends.',
            tip: 'Compare similar event types to see which formats work best.'
          },
          {
            title: 'Export to CSV',
            description: 'Click the "Export to CSV" button to download report data for analysis in spreadsheet applications.',
            tip: 'Exported data includes all timing metrics and can be used for detailed analysis.'
          }
        ]
      }
    },
    {
      id: 'security-features',
      category: 'Security',
      title: 'Understanding PIN Protection and Security',
      icon: <Shield className="w-6 h-6" />,
      color: 'red',
      difficulty: 'Advanced',
      content: {
        overview: 'Learn about the security features that protect your events and presenter access.',
        steps: [
          {
            title: 'Security Level Options',
            description: 'SyncCue offers four security levels: No Security (anyone with link can access), PIN Optional (balanced security), PIN Required (maximum protection), and Email Verification (coming soon).',
            tip: 'Choose the security level when creating an event based on your needs.'
          },
          {
            title: 'How PIN Protection Works',
            description: 'Each presenter can have a unique 6-digit PIN. When security is enabled, presenters must enter their PIN after selecting their name from the QR code scan.',
            tip: 'PINs are automatically generated for new presenters and can be regenerated as needed.'
          },
          {
            title: 'Sending PINs to Presenters',
            description: 'Go to the Presenters page or Team Management, find a presenter, and click "Send PIN" to email their PIN. You can also manually share PINs.',
            tip: 'Send PINs in advance so presenters have them ready when they arrive at your event.'
          },
          {
            title: 'Failed Login Protection',
            description: 'After multiple failed PIN attempts, presenter accounts are temporarily locked to prevent brute-force attacks.',
            tip: 'Locked accounts automatically unlock after a cooldown period.'
          },
          {
            title: 'Access Logging',
            description: 'All QR code scans, presenter claims, and access attempts are logged in the Access Management section of each event.',
            tip: 'Review access logs to monitor security and identify any unauthorized access attempts.'
          },
          {
            title: 'Regenerating QR Codes',
            description: 'If a QR code is compromised, use the "Regenerate" button to invalidate the old code and create a new one.',
            tip: 'Always regenerate QR codes after events to prevent unauthorized future access.'
          }
        ]
      }
    },
    {
      id: 'event-filters',
      category: 'Events',
      title: 'Filtering and Managing Events',
      icon: <Calendar className="w-6 h-6" />,
      color: 'indigo',
      difficulty: 'Beginner',
      content: {
        overview: 'Organize and find events quickly using filters and the recently deleted section.',
        steps: [
          {
            title: 'Access Event Filters',
            description: 'On the Events page, use the filter buttons at the top: All Events, Upcoming, In Progress, Completed, and Recently Deleted (Admin only).',
            tip: 'Filters help you focus on relevant events based on their status.'
          },
          {
            title: 'View Event Status',
            description: 'Each event card shows its status with a colored badge: Upcoming (blue), In Progress (green), Completed (gray), or Cancelled (red).',
            tip: 'Event status updates automatically based on timer activity.'
          },
          {
            title: 'Delete an Event',
            description: 'Open an event, click the "Delete Event" button in the controls section. The event moves to Recently Deleted for 5 days.',
            tip: 'Deleted events can be restored within 5 days before permanent deletion.'
          },
          {
            title: 'Restore Deleted Events',
            description: 'Admins can view Recently Deleted events, then click "Restore" to bring an event back or "Delete Permanently" to remove it immediately.',
            tip: 'After 5 days, deleted events are automatically and permanently removed.'
          },
          {
            title: 'Search Events',
            description: 'While filters are not searchable yet, you can visually scan events by name, date, or presenter count to find what you need.',
            tip: 'Use descriptive event names to make finding events easier.'
          }
        ]
      }
    },
    {
      id: 'messaging-presenters',
      category: 'Events',
      title: 'Sending Messages to Presenters',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'pink',
      difficulty: 'Intermediate',
      content: {
        overview: 'Communicate with presenters in real-time during their presentations.',
        steps: [
          {
            title: 'Open Event Running Interface',
            description: 'From the Event Detail page, click "Run Event" to access the event control panel.',
            tip: 'You can only send messages during active events.'
          },
          {
            title: 'Locate Presenter Messaging',
            description: 'Find the active presenter section which includes a message input field and quick message buttons.',
            tip: 'Only the currently presenting (active) presenter can receive messages.'
          },
          {
            title: 'Use Quick Messages',
            description: 'Click pre-configured quick message buttons like "2 minutes left", "Speed up", or "Wrap up" for instant communication.',
            tip: 'Quick messages are faster than typing and work great for common scenarios.'
          },
          {
            title: 'Send Custom Messages',
            description: 'Type a custom message in the text field and click "Send" to deliver personalized instructions or feedback to the presenter.',
            tip: 'Keep messages short and clear for easy reading during presentations.'
          },
          {
            title: 'Presenter Receives Messages',
            description: 'Messages appear on the presenter timer view as notifications. Presenters can quickly glance at messages without interrupting their flow.',
            tip: 'Messages are displayed prominently but do not interfere with the timer visibility.'
          },
          {
            title: 'Message History',
            description: 'Previous messages remain visible in the message log, allowing you to track all communications during the event.',
            tip: 'Use messages sparingly to avoid distracting presenters.'
          }
        ]
      }
    }
  ]

  const categories = ['all', 'Getting Started', 'User Management', 'Events', 'QR Code Access', 'Settings', 'Reports', 'Security']

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          guide.content.overview.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    teal: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30'
  }

  const difficultyColors = {
    Beginner: 'bg-green-500/20 text-green-400',
    Intermediate: 'bg-yellow-500/20 text-yellow-400',
    Advanced: 'bg-red-500/20 text-red-400'
  }

  if (selectedGuide) {
    const guide = guides.find(g => g.id === selectedGuide)
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedGuide(null)
          }
        }}
      >
        <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className={`p-2 rounded-lg ${colorClasses[guide.color]}`}>
                {guide.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{guide.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-400">{guide.category}</span>
                  <span className="text-gray-600">•</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${difficultyColors[guide.difficulty]}`}>
                    {guide.difficulty}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-200 text-sm">{guide.content.overview}</p>
              </div>
            </div>

            <div className="space-y-6">
              {guide.content.steps.map((step, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">
                        {step.description}
                      </p>
                      {step.tip && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-green-200 text-xs">
                            <strong>Tip:</strong> {step.tip}
                          </p>
                        </div>
                      )}
                      {step.warning && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2 mt-2">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-200 text-xs">
                            <strong>Warning:</strong> {step.warning}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-gray-700 bg-gray-900">
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedGuide(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Guides
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
            <h2 className="text-3xl font-bold text-white mb-1">How to Guides</h2>
            <p className="text-gray-400">Step-by-step instructions for using SyncCue features</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guides..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {filteredGuides.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No guides found</h3>
              <p className="text-gray-400">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setSelectedGuide(guide.id)}
                  className={`${colorClasses[guide.color]} rounded-xl p-5 border transition-all duration-200 hover:scale-105 text-left`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colorClasses[guide.color]}`}>
                      {guide.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {guide.title}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{guide.category}</p>
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-3">
                        {guide.content.overview}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${difficultyColors[guide.difficulty]}`}>
                          {guide.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">
                          {guide.content.steps.length} steps
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-900">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              {filteredGuides.length} guide{filteredGuides.length !== 1 ? 's' : ''} available
            </p>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
