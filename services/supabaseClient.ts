import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export const checkIsSupabaseConfigured = (): boolean => {
  if (client) return true;
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('https://'));
};

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(credentials.url, credentials.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log("✅ Supabase client successfully initialized:", credentials.url);
  } catch (err) {
    console.warn("⚠️ Failed to initialize Supabase client:", err);
    client = null;
  }
} else {
  console.log("ℹ️ Supabase credentials not yet configured. Running in safe fallback mode.");
}

/**
 * 런타임에 Supabase 설정 동적 업데이트 (관리자 대시보드 저장용)
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
    try {
      client = createClient(cleanUrl, cleanKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      isSupabaseConfigured = true;
      console.log("✅ Supabase credentials updated and connected.");
      return true;
    } catch (e) {
      console.error("Failed to re-initialize Supabase:", e);
      isSupabaseConfigured = false;
      return false;
    }
  }
  client = null;
  isSupabaseConfigured = false;
  return false;
};

export const getSupabase = (): SupabaseClient | null => {
  if (client) return client;
  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey && url.startsWith('https://')) {
    try {
      client = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      isSupabaseConfigured = true;
      return client;
    } catch (e) {
      console.warn("Lazy getSupabase init error:", e);
    }
  }
  return null;
};

export { credentials };
