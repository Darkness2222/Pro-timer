import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Play, Pause, RotateCcw, Send, Copy, QrCode, Plus, Clock, Users } from 'lucide-react';

const ProTimerApp = () => {
  const [currentView, setCurrentView] = useState('admin');
  const [timers, setTimers] = useState([]);
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [editingTimerId, setEditingTimerId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Form states for creating new timer
  const [newTimerName, setNewTimerName] = useState('');
  const [newPresenterName, setNewPresenterName] = useState('');
  const [newDuration, setNewDuration] = useState('');

  const activeTimer = timers.find(t => t.id === activeTimerId);

  useEffect(() => {
    loadTimers();
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            setIsRunning(false);
          }
          updateTimerSession(activeTimerId, newTime, newTime > 0 ? isRunning : false);
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, activeTimerId]);

  useEffect(() => {
    if (activeTimerId) {
      loadTimerSession(activeTimerId);
    }
  }, [activeTimerId]);

  const loadTimers = async () => {
    try {
      const { data, error } = await supabase
        .from('timers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setTimers(data);
        if (!activeTimerId) {
          setActiveTimerId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  };

  const loadTimerSession = async (timerId) => {
    try {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('timer_id', timerId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setTimeLeft(data.time_left);
        setIsRunning(data.is_running);
      } else {
        const timer = timers.find(t => t.id === timerId);
        if (timer) {
          setTimeLeft(timer.duration);
          setIsRunning(false);
        }
      }
    } catch (error) {
      console.error('Error loading timer session:', error);
    }
  };

  const updateTimerSession = async (timerId, timeLeft, isRunning) => {
    try {
      const { error } = await supabase
        .from('timer_sessions')
        .upsert({
          timer_id: timerId,
          time_left: timeLeft,
          is_running: isRunning,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating timer session:', error);
    }
  };

  const createTimer = async () => {
    if (!newTimerName.trim() || !newPresenterName.trim() || !newDuration) return;
    
    const durationInSeconds = parseInt(newDuration) * 60;
    
    try {
      const { data, error } = await supabase
        .from('timers')
        .insert([{
          name: newTimerName.trim(),
          presenter_name: newPresenterName.trim(),
          duration: durationInSeconds
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setTimers(prev => [data, ...prev]);
      setActiveTimerId(data.id);
      setTimeLeft(durationInSeconds);
      setIsRunning(false);
      
      // Reset form
      setNewTimerName('');
      setNewPresenterName('');
      setNewDuration('');
      setCurrentView('admin');
    } catch (error) {
      console.error('Error creating timer:', error);
    }
  };

  const deleteTimer = async (timerId) => {
    if (timers.length <= 1) return;
    
    try {
      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', timerId);
      
      if (error) throw error;
      
      setTimers(prev => prev.filter(t => t.id !== timerId));
      
      if (timerId === activeTimerId) {
        const remainingTimers = timers.filter(t => t.id !== timerId);
        if (remainingTimers.length > 0) {
          setActiveTimerId(remainingTimers[0].id);
        }
      }
    } catch (error) {
      console.error('Error deleting timer:', error);
    }
  };

  const setActiveTimer = (timerId) => {
    setActiveTimerId(timerId);
    setCurrentView('admin');
  };

  const toggleTimer = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    updateTimerSession(activeTimerId, timeLeft, newRunningState);
  };

  const resetTimer = () => {
    const timer = timers.find(t => t.id === activeTimerId);
    if (timer) {
      setTimeLeft(timer.duration);
      setIsRunning(false);
      updateTimerSession(activeTimerId, timer.duration, false);
    }
  };

  const adjustTime = (seconds) => {
    setTimeLeft(prev => {
      const newTime = Math.max(0, prev + seconds);
      updateTimerSession(activeTimerId, newTime, isRunning);
      return newTime;
    });
  };

  const setCustomTime = () => {
    const [minutes, seconds] = customTimeInput.split(':').map(n => parseInt(n) || 0);
    const totalSeconds = (minutes * 60) + seconds;
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
      updateTimerSession(activeTimerId, totalSeconds, isRunning);
      setShowCustomTime(false);
      setCustomTimeInput('');
    }
  };

  const sendQuickMessage = async (message) => {
    try {
      const { error } = await supabase
        .from('timer_messages')
        .insert([{
          timer_id: activeTimerId,
          message: message
        }]);
      
      if (error) throw error;
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendCustomMessage = async () => {
    if (!customMessage.trim()) return;
    
    try {
      const { error } = await supabase
        .from('timer_messages')
        .insert([{
          timer_id: activeTimerId,
          message: customMessage.trim()
        }]);
      
      if (error) throw error;
      setCustomMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending custom message:', error);
    }
  };

  const loadMessages = async () => {
    if (!activeTimerId) return;
    
    try {
      const { data, error } = await supabase
        .from('timer_messages')
        .select('*')
        .eq('timer_id', activeTimerId)
        .order('sent_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const generateQRCode = () => {
    const presenterUrl = `${window.location.origin}?view=presenter&timer=${activeTimerId}`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(presenterUrl)}`);
    setShowQR(true);
  };

  const copyPresenterLink = () => {
    const presenterUrl = `${window.location.origin}?view=presenter&timer=${activeTimerId}`;
    navigator.clipboard.writeText(presenterUrl);
  };

  const startEditingName = (timerId, currentName) => {
    setEditingTimerId(timerId);
    setEditingName(currentName);
  };

  const saveEditedName = async () => {
    if (!editingName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('timers')
        .update({ name: editingName.trim() })
        .eq('id', editingTimerId);
      
      if (error) throw error;
      
      setTimers(prev => prev.map(t => 
        t.id === editingTimerId ? { ...t, name: editingName.trim() } : t
      ));
      
      setEditingTimerId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error updating timer name:', error);
    }
  };

  const cancelEditing = () => {
    setEditingTimerId(null);
    setEditingName('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (timer) => {
    const session = timer.timeLeft !== undefined ? timer.timeLeft : timeLeft;
    return ((timer.duration - session) / timer.duration) * 100;
  };

  const getTimerStatus = (timer) => {
    const currentTimeLeft = timer.id === activeTimerId ? timeLeft : timer.timeLeft || timer.duration;
    const currentIsRunning = timer.id === activeTimerId ? isRunning : timer.isRunning;
    
    if (currentIsRunning) return { text: '▶️ Running', color: 'text-green-400' };
    if (currentTimeLeft === 0) return { text: '⏹️ Stopped', color: 'text-red-400' };
    return { text: '⏸️ Paused', color: 'text-yellow-400' };
  };

  // Load messages when active timer changes
  useEffect(() => {
    loadMessages();
  }, [activeTimerId]);

  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Create New Timer</h1>
            <button
              onClick={() => setCurrentView('admin')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Timer Name</label>
                <input
                  type="text"
                  value={newTimerName}
                  onChange={(e) => setNewTimerName(e.target.value)}
                  placeholder="e.g., Keynote Session"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Presenter Name</label>
                <input
                  type="text"
                  value={newPresenterName}
                  onChange={(e) => setNewPresenterName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="e.g., 30"
                  min="1"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                />
              </div>

              <button
                onClick={createTimer}
                disabled={!newTimerName.trim() || !newPresenterName.trim() || !newDuration}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                Create Timer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'presenter') {
    const latestMessage = messages[0];
    
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-2xl w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{activeTimer?.name || 'Timer'}</h1>
            <p className="text-xl text-gray-400">Speaker: {activeTimer?.presenter_name}</p>
            <div className="mt-4">
              <span className={`text-lg ${getTimerStatus(activeTimer).color}`}>
                Status: {getTimerStatus(activeTimer).text}
              </span>
            </div>
          </div>
          
          <div className="text-8xl font-mono mb-8" style={{
            color: isRunning ? '#10b981' : timeLeft === 0 ? '#ef4444' : '#ef4444'
          }}>
            {formatTime(timeLeft)}
          </div>
          
          <div className="w-full bg-gray-800 rounded-full h-4 mb-8">
            <div 
              className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full transition-all duration-1000" 
              style={{width: `${getProgressPercentage(activeTimer)}%`}}
            ></div>
          </div>
          
          {latestMessage ? (
            <div className="bg-blue-600 rounded-xl p-6 text-xl">
              <p className="font-semibold mb-2">Message from Admin:</p>
              <p>{latestMessage.message}</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-6 text-gray-400">
              <p>No message</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'overview') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Timer Overview</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView('admin')}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                ← Admin Dashboard
              </button>
              <button
                onClick={() => setCurrentView('create')}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                + Add Timer
              </button>
            </div>
          </div>

          {timers.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={64} className="mx-auto mb-4 text-gray-600" />
              <h2 className="text-2xl font-semibold mb-2">No Timers Created</h2>
              <p className="text-gray-400 mb-6">Create your first timer to get started</p>
              <button
                onClick={() => setCurrentView('create')}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors"
              >
                Create Timer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {timers.map(timer => {
                const currentTimeLeft = timer.id === activeTimerId ? timeLeft : timer.timeLeft || timer.duration;
                const currentIsRunning = timer.id === activeTimerId ? isRunning : timer.isRunning;
                const status = getTimerStatus(timer);
                
                return (
                  <div 
                    key={timer.id}
                    onClick={() => setActiveTimer(timer.id)}
                    className={`bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all hover:border-blue-500 ${
                      timer.id === activeTimerId 
                        ? 'border-blue-500 bg-gray-700' 
                        : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{timer.name}</h3>
                      <div className="flex gap-2">
                        {timer.id === activeTimerId && (
                          <span className="bg-blue-500 text-xs px-2 py-1 rounded">ACTIVE</span>
                        )}
                        {currentIsRunning && (
                          <span className="bg-green-500 text-xs px-2 py-1 rounded">RUNNING</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-4">Speaker: {timer.presenter_name}</p>
                    
                    <div className="text-5xl font-mono mb-4 text-center" style={{
                      color: currentIsRunning ? '#10b981' : currentTimeLeft === 0 ? '#ef4444' : '#ef4444'
                    }}>
                      {formatTime(currentTimeLeft)}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span className={status.color}>{status.text}</span>
                        <span>{Math.round(((timer.duration - currentTimeLeft) / timer.duration) * 100)}% complete</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-1000" 
                          style={{width: `${((timer.duration - currentTimeLeft) / timer.duration) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                      Manage Timer →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Pro Timer Admin</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('presenter')}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              📺 Presenter View
            </button>
            <button
              onClick={() => setCurrentView('overview')}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
            >
              📋 Timer Overview
            </button>
          </div>
        </div>

        {!activeTimer ? (
          <div className="text-center py-12">
            <Clock size={64} className="mx-auto mb-4 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-2">No Timers Available</h2>
            <p className="text-gray-400 mb-6">Create your first timer to get started</p>
            <button
              onClick={() => setCurrentView('create')}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors"
            >
              Create Timer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Timer Control */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">{activeTimer.name}</h2>
                  <p className="text-gray-400">Speaker: {activeTimer.presenter_name}</p>
                </div>
                <button
                  onClick={generateQRCode}
                  className="bg-indigo-600 hover:bg-indigo-700 p-3 rounded-lg transition-colors"
                >
                  <QrCode size={20} />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="text-6xl font-mono mb-4" style={{
                  color: isRunning ? '#10b981' : timeLeft === 0 ? '#ef4444' : '#ef4444'
                }}>
                  {formatTime(timeLeft)}
                </div>
                
                <div className="mb-4">
                  <span className={`text-lg ${getTimerStatus(activeTimer).color}`}>
                    {getTimerStatus(activeTimer).text}
                  </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
                  <div 
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-1000" 
                    style={{width: `${getProgressPercentage(activeTimer)}%`}}
                  ></div>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={toggleTimer}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                      isRunning 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isRunning ? <Pause size={20} /> : <Play size={20} />}
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors"
                  >
                    <RotateCcw size={20} />
                    Reset
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-2 mb-4">
                <button 
                  onClick={() => adjustTime(60)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                >
                  +1 min
                </button>
                <button 
                  onClick={() => adjustTime(300)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
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

              <div className="flex justify-center mt-4">
                <button 
                  onClick={() => setShowCustomTime(!showCustomTime)}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Set Custom Time
                </button>
              </div>

              {showCustomTime && (
                <div className="mt-4 flex justify-center gap-3">
                  <input
                    type="text"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setCustomTime()}
                    placeholder="MM:SS (e.g., 15:30)"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                  <button 
                    onClick={setCustomTime}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Set
                  </button>
                  <button 
                    onClick={() => {
                      setShowCustomTime(false);
                      setCustomTimeInput('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
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
                  onKeyDown={(e) => e.key === 'Enter' && sendCustomMessage()}
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
        )}

        {/* Timer Details */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Timer Details</h2>
            <button
              onClick={() => setCurrentView('create')}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              + Add Timer
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timers.map(timer => {
              const currentTimeLeft = timer.id === activeTimerId ? timeLeft : timer.timeLeft || timer.duration;
              const currentIsRunning = timer.id === activeTimerId ? isRunning : timer.isRunning;
              const status = getTimerStatus(timer);
              
              return (
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
                          onKeyDown={(e) => e.key === 'Enter' && saveEditedName()}
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
                          <span className={`text-xs px-2 py-1 rounded ${
                            currentIsRunning ? 'bg-green-500' : 
                            currentTimeLeft === 0 ? 'bg-red-500' : 'bg-yellow-500'
                          }`}>
                            {status.text}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Speaker: {timer.presenter_name}</p>
                  <div className="text-2xl font-mono mb-3" style={{
                    color: currentIsRunning ? '#10b981' : currentTimeLeft === 0 ? '#ef4444' : '#ef4444'
                  }}>
                    {formatTime(currentTimeLeft)}
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-1000" 
                      style={{width: `${((timer.duration - currentTimeLeft) / timer.duration) * 100}%`}}
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
              );
            })}
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
};

export default ProTimerApp;