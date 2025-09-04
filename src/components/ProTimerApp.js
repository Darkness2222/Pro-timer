import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, QrCode, Send, Copy, Eye } from 'lucide-react';
import QRCodeLib from 'qrcode';

const ProTimerApp = () => {
  const [currentView, setCurrentView] = useState('admin');
  const [showQR, setShowQR] = useState(false);
  const [timers, setTimers] = useState([
    {
      id: 1,
      name: 'Keynote Session',
      presenterName: 'John Doe',
      timeLeft: 12 * 60 + 34,
      initialTime: 12 * 60 + 34,
      isRunning: false,
      isActive: true
    },
    {
      id: 2,
      name: 'Q&A Session',
      presenterName: 'Jane Smith',
      timeLeft: 5 * 60 + 42,
      initialTime: 5 * 60 + 42,
      isRunning: false,
      isActive: false
    }
  ]);
  const [activeTimerId, setActiveTimerId] = useState(1);
  const [editingTimerId, setEditingTimerId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const intervalRef = useRef(null);

  // Get active timer
  const activeTimer = timers.find(timer => timer.id === activeTimerId) || timers[0];

  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer?.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimers(prevTimers => 
          prevTimers.map(timer => {
            if (timer.id === activeTimerId && timer.isRunning) {
              if (timer.timeLeft <= 1) {
                return { ...timer, timeLeft: 0, isRunning: false };
              }
              return { ...timer, timeLeft: timer.timeLeft - 1 };
            }
            return timer;
          })
        );
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [activeTimer?.isRunning, activeTimer?.timeLeft, activeTimerId]);

  // Update timer state
  const updateTimer = (timerId, updates) => {
    setTimers(prevTimers =>
      prevTimers.map(timer =>
        timer.id === timerId ? { ...timer, ...updates } : timer
      )
    );
  };

  // Add new timer
  const addTimer = (name, presenterName, duration) => {
    const newTimer = {
      id: Date.now(),
      name,
      presenterName,
      timeLeft: duration * 60,
      initialTime: duration * 60,
      isRunning: false,
      isActive: false
    };
    setTimers(prev => [...prev, newTimer]);
  };

  // Delete timer
  const deleteTimer = (timerId) => {
    if (timers.length <= 1) return; // Keep at least one timer
    setTimers(prev => prev.filter(timer => timer.id !== timerId));
    if (activeTimerId === timerId) {
      const remainingTimers = timers.filter(timer => timer.id !== timerId);
      setActiveTimerId(remainingTimers[0]?.id);
    }
  };

  // Start editing timer name
  const startEditingName = (timerId, currentName) => {
    setEditingTimerId(timerId);
    setEditingName(currentName);
  };

  // Save edited name
  const saveEditedName = () => {
    if (editingName.trim()) {
      updateTimer(editingTimerId, { name: editingName.trim() });
    }
    setEditingTimerId(null);
    setEditingName('');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTimerId(null);
    setEditingName('');
  };

  // Set active timer
  const setActiveTimer = (timerId) => {
    // Stop current active timer
    updateTimer(activeTimerId, { isRunning: false });
    // Set new active timer
    setActiveTimerId(timerId);
    updateTimer(timerId, { isActive: true });
    // Mark others as inactive
    setTimers(prevTimers =>
      prevTimers.map(timer => ({
        ...timer,
        isActive: timer.id === timerId
      }))
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (timer = activeTimer) => {
    if (!timer || timer.initialTime === 0) return 0;
    return (timer.timeLeft / timer.initialTime) * 100;
  };

  const handleStart = () => updateTimer(activeTimerId, { isRunning: true });
  const handlePause = () => updateTimer(activeTimerId, { isRunning: false });
  const handleStop = () => {
    updateTimer(activeTimerId, { isRunning: false, timeLeft: 0 });
  };
  const handleReset = () => {
    updateTimer(activeTimerId, { 
      isRunning: false, 
      timeLeft: activeTimer.initialTime 
    });
  };

  const adjustTime = (seconds) => {
    const newTime = Math.max(0, activeTimer.timeLeft + seconds);
    updateTimer(activeTimerId, { 
      timeLeft: newTime,
      ...((!activeTimer.isRunning && newTime > 0) && { initialTime: newTime })
    });
  };

  const generateQRCode = async () => {
    try {
      // Dynamic import to avoid module resolution issues
      const QRCode = await import('qrcode');
      // Create a URL that opens the presenter view
      const presenterUrl = `${window.location.origin}${window.location.pathname}?view=presenter&timer=${activeTimerId}`;
      const qrDataUrl = await QRCode.default.toDataURL(presenterUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
      setShowQR(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback: show modal without QR code
      setShowQR(true);
    }
  };

  const copyPresenterLink = () => {
    const presenterUrl = `${window.location.origin}${window.location.pathname}?view=presenter&timer=${activeTimerId}`;
    navigator.clipboard.writeText(presenterUrl).then(() => {
      alert('Presenter link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link');
    });
  };

  const sendQuickMessage = (message) => {
    setCurrentMessage(message);
    // Auto-clear message after 10 seconds
    setTimeout(() => setCurrentMessage(''), 10000);
  };

  const sendCustomMessage = () => {
    if (customMessage.trim()) {
      setCurrentMessage(customMessage.trim());
      setCustomMessage('');
      // Auto-clear message after 10 seconds
      setTimeout(() => setCurrentMessage(''), 10000);
    }
  };

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
              onClick={generateQRCode}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              <QrCode size={20} />
              QR Code
            </button>
            <button 
              onClick={() => setCurrentView('presenter')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Eye size={20} />
              View Presenter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Control */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Timer Control</h2>
              <div className="text-sm text-gray-400">
                Active: {activeTimer?.name} - {activeTimer?.presenterName}
              </div>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-6xl font-mono font-bold text-red-500 mb-4">
                {formatTime(activeTimer?.timeLeft || 0)}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-1000" 
                  style={{width: `${getProgressPercentage()}%`}}
                ></div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-6">
              <button 
                onClick={handleStart}
                disabled={activeTimer?.timeLeft === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
              >
                <Play size={20} />
                Start
              </button>
              <button 
                onClick={handlePause}
                disabled={!activeTimer?.isRunning}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
              >
                <Pause size={20} />
                Pause
              </button>
              <button 
                onClick={handleStop}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors"
              >
                <Square size={20} />
                Stop
              </button>
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors"
              >
                <RotateCcw size={20} />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => adjustTime(60)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                +1 min
              </button>
              <button 
                onClick={() => adjustTime(300)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                +5 min
              </button>
              <button 
                onClick={() => adjustTime(-60)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                -1 min
              </button>
              <button 
                onClick={() => adjustTime(-300)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                -5 min
              </button>
            </div>
          </div>

          {/* Quick Messages */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Quick Messages</h2>
            
            <div className="space-y-3 mb-6">
              <button 
                onClick={() => sendQuickMessage('🎯 Wrap up')}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors text-left"
              >
                🎯 "Wrap up"
              </button>
              <button 
                onClick={() => sendQuickMessage('📢 Louder')}
                className="w-full bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg transition-colors text-left"
              >
                📢 "Louder"
              </button>
              <button 
                onClick={() => sendQuickMessage('⚡ Faster')}
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition-colors text-left"
              >
                ⚡ "Faster"
              </button>
              <button 
                onClick={() => sendQuickMessage('👍 Great job')}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors text-left"
              >
                👍 "Great job"
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendCustomMessage()}
                placeholder="Custom message..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
              />
              <button 
                onClick={sendCustomMessage}
                disabled={!customMessage.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 px-4 py-3 rounded-lg transition-colors"
              >
                <Send size={20} />
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* All Timers */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Timers</h2>
            <button
              onClick={() => setCurrentView('create')}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              + Add Timer
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timers.map(timer => (
              <div 
                key={timer.id} 
                className={`bg-gray-700 rounded-lg p-4 border-2 transition-all ${
                  timer.id === activeTimerId 
                    ? 'border-blue-500 bg-gray-600' 
                    : 'border-transparent hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {editingTimerId === timer.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEditedName()}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                        autoFocus
                      />
                      <button
                        onClick={saveEditedName}
                        className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 
                        className="font-semibold cursor-pointer hover:text-blue-400"
                        onClick={() => startEditingName(timer.id, timer.name)}
                      >
                        {timer.name}
                      </h3>
                      <div className="flex gap-1">
                        {timer.id === activeTimerId && (
                          <span className="bg-blue-500 text-xs px-2 py-1 rounded">ACTIVE</span>
                        )}
                        {timer.isRunning && (
                          <span className="bg-green-500 text-xs px-2 py-1 rounded">RUNNING</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-3">Speaker: {timer.presenterName}</p>
                <div className="text-2xl font-mono mb-3" style={{
                  color: timer.isRunning ? '#10b981' : timer.timeLeft === 0 ? '#ef4444' : '#ef4444'
                }}>
                  {formatTime(timer.timeLeft)}
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-1000" 
                    style={{width: `${getProgressPercentage(timer)}%`}}
                  ></div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTimer(timer.id)}
                    disabled={timer.id === activeTimerId}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm transition-colors"
                  >
                    {timer.id === activeTimerId ? 'Active' : 'Select'}
                  </button>
                  <button
                    onClick={() => deleteTimer(timer.id)}
                    disabled={timers.length <= 1}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4 text-center">Presenter Access</h3>
              <div className="bg-white p-6 rounded-lg mb-4">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code for Presenter View" 
                    className="w-64 h-64 mx-auto"
                  />
                ) : (
                  <div className="w-64 h-64 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600">QR Code not available</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm text-center mb-4">
                Scan this QR code to open the presenter view for "{activeTimer?.name}" on another device
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={copyPresenterLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
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
          {formatTime(activeTimer?.timeLeft || 0)}
        </div>
        
        <div className="w-96 bg-gray-800 rounded-full h-6 mb-8">
          <div 
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-6 rounded-full transition-all duration-1000" 
            style={{width: `${getProgressPercentage()}%`}}
          ></div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 max-w-md">
          <div className="text-lg font-semibold text-blue-400 mb-2">
            {activeTimer?.name} - {activeTimer?.presenterName}
          </div>
          <div className="text-2xl font-semibold text-yellow-400 mb-2">📢 Message from Admin</div>
          <p className="text-xl">
            {currentMessage || (activeTimer?.isRunning ? 'Timer is running' : activeTimer?.timeLeft === 0 ? 'Time is up!' : 'Timer is paused')}
          </p>
        </div>
      </div>
    </div>
  );

  const CreateView = () => {
    const [newTimerName, setNewTimerName] = useState('');
    const [newPresenterName, setNewPresenterName] = useState('');
    const [newDuration, setNewDuration] = useState('');

    const handleCreateTimer = () => {
      if (newTimerName.trim() && newPresenterName.trim() && newDuration) {
        addTimer(newTimerName.trim(), newPresenterName.trim(), parseInt(newDuration));
        setNewTimerName('');
        setNewPresenterName('');
        setNewDuration('');
        setCurrentView('admin');
      }
    };

    return (
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
                  value={newTimerName}
                  onChange={(e) => setNewTimerName(e.target.value)}
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
                  value={newPresenterName}
                  onChange={(e) => setNewPresenterName(e.target.value)}
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
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="30"
                  min="1"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleCreateTimer}
                  disabled={!newTimerName.trim() || !newPresenterName.trim() || !newDuration}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Timer
                </button>
                <button 
                  onClick={() => setCurrentView('admin')}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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