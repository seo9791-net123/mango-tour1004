
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ⚠️ 주의: Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트를 생성 후
// 설정(프로젝트 설정) > 일반 > '내 앱'에서 SDK 설정 및 구성을 선택하여 아래 내용을 채워주세요.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 앱 초기화
// 설정값이 비어있으면 초기화하지 않도록 하여 에러 방지
let app;
let db: any;
let auth: any;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase config is missing. Update services/firebaseConfig.ts");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { app, db, auth };
