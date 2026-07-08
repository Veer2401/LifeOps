import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";
import * as fs from "fs";

let db: FirebaseFirestore.Firestore;
let auth: ReturnType<typeof getAuth>;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    db = getFirestore();
    auth = getAuth();
    return { db, auth };
  }

  try {
    const serviceAccountPath = path.resolve(process.cwd(), "server/service-account.json");
    if (!fs.existsSync(serviceAccountPath)) {
      console.warn("⚠️ Firebase Admin warning: service-account.json not found. Firestore will not work.");
      return null;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    
    initializeApp({
      credential: cert(serviceAccount)
    });

    db = getFirestore();
    auth = getAuth();
    console.log("🔥 Firebase Admin SDK initialized successfully.");
    
    return { db, auth };
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    return null;
  }
}

const adminApp = initializeFirebaseAdmin();

export { adminApp, db, auth };
