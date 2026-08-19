/**
 * pushNotifications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles OneSignal Web Push initialisation on the frontend.
 *
 * Flow:
 *   1. OneSignal SDK is loaded globally via index.html (CDN script tag).
 *   2. initPushNotifications(userId) is called once after the user logs in.
 *   3. The SDK prompts the user to allow push notifications.
 *   4. On grant, OneSignal returns a Player ID which we save to the backend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\\/$/, "");

// Your OneSignal App ID — set VITE_ONESIGNAL_APP_ID in frontend .env
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

let initialized = false;

/**
 * Initialise OneSignal and save the Player ID to the backend.
 * Safe to call multiple times — will skip if already initialised.
 * @param {string} userId - The logged-in user's MongoDB _id
 */
export async function initPushNotifications(userId) {
  if (!userId || !ONESIGNAL_APP_ID) {
    if (!ONESIGNAL_APP_ID) {
      console.warn('ℹ️  VITE_ONESIGNAL_APP_ID not set — push notifications skipped.');
    }
    return;
  }

  // Wait for OneSignal SDK to be available (loaded via CDN in index.html)
  if (typeof window.OneSignalDeferred === 'undefined') {
    console.warn('ℹ️  OneSignal SDK not found on page — push notifications skipped.');
    return;
  }

  if (initialized) return;
  initialized = true;

  try {
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        // Show native browser prompt immediately after init
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: 'push',
                autoPrompt: true,
                text: {
                  actionMessage: 'Get reminders 30 minutes before your SkillSwap sessions!',
                  acceptButton: 'Allow',
                  cancelButton: 'No thanks'
                },
                delay: {
                  pageViews: 1,
                  timeDelay: 5 // seconds after page load
                }
              }
            ]
          }
        },
        allowLocalhostAsSecureOrigin: true // Enable during local development
      });

      // Set the external user ID so OneSignal can target by userId
      OneSignal.login(userId);

      // Listen for subscription changes and save the Player ID
      OneSignal.User.PushSubscription.addEventListener('change', async (event) => {
        if (event.current.isSubscribed) {
          const playerId = event.current.id;
          if (playerId) {
            await savePlayerIdToBackend(userId, playerId);
          }
        }
      });

      // If already subscribed (returning user), sync Player ID
      const isSubscribed = OneSignal.User.PushSubscription.isSubscribed;
      if (isSubscribed) {
        const playerId = OneSignal.User.PushSubscription.id;
        if (playerId) {
          await savePlayerIdToBackend(userId, playerId);
        }
      }
    });
  } catch (err) {
    console.error('OneSignal init error:', err);
  }
}

/**
 * Persist the OneSignal Player ID to the SkillSwap backend.
 */
async function savePlayerIdToBackend(userId, playerId) {
  try {
    await fetch(`${API_URL}/api/users/${userId}/push-subscription`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oneSignalPlayerId: playerId })
    });
    console.log('✅ OneSignal Player ID saved to backend:', playerId);
  } catch (err) {
    console.error('Failed to save OneSignal Player ID:', err);
  }
}
