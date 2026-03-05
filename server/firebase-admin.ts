import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let firestoreDb: Firestore;
let adminAuth: Auth;

export function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      } catch (error) {
        console.error("Error parsing Firebase service account key:", error);
        app = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      }
    } else {
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } else {
    app = getApps()[0];
  }

  firestoreDb = getFirestore(app);
  adminAuth = getAuth(app);
  
  return { app, firestoreDb, adminAuth };
}

export function getFirestoreDb(): Firestore {
  if (!firestoreDb) {
    initializeFirebaseAdmin();
  }
  return firestoreDb;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    initializeFirebaseAdmin();
  }
  return adminAuth;
}

export { app, firestoreDb, adminAuth };
