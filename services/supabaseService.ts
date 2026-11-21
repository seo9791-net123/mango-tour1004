import { getSupabase, isSupabaseConfigured, setAdminSessionToken, clearAdminSessionToken } from './supabaseClient';
import { setCloudinaryConfig } from './uploadService';
import { storageService } from './storageService';
import { 
  Product, 
  VideoItem, 
  CommunityPost, 
  PageContent, 
  PopupNotification, 
  RecommendedDiscountPopup,
  CustomTripPackage,
  ChatMessage,
  User,
  MasterOptionPool,
  NoticeItem,
  QuotationVisibilitySettings
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_VIDEOS, 
  INITIAL_POSTS, 
  HERO_IMAGES, 
  SUB_MENU_ITEMS, 
  INITIAL_PAGE_CONTENTS, 
  INITIAL_POPUP, 
  INITIAL_RECOMMENDED_DISCOUNT_POPUP,
  INITIAL_CUSTOM_PACKAGES,
  INITIAL_MASTER_OPTION_POOL,
  INITIAL_NOTICES
} from '../constants';

const encodeLegacyBase64 = (password: string): string => {
  try {
    const bytes = new TextEncoder().encode(password);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return btoa(unescape(encodeURIComponent(password)));
  }
};

// Pure-JS FIPS 180-4 SHA-256 fallback (used only if Web Crypto subtle is unavailable in non-HTTPS contexts)
const sha256FallbackBytes = (data: Uint8Array): string => {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  const bitLen = data.length * 8;
  const padLen = ((data.length + 9 + 63) >> 6) << 6;
  const padded = new Uint8Array(padLen);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  for (let offset = 0; offset < padLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return Array.from(H)
    .map(n => n.toString(16).padStart(8, '0'))
    .join('');
};

export const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input);
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback below
  }
  return sha256FallbackBytes(bytes);
};

