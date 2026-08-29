
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// URL 파라미터를 통한 다른 컴퓨터/기기 설정 자동 감지 및 저장 (?sync_config=... 또는 ?fb_config=...)
if (typeof window !== 'undefined' && window.location) {
  try {
    const params = new URLSearchParams(window.location.search);
    const syncParam = params.get('sync_config') || params.get('fb_config');
    if (syncParam) {
      const decodedJson = decodeURIComponent(atob(syncParam));
      const config = JSON.parse(decodedJson);
      if (config.fbApiKey) localStorage.setItem('fb_api_key', config.fbApiKey);
      if (config.fbAuthDomain) localStorage.setItem('fb_auth_domain', config.fbAuthDomain);
      if (config.fbDatabaseURL) localStorage.setItem('fb_database_url', config.fbDatabaseURL);
      if (config.fbProjectId) localStorage.setItem('fb_project_id', config.fbProjectId);
      if (config.fbStorageBucket) localStorage.setItem('fb_storage_bucket', config.fbStorageBucket);
      if (config.fbMessagingSenderId) localStorage.setItem('fb_messaging_sender_id', config.fbMessagingSenderId);
      if (config.fbAppId) localStorage.setItem('fb_app_id', config.fbAppId);
      if (config.fbMeasurementId) localStorage.setItem('fb_measurement_id', config.fbMeasurementId);
      if (config.cloudName) localStorage.setItem('cloudinary_cloud_name', config.cloudName);
      if (config.uploadPreset) localStorage.setItem('cloudinary_upload_preset', config.uploadPreset);
      console.log("Config successfully synchronized from URL parameter.");
    }
  } catch (e) {
    console.warn("Failed to parse sync_config from URL parameter:", e);
  }
}

// 기본 권장 설정값 (다른 컴퓨터에서도 기본적으로 동일한 DB를 바라보도록 유지)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCMBakjmKmcJl6WEFkSjmPS7iKRJSPNlf0",
  authDomain: "gen-lang-client-0698853496.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0698853496-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0698853496",
  storageBucket: "gen-lang-client-0698853496.appspot.com",
  messagingSenderId: "517438076",
  appId: "1:517438076:web:eb2d6156caf063415427f9",
  measurementId: "G-EF42069ZSS"
};

// 설정값 적용 (localStorage 우선, 그 다음 환경 변수, 마지막으로 기본 내장 설정)
const firebaseConfig = {
  apiKey: localStorage.getItem('fb_api_key') || import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: localStorage.getItem('fb_auth_domain') || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  databaseURL: localStorage.getItem('fb_database_url') || DEFAULT_FIREBASE_CONFIG.databaseURL,
  projectId: localStorage.getItem('fb_project_id') || import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: localStorage.getItem('fb_storage_bucket') || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: localStorage.getItem('fb_messaging_sender_id') || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: localStorage.getItem('fb_app_id') || import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: localStorage.getItem('fb_measurement_id') || DEFAULT_FIREBASE_CONFIG.measurementId
};

const isDefaultConfig = !localStorage.getItem('fb_project_id') && !import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Firebase 앱 및 Firestore 안전한 초기화
let app: any = null;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.error("Firebase app initialization failed:", e);
}

let db: any = null;
let auth: any = null;
let storage: any = null;

if (app) {
  try {
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Firebase services initialization failed:", e);
  }
}

export { app, db, auth, storage, isDefaultConfig, firebaseConfig };


