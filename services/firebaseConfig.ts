
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// 제공해주신 설정값 적용 (localStorage 우선, 그 다음 환경 변수, 마지막으로 플레이스홀더)
const firebaseConfig = {
  apiKey: localStorage.getItem('fb_api_key') || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy...",
  authDomain: localStorage.getItem('fb_auth_domain') || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: localStorage.getItem('fb_project_id') || import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project",
  storageBucket: localStorage.getItem('fb_storage_bucket') || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: localStorage.getItem('fb_messaging_sender_id') || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "...",
  appId: localStorage.getItem('fb_app_id') || import.meta.env.VITE_FIREBASE_APP_ID || "..."
};

// Firebase 앱 초기화 (싱글톤 패턴)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore 초기화 (네트워크 환경에 따른 롱폴링 강제 설정)
// experimentalForceLongPolling: true와 experimentalAutoDetectLongPolling: false를 함께 사용하여
// WebSocket 시도를 완전히 차단하고 HTTP 롱폴링만 사용하도록 합니다.
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
  // 일부 환경에서 fetch 스트림 문제로 오프라인 에러가 발생하는 것을 방지
  useFetchStreams: false,
} as any); // useFetchStreams는 일부 버전에 따라 타입 정의가 다를 수 있어 any 처리

const auth = getAuth(app);
const storage = getStorage(app);

console.log("Firebase initialized with Long Polling enabled");

export { app, db, auth, storage };
