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

    const logsSubscription = supabase
      .channel('timer_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_logs' }, () => {
        loadTimerLogs();
      })
      .subscribe();

    // Load initial data
    loadSessions();
    loadMessages();
    loadTimerLogs();

    return () => {
      supabase.removeChannel(timersSubscription);
      supabase.removeChannel(sessionsSubscription);
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(logsSubscription);
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
      // Update local state immediately for smooth UI
      setSessions(prevSessions => {
        const updatedSessions = { ...prevSessions };
        let hasChanges = false;
        
        Object.entries(updatedSessions).forEach(([timerId, session]) => {
          if (session.is_running) {
            if (session.time_left > 0) {
              updatedSessions[timerId] = {
                ...session,
                time_left: session.time_left - 1,
                updated_at: new Date().toISOString()
              };
              hasChanges = true;
              
              // Update database in background
              supabase
                .from('timer_sessions')
                .update({ 
                  time_left: session.time_left - 1,
                  updated_at: new Date().toISOString()
                })
                .eq('timer_id', timerId);
            } else {
              // Timer finished - stop it
              updatedSessions[timerId] = {
                ...session,
                is_running: false,
                updated_at: new Date().toISOString()
              };
              hasChanges = true;
              
              // Log timer completion
              logTimerAction(timerId, 'complete', 0, 0, 'Timer completed automatically');
              
              // Update database in background
              supabase
                .from('timer_sessions')
                .update({ 
                  is_running: false,
                  updated_at: new Date().toISOString()
                })
                .eq('timer_id', timerId);
            }
          }
        });
        
        return hasChanges ? updatedSessions : prevSessions;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessions]);

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

  const loadTimerLogs = async () => {
    const { data, error } = await supabase
      .from('timer_logs')
      .select(`
        *,
        timers (
          name,
          presenter_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error loading timer logs:', error);
      return;
    }
    
    setTimerLogs(data || []);
  };

  const logTimerAction = async (timerId, action, timeValue = 0, durationChange = 0, notes = '') => {
    try {
      await supabase
        .from('timer_logs')
        .insert([{
          timer_id: timerId,
          action,
          time_value: timeValue,
          duration_change: durationChange,
          notes
        }]);
    } catch (error) {
      console.error('Error logging timer action:', error);
    }
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

    // Log timer creation
    await logTimerAction(data.id, 'create', duration, 0, `Timer created: ${name} (${presenterName})`);

    setActiveTimerId(data.id);
    setCurrentView('admin');
    
    // Reset the create form
    setCreateForm({
      name: '',
      presenter: '',
      minutes: 30,
      seconds: 0
    });
  };

  const startTimer = async (timerId) => {
    try {
      console.log('Starting timer:', timerId);
      const currentSession = sessions[timerId];
      
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
      
      // Log timer start
      await logTimerAction(timerId, 'start', currentSession?.time_left || 0, 0, 'Timer started');
      
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
      const currentSession = sessions[timerId];
      
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
      
      // Log timer pause
      await logTimerAction(timerId, 'pause', currentSession?.time_left || 0, 0, 'Timer paused');
      
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
      
      // Log timer reset
      await logTimerAction(timerId, 'reset', timer.duration, 0, 'Timer reset to original duration');
      
      // Force reload sessions to update UI immediately
      await loadSessions();
      console.log('Timer reset successfully');
    } catch (err) {
      console.error('Failed to reset timer:', err);
    }
  };

  const setCustomTimer = async (timerId, total
  )
}