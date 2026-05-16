import admin from "firebase-admin";
import fs from "fs";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "pollution-messaging-web-firebase-adminsdk-fbsvc-f3a6175052.json";
let messaging: any = null;

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  messaging = admin.messaging();
} catch (error) {
  console.warn("Firebase admin not initialized. Messaging will be disabled:", error);
  messaging = {
    sendEachForMulticast: async () => {
      throw new Error("Firebase messaging is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH to a valid service account JSON file.");
    },
    send: async () => {
      throw new Error("Firebase messaging is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH to a valid service account JSON file.");
    },
  };
}

export { messaging };
