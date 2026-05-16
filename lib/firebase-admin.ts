import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const DEFAULT_SERVICE_ACCOUNT = "pollution-messaging-web-firebase-adminsdk-fbsvc-f3a6175052.json";

let _messaging: any = null;
let _initialized = false;

async function initFirebaseIfNeeded() {
  if (_initialized) return;
  _initialized = true;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || DEFAULT_SERVICE_ACCOUNT;

  try {
    const absolutePath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(process.cwd(), serviceAccountPath);

    if (!fs.existsSync(absolutePath)) {
      console.warn("Firebase service account file not found at", absolutePath);
      return;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, "utf8"));

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    _messaging = admin.messaging();
  } catch (error) {
    console.warn("Firebase admin not initialized. Messaging will be disabled:", error);
  }
}

export async function getMessaging() {
  await initFirebaseIfNeeded();
  if (!_messaging) {
    return {
      sendEachForMulticast: async () => {
        throw new Error("Firebase messaging is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH to a valid service account JSON file.");
      },
      send: async () => {
        throw new Error("Firebase messaging is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH to a valid service account JSON file.");
      },
    };
  }

  return _messaging;
}
