@@ .. @@
          )}
        </div>
      )}

+      {/* Presenter View */}
+      {currentView === 'presenter' && (
+        <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
+          {selectedTimer ? (
+            <div className="text-center">
+              <h1 className="text-4xl font-bold text-white mb-4">{selectedTimer.name}</h1>
+              <p className="text-2xl text-gray-300 mb-8">Presenter: {selectedTimer.presenter_name}</p>
+              <div className={`text-8xl font-mono font-bold mb-8 ${
+                timeLeft < 0 ? 'text-red-500 animate-pulse' : 'text-orange-400'
+              }`}>
+                {formatTime(timeLeft)}
+              </div>
+              {timeLeft < 0 && (
+                <div className="text-4xl font-bold text-red-500 mb-4">
+                  ⚠️ OVERTIME ⚠️
+                </div>
+              )}
+              <div className="w-96 bg-gray-700 rounded-full h-6 mb-8">
+                <div
+                  className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-6 rounded-full transition-all duration-1000"
+                  style={{ width: `${Math.min(100, getProgressPercentage())}%` }}
+                ></div>
+              </div>
+              {messages.length > 0 && (
+                <div className="bg-blue-900/50 rounded-lg p-4 max-w-md mx-auto">
+                  <h3 className="text-white font-bold mb-2">Latest Message:</h3>
+                  <p className="text-blue-200">{messages[0]?.message}</p>
+                </div>
+              )}
+            </div>
+          ) : (
+            <div className="text-center">
+              <TimerIcon className="w-24 h-24 text-gray-600 mx-auto mb-4" />
+              <h2 className="text-3xl font-bold text-white mb-2">No Timer Selected</h2>
+              <p className="text-gray-400">Select a timer from the Admin Dashboard to display it here</p>
+            </div>
+          )}
+        </div>
+      )}
+
+      {/* Timer Overview */}
+      {currentView === 'overview' && (
+        <div className="min-h-screen w-full bg-gray-900 p-6">
+          <div className="max-w-7xl mx-auto">
+            <div className="mb-8">
+              <h1 className="text-3xl font-bold text-white mb-2">Timer Overview</h1>
+              <p className="text-gray-300">Monitor and control all your timers</p>
+            </div>
+
+            {/* Bulk Controls */}
+            <div className="mb-6 flex gap-4">
+              <button
+                onClick={handlePauseAll}
+                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
+              >
+                <Pause className="w-5 h-5" />
+                Pause All
+              </button>
+              <button
+                onClick={handlePlayAll}
+                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
+              >
+                <Play className="w-5 h-5" />
+                Play All
+              </button>
+            </div>
+
+            {/* Timers Grid */}
+            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
+              {timers.map((timer) => {
+                const session = timerSessions[timer.id];
+                return (
+                  <div
+                    key={timer.id}
+                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 cursor-pointer hover:border-gray-600 transition-all"
+                    onClick={() => {
+                      selectTimer(timer);
+                      setCurrentView('admin');
+                    }}
+                  >
+                    <div className="flex justify-between items-start mb-4">
+                      <div className={`w-3 h-3 rounded-full ${session?.is_running ? 'bg-green-500' : 'bg-red-500'}`}></div>
+                      <button
+                        onClick={(e) => {
+                          e.stopPropagation();
+                          handleFinishTimer(timer.id);
+                        }}
+                        disabled={!session?.is_running}
+                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
+                      >
+                        <CheckCircle className="w-4 h-4" />
+                        Finish
+                      </button>
+                    </div>
+                    
+                    <h3 className="text-xl font-bold text-white mb-2">{timer.name}</h3>
+                    <p className="text-gray-300 mb-4">Presenter: {timer.presenter_name}</p>
+                    
+                    <div className="text-3xl font-mono text-blue-400 mb-4">
+                      {formatTimeFromSession(session, timer.duration)}
+                    </div>
+                    
+                    <div className="w-full bg-gray-700 rounded-full h-2">
+                      <div
+                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-1000"
+                        style={{ width: `${Math.min(100, getProgressPercentageFromSession(session, timer.duration))}%` }}
+                      ></div>
+                    </div>
+                  </div>
+                );
+              })}
+            </div>
+          </div>
+        </div>
+      )}
+
+      {/* Reports View */}
+      {currentView === 'reports' && (
+        <div className="min-h-screen w-full bg-gray-900 p-6">
+          <div className="max-w-7xl mx-auto">
+            <div className="mb-8">
+              <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
+              <p className="text-gray-300">Track timer usage and efficiency</p>
+            </div>
+
+            {/* Date Range Filter */}
+            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
+              <h3 className="text-xl font-bold text-white mb-4">Filter Reports</h3>
+              <div className="flex gap-4 items-end">
+                <div>
+                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
+                  <input
+                    type="date"
+                    value={startDate}
+                    onChange={(e) => setStartDate(e.target.value)}
+                    className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
+                  />
+                </div>
+                <div>
+                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
+                  <input
+                    type="date"
+                    value={endDate}
+                    onChange={(e) => setEndDate(e.target.value)}
+                    className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
+                  />
+                </div>
+                <button
+                  onClick={exportFilteredCSV}
+                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
+                >
+                  <Download className="w-4 h-4" />
+                  Export CSV
+                </button>
+              </div>
+            </div>
+
+            {/* Summary Stats */}
+            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
+              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
+                <div className="flex items-center justify-between">
+                  <div>
+                    <p className="text-gray-400 text-sm">Total Timers</p>
+                    <p className="text-2xl font-bold text-white">{timers.length}</p>
+                  </div>
+                  <TimerIcon className="w-8 h-8 text-blue-400" />
+                </div>
+              </div>
+              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
+                <div className="flex items-center justify-between">
+                  <div>
+                    <p className="text-gray-400 text-sm">Total Actions</p>
+                    <p className="text-2xl font-bold text-white">{getFilteredLogs().length}</p>
+                  </div>
+                  <BarChart3 className="w-8 h-8 text-green-400" />
+                </div>
+              </div>
+              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
+                <div className="flex items-center justify-between">
+                  <div>
+                    <p className="text-gray-400 text-sm">Active Sessions</p>
+                    <p className="text-2xl font-bold text-white">
+                      {Object.values(timerSessions).filter(s => s?.is_running).length}
+                    </p>
+                  </div>
+                  <Play className="w-8 h-8 text-yellow-400" />
+                </div>
+              </div>
+              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
+                <div className="flex items-center justify-between">
+                  <div>
+                    <p className="text-gray-400 text-sm">Presenters</p>
+                    <p className="text-2xl font-bold text-white">
+                      {new Set(timers.map(t => t.presenter_name)).size}
+                    </p>
+                  </div>
+                  <Users className="w-8 h-8 text-purple-400" />
+                </div>
+              </div>
+            </div>
+
+            {/* Activity Log */}
+            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
+              <h3 className="text-xl font-bold text-white mb-4">Activity Log</h3>
+              <div className="overflow-x-auto">
+                <table className="w-full text-sm">
+                  <thead>
+                    <tr className="border-b border-gray-700">
+                      <th className="text-left py-2 text-gray-300">Date</th>
+                      <th className="text-left py-2 text-gray-300">Timer</th>
+                      <th className="text-left py-2 text-gray-300">Presenter</th>
+                      <th className="text-left py-2 text-gray-300">Action</th>
+                      <th className="text-left py-2 text-gray-300">Status</th>
+                    </tr>
+                  </thead>
+                  <tbody className="bg-gray-800">
+                    {getFilteredLogs().slice(0, 50).map((log, index) => (
+                      <tr key={index} className="border-b border-gray-700">
+                        <td className="py-2 text-gray-300">
+                          {new Date(log.created_at).toLocaleDateString()}
+                        </td>
+                        <td className="py-2 text-white">{log.timers?.name || 'Unknown'}</td>
+                        <td className="py-2 text-gray-300">{log.timers?.presenter_name || 'Unknown'}</td>
+                        <td className="py-2 text-gray-300">{log.action}</td>
+                        <td className="py-2">
+                          {log.action === 'expired' && <span className="text-red-400">⚠️ Overtime</span>}
+                          {log.action === 'finished' && <span className="text-green-400">✅ Finished Early</span>}
+                          {!['expired', 'finished'].includes(log.action) && <span className="text-gray-400">-</span>}
+                        </td>
+                      </tr>
+                    ))}
+                  </tbody>
+                </table>
+              </div>
+            </div>
+          </div>
+        </div>
+      )}
+
+      {/* Create Timer Modal */}
+      {showCreateModal && (
+        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
+          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
+            <div className="flex justify-between items-center mb-6">
+              <h2 className="text-2xl font-bold text-white">Create New Timer</h2>
+              <button
+                onClick={() => setShowCreateModal(false)}
+                className="text-gray-400 hover:text-white transition-colors"
+              >
+                <X className="w-6 h-6" />
+              </button>
+            </div>
+
+            {/* Timer Type Selection */}
+            <div className="mb-6">
+              <label className="block text-sm font-medium text-gray-300 mb-3">Timer Type</label>
+              <div className="flex gap-4">
+                <button
+                  onClick={() => setTimerType('single')}
+                  className={`px-4 py-2 rounded-lg border transition-colors ${
+                    timerType === 'single'
+                      ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-400'
+                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
+                  }`}
+                >
+                  Single Timer
+                </button>
+                <button
+                  onClick={() => setTimerType('event')}
+                  className={`px-4 py-2 rounded-lg border transition-colors ${
+                    timerType === 'event'
+                      ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-400'
+                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
+                  }`}
+                >
+                  Event Timer
+                </button>
+              </div>
+            </div>
+
+            {timerType === 'single' ? (
+              <div className="space-y-4">
+                <div>
+                  <label className="block text-sm font-medium text-gray-300 mb-2">Timer Name</label>
+                  <input
+                    type="text"
+                    value={newTimerName}
+                    onChange={(e) => setNewTimerName(e.target.value)}
+                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
+                    placeholder="e.g., Opening Keynote"
+                  />
+                </div>
+                <div>
+                  <label className="block text-sm font-medium text-gray-300 mb-2">Presenter Name</label>
+                  <input
+                    type="text"
+                    value={newTimerPresenter}
+                    onChange={(e) => setNewTimerPresenter(e.target.value)}
+                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
+                    placeholder="e.g., John Smith"
+                  />
+                </div>
+                <div>
+                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
+                  <input
+                    type="number"
+                    value={newTimerDuration}
+                    onChange={(e) => setNewTimerDuration(e.target.value)}
+                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
+                    placeholder="e.g., 15"
+                    min="1"
+                  />
+                </div>
+              </div>
+            ) : (
+              <div className="space-y-6">
+                <div>
+                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Name</label>
+                  <input
+                    type="text"
+                    value={eventName}
+                    onChange={(e) => setEventName(e.target.value)}
+                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
+                    placeholder="e.g., Tech Conference 2024"
+                  />
+                </div>
+
+                <div>
+                  <div className="flex justify-between items-center mb-3">
+                    <label className="block text-sm font-medium text-gray-300">Presenters</label>
+                    <button
+                      onClick={addPresenter}
+                      disabled={presenters.length >= 8}
+                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
+                    >
+                      <Plus className="w-4 h-4" />
+                      Add Presenter
+                    </button>
+                  </div>
+                  
+                  <div className="space-y-3">
+                    {presenters.map((presenter, index) => (
+                      <div key={presenter.id} className="flex gap-3 items-center bg-gray-700 p-3 rounded">
+                        <div className="flex-1">
+                          <input
+                            type="text"
+                            value={presenter.name}
+                            onChange={(e) => updatePresenter(presenter.id, 'name', e.target.value)}
+                            className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
+                            placeholder={`Presenter ${index + 1} name`}
+                          />
+                        </div>
+                        <div className="flex gap-2">
+                          <input
+                            type="number"
+                            value={presenter.minutes}
+                            onChange={(e) => updatePresenter(presenter.id, 'minutes', parseInt(e.target.value) || 0)}
+                            className="w-16 bg-gray-600 text-white px-2 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
+                            min="0"
+                            max="59"
+                          />
+                          <span className="text-gray-300 py-2">m</span>
+                          <input
+                            type="number"
+                            value={presenter.seconds}
+                            onChange={(e) => updatePresenter(presenter.id, 'seconds', parseInt(e.target.value) || 0)}
+                            className="w-16 bg-gray-600 text-white px-2 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
+                            min="0"
+                            max="59"
+                          />
+                          <span className="text-gray-300 py-2">s</span>
+                        </div>
+                        {presenters.length > 1 && (
+                          <button
+                            onClick={() => removePresenter(presenter.id)}
+                            className="text-red-400 hover:text-red-300 p-1"
+                          >
+                            <X className="w-4 h-4" />
+                          </button>
+                        )}
+                      </div>
+                    ))}
+                  </div>
+                </div>
+
+                <div className="bg-gray-700 p-4 rounded">
+                  <h4 className="text-white font-medium mb-2">Event Summary</h4>
+                  <p className="text-gray-300 text-sm">
+                    Total estimated time: <span className="font-bold">{calculateEventTotalTime()} minutes</span>
+                  </p>
+                  <p className="text-gray-300 text-sm">
+                    This will create {presenters.length} individual timers
+                  </p>
+                </div>
+              </div>
+            )}
+
+            <div className="flex justify-end gap-4 mt-6">
+              <button
+                onClick={() => setShowCreateModal(false)}
+                className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
+              >
+                Cancel
+              </button>
+              <button
+                onClick={createTimer}
+                disabled={
+                  timerType === 'single' 
+                    ? !newTimerName.trim() || !newTimerPresenter.trim() || !newTimerDuration
+                    : !eventName.trim() || presenters.some(p => !p.name.trim())
+                }
+                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
+              >
+                Create {timerType === 'event' ? `${presenters.length} Timers` : 'Timer'}
+              </button>
+            </div>
+          </div>
+        </div>
+      )}
+
+      {/* Settings Modal */}
+      {showSettings && (
+        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
+          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
+            <div className="flex justify-between items-center mb-6">
+              <h2 className="text-2xl font-bold text-white">Settings</h2>
+              <button
+                onClick={() => setShowSettings(false)}
+                className="text-gray-400 hover:text-white transition-colors"
+              >
+                <X className="w-6 h-6" />
+              </button>
+            </div>
+
+            <div className="space-y-6">
+              <div>
+                <h3 className="text-lg font-medium text-white mb-3">Timer Preferences</h3>
+                <div className="space-y-3">
+                  <label className="flex items-center">
+                    <input type="checkbox" className="mr-3" />
+                    <span className="text-gray-300">Sound notifications</span>
+                  </label>
+                  <label className="flex items-center">
+                    <input type="checkbox" className="mr-3" />
+                    <span className="text-gray-300">Vibration feedback</span>
+                  </label>
+                  <label className="flex items-center">
+                    <input type="checkbox" className="mr-3" />
+                    <span className="text-gray-300">Auto-start next timer</span>
+                  </label>
+                </div>
+              </div>
+
+              <div>
+                <h3 className="text-lg font-medium text-white mb-3">Display Preferences</h3>
+                <div className="space-y-3">
+                  <label className="flex items-center">
+                    <input type="checkbox" className="mr-3" />
+                    <span className="text-gray-300">Show seconds</span>
+                  </label>
+                  <label className="flex items-center">
+                    <input type="checkbox" className="mr-3" />
+                    <span className="text-gray-300">24-hour format</span>
+                  </label>
+                  <label className="flex items-center">
+                    <input type="checkbox" className="mr-3" />
+                    <span className="text-gray-300">Fullscreen on start</span>
+                  </label>
+                </div>
+              </div>
+            </div>
+
+            <div className="flex justify-end gap-4 mt-6">
+              <button
+                onClick={() => setShowSettings(false)}
+                className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
+              >
+                Cancel
+              </button>
+              <button
+                onClick={() => setShowSettings(false)}
+                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
+              >
+                Save Settings
+              </button>
+            </div>
+          </div>
+        </div>
+      )}
+
+      {/* Subscription Modal */}
+      <SubscriptionModal
+        isOpen={showSubscriptionModal}
+        onClose={() => setShowSubscriptionModal(false)}
+        session={session}
+      />
+    </div>
+  )
+}