importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js');

// Initialize Firebase with your config
firebase.initializeApp({
  apiKey: "AIzaSyBc63gB-VcvAkF9E3jnD_C6IINP2S_MBhU",
  authDomain: "software-design-project-d868e.firebaseapp.com",
  projectId: "software-design-project-d868e",
  storageBucket: "software-design-project-d868e.firebasestorage.app",
  messagingSenderId: "45952821906",
  appId: "1:45952821906:web:fb332d61585700efabd44b",
  measurementId: "G-B78W9ZGHE5"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Customize the notification shown by the service worker
  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/firebase-logo.png' // Optional: add an icon in your public folder
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);

  // Post the message to all clients (open tabs)
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'FCM_MESSAGE',
        payload: payload
      });
    });
  });
});