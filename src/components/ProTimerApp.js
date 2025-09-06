@@ .. @@
 import React, { useState, useEffect } from 'react'
 import { supabase } from '../lib/supabase'
 
 export default function ProTimerApp({ session, bypassAuth }) {
 }
+  const [activeTab, setActiveTab] = useState('overview')
   const [timers, setTimers] = useState([])
   const [selectedTimer, setSelectedTimer] = useState(null)
   const [loading, setLoading] = useState(true)
@@ .. @@
   const [messages, setMessages] = useState([])
   const [newMessage, setNewMessage] = useState('')
   const [isFullscreen, setIsFullscreen] = useState(false)
-  const [activeTab, setActiveTab] = useState('overview')
 
   // Load timers on component mount