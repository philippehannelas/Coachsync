import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Check for service worker support
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
          console.log('[App] Service Worker registered');
          setRegistration(reg);

          // Check for updates every 60 seconds
          setInterval(() => {
            reg.update();
          }, 60000);

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('[App] New version available!');
                setShowUpdate(true);
              }
            });
          });
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error);
        });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[App] New service worker activated, reloading...');
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Update Available!</h3>
            <p className="text-sm text-white/90 mb-3">
              A new version of CoachSync is ready. Update now for the latest features and improvements.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
