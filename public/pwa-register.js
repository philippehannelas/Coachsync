// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Handle install prompt
let deferredPrompt;
const installButton = document.getElementById('install-pwa-button');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show install button
  if (installButton) {
    installButton.style.display = 'block';
  }
});

// Install button click handler
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Clear the deferredPrompt
    deferredPrompt = null;
    // Hide the install button
    installButton.style.display = 'none';
  });
}

// Track if app is installed
window.addEventListener('appinstalled', () => {
  console.log('✅ AthleteHub has been installed');
  deferredPrompt = null;
});

// Check if running as PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Log PWA status
if (isPWA()) {
  console.log('✅ Running as installed PWA');
} else {
  console.log('ℹ️ Running in browser');
}
