import { getSupabase, isSupabaseConfigured, getAdminSessionToken } from './supabaseClient';
import trangPortraitImg from '../src/assets/images/interpreter_trang_portrait_1795846451905.jpg';
import mouSeminarImg from '../src/assets/images/portfolio_mou_seminar_1795846452683.jpg';
import vpcaSigningImg from '../src/assets/images/portfolio_vpca_signing_1795846453346.jpg';
import techConferenceImg from '../src/assets/images/portfolio_tech_conference_1795846453197.jpg';
import digitalShowcaseImg from '../src/assets/images/portfolio_digital_showcase_1795846455090.jpg';
import hoianGalaImg from '../src/assets/images/portfolio_hoian_gala_1795846453383.jpg';

export type PortfolioCategory =
  | '기업 세미나/MOU'
  | 'VIP 의전/컨퍼런스'
  | '개업식/방송 MC';

export type PortfolioItemCategory = PortfolioCategory;

export interface InterpreterProfile {
  name: string;
  nickname: string;
  title: string;
  portraitUrl: string;
  badges: [string, string, string];
  educationTitle: string;
  educationDesc: string;
  certTitle: string;
  certDesc: string;
  specialties: string[];
  kakaoUrl: string;
}

export interface PortfolioItem {
  id: string;
  category: PortfolioItemCategory;
  title: string;
  client: string;
  role?: string;
  image?: string;
  visualVariant?: 'concert' | 'opening';
  videoUrl: string;
}

export interface InterpreterPortfolioStore {
  profile: InterpreterProfile;
  items: PortfolioItem[];
  updatedAt?: string;
}

export const KAKAO_OPEN_CHAT_URL = 'https://open.kakao.com/o/gprQnKSi';
export const INTERPRETER_PORTFOLIO_STORAGE_KEY = 'mango_interpreter_portfolio_v1';
export const INTERPRETER_PORTFOLIO_UPDATED_EVENT = 'mango_interpreter_portfolio_updated';

export const DEFAULT_INTERPRETER_PROFILE: InterpreterProfile = {
  name: 'Đỗ Quang Khánh Trang',
  nickname: 'Ms. Trang',
  title: '한·영·베 3개국어 비즈니스 전문 통역 & MC',
  portraitUrl: trangPortraitImg,
  badges: ['경성대학교 졸업', 'TOPIK 6급(최고등급)', 'TOEIC 870 / 영어 능통'],
  educationTitle: '부산 경성대학교 홍보광고학 졸업',
  educationDesc:
    '한국 현지 학부 과정을 통해 기업 홍보·마케팅 실무 언어와 한국 비즈니스 문화를 깊이 있게 습득했습니다.',
  certTitle: 'TOPIK 6급(최고등급) · MC 아카데미 수료',
  certDesc:
    'TOEIC 870(영어 능통) · 한·영·베 3개국어 순차/동시 통역 및 공식 무대 행사·방송 MC 진행 자격을 갖추었습니다.',
  specialties: [
    '기업 MOU 체결식 & 투자 세미나',
    'VIP 의전 및 글로벌 컨퍼런스',
    '기업 개업식 & 갈라 디너 MC',
  ],
  kakaoUrl: KAKAO_OPEN_CHAT_URL,
};

