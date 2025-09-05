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
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-extrabold mb-6 leading-tight">
          SyncCue Pro: Timers that Stay in Sync
        </h1>
        <p className="text-xl text-gray-300 mb-10">
          Professional presentation timers with remote control, real-time updates, and customizable cues.
          Keep your events, classes, and presentations perfectly on schedule.
        </p>
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
      </div>
    </div>
  );
}