const generateRandomSaltHex = (byteLength = 16): string => {
  const bytes = new Uint8Array(byteLength);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const timingSafeEqual = (a: string, b: string): boolean => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

/**
 * 비밀번호 단방향 암호화 (무작위 16바이트 솔트 + SHA-256)
 * 포맷: sha256$<saltHex>$<digestHex>
 */
export const hashPasswordSha256 = async (password: string): Promise<string> => {
  const salt = generateRandomSaltHex(16);
  const digest = await sha256Hex(`${salt}:${password}`);
  return `sha256$${salt}$${digest}`;
};

export const verifyPasswordHash = async (password: string, storedHash?: string | null): Promise<boolean> => {
  if (!storedHash) return false;
  if (storedHash.startsWith('sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3 && parts[1] && parts[2]) {
      const digest = await sha256Hex(`${parts[1]}:${password}`);
      return timingSafeEqual(digest, parts[2]);
    }
    if (parts.length === 2 && parts[1]) {
      const digest = await sha256Hex(password);
      return timingSafeEqual(digest, parts[1]);
    }
    return false;
  }
  // 기존 Base64 계정 호환 검증 (로그인 시 자동 SHA-256 업그레이드 대상)
  return timingSafeEqual(encodeLegacyBase64(password), storedHash);
};

const isMissingRpcError = (err: any): boolean => {
  const code = String(err?.code || '');
  const msg = String(err?.message || '').toLowerCase();
  return code === 'PGRST202' || code === '42883' || msg.includes('could not find the function');
};

export const supabaseService = {
  /**
   * 앱 로딩 시 Supabase에서 모든 전역 데이터를 가져옵니다.
   * Supabase가 미연동 상태이거나 네트워크 장애 시 안전하게 로컬/기본값으로 동작합니다.
   */
  async loadGlobalData() {
    const fallbackData = {
      heroImages: HERO_IMAGES,
      menuItems: SUB_MENU_ITEMS,
      products: INITIAL_PRODUCTS,
      videos: INITIAL_VIDEOS,
      posts: INITIAL_POSTS,
      pageContents: INITIAL_PAGE_CONTENTS,
      popup: INITIAL_POPUP,
      recommendedDiscountPopup: INITIAL_RECOMMENDED_DISCOUNT_POPUP,
      notices: (() => {
        try {
          const localNotices = localStorage.getItem('mango_notices_db');
          if (localNotices) {
            const parsed = JSON.parse(localNotices);
            if (Array.isArray(parsed)) return parsed as NoticeItem[];
          }
        } catch {}
        return INITIAL_NOTICES;
      })(),
      quotationSettings: (() => {
        try {
          const localQuoteSettings = localStorage.getItem('mango_quotation_settings_db');
          if (localQuoteSettings) {
            const parsed = JSON.parse(localQuoteSettings);
            if (parsed && typeof parsed === 'object') {
              return { showDetailedCostsToCustomers: Boolean(parsed.showDetailedCostsToCustomers) };
            }
          }
        } catch {}
        return { showDetailedCostsToCustomers: false } as QuotationVisibilitySettings;
      })(),
      customPackages: INITIAL_CUSTOM_PACKAGES,
      masterOptionPool: INITIAL_MASTER_OPTION_POOL,
      cloudinaryConfig: { cloudName: 'ducor31pp', uploadPreset: 'mangotour' },
      isSupabaseActive: false,
      isLocal: true
    };

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      console.log("ℹ️ Running with local fallback data (Supabase waiting for credentials).");
      return fallbackData;
    }

    try {
      console.log("🔄 Fetching data from Supabase...");

      // 1. Settings (Hero Images, Menu Items, Cloudinary Config)
      let heroImages = HERO_IMAGES;
      let menuItems = SUB_MENU_ITEMS;
      let cloudinaryConfig = { cloudName: 'ducor31pp', uploadPreset: 'mangotour' };

      // Local storage fallback check
      try {
        const localHero = localStorage.getItem('mango_hero_images_db');
        if (localHero) {
          const parsed = JSON.parse(localHero);
          if (Array.isArray(parsed) && parsed.length > 0) heroImages = parsed;
        }
        const localMenu = localStorage.getItem('mango_menu_items_db');
        if (localMenu) {
          const parsed = JSON.parse(localMenu);
          if (Array.isArray(parsed) && parsed.length > 0) menuItems = parsed;
        }
      } catch {
        // ignore JSON parse error
      }

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (settingsData) {
        if (Array.isArray(settingsData.hero_images) && settingsData.hero_images.length > 0) {
          heroImages = settingsData.hero_images;
        }
        if (Array.isArray(settingsData.menu_items) && settingsData.menu_items.length > 0) {
          menuItems = settingsData.menu_items;
        }
        if (settingsData.cloudinary_config) {
          cloudinaryConfig = settingsData.cloudinary_config;
          if (cloudinaryConfig.cloudName || cloudinaryConfig.uploadPreset) {
            setCloudinaryConfig(cloudinaryConfig.cloudName || 'ducor31pp', cloudinaryConfig.uploadPreset || 'mangotour');
          }
        }
      }

      // 2. Products
      let products: Product[] = INITIAL_PRODUCTS;
      try {
        const localProducts = localStorage.getItem('mango_products_db');
        if (localProducts) {
          const parsed = JSON.parse(localProducts);
          if (Array.isArray(parsed) && parsed.length > 0) products = parsed;
        }
      } catch {
        // ignore
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      if (productsData && productsData.length > 0) {
        products = productsData.map(p => p.data || p);
      }

      // 3. Videos
      let videos: VideoItem[] = INITIAL_VIDEOS;
      try {
        const localVideos = localStorage.getItem('mango_videos_db');
        if (localVideos) {
          const parsed = JSON.parse(localVideos);
          const valid = Array.isArray(parsed) ? parsed.filter((v: any) => v?.url && !v.url.startsWith('blob:')) : [];
          if (valid.length > 0) videos = valid;
        }
      } catch {
        // ignore
      }

      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .order('id', { ascending: true });
      if (videosData && videosData.length > 0) {
        videos = videosData.map(v => v.data || v);
      }

      // 4. Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });
      const posts: CommunityPost[] = (postsData && postsData.length > 0) 
        ? postsData
            .map(p => p.data || p)
            .sort((a: CommunityPost, b: CommunityPost) => (b.date || '').localeCompare(a.date || ''))
        : INITIAL_POSTS;

      // 5. Pages
      let pageContents = { ...INITIAL_PAGE_CONTENTS };
      try {
        const localPages = localStorage.getItem('mango_page_contents_db');
        if (localPages) {
          const parsed = JSON.parse(localPages);
          if (parsed && typeof parsed === 'object') {
            pageContents = { ...pageContents, ...parsed };
          }
        }
      } catch {
        // ignore
      }

      let masterOptionPool: MasterOptionPool | null = null;
      const { data: pagesData } = await supabase
        .from('pages')
        .select('*');
      if (pagesData && pagesData.length > 0) {
        pagesData.forEach(row => {
          const content = row.data || row;
          if (row.id === 'master_option_pool') {
            masterOptionPool = content as MasterOptionPool;
          } else if (content.id) {
            pageContents[content.id] = content;
          }
        });
      }

      // 6. Popup, Recommended Discount Popup, Homepage Notices & Quotation Visibility Settings
      let popup = INITIAL_POPUP;
      let recommendedDiscountPopup = INITIAL_RECOMMENDED_DISCOUNT_POPUP;
      let notices: NoticeItem[] = INITIAL_NOTICES;
      let quotationSettings: QuotationVisibilitySettings = { showDetailedCostsToCustomers: false };
      try {
        const localRecPopup = localStorage.getItem('mango_recommended_discount_popup_db');
        if (localRecPopup) {
          recommendedDiscountPopup = { ...INITIAL_RECOMMENDED_DISCOUNT_POPUP, ...JSON.parse(localRecPopup) };
        }
        const localNotices = localStorage.getItem('mango_notices_db');
        if (localNotices) {
          const parsedNotices = JSON.parse(localNotices);
          if (Array.isArray(parsedNotices)) {
            notices = parsedNotices;
          }
        }
        const localQuoteSettings = localStorage.getItem('mango_quotation_settings_db');
        if (localQuoteSettings) {
          const parsedQuoteSettings = JSON.parse(localQuoteSettings);
          if (parsedQuoteSettings && typeof parsedQuoteSettings === 'object') {
            quotationSettings = { showDetailedCostsToCustomers: Boolean(parsedQuoteSettings.showDetailedCostsToCustomers) };
          }
        }
      } catch {
        // ignore
      }
      const { data: popupRows } = await supabase
        .from('popup')
        .select('*')
        .in('id', ['main', 'recommended_discount', 'notices', 'quotation_settings']);
      if (popupRows && popupRows.length > 0) {
        const mainRow = popupRows.find((r: any) => r.id === 'main');
        if (mainRow) {
          popup = mainRow.data || mainRow;
        }
        const recRow = popupRows.find((r: any) => r.id === 'recommended_discount');
        if (recRow) {
          recommendedDiscountPopup = { ...INITIAL_RECOMMENDED_DISCOUNT_POPUP, ...(recRow.data || recRow) };
        }
        const noticesRow = popupRows.find((r: any) => r.id === 'notices');
        if (noticesRow && noticesRow.data) {
          const rawItems = Array.isArray(noticesRow.data)
            ? noticesRow.data
            : Array.isArray(noticesRow.data.items)
              ? noticesRow.data.items
              : null;
          if (rawItems) {
            notices = rawItems;
          }
        }
        const quoteRow = popupRows.find((r: any) => r.id === 'quotation_settings');
        if (quoteRow && quoteRow.data && typeof quoteRow.data === 'object') {
          quotationSettings = { showDetailedCostsToCustomers: Boolean(quoteRow.data.showDetailedCostsToCustomers) };
        }
      }

      // 7. Custom Packages
      const { data: packagesData } = await supabase
        .from('custom_packages')
        .select('*')
        .order('id', { ascending: true });
      const customPackages: CustomTripPackage[] = (packagesData && packagesData.length > 0)
        ? packagesData.map(pkg => pkg.data || pkg)
        : INITIAL_CUSTOM_PACKAGES;

      console.log("✅ Supabase data loaded successfully!");
      return {
        heroImages,
        menuItems,
        products,
        videos,
        posts,
        pageContents,
        popup,
        recommendedDiscountPopup,
        notices,
        quotationSettings,
        customPackages,
        masterOptionPool,
        cloudinaryConfig,
        isSupabaseActive: true,
        isLocal: false
      };
    } catch (err) {
      console.warn("⚠️ Failed to load from Supabase, reverting to fallback data:", err);
      return fallbackData;
    }
  },

  /**
   * 컬렉션 데이터 동기화 (상품, 비디오, 게시글, 패키지 등)
   */
  async syncCollection(tableName: string, newItems: any[]) {
    // 1. 로컬 IndexedDB에 즉시 보존하여 오프라인에서도 보존
    try {
      await storageService.setItem(`mango_${tableName}`, newItems);
    } catch {
      // ignore
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      // Supabase 테이블에는 id, data(jsonb), updated_at 구조로 저장하여 유연성 극대화
      const rows = newItems.map(item => ({
        id: String(item.id),
        data: item,
        updated_at: new Date().toISOString()
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from(tableName)
          .upsert(rows, { onConflict: 'id' });
        if (error) throw error;
      }

      // 기존 DB에서 삭제된 아이템 정리
      const currentIds = newItems.map(item => String(item.id));
      if (currentIds.length > 0) {
        const { data: existingRows } = await supabase
          .from(tableName)
          .select('id');
        if (existingRows) {
          const toDelete = existingRows
            .map(r => String(r.id))
            .filter(id => !currentIds.includes(id));
          if (toDelete.length > 0) {
            await supabase.from(tableName).delete().in('id', toDelete);
          }
        }
      }
      console.log(`✅ Synced ${tableName} to Supabase successfully.`);
    } catch (e) {
      console.warn(`Failed to sync ${tableName} to Supabase:`, e);
    }
  },

  /**
   * 전역 설정 저장 (슬라이더, 메뉴, Cloudinary 등)
   * 슬라이드나 메뉴 아이콘 변경 시 Supabase의 settings 테이블에 안전하게 자동 저장
   */
  async saveSettings(key: 'heroImages' | 'menuItems' | 'cloudinaryConfig', data: any) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    const columnMap: Record<string, string> = {
      heroImages: 'hero_images',
      menuItems: 'menu_items',
      cloudinaryConfig: 'cloudinary_config'
    };
    const col = columnMap[key] || key;

    try {
      // 기존 설정 데이터를 조회하여 다른 컬럼(슬라이드, 메뉴, Cloudinary 등)이 지워지지 않도록 병합 보존
      const { data: existing } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      const payload: Record<string, any> = {
        id: 'global',
        hero_images: existing?.hero_images ?? null,
        menu_items: existing?.menu_items ?? null,
        cloudinary_config: existing?.cloudinary_config ?? null,
        updated_at: new Date().toISOString()
      };
      payload[col] = data;

      const { error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn(`Supabase settings upsert error for ${key}:`, error.message);
      } else {
        console.log(`✅ Supabase settings [${key}] 자동 저장 완료`);
      }
    } catch (e) {
      console.warn(`Failed to save settings for ${key}:`, e);
    }
  },

  /**
   * Cloudinary 이미지 서버 설정을 Supabase에 저장 및 동기화
   */
  async saveCloudinaryConfig(cloudName: string, uploadPreset: string) {
    const cfg = {
      cloudName: (cloudName || 'ducor31pp').trim(),
      uploadPreset: (uploadPreset || 'mangotour').trim(),
      updatedAt: new Date().toISOString()
    };
    setCloudinaryConfig(cfg.cloudName, cfg.uploadPreset);
    await this.saveSettings('cloudinaryConfig', cfg);
  },

  /**
   * 페이지 내용 저장
   */
  async savePageContent(pageId: string, content: PageContent) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('pages')
        .upsert({
          id: pageId,
          data: content,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn(`Failed to save page ${pageId}:`, e);
    }
  },

  /**
   * DIY 마스터 옵션 풀 저장 (지역, 골프장, 여행, 숙박, 차량, 기타)
   */
  async saveMasterOptionPool(pool: MasterOptionPool) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('pages')
        .upsert({
          id: 'master_option_pool',
          data: pool,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      console.log("✅ Synced master_option_pool to Supabase successfully.");
    } catch (e) {
      console.warn("Failed to save master_option_pool to Supabase:", e);
    }
  },

  /**
   * 팝업 저장
   */
  async savePopup(popup: PopupNotification) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('popup')
        .upsert({
          id: 'main',
          data: popup,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Failed to save popup to Supabase:", e);
    }
  },

  /**
   * 추천상품 할인 팝업 저장
   */
  async saveRecommendedDiscountPopup(discountPopup: RecommendedDiscountPopup) {
    try {
      localStorage.setItem('mango_recommended_discount_popup_db', JSON.stringify(discountPopup));
    } catch {
      // ignore
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('popup')
        .upsert({
          id: 'recommended_discount',
          data: discountPopup,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Failed to save recommended discount popup to Supabase:", e);
    }
  },

  /**
   * 메인 공지사항 바 목록 저장
   */
  async saveNotices(notices: NoticeItem[]) {
    try {
      localStorage.setItem('mango_notices_db', JSON.stringify(notices));
    } catch {
      // ignore
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('popup')
        .upsert({
          id: 'notices',
          data: { items: notices },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Failed to save notices to Supabase:", e);
    }
  },

  /**
   * 견적서 금액 표시 설정 저장 (합산·골프만 표시 / 전체 세부금액 표시)
   */
  async saveQuotationSettings(settings: QuotationVisibilitySettings) {
    try {
      localStorage.setItem('mango_quotation_settings_db', JSON.stringify(settings));
    } catch {
      // ignore
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('popup')
        .upsert({
          id: 'quotation_settings',
          data: settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Failed to save quotation settings to Supabase:", e);
    }
  },

  /**
   * 견적/예약 문의 저장
   */
  async saveInquiry(inquiry: any) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const existing = JSON.parse(localStorage.getItem('mango_inquiries') || '[]');
      existing.unshift({ ...inquiry, id: Date.now().toString(), createdAt: new Date().toISOString() });
      localStorage.setItem('mango_inquiries', JSON.stringify(existing));
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('inquiries')
        .insert([{
          data: inquiry,
          created_at: new Date().toISOString()
        }])
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      console.warn("Failed to save inquiry to Supabase:", e);
      return { success: false, error: e };
    }
  },

  /**
   * 실시간 채팅 메시지 전송
   */
  async sendChatMessage(message: { sender: string; text: string }): Promise<ChatMessage> {
    const supabase = getSupabase();
    const now = Date.now();
    const payload = {
      sender: message.sender,
      text: message.text,
      created_at: new Date(now).toISOString()
    };

    if (!supabase || !isSupabaseConfigured) {
      const storageKey = 'mango_tour_public_chat_v1';
      const existing: ChatMessage[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const newMsg: ChatMessage = {
        id: `local-${now}`,
        sender: message.sender,
        text: message.text,
        timestamp: now
      };
      existing.push(newMsg);
      localStorage.setItem(storageKey, JSON.stringify(existing.slice(-100)));
      return newMsg;
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn("Failed to write chat to Supabase, saving locally:", error);
      return {
        id: `local-${now}`,
        sender: message.sender,
        text: message.text,
        timestamp: now
      };
    }

    return {
      id: String(data.id),
      sender: data.sender || message.sender,
      text: data.text,
      timestamp: new Date(data.created_at).getTime()
    };
  },

  /**
   * 실시간 채팅 메시지 구독 (Supabase Realtime)
   */
  subscribeChat(
    onInitialMessages: (msgs: ChatMessage[]) => void,
    onNewMessage: (msg: ChatMessage) => void
  ) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      // 로컬스토리지 기반 초기 메시지 로드
      const storageKey = 'mango_tour_public_chat_v1';
      const localMsgs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      onInitialMessages(localMsgs);
      return () => {};
    }

    // 1. 최근 메시지 로드 (최신 100개)
    supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const formatted: ChatMessage[] = data.map(d => ({
            id: String(d.id),
            sender: d.sender || '여행자',
            text: d.text,
            timestamp: new Date(d.created_at).getTime()
          }));
          onInitialMessages(formatted);
        }
      });

    // 2. 실시간 새 메시지 청취 (Supabase Channel)
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const d = payload.new;
        const msg: ChatMessage = {
          id: String(d.id),
          sender: d.sender || '여행자',
          text: d.text,
          timestamp: new Date(d.created_at).getTime()
        };
        onNewMessage(msg);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * 회원 목록 조회 (password_hash는 절대 조회하지 않음)
   */
  async loadUsers(): Promise<User[]> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      return JSON.parse(localStorage.getItem('mango_users_db') || '[]');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, nickname, role, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(u => ({
        id: String(u.id),
        username: u.username,
        role: u.role || 'user',
        nickname: u.nickname || u.username,
        createdAt: u.created_at || undefined
      }));
    } catch (e) {
      console.warn("Failed to load users from Supabase:", e);
      return JSON.parse(localStorage.getItem('mango_users_db') || '[]');
    }
  },

  /**
   * 회원 목록 실시간 변경 구독 (신규 가입/권한 변경/삭제 즉시 반영)
   */
  subscribeToUsers(onUsersChanged: (users: User[]) => void) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      return () => {};
    }

    const channel = supabase
      .channel('public:users_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, async () => {
        const freshUsers = await this.loadUsers();
        if (freshUsers) {
          onUsersChanged(freshUsers);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * 신규 회원가입 / 관리자 신규 회원 등록 (SHA-256 솔트 해시 + 중복 아이디 차단 + RPC/RLS 지원)
   */
  async registerUser(user: User, password: string): Promise<{
    success: boolean;
    user?: User;
    code?: 'VALIDATION_ERROR' | 'RESERVED_USERNAME' | 'DUPLICATE_USERNAME' | 'DB_ERROR';
    message?: string;
  }> {
    const cleanUsername = (user.username || '').trim();
    const cleanNickname = (user.nickname || '').trim() || cleanUsername;
    if (!cleanUsername || !password.trim()) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: '아이디와 비밀번호를 입력해주세요.'
      };
    }

    if (cleanUsername.toLowerCase() === 'admin' && user.role !== 'admin') {
      return {
        success: false,
        code: 'RESERVED_USERNAME',
        message: '사용할 수 없는 아이디입니다. 다른 아이디를 입력해주세요.'
      };
    }

    const passwordHash = await hashPasswordSha256(password);
    const nowIso = new Date().toISOString();
    const supabase = getSupabase();

    if (!supabase || !isSupabaseConfigured) {
      const users: User[] = JSON.parse(localStorage.getItem('mango_users_db') || '[]');
      const isDuplicate = users.some(
        u => (u.username || '').trim().toLowerCase() === cleanUsername.toLowerCase()
      );
      if (isDuplicate) {
        return {
          success: false,
          code: 'DUPLICATE_USERNAME',
          message: '이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.'
        };
      }
      const savedUser: User = {
        ...user,
        username: cleanUsername,
        nickname: cleanNickname,
        passwordHash,
        createdAt: nowIso
      };
      users.push(savedUser);
      localStorage.setItem('mango_users_db', JSON.stringify(users));
      return {
        success: true,
        user: {
          id: savedUser.id,
          username: savedUser.username,
          role: savedUser.role,
          nickname: savedUser.nickname,
          createdAt: savedUser.createdAt
        }
      };
    }

    try {
      // 일반 회원 가입은 보안 강화 RPC(register_member)를 우선 사용하여 RLS 하에서도 안전하게 가입
      if (user.role !== 'admin') {
        const { data: rpcData, error: rpcError } = await supabase.rpc('register_member', {
          p_id: user.id,
          p_username: cleanUsername,
          p_nickname: cleanNickname,
          p_password_hash: passwordHash
        });

        if (!rpcError && rpcData) {
          if (!rpcData.success) {
            return {
              success: false,
              code: rpcData.code || 'DB_ERROR',
              message: rpcData.message || '회원가입에 실패했습니다.'
            };
          }
          const u = rpcData.user || {};
          return {
            success: true,
            user: {
              id: String(u.id || user.id),
              username: u.username || cleanUsername,
              role: (u.role as 'admin' | 'user') || 'user',
              nickname: u.nickname || cleanNickname,
              createdAt: u.created_at || nowIso
            }
          };
        }

        if (rpcError && !isMissingRpcError(rpcError)) {
          console.warn("register_member RPC error:", rpcError);
          return {
            success: false,
            code: 'DB_ERROR',
            message: '회원가입 정보를 서버에 저장하지 못했습니다. 잠시 후 다시 시도해주세요.'
          };
        }
      }

      // RPC 미설치 구버전 DB 또는 관리자 직접 등록 폴백
      const { data: existingRows, error: checkError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', cleanUsername)
        .limit(1);

      if (checkError) {
        console.warn("Failed to check duplicate username in Supabase:", checkError);
        return {
          success: false,
          code: 'DB_ERROR',
          message: '서버 연결 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        };
      }

      if (existingRows && existingRows.length > 0) {
        return {
          success: false,
          code: 'DUPLICATE_USERNAME',
          message: '이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.'
        };
      }

      const { data: insertedRow, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username: cleanUsername,
          role: user.role,
          nickname: cleanNickname,
          password_hash: passwordHash,
          created_at: nowIso,
          updated_at: nowIso
        })
        .select('id, username, role, nickname, created_at')
        .single();

      if (insertError) {
        const errCode = (insertError as any)?.code;
        const errMsg = String((insertError as any)?.message || '');
        if (errCode === '23505' || errMsg.toLowerCase().includes('duplicate')) {
          return {
            success: false,
            code: 'DUPLICATE_USERNAME',
            message: '이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.'
          };
        }
        console.warn("Failed to insert user in Supabase:", insertError);
        return {
          success: false,
          code: 'DB_ERROR',
          message: '회원가입 정보를 서버에 저장하지 못했습니다. 잠시 후 다시 시도해주세요.'
        };
      }

      const savedUser: User = {
        id: String(insertedRow?.id || user.id),
        username: insertedRow?.username || cleanUsername,
        role: (insertedRow?.role as 'admin' | 'user') || user.role,
        nickname: insertedRow?.nickname || cleanNickname,
        createdAt: insertedRow?.created_at || nowIso
      };

      return { success: true, user: savedUser };
    } catch (e) {
      console.warn("Failed to register user in Supabase:", e);
      return {
        success: false,
        code: 'DB_ERROR',
        message: '네트워크 오류로 회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.'
      };
    }
  },

  /**
   * 로그인 인증 (관리자: VITE_ADMIN_PASSWORD 환경변수 검증 / 일반회원: SHA-256 해시 검증)
   */
  async authenticateUser(
    username: string,
    password: string,
    fallbackUsers: User[] = []
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    const cleanUsername = (username || '').trim();
    if (!cleanUsername || !password) {
      return { success: false, message: '아이디와 비밀번호를 입력해주세요.' };
    }

    const supabase = getSupabase();
    const envAdminPassword = ((import.meta as any).env?.VITE_ADMIN_PASSWORD || '').trim();

    // 1. 기본 관리자 계정: 환경변수 VITE_ADMIN_PASSWORD 로 검증 (평문 하드코딩 제거)
    if (cleanUsername.toLowerCase() === 'admin') {
      if (envAdminPassword && timingSafeEqual(password, envAdminPassword)) {
        const adminToken = await sha256Hex(`mango-admin-api:${envAdminPassword}`);
        setAdminSessionToken(adminToken);

        const localAdmin = fallbackUsers.find(u => u.username === 'admin');
        if (supabase && isSupabaseConfigured) {
          try {
            const { data } = await supabase
              .from('users')
              .select('id, username, role, nickname, created_at')
              .eq('username', 'admin')
              .maybeSingle();
            if (data) {
              return {
                success: true,
                user: {
                  id: String(data.id),
                  username: data.username,
                  role: 'admin',
                  nickname: data.nickname || '관리자',
                  createdAt: data.created_at || undefined
                }
              };
            }
          } catch {
            // fallback below
          }
        }
        return {
          success: true,
          user: localAdmin
            ? { id: localAdmin.id, username: localAdmin.username, role: 'admin', nickname: localAdmin.nickname || '관리자', createdAt: localAdmin.createdAt }
            : { id: 'admin_primary', username: 'admin', role: 'admin', nickname: '관리자' }
        };
      }
      // 환경변수 미일치 또는 미설정 시, 아래 DB 해시 검증(SQL로 직접 해시 지정한 경우)을 추가로 확인한 뒤 최종 실패 반환
    }

    // 2. 로컬 모드 검증
    if (!supabase || !isSupabaseConfigured) {
      if (cleanUsername.toLowerCase() === 'admin' && !envAdminPassword) {
        return {
          success: false,
          message: '관리자 비밀번호 환경변수(VITE_ADMIN_PASSWORD)가 설정되지 않았습니다.'
        };
      }
      const storedUsers: User[] = JSON.parse(localStorage.getItem('mango_users_db') || '[]');
      const pool = storedUsers.length > 0 ? storedUsers : fallbackUsers;
      const found = pool.find(u => (u.username || '').trim() === cleanUsername);
      if (!found || !(await verifyPasswordHash(password, found.passwordHash))) {
        return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
      }
      // 기존 Base64 저장 회원은 로그인 성공 시 SHA-256 솔트 해시로 자동 업그레이드
      if (found.passwordHash && !found.passwordHash.startsWith('sha256$')) {
        try {
          const upgradedHash = await hashPasswordSha256(password);
          const updatedPool = pool.map(u =>
            u.username === found.username ? { ...u, passwordHash: upgradedHash } : u
          );
          localStorage.setItem('mango_users_db', JSON.stringify(updatedPool));
        } catch {
          // ignore
        }
      }
      return {
        success: true,
        user: {
          id: found.id,
          username: found.username,
          role: found.role,
          nickname: found.nickname,
          createdAt: found.createdAt
        }
      };
    }

    try {
      // 3-A. 보안 강화 RPC 로그인 (password_hash를 네트워크로 내려보내지 않음)
      const { data: challenge, error: challengeError } = await supabase.rpc('get_member_login_challenge', {
        p_username: cleanUsername
      });

      if (!challengeError && challenge) {
        if (!challenge.found) {
          if (cleanUsername.toLowerCase() === 'admin' && !envAdminPassword) {
            return {
              success: false,
              message: '관리자 비밀번호 환경변수(VITE_ADMIN_PASSWORD)가 설정되지 않았습니다.'
            };
          }
          return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
        }

        let candidateHash = '';
        let upgradeSaltedHash: string | null = null;

        if (challenge.format === 'salted_sha256' && challenge.salt) {
          const digest = await sha256Hex(`${challenge.salt}:${password}`);
          candidateHash = `sha256$${challenge.salt}$${digest}`;
        } else if (challenge.format === 'sha256') {
          const digest = await sha256Hex(password);
          candidateHash = `sha256$${digest}`;
        } else {
          candidateHash = encodeLegacyBase64(password);
          upgradeSaltedHash = await hashPasswordSha256(password);
        }

        const { data: loginRes, error: verifyError } = await supabase.rpc('verify_member_login_hash', {
          p_username: cleanUsername,
          p_candidate_hash: candidateHash,
          p_upgrade_salted_hash: upgradeSaltedHash
        });

        if (verifyError) {
          console.warn("verify_member_login_hash error:", verifyError);
          return { success: false, message: '로그인 검증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
        }

        if (!loginRes?.success || !loginRes?.user) {
          return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
        }

        const u = loginRes.user;
        if (u.role === 'admin' && envAdminPassword) {
          const adminToken = await sha256Hex(`mango-admin-api:${envAdminPassword}`);
          setAdminSessionToken(adminToken);
        } else if (u.role !== 'admin') {
          clearAdminSessionToken();
        }

        return {
          success: true,
          user: {
            id: String(u.id),
            username: u.username,
            role: u.role || 'user',
            nickname: u.nickname || u.username,
            createdAt: u.created_at || undefined
          }
        };
      }

      if (challengeError && !isMissingRpcError(challengeError)) {
        console.warn("Failed to authenticate user via RPC:", challengeError);
        return { success: false, message: '서버 연결 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
      }

      // 3-B. RPC 미설치 구버전 DB 폴백
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, nickname, password_hash, created_at')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error) {
        console.warn("Failed to authenticate user from Supabase:", error);
        return { success: false, message: '서버 연결 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
      }

      if (!data || !(await verifyPasswordHash(password, data.password_hash))) {
        if (cleanUsername.toLowerCase() === 'admin' && !envAdminPassword) {
          return {
            success: false,
            message: '관리자 비밀번호 환경변수(VITE_ADMIN_PASSWORD)가 설정되지 않았습니다.'
          };
        }
        return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
      }

      // 구버전 Base64 저장 계정은 로그인 성공 시 SHA-256 솔트 해시로 자동 업그레이드
      if (data.password_hash && !String(data.password_hash).startsWith('sha256$')) {
        try {
          const upgradedHash = await hashPasswordSha256(password);
          await supabase
            .from('users')
            .update({ password_hash: upgradedHash, updated_at: new Date().toISOString() })
            .eq('id', data.id);
        } catch {
          // ignore upgrade error if restricted
        }
      }

      return {
        success: true,
        user: {
          id: String(data.id),
          username: data.username,
          role: data.role || 'user',
          nickname: data.nickname || data.username,
          createdAt: data.created_at || undefined
        }
      };
    } catch (e) {
      console.warn("Failed to authenticate user:", e);
      return { success: false, message: '네트워크 오류로 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }
  },

  /**
   * 회원 저장 (SHA-256 솔트 해시 암호화 적용)
   */
  async saveUser(user: User, password?: string) {
    const passwordHash = password ? await hashPasswordSha256(password) : user.passwordHash;
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const users: User[] = JSON.parse(localStorage.getItem('mango_users_db') || '[]');
      const userToStore: User = { ...user, ...(passwordHash ? { passwordHash } : {}) };
      const idx = users.findIndex(u => u.username === user.username);
      if (idx >= 0) users[idx] = userToStore;
      else users.push(userToStore);
      localStorage.setItem('mango_users_db', JSON.stringify(users));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: user.username,
          role: user.role,
          nickname: user.nickname,
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        }, { onConflict: 'username' });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn("Failed to save user to Supabase:", e);
      return { success: false, error: e };
    }
  },

  /**
   * 회원 삭제
   */
  async deleteUser(userId: string) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const users: User[] = JSON.parse(localStorage.getItem('mango_users_db') || '[]');
      const filtered = users.filter(u => u.id !== userId);
      localStorage.setItem('mango_users_db', JSON.stringify(filtered));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn("Failed to delete user in Supabase:", e);
      return { success: false, error: e };
    }
  },

  /**
   * 회원 권한 업데이트 (관리자 <-> 일반회원)
   */
  async updateUserRole(userId: string, newRole: 'admin' | 'user') {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const users: User[] = JSON.parse(localStorage.getItem('mango_users_db') || '[]');
      const user = users.find(u => u.id === userId);
      if (user) {
        user.role = newRole;
        localStorage.setItem('mango_users_db', JSON.stringify(users));
      }
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn("Failed to update user role in Supabase:", e);
      return { success: false, error: e };
    }
  },

  /**
   * 원클릭 전체 데이터 Supabase 클라우드 초기 주입 (Seed All Data)
   */
  async seedAllToSupabase(payload: {
    products: Product[];
    videos: VideoItem[];
    posts: CommunityPost[];
    customPackages: CustomTripPackage[];
    heroImages: string[];
    menuItems: any[];
    cloudinaryConfig: { cloudName: string; uploadPreset: string };
    popup: PopupNotification;
    recommendedDiscountPopup?: RecommendedDiscountPopup;
    notices?: NoticeItem[];
    pageContents: Record<string, PageContent>;
  }) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase가 아직 연결되지 않았습니다. [Supabase DB 설정]에서 URL과 Anon Key를 먼저 저장해주세요.");
    }

    console.log("🚀 Starting one-click full data seeding to Supabase...");

    // 1. Settings
    await supabase.from('settings').upsert({
      id: 'global',
      hero_images: payload.heroImages,
      menu_items: payload.menuItems,
      cloudinary_config: payload.cloudinaryConfig,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    // 2. Popup, Recommended Discount Popup & Notices
    const popupRows: Array<{ id: string; data: any; updated_at: string }> = [
      {
        id: 'main',
        data: payload.popup,
        updated_at: new Date().toISOString()
      }
    ];
    if (payload.recommendedDiscountPopup) {
      popupRows.push({
        id: 'recommended_discount',
        data: payload.recommendedDiscountPopup,
        updated_at: new Date().toISOString()
      });
    }
    if (payload.notices) {
      popupRows.push({
        id: 'notices',
        data: { items: payload.notices },
        updated_at: new Date().toISOString()
      });
    }
    await supabase.from('popup').upsert(popupRows, { onConflict: 'id' });

    // 3. Products
    if (payload.products && payload.products.length > 0) {
      const productRows = payload.products.map(p => ({
        id: String(p.id),
        data: p,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('products').upsert(productRows, { onConflict: 'id' });
    }

    // 4. Videos
    if (payload.videos && payload.videos.length > 0) {
      const videoRows = payload.videos.map(v => ({
        id: String(v.id),
        data: v,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('videos').upsert(videoRows, { onConflict: 'id' });
    }

    // 5. Posts
    if (payload.posts && payload.posts.length > 0) {
      const postRows = payload.posts.map(p => ({
        id: String(p.id),
        data: p,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('posts').upsert(postRows, { onConflict: 'id' });
    }

    // 6. Custom Packages
    if (payload.customPackages && payload.customPackages.length > 0) {
      const packageRows = payload.customPackages.map(pkg => ({
        id: String(pkg.id),
        data: pkg,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('custom_packages').upsert(packageRows, { onConflict: 'id' });
    }

    // 7. Pages
    if (payload.pageContents) {
      const pageRows = Object.entries(payload.pageContents).map(([pageId, content]) => ({
        id: pageId,
        data: content,
        updated_at: new Date().toISOString()
      }));
      if (pageRows.length > 0) {
        await supabase.from('pages').upsert(pageRows, { onConflict: 'id' });
      }
    }

    console.log("✅ All data seeded to Supabase successfully!");
    return { success: true };
  }
};
