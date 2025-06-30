//in-editor will show importScripts and firebase as undefined, THIS IS NORMAL

// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js');

// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBc63gB-VcvAkF9E3jnD_C6IINP2S_MBhU",
  authDomain: "software-design-project-d868e.firebaseapp.com",
  projectId: "software-design-project-d868e",
  messagingSenderId: "45952821906",
  appId: "1:45952821906:web:fb332d61585700efabd44b",
});

const messaging = firebase.messaging();