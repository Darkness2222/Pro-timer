import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, QrCode, Send, Copy, Eye } from 'lucide-react';

const ProTimerApp = () => {
  const [currentView, setCurrentView] = useState('admin');
  const [showQR, setShowQR] = useState(false);

  const AdminView = () => (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* ... all your Admin code here ... */}
    </div>
  );

  const PresenterView = () => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 relative">
      {/* ... all your Presenter code here ... */}
    </div>
  );

  const CreateView = () => (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* ... all your Create Timer code here ... */}
    </div>
  );

  return (
    <div className="w-full">
      {/* Top nav buttons to switch views */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4 border-b border-gray-700">
        <button
          onClick={() => setCurrentView('admin')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentView === 'admin'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          👨‍💼 Admin Dashboard
        </button>
        <button
          onClick={() => setCurrentView('presenter')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentView === 'presenter'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🎯 Presenter View
        </button>
        <button
          onClick={() => setCurrentView('create')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentView === 'create'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ➕ Create Timer
        </button>
      </div>

      {/* Switch views */}
      {currentView === 'admin' && <AdminView />}
      {currentView === 'presenter' && <PresenterView />}
      {currentView === 'create' && <CreateView />}
    </div>
  );
};

export default ProTimerApp;