/**
 * 실시간 채팅 알림 사운드 (10가지 테마), 진동 및 브라우저 알림 유틸리티
 */

export type ChatSoundTheme =
  | 'chime'       // 1. 청량한 차임벨 (기본)
  | 'bubble'      // 2. 카톡 스타일 버블팝
  | 'tritone'     // 3. 아이폰 삼중음 벨
  | 'crystal'     // 4. 영롱한 크리스탈
  | 'marimba'     // 5. 마림바 멜로디
  | 'golf_cup'    // 6. 골프 굿샷 컵인
  | 'harp'        // 7. 하프 아르페지오
  | 'dingdong'    // 8. 모던 띵동 벨
  | 'fanfare'     // 9. 스타 팡파레
  | 'tropical';   // 10. 망고 트로피컬

export interface SoundThemeItem {
  id: ChatSoundTheme;
  name: string;
  category: string;
  description: string;
  icon: string;
  badge?: string;
}

export const CHAT_SOUND_THEMES: SoundThemeItem[] = [
  {
    id: 'chime',
    name: '청량한 차임벨',
    category: '기본 벨',
    description: '맑고 세련된 3음 하모니 차임',
    icon: '🔔',
    badge: '추천 기본'
  },
  {
    id: 'bubble',
    name: '카톡 스타일 버블팝',
    category: '메신저',
    description: '통통 튀는 경쾌한 더블 버블 팝 사운드',
    icon: '🫧',
    badge: '인기'
  },
  {
    id: 'tritone',
    name: '아이폰 삼중음 벨',
    category: '클래식',
    description: '명쾌하고 깔끔한 3단 시그니처 톤',
    icon: '📱'
  },
  {
    id: 'crystal',
    name: '영롱한 크리스탈',
    category: '프리미엄',
    description: '유리구슬처럼 투명하고 은은한 여운',
    icon: '💎'
  },
  {
    id: 'marimba',
    name: '마림바 멜로디',
    category: '어쿠스틱',
    description: '따뜻한 우드 타악기의 통통 튀는 울림',
    icon: '🪵'
  },
  {
    id: 'golf_cup',
    name: '골프 굿샷 컵인',
    category: '망고 스페셜',
    description: '골프공이 홀컵에 땡그랑 떨어지는 쾌감',
    icon: '⛳',
    badge: '골프 특화'
  },
  {
    id: 'harp',
    name: '하프 아르페지오',
    category: '감성/힐링',
    description: '우아하게 흐르는 부드러운 4음 하프',
    icon: '🪕'
  },
  {
    id: 'dingdong',
    name: '모던 띵동 벨',
    category: '호텔/컨시어지',
    description: '고급 호텔 컨시어지의 정갈한 안내음',
    icon: '🛎️'
  },
  {
    id: 'fanfare',
    name: '스타 팡파레',
    category: '경쾌함',
    description: '기분 좋은 소식을 알리는 미니 축하음',
    icon: '⭐'
  },
  {
    id: 'tropical',
    name: '망고 트로피컬',
    category: '휴양지 바이브',
    description: '동남아 휴양지의 싱그러운 스틸팬 멜로디',
    icon: '🥭',
    badge: '시그니처'
  }
];

// Web Audio API를 활용한 무설치/무지연 알림음 생성기
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio not supported or blocked:', e);
    return null;
  }
};

/**
 * 알림음 켜기/끄기 설정 확인 (기본값: true)
 */
export const isChatSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('mango_chat_sound_enabled');
  return saved === null ? true : saved === 'true';
};

export const setChatSoundEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mango_chat_sound_enabled', enabled ? 'true' : 'false');
};

/**
 * 현재 선택된 알림음 테마 가져오기 (기본값: 'chime')
 */
export const getChatSoundTheme = (): ChatSoundTheme => {
  if (typeof window === 'undefined') return 'chime';
  const saved = localStorage.getItem('mango_chat_sound_theme') as ChatSoundTheme;
  const valid = CHAT_SOUND_THEMES.some(t => t.id === saved);
  return valid ? saved : 'chime';
};

