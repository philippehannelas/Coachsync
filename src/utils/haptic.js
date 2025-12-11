// Haptic Feedback Utility
// Provides tactile feedback for mobile interactions

export const haptic = {
  // Light tap (10ms) - For button taps, card taps
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  // Medium tap (20ms) - For pull-to-refresh, swipe complete
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  // Heavy tap (30-10-30ms pattern) - For errors, warnings
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 10, 30]);
    }
  },

  // Success pattern (10-50-10ms) - For booking confirmed, action complete
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  // Error pattern (50-30-50ms) - For errors
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  }
};

export default haptic;
