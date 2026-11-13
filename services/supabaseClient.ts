import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseSingletonStore {
  client: SupabaseClient | null;
  url: string;
  anonKey: string;
}

const SINGLETON_KEY = '__MANGO_SUPABASE_SINGLETON__';

const getSingletonStore = (): SupabaseSingletonStore => {
  const g = globalThis as Record<string, any>;
  if (!g[SINGLETON_KEY]) {
    g[SINGLETON_KEY] = {
      client: null,
      url: '',
      anonKey: '',
    } as SupabaseSingletonStore;
  }
  return g[SINGLETON_KEY] as SupabaseSingletonStore;
};

// 기본 환경변수 또는 로컬스토리지에서 Supabase 연결 설정 로드
const getSupabaseCredentials = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('sb_url') || '' : '';
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('sb_anon_key') || '' : '';

  const url = (localUrl || envUrl || '').trim();
  const anonKey = (localKey || envAnonKey || '').trim();

  return { url, anonKey };
};

const credentials = getSupabaseCredentials();

export let isSupabaseConfigured = Boolean(
  credentials.url &&
  credentials.anonKey &&
  credentials.url.startsWith('https://')
);

const getOrCreateSingletonClient = (url: string, anonKey: string): SupabaseClient | null => {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();

  if (!cleanUrl || !cleanKey || !cleanUrl.startsWith('https://')) {
    return null;
  }

  const store = getSingletonStore();

  // 이미 동일한 URL/Key로 생성된 싱글톤 클라이언트가 있으면 그대로 재사용
  if (store.client && store.url === cleanUrl && store.anonKey === cleanKey) {
    isSupabaseConfigured = true;
    return store.client;
  }

  // 다른 프로젝트로 교체되는 경우에만 기존 채널 정리 후 새 클라이언트 1회 생성
  if (store.client) {
    try {
      store.client.removeAllChannels?.();
    } catch {
      // ignore channel cleanup error
    }
  }

  try {
    const instance = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    store.client = instance;
    store.url = cleanUrl;
    store.anonKey = cleanKey;
    isSupabaseConfigured = true;
    return instance;
  } catch (err) {
    console.warn("⚠️ Failed to initialize Supabase client:", err);
    store.client = null;
    store.url = '';
    store.anonKey = '';
    isSupabaseConfigured = false;
    return null;
  }
};

// 앱 시작 시 1회만 싱글톤 클라이언트 초기화
if (isSupabaseConfigured) {
  const initialClient = getOrCreateSingletonClient(credentials.url, credentials.anonKey);
  if (initialClient) {
    console.log("✅ Supabase singleton client ready:", credentials.url);
  }
} else {
  console.log("ℹ️ Supabase credentials not yet configured. Running in safe fallback mode.");
}

export const checkIsSupabaseConfigured = (): boolean => {
  const store = getSingletonStore();
  if (store.client) return true;
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('https://'));
};

/**
 * 런타임에 Supabase 설정 동적 업데이트 (관리자 대시보드 저장용)
 * 동일한 자격 증명인 경우 기존 싱글톤 인스턴스를 재사용하여 중복 생성을 방지합니다.
 */
export const updateSupabaseCredentials = (url: string, anonKey: string): boolean => {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();

  if (typeof localStorage !== 'undefined') {
    if (cleanUrl) localStorage.setItem('sb_url', cleanUrl);
    else localStorage.removeItem('sb_url');

    if (cleanKey) localStorage.setItem('sb_anon_key', cleanKey);
    else localStorage.removeItem('sb_anon_key');
  }

  if (cleanUrl && cleanKey && cleanUrl.startsWith('https://')) {
    const store = getSingletonStore();
    const isSame = Boolean(store.client && store.url === cleanUrl && store.anonKey === cleanKey);
    const connected = getOrCreateSingletonClient(cleanUrl, cleanKey);
    if (connected) {
      if (!isSame) {
        console.log("✅ Supabase credentials updated and singleton connected.");
      }
      return true;
    }
    return false;
  }

  const store = getSingletonStore();
  if (store.client) {
    try {
      store.client.removeAllChannels?.();
    } catch {
      // ignore
    }
  }
  store.client = null;
  store.url = '';
  store.anonKey = '';
  isSupabaseConfigured = false;
  return false;
};

/**
 * 싱글톤 Supabase 클라이언트 반환 (미생성 시에만 1회 생성 후 재사용)
 */
export const getSupabase = (): SupabaseClient | null => {
  const store = getSingletonStore();
  if (store.client) {
    return store.client;
  }
  const { url, anonKey } = getSupabaseCredentials();
  return getOrCreateSingletonClient(url, anonKey);
};

export { credentials };
