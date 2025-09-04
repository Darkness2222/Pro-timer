import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, QrCode, Send, Copy, Eye } from 'lucide-react';

const ProTimerApp = () => {
  const [currentView, setCurrentView] = useState('admin');
  const [showQR, setShowQR] = useState(false);

  const AdminView = () => (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎯 Pro Timer Admin</h1>
            <p className="text-gray-400">Control timers and send messages to presenters</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              <QrCode size={20} />
              QR Code
            </button>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">
              <Eye size={20} />
              View Presenter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Control */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Timer Control</h2>
            
            <div className="text-center mb-6">
              <div className="text-6xl font-mono font-bold text-red-500 mb-4">12:34</div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full" style={{width: '65%'}}></div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-6">
              <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors">
                <Play size={20} />
                Start
              </button>
              <button className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg transition-colors">
                <Pause size={20} />
                Pause
              </button>
              <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors">
                <Square size={20} />
                Stop
              </button>
              <button className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors">
                <RotateCcw size={20} />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">+1 min</button>
              <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">+5 min</button>
              <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">-1 min</button>
              <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">-5 min</button>
            </div>
          </div>

          {/* Quick Messages */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Quick Messages</h2>
            
            <div className="space-y-3 mb-6">
              <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors text-left">
                🎯 "Wrap up"
              </button>
              <button className="w-full bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg transition-colors text-left">
                📢 "Louder"
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition-colors text-left">
                ⚡ "Faster"
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors text-left">
                👍 "Great job"
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Custom message..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
              />
              <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-lg transition-colors">
                <Send size={20} />
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Active Timers */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Active Timers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Keynote Session</h3>
              <p className="text-gray-400 text-sm mb-3">Speaker: John Doe</p>
              <div className="text-2xl font-mono text-red-500">12:34</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Q&A Session</h3>
              <p className="text-gray-400 text-sm mb-3">Speaker: Jane Smith</p>
              <div className="text-2xl font-mono text-green-500">05:42</div>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4 text-center">Presenter Access</h3>
              <div className="bg-white p-6 rounded-lg mb-4">
                <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600">QR Code</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                  <Copy size={16} />
                  Copy Link
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const PresenterView = () => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 relative">
      <button className="absolute top-6 right-6 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
        Exit Fullscreen
      </button>
      
      <div className="text-center">
        <div className="text-9xl font-mono font-bold text-red-500 mb-8 leading-none">
          12:34
        </div>
        
        <div className="w-96 bg-gray-800 rounded-full h-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-6 rounded-full transition-all duration-1000" style={{width: '65%'}}></div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 max-w-md">
          <div className="text-2xl font-semibold text-yellow-400 mb-2">📢 Message from Admin</div>
          <p className="text-xl">"Please wrap up in the next 2 minutes"</p>
        </div>
      </div>
    </div>
  );

  const CreateView = () => (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">➕ Create New Timer</h1>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timer Name
              </label>
              <input
                type="text"
                placeholder="e.g., Keynote Session"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Presenter Name
              </label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                placeholder="30"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            
            <div className="flex gap-3">
              <button className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Create Timer
              </button>
              <button className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Top nav buttons to switch views */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4 border-b border-gray-700">
        <button
          onClick={() => setCurrentView('admin')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentView === 'admin'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          👨‍💼 Admin Dashboard
        </button>
        <button
          onClick={() => setCurrentView('presenter')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentView === 'presenter'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🎯 Presenter View
        </button>
        <button
          onClick={() => setCurrentView('create')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentView === 'create'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ➕ Create Timer
        </button>
      </div>

      {/* Switch views */}
      {currentView === 'admin' && <AdminView />}
      {currentView === 'presenter' && <PresenterView />}
      {currentView === 'create' && <CreateView />}
    </div>
  );
};

export default ProTimerApp;