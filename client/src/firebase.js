import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyC0hb_VcyD_cHb7rMF26s3ISTh2_mYsi9w",
  authDomain: "collabsheetss.firebaseapp.com",
  projectId: "collabsheetss",
  storageBucket: "collabsheetss.firebasestorage.app",
  messagingSenderId: "381141306368",
  appId: "1:381141306368:web:97fe82ba7206ebd09adce5",
  measurementId: "G-GM86NYHKQ6"
}

// Initialize Firebase only if the config is present
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()