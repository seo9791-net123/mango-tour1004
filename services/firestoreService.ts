
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  getDoc 
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { setCloudinaryConfig } from "./uploadService";
import { 
  PageContent,
  PopupNotification
} from "../types";
import { 
  INITIAL_PRODUCTS, 
  INITIAL_VIDEOS, 
  INITIAL_POSTS, 
  HERO_IMAGES, 
  SUB_MENU_ITEMS, 
  INITIAL_PAGE_CONTENTS,
  INITIAL_POPUP,
  INITIAL_CUSTOM_PACKAGES
} from "../constants";

// 데이터 컬렉션 이름 정의
const COLLECTIONS = {
  PRODUCTS: "products",
  VIDEOS: "videos",
  POSTS: "posts",
  PAGES: "pages",
  SETTINGS: "settings", // Hero Images, Menu Items, Cloudinary Config 등을 저장
  POPUP: "popup",
  CUSTOM_PACKAGES: "custom_packages"
};

export const firestoreService = {
  
  /**
   * 앱 초기 로딩 시 모든 데이터를 가져옵니다.
   * 데이터가 없으면 초기값(constants.ts)으로 DB를 채웁니다.
   */
  async loadGlobalData() {
    // Default fallback local data
    const localDataFallback = {
      heroImages: HERO_IMAGES,
      menuItems: SUB_MENU_ITEMS,
      products: INITIAL_PRODUCTS,
      videos: INITIAL_VIDEOS,
      posts: INITIAL_POSTS,
      pageContents: INITIAL_PAGE_CONTENTS,
      popup: INITIAL_POPUP,
      customPackages: INITIAL_CUSTOM_PACKAGES,
      cloudinaryConfig: { cloudName: '', uploadPreset: '' },
      isDefaultConfig: true,
      isLocal: true
    };

    if (!db) {
      console.log("Firebase DB not initialized, using local fallback mode");
      return localDataFallback;
    }

    // Helper for timeout
    const withTimeout = <T>(promise: Promise<T>, ms: number = 3000): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Firestore operation timed out")), ms))
        ]);
    };

    try {
      console.log("Fetching data from Firestore server...");
      
      // 1. Settings (Hero Images, Menu Items, Cloudinary Image Server Config)
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, "global");
      const settingsSnap = await withTimeout(getDoc(settingsRef));
      
      let heroImages = HERO_IMAGES;
      let menuItems = SUB_MENU_ITEMS;
      let cloudinaryConfig = { cloudName: '', uploadPreset: '' };

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.heroImages) heroImages = data.heroImages;
        if (data.menuItems) menuItems = data.menuItems;
        if (data.cloudinaryConfig) {
          cloudinaryConfig = data.cloudinaryConfig;
          if (data.cloudinaryConfig.cloudName || data.cloudinaryConfig.uploadPreset) {
            setCloudinaryConfig(data.cloudinaryConfig.cloudName || '', data.cloudinaryConfig.uploadPreset || '');
            console.log("Applied cloud-synced Cloudinary settings from Firestore.");
          }
        }
      }

      // 2. Products
      const products = await withTimeout(this.fetchOrSeedCollection(COLLECTIONS.PRODUCTS, INITIAL_PRODUCTS));
      
      // 3. Videos
      const videos = await withTimeout(this.fetchOrSeedCollection(COLLECTIONS.VIDEOS, INITIAL_VIDEOS));
      
      // 4. Posts
      const posts = await withTimeout(this.fetchOrSeedCollection(COLLECTIONS.POSTS, INITIAL_POSTS));

      // 5. Pages
      let pageContents = { ...INITIAL_PAGE_CONTENTS };
      const pagesSnap = await withTimeout(getDocs(collection(db, COLLECTIONS.PAGES)));
      
      if (!pagesSnap.empty) {
        pagesSnap.forEach(doc => {
          const data = doc.data() as PageContent;
          pageContents[data.id] = data;
        });
      }

      // 6. Popup
      const popupRef = doc(db, COLLECTIONS.POPUP, "main");
      const popupSnap = await withTimeout(getDoc(popupRef));
      let popup = INITIAL_POPUP;
      if (popupSnap.exists()) {
        popup = popupSnap.data() as PopupNotification;
      }

      // 7. Custom Trip Packages
      const customPackages = await withTimeout(this.fetchOrSeedCollection(COLLECTIONS.CUSTOM_PACKAGES, INITIAL_CUSTOM_PACKAGES));

      return {
        heroImages,
        menuItems,
        products,
        videos,
        posts,
        pageContents,
        popup,
        customPackages,
        cloudinaryConfig,
        isDefaultConfig: false,
        isLocal: false
      };

    } catch (error: any) {
      console.warn("Firestore offline, unreachable, or error occurred. Falling back to local data.", error.message);
      return localDataFallback;
    }
  },

  /**
   * 컬렉션을 가져오거나, 비어있다면 초기 데이터로 채웁니다.
   */
  async fetchOrSeedCollection(collectionName: string, initialData: any[]) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    if (querySnapshot.empty && initialData.length > 0) {
      console.log(`Seeding ${collectionName}...`);
      const batch = writeBatch(db);
      initialData.forEach(item => {
        const ref = doc(db, collectionName, item.id);
        batch.set(ref, item);
      });
      await batch.commit();
      return initialData;
    }

    const data: any[] = [];
    querySnapshot.forEach(doc => {
      data.push(doc.data());
    });
    return data;
  },

  /**
   * 배열 형태의 데이터(상품, 비디오, 게시글)를 동기화합니다.
   * - 새로운 아이템은 추가/수정
   * - 없어진 아이템은 삭제
   */
  async syncCollection(collectionName: string, newItems: any[]) {
    if (!db || !navigator.onLine) return;

    try {
      // 1. 현재 DB에 있는 모든 ID 가져오기
      const snapshot = await getDocs(collection(db, collectionName));
      const dbIds = new Set<string>();
      snapshot.forEach(d => dbIds.add(d.id));

      const batch = writeBatch(db);
      const newIds = new Set<string>();

      // 2. 추가 및 수정 (Upsert)
      newItems.forEach(item => {
        if (!item.id) return; // ID 필수
        newIds.add(item.id);
        const ref = doc(db, collectionName, item.id);
        batch.set(ref, item, { merge: true });
      });

      // 3. 삭제 (DB에는 있는데 새로운 배열에는 없는 것)
      dbIds.forEach(id => {
        if (!newIds.has(id)) {
          const ref = doc(db, collectionName, id);
          batch.delete(ref);
        }
      });

      await batch.commit();
      console.log(`Synced ${collectionName} successfully.`);
    } catch (e: any) {
      console.error(`Error syncing ${collectionName}:`, e);
      if (e.message?.includes('exceeds the maximum allowed size')) {
        alert(`❌ 저장 실패: '${collectionName}' 데이터가 너무 큽니다 (1MB 제한 초과).\n\n원인: 고화질 이미지를 너무 많이 추가했거나, 이미지 서버(Cloudinary) 연결 실패로 이미지가 텍스트(Base64)로 저장되었습니다.\n\n해결방법: 최근에 추가한 큰 이미지를 삭제하거나, 이미지 용량을 줄여서 다시 시도해주세요.`);
      } else if (e.code === 'resource-exhausted') {
        console.warn("Firestore write stream exhausted. Skipping this sync to prevent overload.");
      } else {
        // 너무 잦은 알림 방지를 위해 콘솔 출력만 수행
        console.warn("데이터 저장 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.");
      }
    }
  },

  /**
   * 설정 데이터(이미지 배열, 메뉴 아이템) 저장
   */
  async saveSettings(key: 'heroImages' | 'menuItems' | 'cloudinaryConfig', data: any) {
    if (!db || !navigator.onLine) return;
    try {
      const ref = doc(db, COLLECTIONS.SETTINGS, "global");
      await setDoc(ref, { [key]: data }, { merge: true });
    } catch (e: any) {
      if (e.code === 'resource-exhausted') {
        console.warn("Firestore write stream exhausted. Skipping settings save.");
      } else {
        console.error("Error saving settings:", e);
      }
    }
  },

  /**
   * Cloudinary 이미지 서버 설정을 Firestore에 클라우드 동기화 저장
   */
  async saveCloudinaryConfig(cloudName: string, uploadPreset: string) {
    if (!db || !navigator.onLine) return;
    try {
      const ref = doc(db, COLLECTIONS.SETTINGS, "global");
      await setDoc(ref, { 
        cloudinaryConfig: { 
          cloudName: (cloudName || '').trim(), 
          uploadPreset: (uploadPreset || '').trim(),
          updatedAt: new Date().toISOString()
        } 
      }, { merge: true });
      console.log("Cloudinary configuration saved to Firestore settings/global.");
    } catch (e: any) {
      console.error("Failed to save Cloudinary configuration to Firestore:", e);
    }
  },

  /**
   * 페이지 컨텐츠 저장
   */
  async savePageContent(pageId: string, content: PageContent) {
    if (!db || !navigator.onLine) return;
    try {
      const ref = doc(db, COLLECTIONS.PAGES, pageId);
      await setDoc(ref, content, { merge: true });
    } catch (e: any) {
      if (e.code === 'resource-exhausted') {
        console.warn("Firestore write stream exhausted. Skipping page save.");
      } else {
        console.error("Error saving page:", e);
      }
    }
  },
  
  // 전체 페이지 컨텐츠 객체 저장용 헬퍼
  async syncAllPages(pages: Record<string, PageContent>) {
      if (!db || !navigator.onLine) return;
      try {
        const batch = writeBatch(db);
        Object.values(pages).forEach(page => {
            const ref = doc(db, COLLECTIONS.PAGES, page.id);
            batch.set(ref, page, { merge: true });
        });
        await batch.commit();
      } catch (e: any) {
        if (e.code === 'resource-exhausted') {
          console.warn("Firestore write stream exhausted. Skipping all pages sync.");
        } else {
          console.error("Error syncing all pages:", e);
        }
      }
  },

  async savePopup(popup: PopupNotification) {
    if (!db || !navigator.onLine) return;
    try {
      const ref = doc(db, COLLECTIONS.POPUP, "main");
      await setDoc(ref, popup, { merge: true });
    } catch (e: any) {
      if (e.code === 'resource-exhausted') {
        console.warn("Firestore write stream exhausted. Skipping popup save.");
      } else {
        console.error("Error saving popup:", e);
      }
    }
  }
};