export const DEFAULT_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'portfolio-fiin-mou',
    category: '기업 세미나/MOU',
    title: '베트남 비즈니스 성장 전략 세미나 & MOU',
    client: 'Fiin Group, KODATA, Allianz Trade',
    role: '한·베·영 비즈니스 세미나 & MOU 체결식 통역',
    image: mouSeminarImg,
    videoUrl:
      'https://www.youtube.com/results?search_query=Fiin+Group+KODATA+Allianz+Trade+Vietnam+MOU+seminar',
  },
  {
    id: 'portfolio-vpca-mou',
    category: '기업 세미나/MOU',
    title: 'VPCA 3개국어 MOU 체결식 통역',
    client: 'VPCA',
    role: '한·영·베 3개국어 공식 MOU 협약 체결 통역',
    image: vpcaSigningImg,
    videoUrl: 'https://www.youtube.com/results?search_query=VPCA+MOU+Vietnam+ceremony',
  },
  {
    id: 'portfolio-tech-conf-4',
    category: 'VIP 의전/컨퍼런스',
    title: '한국 테크놀로지 컨퍼런스 4.0 한-베 MC',
    client: 'Stun Medical & Seoul Luxury Academy',
    role: '메인 무대 한·베 2개국어 공식 MC 진행',
    image: techConferenceImg,
    videoUrl:
      'https://www.youtube.com/results?search_query=Korea+Technology+Conference+4.0+Stun+Medical+Vietnam',
  },
  {
    id: 'portfolio-digital-showcase',
    category: 'VIP 의전/컨퍼런스',
    title: '글로벌 디지털 플랫폼 파운데이션 쇼케이스',
    client: 'One Company Foundation',
    role: '글로벌 쇼케이스 VIP 통역 & 스테이지 진행',
    image: digitalShowcaseImg,
    videoUrl:
      'https://www.youtube.com/results?search_query=One+Company+Foundation+Global+Digital+Platform+Showcase',
  },
  {
    id: 'portfolio-tiger-remix-cl',
    category: 'VIP 의전/컨퍼런스',
    title: 'Tiger Remix 2023 가수 CL 팀 메인 전담 통역',
    client: 'Tiger Remix 2023 · 가수 CL 팀',
    role: '아티스트·매니지먼트 VIP 의전 및 현장 총괄 통역',
    visualVariant: 'concert',
    videoUrl: 'https://www.youtube.com/results?search_query=Tiger+Remix+2023+CL+Ho+Chi+Minh',
  },
  {
    id: 'portfolio-trungson-gs25',
    category: '개업식/방송 MC',
    title: 'Trung Son Pharma X GS25 개업식 및 남껀터 대학교 MOU 진행',
    client: 'Trung Son Pharma · GS25 · 남껀터 대학교',
    role: '브랜드 그랜드 오프닝 & 산학협력 MOU 공식 MC',
    visualVariant: 'opening',
    videoUrl: 'https://www.youtube.com/results?search_query=Trung+Son+Pharma+GS25+Nam+Can+Tho',
  },
  {
    id: 'portfolio-hoian-dinner',
    category: '개업식/방송 MC',
    title: '호이안 감사 만찬(Appreciation Dinner) 한-영 MC',
    client: '호이안 VIP 기업 감사 만찬',
    role: '이브닝 갈라 디너 한·영 공식 MC & VIP 의전',
    image: hoianGalaImg,
    videoUrl: 'https://www.youtube.com/results?search_query=Hoi+An+Appreciation+Dinner+MC',
  },
];

export const sanitizeSafeUrl = (
  raw?: string,
  options: { allowRelative?: boolean } = {}
): string => {
  const trimmed = (raw || '').trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return '';
  if (
    options.allowRelative &&
    (trimmed.startsWith('/') || /^data:image\/(png|jpe?g|webp|gif|svg\+xml);/i.test(trimmed))
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // try adding https:// if user typed domain without scheme
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
      try {
        const parsedWithHttps = new URL(`https://${trimmed}`);
        return parsedWithHttps.toString();
      } catch {
        return '';
      }
    }
  }
  return '';
};

export const validateImageInput = (
  raw?: string
): { valid: boolean; sanitized: string } => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return { valid: true, sanitized: '' };
  const sanitized = sanitizeSafeUrl(trimmed, { allowRelative: true });
  return { valid: Boolean(sanitized), sanitized };
};

export const getDefaultInterpreterPortfolio = (): InterpreterPortfolioStore => ({
  profile: {
    ...DEFAULT_INTERPRETER_PROFILE,
    badges: [...DEFAULT_INTERPRETER_PROFILE.badges] as [string, string, string],
    specialties: [...DEFAULT_INTERPRETER_PROFILE.specialties],
  },
  items: DEFAULT_PORTFOLIO_ITEMS.map((item) => ({ ...item })),
});

