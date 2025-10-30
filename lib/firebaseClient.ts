import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let cachedApp: FirebaseApp | null = null;

function isValidConfig(cfg: typeof firebaseConfig): boolean {
  // apiKey de Firebase Web suele empezar con "AIza"
  const hasApiKey = typeof cfg.apiKey === "string" && cfg.apiKey.length > 0 && /^(AIza)/.test(cfg.apiKey);
  const required = [cfg.authDomain, cfg.projectId, cfg.appId];
  const haveRequired = required.every((v) => typeof v === "string" && v.length > 0);
  return hasApiKey && haveRequired;
}

export function getFirebaseApp(): FirebaseApp | null {
  // Evitar inicializar en el servidor (build/prerender)
  if (typeof window === "undefined") return null;
  if (cachedApp) return cachedApp;
  if (!isValidConfig(firebaseConfig)) {
    console.warn("Firebase config ausente o inválida. Verificá tus NEXT_PUBLIC_FIREBASE_* env vars.");
    return null;
  }
  cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}


