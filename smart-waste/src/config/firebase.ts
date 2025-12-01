import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAiwnXHxEUUWVq3aRqBwAo1_k0t5lPY2HA",
  authDomain: "smart-waste-management-f008e.firebaseapp.com",
  databaseURL:
    "https://smart-waste-management-f008e-default-rtdb.firebaseio.com",
  projectId: "smart-waste-management-f008e",
  storageBucket: "smart-waste-management-f008e.appspot.com",
  messagingSenderId: "114093978875",
  appId: "1:114093978875:web:04df9ca1491339ce7dec5e",
  measurementId: "G-LPXPGXXRQR",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