const normalizeStore = (raw: any): InterpreterPortfolioStore => {
  const defaults = getDefaultInterpreterPortfolio();
  if (!raw || typeof raw !== 'object') return defaults;

  const rawProfile = raw.profile && typeof raw.profile === 'object' ? raw.profile : {};
  const rawBadges = Array.isArray(rawProfile.badges) ? rawProfile.badges : [];
  const badges: [string, string, string] = [
    String(rawBadges[0] || defaults.profile.badges[0]).trim() || defaults.profile.badges[0],
    String(rawBadges[1] || defaults.profile.badges[1]).trim() || defaults.profile.badges[1],
    String(rawBadges[2] || defaults.profile.badges[2]).trim() || defaults.profile.badges[2],
  ];

  const rawSpecialties = Array.isArray(rawProfile.specialties)
    ? rawProfile.specialties.map((s: any) => String(s || '').trim()).filter(Boolean)
    : defaults.profile.specialties;

  const safePortrait =
    sanitizeSafeUrl(rawProfile.portraitUrl, { allowRelative: true }) ||
    defaults.profile.portraitUrl;

  const safeKakao =
    sanitizeSafeUrl(rawProfile.kakaoUrl) || defaults.profile.kakaoUrl;

  const profile: InterpreterProfile = {
    name: String(rawProfile.name || defaults.profile.name).trim() || defaults.profile.name,
    nickname:
      String(rawProfile.nickname || defaults.profile.nickname).trim() || defaults.profile.nickname,
    title: String(rawProfile.title || defaults.profile.title).trim() || defaults.profile.title,
    portraitUrl: safePortrait,
    badges,
    educationTitle:
      String(rawProfile.educationTitle || defaults.profile.educationTitle).trim() ||
      defaults.profile.educationTitle,
    educationDesc:
      String(rawProfile.educationDesc || defaults.profile.educationDesc).trim() ||
      defaults.profile.educationDesc,
    certTitle:
      String(rawProfile.certTitle || defaults.profile.certTitle).trim() ||
      defaults.profile.certTitle,
    certDesc:
      String(rawProfile.certDesc || defaults.profile.certDesc).trim() ||
      defaults.profile.certDesc,
    specialties: rawSpecialties.length > 0 ? rawSpecialties : defaults.profile.specialties,
    kakaoUrl: safeKakao,
  };

  const validCategories: PortfolioItemCategory[] = [
    '기업 세미나/MOU',
    'VIP 의전/컨퍼런스',
    '개업식/방송 MC',
  ];

  const items: PortfolioItem[] = Array.isArray(raw.items)
    ? raw.items
        .filter((it: any) => it && typeof it === 'object' && String(it.title || '').trim())
        .map((it: any, idx: number) => {
          const category = validCategories.includes(it.category)
            ? (it.category as PortfolioItemCategory)
            : '기업 세미나/MOU';
          const title = String(it.title || '').trim();
          const client = String(it.client || '비즈니스 파트너').trim();
          const safeVideo =
            sanitizeSafeUrl(it.videoUrl) ||
            `https://www.youtube.com/results?search_query=${encodeURIComponent(
              `${title} ${client}`
            )}`;
          const safeImage = sanitizeSafeUrl(it.image, { allowRelative: true }) || undefined;
          return {
            id: String(it.id || `portfolio-custom-${Date.now()}-${idx}`),
            category,
            title,
            client,
            role: typeof it.role === 'string' && it.role.trim() ? it.role.trim() : undefined,
            image: safeImage,
            visualVariant:
              it.visualVariant === 'concert' || it.visualVariant === 'opening'
                ? it.visualVariant
                : undefined,
            videoUrl: safeVideo,
          };
        })
    : defaults.items;

  return {
    profile,
    items,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
};

export const loadInterpreterPortfolioLocal = (): InterpreterPortfolioStore => {
  try {
    const raw = localStorage.getItem(INTERPRETER_PORTFOLIO_STORAGE_KEY);
    if (!raw) return getDefaultInterpreterPortfolio();
    return normalizeStore(JSON.parse(raw));
  } catch {
    return getDefaultInterpreterPortfolio();
  }
};

export const saveInterpreterPortfolio = async (
  store: InterpreterPortfolioStore
): Promise<{ localSaved: boolean; cloudSynced: boolean; errorMessage?: string }> => {
  const normalized = normalizeStore({
    ...store,
    updatedAt: new Date().toISOString(),
  });

  let localSaved = false;
  try {
    localStorage.setItem(INTERPRETER_PORTFOLIO_STORAGE_KEY, JSON.stringify(normalized));
    localSaved = true;
    window.dispatchEvent(
      new CustomEvent(INTERPRETER_PORTFOLIO_UPDATED_EVENT, { detail: normalized })
    );
  } catch (e: any) {
    return {
      localSaved: false,
      cloudSynced: false,
      errorMessage: e?.message || '브라우저 저장 공간에 저장하지 못했습니다.',
    };
  }

  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured || !getAdminSessionToken()) {
    return { localSaved, cloudSynced: false };
  }

  try {
    const { error } = await supabase.from('pages').upsert(
      {
        id: 'interpreter_portfolio',
        data: normalized,
        updated_at: normalized.updatedAt || new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
    return { localSaved, cloudSynced: true };
  } catch (e: any) {
    console.warn('Failed to sync interpreter portfolio to Supabase:', e);
    return {
      localSaved,
      cloudSynced: false,
      errorMessage: e?.message || 'Supabase 동기화에 실패해 현재 브라우저에만 저장되었습니다.',
    };
  }
};

export const syncInterpreterPortfolioFromCloud = async (): Promise<InterpreterPortfolioStore | null> => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('pages')
      .select('data, updated_at')
      .eq('id', 'interpreter_portfolio')
      .maybeSingle();

    if (error || !data?.data) return null;

    const cloudStore = normalizeStore({
      ...data.data,
      updatedAt: data.data?.updatedAt || data.updated_at,
    });
    const localStore = loadInterpreterPortfolioLocal();

    const cloudMs = cloudStore.updatedAt ? Date.parse(cloudStore.updatedAt) : NaN;
    const localMs = localStore.updatedAt ? Date.parse(localStore.updatedAt) : NaN;

    if (
      !localStore.updatedAt ||
      Number.isNaN(localMs) ||
      (!Number.isNaN(cloudMs) && cloudMs > localMs)
    ) {
      try {
        localStorage.setItem(INTERPRETER_PORTFOLIO_STORAGE_KEY, JSON.stringify(cloudStore));
      } catch {}
      return cloudStore;
    }
    return localStore;
  } catch {
    return null;
  }
};
