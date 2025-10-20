import React, { useState } from 'react';
import Auth from './Auth'; // Assuming Auth.js is in the same directory

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('signIn'); // 'signIn' or 'signUp'

  const handleShowAuth = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  if (showAuth) {
    return <Auth initialMode={authMode} onClose={handleCloseAuth} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-extrabold mb-6 leading-tight">
          SyncCue Pro: Secure Presentation Timing
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Professional presentation timers with enterprise-grade security, PIN authentication, and real-time updates.
          Keep your events perfectly on schedule with verified presenter access.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔒</div>
            <div className="font-semibold text-white mb-1">PIN-Protected Access</div>
            <div className="text-gray-400">Verify presenter identity with flexible security levels</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="font-semibold text-white mb-1">Real-Time Sync</div>
            <div className="text-gray-400">Instant updates across all devices and presenters</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold text-white mb-1">Complete Audit Trails</div>
            <div className="text-gray-400">Track all access attempts and security events</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => handleShowAuth('signIn')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
          >
            Sign In
          </button>
          <button
            onClick={() => handleShowAuth('signUp')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
          >
            Sign Up
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <a href="/privacy" className="underline hover:text-gray-300">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}