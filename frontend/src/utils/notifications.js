import { getToken, onMessage  } from "firebase/messaging";
import { messaging } from "../firebase";

//grabs the FCM token 
export const getFcmToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: 'BO-QPzoEL6lO0nyJ1m1QSTfw34zxHFEiLalwxiFT02Yw200nu_e3rzyNx8EnKfvPmxN_Bu7oKuVd6F9s1xrNt1k'
    });

    if (currentToken) {
      console.log('FCM Token retrieved:', currentToken);
      return currentToken;
    } else {
      console.warn('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving FCM token:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      resolve(payload);
    });
  });