export const setChatSoundTheme = (theme: ChatSoundTheme): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mango_chat_sound_theme', theme);
};

/**
 * 알림 볼륨 (0.1 ~ 1.0, 기본값: 0.8)
 */
export const getChatSoundVolume = (): number => {
  if (typeof window === 'undefined') return 0.8;
  const saved = localStorage.getItem('mango_chat_sound_volume');
  if (saved !== null) {
    const num = parseFloat(saved);
    if (!isNaN(num) && num >= 0 && num <= 1) return num;
  }
  return 0.8;
};

export const setChatSoundVolume = (volume: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mango_chat_sound_volume', String(Math.max(0, Math.min(1, volume))));
};

/**
 * 10가지 개별 알림음 사운드 합성 구현체
 */
const synthesizeSoundTheme = (
  ctx: AudioContext,
  theme: ChatSoundTheme,
  masterVol: number
): void => {
  const now = ctx.currentTime;

  const tone = (
    freq: number,
    start: number,
    duration: number,
    gainLevel: number,
    type: OscillatorType = 'sine',
    sweepTo?: number
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(sweepTo, start + duration * 0.8);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainLevel * masterVol, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.05);
  };

  switch (theme) {
    // 1. 청량한 차임벨 (F5 -> A5 -> C6)
    case 'chime': {
      tone(698.46, now, 0.28, 0.22, 'sine');
      tone(880.00, now + 0.08, 0.32, 0.25, 'sine');
      tone(1046.50, now + 0.16, 0.45, 0.3, 'sine');
      break;
    }

    // 2. 카톡 스타일 버블팝 (경쾌한 팝 버블 두 번)
    case 'bubble': {
      // 1st pop: C5 sweep up to G5 quickly
      tone(440, now, 0.09, 0.3, 'sine', 784);
      // 2nd pop: E5 sweep up to C6
      tone(659.25, now + 0.09, 0.14, 0.38, 'sine', 1046.5);
      break;
    }

    // 3. 아이폰 삼중음 벨 (G#5 -> B5 -> E6)
    case 'tritone': {
      tone(830.61, now, 0.15, 0.24, 'sine');
      tone(987.77, now + 0.11, 0.18, 0.26, 'sine');
      tone(1318.51, now + 0.22, 0.38, 0.32, 'sine');
      break;
    }

    // 4. 영롱한 크리스탈 (고주파 유리 울림)
    case 'crystal': {
      tone(1174.66, now, 0.4, 0.2, 'sine');
      tone(1479.98, now + 0.05, 0.45, 0.22, 'sine');
      tone(2093.00, now + 0.12, 0.6, 0.26, 'sine');
      tone(2637.02, now + 0.18, 0.5, 0.15, 'triangle');
      break;
    }

    // 5. 마림바 멜로디 (우드 타악기)
    case 'marimba': {
      tone(523.25, now, 0.12, 0.35, 'triangle'); // C5
      tone(659.25, now + 0.07, 0.12, 0.35, 'triangle'); // E5
      tone(783.99, now + 0.14, 0.14, 0.38, 'triangle'); // G5
      tone(1046.50, now + 0.21, 0.25, 0.4, 'triangle'); // C6
      break;
    }

    // 6. 골프 굿샷 컵인 (맑은 땡그랑 컵인 소리)
    case 'golf_cup': {
      // 핀/홀컵 진동 소리 (금속성 딩)
      tone(1567.98, now, 0.35, 0.35, 'sine'); // G6
      tone(2093.00, now + 0.04, 0.4, 0.28, 'triangle'); // C7
      // 땡그랑 바운스
      tone(1318.51, now + 0.14, 0.22, 0.25, 'sine'); // E6
      tone(1760.00, now + 0.18, 0.35, 0.22, 'triangle'); // A6
      break;
    }

    // 7. 하프 아르페지오 (C5 -> E5 -> G5 -> C6 글리산도)
    case 'harp': {
      tone(523.25, now, 0.3, 0.18, 'sine');
      tone(659.25, now + 0.06, 0.32, 0.2, 'sine');
      tone(783.99, now + 0.12, 0.35, 0.24, 'sine');
      tone(1046.50, now + 0.18, 0.48, 0.28, 'triangle');
      break;
    }

    // 8. 모던 띵동 벨 (A5 -> D5 호텔 컨시어지 벨)
    case 'dingdong': {
      tone(880.00, now, 0.32, 0.32, 'sine'); // Ding (A5)
      tone(587.33, now + 0.18, 0.55, 0.35, 'sine'); // Dong (D5)
      break;
    }

    // 9. 스타 팡파레 (G5 -> C6 -> E6 -> G6)
    case 'fanfare': {
      tone(783.99, now, 0.1, 0.25, 'triangle');
      tone(1046.50, now + 0.07, 0.1, 0.28, 'triangle');
      tone(1318.51, now + 0.14, 0.12, 0.32, 'triangle');
      tone(1567.98, now + 0.21, 0.35, 0.38, 'sine');
      break;
    }

    // 10. 망고 트로피컬 (동남아 스틸팬 리조트 바이브)
    case 'tropical': {
      tone(587.33, now, 0.2, 0.3, 'triangle'); // D5
      tone(739.99, now + 0.08, 0.22, 0.32, 'triangle'); // F#5
      tone(880.00, now + 0.15, 0.25, 0.35, 'sine'); // A5
      tone(1174.66, now + 0.23, 0.45, 0.38, 'triangle'); // D6
      break;
    }

    default: {
      tone(698.46, now, 0.28, 0.25, 'sine');
      tone(880.00, now + 0.08, 0.32, 0.3, 'sine');
      tone(1046.50, now + 0.16, 0.45, 0.35, 'sine');
      break;
    }
  }
};

