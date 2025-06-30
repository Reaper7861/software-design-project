// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {getAuth} from 'firebase/auth';
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBc63gB-VcvAkF9E3jnD_C6IINP2S_MBhU",
  authDomain: "software-design-project-d868e.firebaseapp.com",
  projectId: "software-design-project-d868e",
  storageBucket: "software-design-project-d868e.firebasestorage.app",
  messagingSenderId: "45952821906",
  appId: "1:45952821906:web:fb332d61585700efabd44b",
  measurementId: "G-B78W9ZGHE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//exporting auth and messaging
const auth = getAuth(app);
const messaging = getMessaging(app); 

export { auth, messaging };