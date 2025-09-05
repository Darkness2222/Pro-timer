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
    if