/**
 * 메시지 수신 알림음 재생
 * @param volumeMultiplier 볼륨 보정 계수 (기본 1.0)
 * @param specificTheme 특정 테마 강제 재생 (미리듣기 용도 등)
 */
export const playChatNotificationSound = (
  volumeMultiplier: number = 1.0,
  specificTheme?: ChatSoundTheme
): void => {
  if (!isChatSoundEnabled() && !specificTheme) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const theme = specificTheme || getChatSoundTheme();
    const userVolume = getChatSoundVolume();
    const effectiveVol = userVolume * volumeMultiplier;

    synthesizeSoundTheme(ctx, theme, effectiveVol);

    // 모바일 기기 진동 알림 (지원 기기)
    vibrateDevice([80, 40, 100]);
  } catch (err) {
    console.warn('Failed to play chat notification sound:', err);
  }
};

/**
 * 메시지 발신 성공 시 가벼운 피드백 사운드 (미세한 팝 사운드)
 */
export const playChatSendSound = (): void => {
  if (!isChatSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5

    const vol = getChatSoundVolume() * 0.15;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    // ignore
  }
};

/**
 * 모바일 디바이스 진동
 */
export const vibrateDevice = (pattern: number[] = [80, 40, 100]): void => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
};

/**
 * 브라우저 웹 푸시 / 데스크톱 알림 권한 요청
 */
export const requestChatNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Failed to request notification permission:', e);
    return 'denied';
  }
};

/**
 * 브라우저 데스크톱 알림 팝업 (탭이 백그라운드이거나 최소화되었을 때)
 */
export const showBrowserChatNotification = (sender: string, text: string, onClick?: () => void): void => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(`💬 망고투어 실시간 채팅 [${sender}]`, {
      body: text.length > 60 ? `${text.slice(0, 60)}...` : text,
      icon: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=128&q=80',
      badge: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=64&q=80',
      tag: 'mango-chat-notification',
    });

    notification.onclick = () => {
      window.focus();
      if (onClick) onClick();
      notification.close();
    };

    // 5초 후 자동 닫기
    setTimeout(() => {
      try {
        notification.close();
      } catch {
        // ignore
      }
    }, 5000);
  } catch (e) {
    console.warn('Failed to show browser notification:', e);
  }
};
