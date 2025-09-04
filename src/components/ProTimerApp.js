import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const ProTimerApp = () => {
  const [currentView, setCurrentView] = useState('admin');
  const [timers, setTimers] = useState([]);
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [sessions, setSessions] = useState({});
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [customTime, setCustomTime] = useState({ minutes: 30, seconds: 0 });
  const [showQRCode, setShowQRCode] = useState(false);
  const [showMessageSettings, setShowMessageSettings] = useState(false);
  const [customMessages, setCustomMessages] = useState([
    "⏰ 5 minutes remaining",
    "⚡ Please wrap up",
    "🎯 Final slide please",
    "👏 Thank you!"
  ]);
  const [newCustomMessage, setNewCustomMessage] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    presenter: '',
    minutes: 30,
    seconds: 0
  });
  const intervalRef = useRef(null);

  // Load timers from database
  useEffect(() => {
    loadTimers();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const timersSubscription = supabase
      .channel('timers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timers' }, () => {
        loadTimers();
      })
      .subscribe();

    const sessionsSubscription = supabase
      .channel('timer_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_sessions' }, () => {
        loadSessions();
      })
      .subscribe();

    const messagesSubscription = supabase
      .channel('timer_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_messages' }, () => {
        loadMessages();
      })
      .subscribe();

    // Load initial data
    loadSessions();
    loadMessages();

    return () => {
      supabase.removeChannel(timersSubscription);
      supabase.removeChannel(sessionsSubscription);
      supabase.removeChannel(messagesSubscription);
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const runningSessions = Object.entries(sessions).filter(([_, session]) => session.is_running);
    
    if (runningSessions.length === 0) {
      return;
    }

    intervalRef.current = setInterval(async () => {
      const currentRunningSessions = Object.entries(sessions).filter(([_, session]) => session.is_running);
      
      for (const [timerId, session] of currentRunningSessions) {
        if (session.time_left > 0) {
          const newTimeLeft = session.time_left - 1;
          
          // Update in database
          await supabase
            .from('timer_sessions')
            .update({ 
              time_left: newTimeLeft,
              updated_at: new Date().toISOString()
            })
            .eq('timer_id', timerId);
        } else {
          // Timer finished - stop it
          await supabase
            .from('timer_sessions')
            .update({ 
              is_running: false,
              updated_at: new Date().toISOString()
            })
            .eq('timer_id', timerId);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessions]);

  const loadTimers = async () => {
    const { data, error } = await supabase
      .from('timers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading timers:', error);
      return;
    }
    
    setTimers(data || []);
    if (data && data.length > 0 && !activeTimerId) {
      setActiveTimerId(data[0].id);
    }
    
    loadSessions();
    loadMessages();
  };

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('timer_sessions')
      .select('*');
    
    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }
    
    const sessionsMap = {};
    data?.forEach(session => {
      sessionsMap[session.timer_id] = session;
    });
    setSessions(sessionsMap);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('timer_messages')
      .select('*')
      .order('sent_at', { ascending: false });
    
    if (error) {
      console.error('Error loading messages:', error);
      return;
    }
    
    const messagesMap = {};
    data?.forEach(message => {
      if (!messagesMap[message.timer_id]) {
        messagesMap[message.timer_id] = [];
      }
      messagesMap[message.timer_id].push(message);
    });
    setMessages(messagesMap);
  };

  const createTimer = async (name, presenterName, duration) => {
    const { data, error } = await supabase
      .from('timers')
      .insert([{
        name,
        presenter_name: presenterName,
        duration
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating timer:', error);
      return;
    }

    // Create initial session
    await supabase
      .from('timer_sessions')
      .insert([{
        timer_id: data.id,
        time_left: duration,
        is_running: false
      }]);

    setActiveTimerId(data.id);
    setCurrentView('admin');
  };

  const startTimer = async (timerId) => {
    try {
      console.log('Starting timer:', timerId);
      const { error } = await supabase
        .from('timer_sessions')
        .update({ 
          is_running: true,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId);
      
      if (error) {
        console.error('Error starting timer:', error);
        return;
      }
      
      // Force reload sessions to update UI immediately
      await loadSessions();
      console.log('Timer started successfully');
    } catch (err) {
      console.error('Failed to start timer:', err);
    }
  };

  const pauseTimer = async (timerId) => {
    try {
      console.log('Pausing timer:', timerId);
      const { error } = await supabase
        .from('timer_sessions')
        .update({ 
          is_running: false,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId);
      
      if (error) {
        console.error('Error pausing timer:', error);
        return;
      }
      
      // Force reload sessions to update UI immediately
      await loadSessions();
      console.log('Timer paused successfully');
    } catch (err) {
      console.error('Failed to pause timer:', err);
    }
  };

  const resetTimer = async (timerId) => {
    try {
      console.log('Resetting timer:', timerId);
      const timer = timers.find(t => t.id === timerId);
      if (!timer) {
        console.error('Timer not found:', timerId);
        return;
      }

      const { error } = await supabase
        .from('timer_sessions')
        .update({ 
          time_left: timer.duration,
          is_running: false,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId);
      
      if (error) {
        console.error('Error resetting timer:', error);
        return;
      }
      
      // Force reload sessions to update UI immediately
      await loadSessions();
      console.log('Timer reset successfully');
    } catch (err) {
      console.error('Failed to reset timer:', err);
    }
  };

  const setCustomTimer = async (timerId, totalSeconds) => {
    try {
      console.log('Setting custom timer:', timerId, totalSeconds);
      const { error } = await supabase
        .from('timer_sessions')
        .update({ 
          time_left: Math.max(0, totalSeconds),
          is_running: false,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId);
      
      if (error) {
        console.error('Error setting custom timer:', error);
        return;
      }
      
      // Force reload sessions to update UI immediately
      await loadSessions();
      console.log('Custom timer set successfully');
    } catch (err) {
      console.error('Failed to set custom timer:', err);
    }
  };

  const sendMessage = async (timerId, message) => {
    await supabase
      .from('timer_messages')
      .insert([{
        timer_id: timerId,
        message
      }]);
    
    setNewMessage('');
  };

  const addCustomMessage = () => {
    if (newCustomMessage.trim() && !customMessages.includes(newCustomMessage.trim())) {
      setCustomMessages([...customMessages, newCustomMessage.trim()]);
      setNewCustomMessage('');
    }
  };

  const removeCustomMessage = (index) => {
    setCustomMessages(customMessages.filter((_, i) => i !== index));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerStatus = (timerId) => {
    const session = sessions[timerId];
    if (!session) return { status: 'stopped', timeLeft: 0, isRunning: false };
    
    return {
      status: session.is_running ? 'running' : (session.time_left === 0 ? 'finished' : 'paused'),
      timeLeft: session.time_left,
      isRunning: session.is_running
    };
  };

  const activeTimer = timers.find(t => t.id === activeTimerId);
  const activeSession = sessions[activeTimerId];

  const renderCreateTimer = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Create New Timer</h1>
          <p className="text-slate-300">Set up a presentation timer</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <form onSubmit={(e) => {
            e.preventDefault();
            const totalSeconds = (createForm.minutes * 60) + createForm.seconds;
            
            if (createForm.name && createForm.presenter && totalSeconds > 0) {
              createTimer(createForm.name, createForm.presenter, totalSeconds);
            }
          }} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">Session Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                placeholder="e.g., Keynote Presentation"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Presenter Name</label>
              <input
                type="text"
                value={createForm.presenter}
                onChange={(e) => setCreateForm({...createForm, presenter: e.target.value})}
                placeholder="e.g., John Smith"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Duration</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={createForm.minutes}
                    onChange={(e) => setCreateForm({...createForm, minutes: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-white/70 text-sm mt-1 block">Minutes</span>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={createForm.seconds}
                    onChange={(e) => setCreateForm({...createForm, seconds: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-white/70 text-sm mt-1 block">Seconds</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              🚀 Create Timer
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderTimerOverview = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📋 Timer Overview</h1>
          <p className="text-slate-300">Manage all your presentation timers</p>
        </div>

        {timers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏰</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Timers Yet</h3>
            <p className="text-slate-300 mb-6">Create your first presentation timer to get started</p>
            <button
              onClick={() => setCurrentView('create')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              🎯 Create Timer
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {timers.map(timer => {
              const status = getTimerStatus(timer.id);
              return (
                <div
                  key={timer.id}
                  onClick={() => {
                    setActiveTimerId(timer.id);
                    setCurrentView('admin');
                  }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer transform hover:scale-105"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{timer.name}</h3>
                    <p className="text-slate-300">👤 {timer.presenter_name}</p>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-5xl font-mono text-white mb-2">
                      {formatTime(status.timeLeft)}
                    </div>
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        status.status === 'running' ? 'bg-green-500/20 text-green-300' :
                        status.status === 'finished' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {status.status === 'running' ? '▶️ RUNNING' :
                         status.status === 'finished' ? '⏹️ FINISHED' :
                         '⏸️ PAUSED'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="bg-white/10 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                        style={{
                          width: `${Math.max(0, (status.timeLeft / timer.duration) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="text-center text-white/70 text-sm mt-1">
                      {Math.round((status.timeLeft / timer.duration) * 100)}% remaining
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
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

  const renderAdminDashboard = () => {
    if (!activeTimer) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Active Timer</h2>
            <button
              onClick={() => setCurrentView('create')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Create Timer
            </button>
          </div>
        </div>
      );
    }

    const status = getTimerStatus(activeTimerId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-lg border-b border-white/10 p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                🎯 Pro Timer Admin
              </h1>
              <p className="text-slate-300 mt-1">Control timers and send messages to presenters</p>
            </div>
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              📱 QR Code
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Timer Control */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Timer Control</h2>
                  <div className="text-right">
                    <div className="text-white font-medium">Active: {activeTimer.name}</div>
                    <div className="text-slate-300 text-sm">👤 {activeTimer.presenter_name}</div>
                  </div>
                </div>

                {/* Timer Display */}
                <div className="text-center mb-8">
                  <div className="text-8xl font-mono text-red-500 mb-4 tracking-wider">
                    {formatTime(status.timeLeft)}
                  </div>
                  <div className="flex justify-center mb-4">
                    <span className={`px-4 py-2 rounded-full text-lg font-medium flex items-center gap-2 ${
                      status.status === 'running' ? 'bg-green-500/20 text-green-300' :
                      status.status === 'finished' ? 'bg-red-500/20 text-red-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {status.status === 'running' ? '▶️ Running' :
                       status.status === 'finished' ? '⏹️ Finished' :
                       '⏸️ Paused'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="bg-white/10 rounded-full h-3 mb-6">
                    <div
                      className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                      style={{
                        width: `${Math.max(0, (status.timeLeft / activeTimer.duration) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={async () => {
                      if (!activeTimerId) {
                        console.error('No active timer ID');
                        return;
                      }
                      
                      console.log('Start/Pause button clicked');
                      console.log('Active Timer ID:', activeTimerId);
                      console.log('Current status:', status);
                      
                      if (status.isRunning) {
                        await pauseTimer(activeTimerId);
                      } else {
                        await startTimer(activeTimerId);
                      }
                    }}
                    className={`flex-1 font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                      status.isRunning
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                    }`}
                  >
                    {status.isRunning ? '⏸️ Pause' : '▶️ Start'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!activeTimerId) {
                        console.error('No active timer ID');
                        return;
                      }
                      
                      console.log('Stop button clicked');
                      await pauseTimer(activeTimerId);
                      await resetTimer(activeTimerId);
                    }}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    ⏹️ Stop
                  </button>
                  <button
                    onClick={async () => {
                      if (!activeTimerId) {
                        console.error('No active timer ID');
                        return;
                      }
                      
                      console.log('Reset button clicked');
                      await resetTimer(activeTimerId);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    🔄 Reset
                  </button>
                </div>

                {/* Quick Adjust Buttons */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Adjust</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <button
                      onClick={() => {
                        const currentTime = status.timeLeft;
                        const newTime = Math.max(0, currentTime - 300); // -5 minutes
                        setCustomTimer(activeTimerId, newTime);
                      }}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                    >
                      -5m
                    </button>
                    <button
                      onClick={() => {
                        const currentTime = status.timeLeft;
                        const newTime = Math.max(0, currentTime - 60); // -1 minute
                        setCustomTimer(activeTimerId, newTime);
                      }}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                    >
                      -1m
                    </button>
                    <button
                      onClick={() => {
                        const currentTime = status.timeLeft;
                        const newTime = currentTime + 60; // +1 minute
                        setCustomTimer(activeTimerId, newTime);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                    >
                      +1m
                    </button>
                    <button
                      onClick={() => {
                        const currentTime = status.timeLeft;
                        const newTime = currentTime + 300; // +5 minutes
                        setCustomTimer(activeTimerId, newTime);
                      }}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                    >
                      +5m
                    </button>
                  </div>
                </div>

                {/* Custom Time */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Set Custom Time</h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={customTime.minutes}
                        onChange={(e) => setCustomTime({...customTime, minutes: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Minutes"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={customTime.seconds}
                        onChange={(e) => setCustomTime({...customTime, seconds: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Seconds"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const totalSeconds = (customTime.minutes * 60) + customTime.seconds;
                        if (totalSeconds > 0) {
                          setCustomTimer(activeTimerId, totalSeconds);
                        }
                      }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">📨 Messages</h3>
              
              {/* Quick Message Buttons */}
              <div className="space-y-2 mb-6">
                {customMessages.map((msg, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(activeTimerId, msg)}
                    className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all duration-200 border border-white/10 hover:border-white/20"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              {/* Message Settings Button */}
              <div className="mb-4">
                <button
                  onClick={() => setShowMessageSettings(true)}
                  className="w-full text-center px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-300 transition-all duration-200 border border-purple-500/30 hover:border-purple-500/50 text-sm"
                >
                  ⚙️ Customize Messages
                </button>
              </div>

              {/* Custom Message */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Custom message..."
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newMessage.trim()) {
                        sendMessage(activeTimerId, newMessage);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newMessage.trim()) {
                        sendMessage(activeTimerId, newMessage);
                      }
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    📤
                  </button>
                </div>
              </div>

              {/* Recent Messages */}
              {messages[activeTimerId] && messages[activeTimerId].length > 0 && (
                <div className="border-t border-white/10 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-white/70 mb-3">Recent Messages</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {messages[activeTimerId].slice(0, 5).map((msg, index) => (
                      <div key={index} className="text-sm text-white/80 bg-white/5 rounded p-2">
                        {msg.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Presenter View</h3>
              <div className="bg-gray-100 p-6 rounded-lg mb-4">
                <div className="text-6xl mb-4">📱</div>
                <p className="text-gray-600 mb-4">Scan to access presenter view</p>
                <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">QR Code would appear here</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {window.location.origin}/presenter/{activeTimerId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQRCode(false)}
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Message Settings Modal */}
        {showMessageSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">⚙️ Customize Quick Messages</h3>
                <button
                  onClick={() => setShowMessageSettings(false)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Add New Message */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Add New Quick Message</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomMessage}
                    onChange={(e) => setNewCustomMessage(e.target.value)}
                    placeholder="e.g., 🔔 2 minutes left"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomMessage();
                      }
                    }}
                  />
                  <button
                    onClick={addCustomMessage}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    ➕
                  </button>
                </div>
              </div>

              {/* Current Messages */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">Current Quick Messages</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customMessages.map((msg, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <span className="text-white text-sm flex-1">{msg}</span>
                      <button
                        onClick={() => removeCustomMessage(index)}
                        className="text-red-400 hover:text-red-300 ml-2 p-1"
                        title="Remove message"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
                {customMessages.length === 0 && (
                  <p className="text-white/60 text-sm text-center py-4">No quick messages yet. Add one above!</p>
                )}
              </div>

              {/* Reset to Defaults */}
              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={() => {
                    setCustomMessages([
                      "⏰ 5 minutes remaining",
                      "⚡ Please wrap up", 
                      "🎯 Final slide please",
                      "👏 Thank you!"
                    ]);
                  }}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                >
                  🔄 Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPresenterView = () => {
    if (!activeTimer) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Active Timer</h2>
          </div>
        </div>
      );
    }

    const status = getTimerStatus(activeTimerId);
    const recentMessages = messages[activeTimerId]?.slice(0, 3) || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{activeTimer.name}</h1>
            <p className="text-2xl text-blue-200">👤 {activeTimer.presenter_name}</p>
          </div>

          {/* Timer Display */}
          <div className="mb-8">
            <div className="text-9xl font-mono text-red-500 mb-6 tracking-wider">
              {formatTime(status.timeLeft)}
            </div>
            
            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full h-4 mb-4 max-w-2xl mx-auto overflow-hidden">
              <div
                className="h-4 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, (status.timeLeft / activeTimer.duration) * 100)}%`,
                  background: 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)'
                }}
              />
            </div>
            
            <div className="text-xl text-white/80">
              {Math.round((status.timeLeft / activeTimer.duration) * 100)}% remaining
            </div>
          </div>

          {/* Status */}
          <div className="mb-8">
            <span className={`px-6 py-3 rounded-full text-xl font-medium ${
              status.status === 'running' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
              status.status === 'finished' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
              'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            }`}>
              {status.status === 'running' ? '▶️ Presentation Active' :
               status.status === 'finished' ? '⏹️ Time Complete' :
               '⏸️ Timer Paused'}
            </span>
          </div>

          {/* Messages */}
          {messages[activeTimerId] && messages[activeTimerId].length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-4">📨 Messages from Control</h3>
              <div className="space-y-3">
                {messages[activeTimerId].slice(0, 3).map((msg, index) => (
                  <div
                    key={index}
                    className="bg-white/10 rounded-lg p-4 text-white border border-white/20"
                  >
                    {msg.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-slate-800/90 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentView === 'admin'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                🎯 Admin Dashboard
              </button>
              <button
                onClick={() => setCurrentView('presenter')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentView === 'presenter'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                🎤 Presenter View
              </button>
              <button
                onClick={() => setCurrentView('overview')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentView === 'overview'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                📋 Timer Overview
              </button>
            </div>
            <button
              onClick={() => setCurrentView('create')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              ➕ Create Timer
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === 'admin' && renderAdminDashboard()}
      {currentView === 'presenter' && renderPresenterView()}
      {currentView === 'create' && renderCreateTimer()}
      {currentView === 'overview' && renderTimerOverview()}
    </div>
  );
};

export default ProTimerApp;