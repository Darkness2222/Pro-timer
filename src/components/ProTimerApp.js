@@ .. @@
   // Add session validation
   useEffect(() => {
     if (!bypassAuth && !session) {
       console.log('No session found, user should be redirected to auth')
-      return
+      // Don't automatically redirect, let App.js handle this
+      return
     }
+    
+    // Load initial data when we have a valid session or bypass
+    if (session || bypassAuth) {
+      loadTimers()
+      updateTimerSessions()
+      loadAllTimerLogs()
+    }
-  }, [session, bypassAuth])
+  }, [session, bypassAuth])
-  // Load timers on component mount
-  useEffect(() => {
-    loadTimers()
-      } else if (isRunning && timeLeft <= 0) {
-        // Timer continues into overtime
-        setTimeLeft(prev => prev - 1)
-        // Only log expiration once when it first hits 0
-        if (timeLeft === 0) {
-          logTimerAction('expired', 0, 0, `Timer expired naturally, continuing into overtime`)
-        }
-      setCurrentTime(Date.now())
-    }, 1000)
-    
-    return () => clearInterval(sessionInterval)
    // Load initial data when we have a valid session or bypass
    if (session || bypassAuth) {
      loadTimers()
      updateTimerSessions()
      loadAllTimerLogs()
    }
  }, [session, bypassAuth])

  // Update current time every second for real-time calculations
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    
    return () => clearInterval(timeInterval)
-  }, [])
+  // Update current time every second for real-time calculations
+  useEffect(() => {
+    const timeInterval = setInterval(() => {
+      setCurrentTime(Date.now())
+    }, 1000)
+    
+    return () => clearInterval(timeInterval)
+  }, [])