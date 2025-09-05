import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const ProTimerApp = ({ session, bypassAuth }) => {
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
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    presenter: '',
    minutes: 30,
    seconds: 0
  });
  const [timerLogs, setTimerLogs] = useState([]);
  const [showTimerLogs, setShowTimerLogs] = useState(false);
  const intervalRef = useRef(null);

  // Load timers from database
  const loadTimers = async () => {
    try {
      const { data, error } = await supabase
        .from('timers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading timers:', error);
        return;
      }
      
      setTimers(data || []);
    } catch (error) {
      console.error('Error in loadTimers:', error);
    }
  };

  // Load timer sessions
  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('*');
      
      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }
      
      const sessionMap = {};
      data?.forEach(session => {
        sessionMap[session.timer_id] = session;
      });
      setSessions(sessionMap);
    } catch (error) {
      console.error('Error in loadSessions:', error);
    }
  };

  // Load messages
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_messages')
        .select('*')
        .order('sent_at', { ascending: false });
      
      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      
      const messageMap = {};
      data?.forEach(message => {
        if (!messageMap[message.timer_id]) {
          messageMap[message.timer_id] = [];
        }
        messageMap[message.timer_id].push(message);
      });
      setMessages(messageMap);
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  };

  useEffect(() => {
    loadTimers();
    loadSessions();
    loadMessages();
  }, []);

  useEffect(() => {
    // Set up real-time subscriptions
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

    return () => {
      timersSubscription.unsubscribe();
      sessionsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (activeTimerId && sessions[activeTimerId]?.is_running) {
      intervalRef.current = setInterval(async () => {
        const session = sessions[activeTimerId];
        if (session && session.time_left > 0) {
          const newTimeLeft = session.time_left - 1;
          
          try {
            const { error } = await supabase
              .from('timer_sessions')
              .update({ 
                time_left: newTimeLeft,
                updated_at: new Date().toISOString()
              })
              .eq('timer_id', activeTimerId);

            if (error) {
              console.error('Error updating timer:', error);
            }
          } catch (error) {
            console.error('Error in timer update:', error);
          }
        } else if (session && session.time_left <= 0) {
          // Timer finished
          try {
            await supabase
              .from('timer_sessions')
              .update({ 
                is_running: false,
                time_left: 0,
                updated_at: new Date().toISOString()
              })
              .eq('timer_id', activeTimerId);
          } catch (error) {
            console.error('Error stopping finished timer:', error);
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimerId, sessions]);

  const createTimer = async () => {
    if (!createForm.name.trim() || !createForm.presenter.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const totalSeconds = (createForm.minutes * 60) + createForm.seconds;
    if (totalSeconds <= 0) {
      alert('Please set a valid duration');
      return;
    }

    try {
      const { data: timer, error: timerError } = await supabase
        .from('timers')
        .insert({
          name: createForm.name.trim(),
          presenter_name: createForm.presenter.trim(),
          duration: totalSeconds,
          user_id: session?.user?.id || null
        })
        .select()
        .single();

      if (timerError) {
        console.error('Error creating timer:', timerError);
        alert('Error creating timer');
        return;
      }

      // Create initial session
      const { error: sessionError } = await supabase
        .from('timer_sessions')
        .insert({
          timer_id: timer.id,
          time_left: totalSeconds,
          is_running: false
        });

      if (sessionError) {
        console.error('Error creating session:', sessionError);
      }

      // Reset form
      setCreateForm({
        name: '',
        presenter: '',
        minutes: 30,
        seconds: 0
      });

      setCurrentView('admin');
    } catch (error) {
      console.error('Error in createTimer:', error);
      alert('Error creating timer');
    }
  };

  const startTimer = async (timerId) => {
    try {
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

      setActiveTimerId(timerId);
    } catch (error) {
      console.error('Error in startTimer:', error);
    }
  };

  const pauseTimer = async (timerId) => {
    try {
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

      if (activeTimerId === timerId) {
        setActiveTimerId(null);
      }
    } catch (error) {
      console.error('Error in pauseTimer:', error);
    }
  };

  const resetTimer = async (timerId) => {
    const timer = timers.find(t => t.id === timerId);
    if (!timer) return;

    try {
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

      if (activeTimerId === timerId) {
        setActiveTimerId(null);
      }
    } catch (error) {
      console.error('Error in resetTimer:', error);
    }
  };

  const setCustomTimer = async (timerId, totalSeconds) => {
    try {
      const { error } = await supabase
        .from('timer_sessions')
        .update({ 
          time_left: totalSeconds,
          is_running: false,
          updated_at: new Date().toISOString()
        })
        .eq('timer_id', timerId);

      if (error) {
        console.error('Error setting custom time:', error);
        return;
      }

      // Log the adjustment
      await supabase
        .from('timer_logs')
        .insert({
          timer_id: timerId,
          action: 'time_adjusted',
          time_value: totalSeconds,
          notes: `Time set to ${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`
        });

      if (activeTimerId === timerId) {
        setActiveTimerId(null);
      }

      loadSessions();
    } catch (error) {
      console.error('Error in setCustomTimer:', error);
    }
  };

  const deleteTimer = async (timerId) => {
    try {
      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', timerId);

      if (error) {
        console.error('Error deleting timer:', error);
        return;
      }

      if (activeTimerId === timerId) {
        setActiveTimerId(null);
      }
      
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error in deleteTimer:', error);
    }
  };

  const sendMessage = async (timerId, message) => {
    try {
      const { error } = await supabase
        .from('timer_messages')
        .insert({
          timer_id: timerId,
          message: message.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    if (session) {
      await supabase.auth.signOut();
    }
  };

  // Create View
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Create New Timer</h1>
            <button
              onClick={() => setCurrentView('admin')}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
            >
              Back to Admin
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Timer Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., Keynote Presentation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Presenter Name</label>
              <input
                type="text"
                value={createForm.presenter}
                onChange={(e) => setCreateForm({...createForm, presenter: e.target.value})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={createForm.minutes}
                    onChange={(e) => setCreateForm({...createForm, minutes: parseInt(e.target.value) || 0})}
                    className="w-24 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={createForm.seconds}
                    onChange={(e) => setCreateForm({...createForm, seconds: parseInt(e.target.value) || 0})}
                    className="w-24 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={createTimer}
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              Create Timer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display View
  if (currentView === 'display' && activeTimerId) {
    const timer = timers.find(t => t.id === activeTimerId);
    const session = sessions[activeTimerId];
    const timerMessages = messages[activeTimerId] || [];
    const latestMessage = timerMessages[0];

    if (!timer || !session) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Loading timer...</h2>
            <button
              onClick={() => setCurrentView('admin')}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
            >
              Back to Admin
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <div className="text-center w-full max-w-4xl">
          <h1 className="text-4xl font-bold mb-2">{timer.name}</h1>
          <p className="text-xl text-gray-300 mb-8">Presenter: {timer.presenter_name}</p>
          
          <div className="text-9xl font-mono font-bold mb-8 text-red-500">
            {formatTime(session.time_left)}
          </div>

          <div className="w-full bg-gray-800 rounded-full h-4 mb-8">
            <div 
              className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.max(0, (session.time_left / timer.duration) * 100)}%` 
              }}
            ></div>
          </div>

          {latestMessage && (
            <div className="bg-yellow-600 text-black px-8 py-4 rounded-lg text-2xl font-bold mb-8">
              {latestMessage.message}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setCurrentView('admin')}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin View (Default)
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Timer Admin</h1>
          <div className="flex gap-4">
            {session && (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            )}
            <button
              onClick={() => setCurrentView('create')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              Create New Timer
            </button>
          </div>
        </div>

        {timers.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-400 mb-4">No timers created yet</h2>
            <button
              onClick={() => setCurrentView('create')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              Create Your First Timer
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {timers.map(timer => {
              const session = sessions[timer.id];
              const timerMessages = messages[timer.id] || [];
              
              return (
                <div key={timer.id} className="bg-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{timer.name}</h3>
                      <p className="text-gray-400">Presenter: {timer.presenter_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveTimerId(timer.id);
                          setCurrentView('display');
                        }}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                      >
                        Display
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation(timer.id)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {session && (
                    <div className="space-y-4">
                      <div className="text-4xl font-mono font-bold text-center py-4">
                        {formatTime(session.time_left)}
                      </div>

                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.max(0, (session.time_left / timer.duration) * 100)}%` 
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-center gap-4">
                        {session.is_running ? (
                          <button
                            onClick={() => pauseTimer(timer.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => startTimer(timer.id)}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => resetTimer(timer.id)}
                          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                        >
                          Reset
                        </button>
                      </div>

                      <div className="flex gap-2 justify-center">
                        <input
                          type="number"
                          min="0"
                          value={customTime.minutes}
                          onChange={(e) => setCustomTime({...customTime, minutes: parseInt(e.target.value) || 0})}
                          className="w-20 p-2 bg-gray-700 border border-gray-600 rounded text-center"
                          placeholder="min"
                        />
                        <span className="self-center">:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={customTime.seconds}
                          onChange={(e) => setCustomTime({...customTime, seconds: parseInt(e.target.value) || 0})}
                          className="w-20 p-2 bg-gray-700 border border-gray-600 rounded text-center"
                          placeholder="sec"
                        />
                        <button
                          onClick={() => setCustomTimer(timer.id, (customTime.minutes * 60) + customTime.seconds)}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                        >
                          Set Time
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg"
                            placeholder="Send message to presenter..."
                          />
                          <button
                            onClick={() => sendMessage(timer.id, newMessage)}
                            disabled={!newMessage.trim()}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
                          >
                            Send
                          </button>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {customMessages.map((msg, index) => (
                            <button
                              key={index}
                              onClick={() => sendMessage(timer.id, msg)}
                              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                            >
                              {msg}
                            </button>
                          ))}
                        </div>
                      </div>

                      {timerMessages.length > 0 && (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <h4 className="font-bold mb-2">Recent Messages:</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {timerMessages.slice(0, 5).map(msg => (
                              <div key={msg.id} className="text-sm text-gray-300">
                                <span className="text-gray-500">
                                  {new Date(msg.sent_at).toLocaleTimeString()}:
                                </span> {msg.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Delete Timer</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this timer? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => deleteTimer(deleteConfirmation)}
                  className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
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