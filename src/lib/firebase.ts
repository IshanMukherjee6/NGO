import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
    apiKey: "AIzaSyAMKtqPxd9-eMegDJTWmLDntjc4mbvMoLA",
    authDomain: "teamspirit-fb230.firebaseapp.com",
    databaseURL: "https://teamspirit-fb230-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "teamspirit-fb230",
    storageBucket: "teamspirit-fb230.firebasestorage.app",
    messagingSenderId: "1033012187051",
    appId: "1:1033012187051:web:4ce2c45ac9ce7b89128cee"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app