import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';
import { appConfirm, appAlert } from '../services/dialogService';
import { getAdminSessionToken } from '../services/supabaseClient';
import { supabaseService } from '../services/supabaseService';
import { uploadFile } from '../services/uploadService';
import { withImageVersion } from '../utils/imageUtils';
import {
  PortfolioCategory,
  PortfolioItemCategory,
  PortfolioItem,
  InterpreterProfile,
  InterpreterPortfolioStore,
  DEFAULT_INTERPRETER_PROFILE,
  KAKAO_OPEN_CHAT_URL,
  INTERPRETER_PORTFOLIO_UPDATED_EVENT,
  loadInterpreterPortfolioLocal,
  saveInterpreterPortfolio,
  syncInterpreterPortfolioFromCloud,
  getDefaultInterpreterPortfolio,
  sanitizeSafeUrl,
  validateImageInput,
} from '../services/interpreterPortfolioService';

export type { PortfolioCategory, PortfolioItem };

const CATEGORY_TABS: PortfolioItemCategory[] = [
  '기업 세미나/MOU',
  'VIP 의전/컨퍼런스',
  '개업식/방송 MC',
];

const ITEM_CATEGORIES: PortfolioItemCategory[] = CATEGORY_TABS;

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
  </svg>
);

const PortfolioFallbackArtwork: React.FC<{
  item: PortfolioItem;
  indexLabel: string;
}> = ({ item, indexLabel }) => {
  const isConcert = item.visualVariant === 'concert';
  return (
    <div
      className={`w-full h-full flex flex-col justify-between p-5 select-none ${
        isConcert
          ? 'bg-gradient-to-br from-[#12261E] via-[#1B4232] to-[#0D1A14] text-white'
          : 'bg-gradient-to-br from-[#F1F7F4] via-[#E5F1EB] to-[#D9EBE2] text-[#143D2C]'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider opacity-80">
        <span>{item.category}</span>
        <span className="tabular-nums">{indexLabel}</span>
      </div>

      <div className="my-auto py-3 flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isConcert
              ? 'bg-white/10 border-white/20 text-emerald-200'
              : 'bg-white border-[#1E6B4B]/20 text-[#1E6B4B]'
          }`}
        >
          {isConcert ? (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 8h10M7 12h6M7 16h4" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p
            className={`text-xs font-medium ${
              isConcert ? 'text-emerald-200/90' : 'text-[#1E6B4B]'
            }`}
          >
            {item.client}
          </p>
          <p className="text-sm font-bold leading-snug line-clamp-2 mt-0.5">{item.title}</p>
        </div>
      </div>

      <div
        className={`text-[11px] font-medium pt-2 border-t ${
          isConcert
            ? 'border-white/15 text-white/75'
            : 'border-[#1E6B4B]/15 text-[#1E6B4B]/80'
        }`}
      >
        {item.role || '전문 비즈니스 통역 & 공식 행사 진행'}
      </div>
    </div>
  );
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const InterpreterPortfolioModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [store, setStore] = useState<InterpreterPortfolioStore>(() =>
    loadInterpreterPortfolioLocal()
  );
  const [selectedCategory, setSelectedCategory] = useState<PortfolioItemCategory>('기업 세미나/MOU');
  const [portraitError, setPortraitError] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Admin mode states
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Profile editor modal state
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileDraft, setProfileDraft] = useState<InterpreterProfile>(store.profile);
  const [specialtiesText, setSpecialtiesText] = useState(
    store.profile.specialties.join(', ')
  );
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [profileUploadProgress, setProfileUploadProgress] = useState(0);
  const [profilePreviewError, setProfilePreviewError] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);

  // Card add/edit modal state
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isUploadingCardImage, setIsUploadingCardImage] = useState(false);
  const [cardUploadProgress, setCardUploadProgress] = useState(0);
  const [cardPreviewError, setCardPreviewError] = useState(false);
  const cardFileInputRef = useRef<HTMLInputElement | null>(null);
  const [cardDraft, setCardDraft] = useState<{
    category: PortfolioItemCategory;
    title: string;
    client: string;
    role: string;
    image: string;
    videoUrl: string;
  }>({
    category: '기업 세미나/MOU',
    title: '',
    client: '',
    role: '',
    image: '',
    videoUrl: '',
  });

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setStore(loadInterpreterPortfolioLocal());
    setPortraitError(false);
    setFailedImages({});

    void syncInterpreterPortfolioFromCloud().then((cloudStore) => {
      if (cloudStore) {
        setStore(cloudStore);
        setPortraitError(false);
        setFailedImages({});
      }
    });

    const handleUpdated = (e: Event) => {
      const detail = (e as CustomEvent<InterpreterPortfolioStore>)?.detail;
      if (detail) {
        setStore(detail);
        setPortraitError(false);
        setFailedImages({});
      }
    };
    window.addEventListener(INTERPRETER_PORTFOLIO_UPDATED_EVENT, handleUpdated);
    return () => {
      window.removeEventListener(INTERPRETER_PORTFOLIO_UPDATED_EVENT, handleUpdated);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAuthDialog) {
          setShowAuthDialog(false);
        } else if (showProfileEditor) {
          setShowProfileEditor(false);
        } else if (isAddingItem || editingItem) {
          setIsAddingItem(false);
          setEditingItem(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showAuthDialog, showProfileEditor, isAddingItem, editingItem]);

  const filteredItems = useMemo(() => {
    return store.items.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, store.items]);

  if (!isOpen) return null;

  const openExternal = (url: string) => {
    const safe = sanitizeSafeUrl(url);
    if (!safe) return;
    window.open(safe, '_blank', 'noopener,noreferrer');
  };

  const persistStore = async (nextStore: InterpreterPortfolioStore, message: string) => {
    setStore(nextStore);
    setPortraitError(false);
    setFailedImages({});
    const res = await saveInterpreterPortfolio(nextStore);
    if (!res.localSaved) {
      await appAlert(res.errorMessage || '저장에 실패했습니다.');
      return;
    }
    setSaveFeedback(
      res.cloudSynced
        ? `${message} (브라우저 및 클라우드 저장 완료)`
        : `${message} (브라우저 저장 완료)`
    );
    window.setTimeout(() => {
      setSaveFeedback((prev) => (prev && prev.startsWith(message) ? null : prev));
    }, 3500);
  };

  const handleToggleAdminClick = () => {
    if (isAdminEditing) {
      setIsAdminEditing(false);
      return;
    }
    if (getAdminSessionToken()) {
      setIsAdminEditing(true);
      return;
    }
    setAdminPasswordInput('');
    setAdminAuthError('');
    setShowAuthDialog(true);
  };

  const handleVerifyAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput.trim()) {
      setAdminAuthError('관리자 비밀번호를 입력해 주세요.');
      return;
    }
    setIsVerifyingAdmin(true);
    setAdminAuthError('');
    try {
      const result = await supabaseService.authenticateUser('admin', adminPasswordInput);
      if (result.success) {
        setShowAuthDialog(false);
        setIsAdminEditing(true);
        setAdminPasswordInput('');
      } else {
        setAdminAuthError(result.message || '관리자 비밀번호가 일치하지 않습니다.');
      }
    } catch (err: any) {
      setAdminAuthError(err?.message || '인증 확인 중 오류가 발생했습니다.');
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  const isSupportedImageFile = (file: File) => {
    const validMime = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(
      file.type.toLowerCase()
    );
    const validExt = /\.(png|jpe?g|webp)$/i.test(file.name);
    return validMime || validExt;
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      await appAlert('PNG, JPG, JPEG, WEBP 형식의 이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploadingProfileImage(true);
    setProfileUploadProgress(10);
    setProfilePreviewError(false);
    try {
      const uploadedUrl = await uploadFile(file, 'interpreter', (p) =>
        setProfileUploadProgress(p)
      );
      const finalUrl = withImageVersion(uploadedUrl);
      setProfileDraft((prev) => ({ ...prev, portraitUrl: finalUrl }));
    } catch (err: any) {
      await appAlert(err?.message || '프로필 이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingProfileImage(false);
      setProfileUploadProgress(0);
    }
  };

  const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      await appAlert('PNG, JPG, JPEG, WEBP 형식의 이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploadingCardImage(true);
    setCardUploadProgress(10);
    setCardPreviewError(false);
    try {
      const uploadedUrl = await uploadFile(file, 'interpreter-portfolio', (p) =>
        setCardUploadProgress(p)
      );
      const finalUrl = withImageVersion(uploadedUrl);
      setCardDraft((prev) => ({ ...prev, image: finalUrl }));
    } catch (err: any) {
      await appAlert(err?.message || '현장 사진 업로드에 실패했습니다.');
    } finally {
      setIsUploadingCardImage(false);
      setCardUploadProgress(0);
    }
  };

  const openProfileEditor = () => {
    setProfileDraft({
      ...store.profile,
      badges: [...store.profile.badges] as [string, string, string],
      specialties: [...store.profile.specialties],
    });
    setSpecialtiesText(store.profile.specialties.join(', '));
    setProfilePreviewError(false);
    setShowProfileEditor(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingProfileImage) {
      await appAlert('사진 업로드가 완료될 때까지 잠시 기다려 주세요.');
      return;
    }

    const portraitCheck = validateImageInput(profileDraft.portraitUrl);
    if (!portraitCheck.valid) {
      await appAlert(
        '프로필 사진 주소 형식이 올바르지 않습니다. 파일 업로드를 이용하거나 https:// 또는 / 로 시작하는 주소를 입력해 주세요.'
      );
      return;
    }

    const parsedSpecialties = specialtiesText
      .split(/[,|\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const nextStore: InterpreterPortfolioStore = {
      ...store,
      profile: {
        ...profileDraft,
        portraitUrl: portraitCheck.sanitized || DEFAULT_INTERPRETER_PROFILE.portraitUrl,
        specialties:
          parsedSpecialties.length > 0
            ? parsedSpecialties
            : store.profile.specialties,
      },
    };
    setShowProfileEditor(false);
    await persistStore(nextStore, '통역사 프로필이 수정되었습니다.');
  };

  const openAddCardModal = () => {
    setEditingItem(null);
    setIsAddingItem(true);
    setCardPreviewError(false);
    setCardDraft({
      category: selectedCategory,
      title: '',
      client: '',
      role: '',
      image: '',
      videoUrl: '',
    });
  };

  const openEditCardModal = (item: PortfolioItem) => {
    setIsAddingItem(false);
    setEditingItem(item);
    setCardPreviewError(false);
    setCardDraft({
      category: item.category,
      title: item.title,
      client: item.client,
      role: item.role || '',
      image: item.image || '',
      videoUrl: item.videoUrl || '',
    });
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingCardImage) {
      await appAlert('사진 업로드가 완료될 때까지 잠시 기다려 주세요.');
      return;
    }

    const cleanTitle = cardDraft.title.trim();
    const cleanClient = cardDraft.client.trim();
    if (!cleanTitle || !cleanClient) {
      await appAlert('행사명과 클라이언트명을 모두 입력해 주세요.');
      return;
    }

    const imageCheck = validateImageInput(cardDraft.image);
    if (!imageCheck.valid) {
      await appAlert(
        '현장 사진 주소 형식이 올바르지 않습니다. 파일 업로드를 이용하거나 https:// 또는 / 로 시작하는 주소를 입력해 주세요.'
      );
      return;
    }

    const safeVideo =
      sanitizeSafeUrl(cardDraft.videoUrl) ||
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanTitle} ${cleanClient}`
      )}`;
    const safeImage = imageCheck.sanitized || undefined;

    if (editingItem) {
      const nextItems = store.items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              category: cardDraft.category,
              title: cleanTitle,
              client: cleanClient,
              role: cardDraft.role.trim() || undefined,
              image: safeImage,
              videoUrl: safeVideo,
            }
          : it
      );
      setEditingItem(null);
      setSelectedCategory(cardDraft.category);
      await persistStore({ ...store, items: nextItems }, '포트폴리오 카드가 수정되었습니다.');
    } else {
      const newItem: PortfolioItem = {
        id: `portfolio-${Date.now()}`,
        category: cardDraft.category,
        title: cleanTitle,
        client: cleanClient,
        role: cardDraft.role.trim() || undefined,
        image: safeImage,
        videoUrl: safeVideo,
      };
      setIsAddingItem(false);
      setSelectedCategory(cardDraft.category);
      await persistStore(
        { ...store, items: [newItem, ...store.items] },
        '새 포트폴리오 카드가 추가되었습니다.'
      );
    }
  };

  const handleDeleteCard = async (item: PortfolioItem) => {
    const ok = await appConfirm(`'${item.title}' 포트폴리오 카드를 삭제하시겠습니까?`);
    if (!ok) return;
    const nextItems = store.items.filter((it) => it.id !== item.id);
    await persistStore({ ...store, items: nextItems }, '포트폴리오 카드가 삭제되었습니다.');
  };

  const handleResetDefaults = async () => {
    const ok = await appConfirm(
      '통역사 프로필과 포트폴리오 목록을 기본 데이터(7건)로 복원하시겠습니까?'
    );
    if (!ok) return;
    await persistStore(getDefaultInterpreterPortfolio(), '기본 데이터로 복원되었습니다.');
  };

  const profile = store.profile;
  const kakaoUrl = sanitizeSafeUrl(profile.kakaoUrl) || KAKAO_OPEN_CHAT_URL;

  const content = (
    <div
      className="fixed inset-0 z-[10020] bg-[#F7F8F7] flex flex-col animate-fade-in w-full max-w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interpreter-portfolio-heading"
    >
      {/* Top Bar */}
      <header className="bg-white border-b border-black/[0.08] px-3 sm:px-6 py-3 sm:py-3.5 shrink-0 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1E6B4B] bg-[#ECFDF5] hover:bg-[#DDF7EB] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B4B]"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>뒤로가기</span>
          </button>

          <h1
            id="interpreter-portfolio-heading"
            className="text-xs sm:text-base font-bold text-gray-900 truncate text-center"
          >
            {profile.nickname || 'Ms. Trang'} 비즈니스 통역 &amp; MC 포트폴리오
          </h1>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleAdminClick}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B4B] ${
                isAdminEditing
                  ? 'bg-[#1E6B4B] text-white'
                  : 'bg-[#F2F2F7] text-gray-700 hover:bg-[#ECFDF5] hover:text-[#1E6B4B]'
              }`}
            >
              {isAdminEditing ? '편집 종료' : '관리자 편집'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="포트폴리오 닫기"
              className="w-9 h-9 rounded-full bg-[#F2F2F7] hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B4B]"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 sm:py-9 pb-28">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-9">
          {/* Admin Toolbar */}
          {isAdminEditing && (
            <div className="rounded-2xl border border-[#1E6B4B]/30 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-extrabold text-[#1E6B4B]">
                  통역사 포트폴리오 관리자 모드
                </p>
                <p className="text-xs text-[#5A5A60]">
                  프로필 정보와 경력 카드를 추가·수정·삭제하면 즉시 저장되어 새로고침 후에도 유지됩니다.
                </p>
                {saveFeedback && (
                  <p className="text-xs font-bold text-[#1E6B4B] pt-0.5">
                    ✓ {saveFeedback}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openProfileEditor}
                  className="px-3.5 py-2 rounded-xl border border-[#1E6B4B]/30 bg-[#ECFDF5] text-[#1E6B4B] hover:bg-[#DDF7EB] text-xs font-bold transition whitespace-nowrap cursor-pointer"
                >
                  프로필 수정
                </button>
                <button
                  type="button"
                  onClick={openAddCardModal}
                  className="px-3.5 py-2 rounded-xl bg-[#1E6B4B] hover:bg-[#16533A] text-white text-xs font-bold transition whitespace-nowrap cursor-pointer"
                >
                  + 경력 카드 추가
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-2 rounded-xl bg-[#F2F2F7] hover:bg-gray-200 text-gray-700 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
                >
                  기본값 복원
                </button>
              </div>
            </div>
          )}

          {/* Top Summary Section: Bio, Education, Certifications */}
          <section className="bg-white rounded-[20px] border border-black/[0.08] p-5 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Portrait + Identity */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#ECFDF5] border border-[#1E6B4B]/20 shrink-0 relative">
                  {!portraitError && profile.portraitUrl ? (
                    <img
                      key={profile.portraitUrl}
                      src={profile.portraitUrl}
                      alt={`${profile.name} (${profile.nickname}) 전담 통역사 겸 MC 프로필 사진`}
                      referrerPolicy="no-referrer"
                      onError={() => setPortraitError(true)}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1E6B4B] text-white font-bold text-xl">
                      MT
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1.5">
                  <p className="text-xs font-bold text-[#1E6B4B] tracking-wide">
                    MANGO TOUR 전담 비즈니스 통역사 &amp; MC
                  </p>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 leading-tight">
                    {profile.name}
                    {profile.nickname && (
                      <span className="block sm:inline sm:ml-2 text-base sm:text-lg font-bold text-[#1E6B4B]">
                        ({profile.nickname})
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-[#4A4A4F] leading-relaxed">
                    {profile.title}
                  </p>
                  {isAdminEditing && (
                    <button
                      type="button"
                      onClick={openProfileEditor}
                      className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ECFDF5] hover:bg-[#DDF7EB] text-[#1E6B4B] text-xs font-bold transition cursor-pointer"
                    >
                      <span>📷 프로필 사진·정보 수정</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Structured Education / Certifications / Bio */}
              <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-black/[0.08] pt-5 lg:pt-0 lg:pl-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-[#1E6B4B] tracking-wide">학력</h3>
                  <p className="text-sm sm:text-base font-bold text-gray-900">
                    {profile.educationTitle}
                  </p>
                  <p className="text-xs sm:text-sm text-[#5A5A60] leading-relaxed">
                    {profile.educationDesc}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-[#1E6B4B] tracking-wide">
                    자격증 및 어학 역량
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-gray-900">
                    {profile.certTitle}
                  </p>
                  <p className="text-xs sm:text-sm text-[#5A5A60] leading-relaxed">
                    {profile.certDesc}
                  </p>
                </div>

                <div className="sm:col-span-2 pt-3 border-t border-black/[0.06] flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-[#3A3A3C]">
                  <span className="font-semibold text-gray-900">전문 수행 영역</span>
                  {profile.specialties.map((spec) => (
                    <React.Fragment key={spec}>
                      <span aria-hidden="true" className="text-gray-300">
                        ·
                      </span>
                      <span>{spec}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Middle Section: Filter Tabs + Portfolio Grid */}
          <section className="space-y-5 sm:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-gray-900">
                  주요 현장 경력 &amp; 진행 영상
                </h2>
                <p className="text-xs sm:text-sm text-[#5A5A60] mt-1">
                  카테고리별로 실제 수행한 기업 세미나, VIP 의전, 공식 MC 레퍼런스를 확인하세요.
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div
                role="tablist"
                aria-label="통역 및 MC 경력 카테고리 필터"
                className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-black/[0.08]"
              >
                {CATEGORY_TABS.map((tab) => {
                  const isActive = selectedCategory === tab;
                  const count = store.items.filter((i) => i.category === tab).length;
                  return (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedCategory(tab)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B4B] ${
                        isActive
                          ? 'bg-[#1E6B4B] text-white'
                          : 'text-[#3A3A3C] hover:bg-[#ECFDF5] hover:text-[#1E6B4B]'
                      }`}
                    >
                      {tab} <span className="tabular-nums opacity-80 ml-0.5">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Responsive Card Grid (2 or 3 columns) */}
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-black/[0.08] py-14 px-6 text-center space-y-2">
                <p className="text-sm font-bold text-gray-900">
                  해당 카테고리에 등록된 경력이 없습니다.
                </p>
                {isAdminEditing && (
                  <button
                    type="button"
                    onClick={openAddCardModal}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#1E6B4B] text-white text-xs font-bold cursor-pointer"
                  >
                    + 새 경력 카드 추가하기
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((item, idx) => {
                  const indexLabel = String(idx + 1).padStart(2, '0');
                  const showPhoto = Boolean(item.image) && !failedImages[item.id];
                  return (
                    <article
                      key={item.id}
                      className="bg-white rounded-[20px] border border-black/[0.08] overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-shadow duration-200"
                    >
                      {/* 4:3 Field Photography / Visual Container */}
                      <div className="aspect-[4/3] w-full overflow-hidden bg-[#EEF3F0]">
                        {showPhoto ? (
                          <img
                            key={item.image}
                            src={item.image}
                            alt={`${item.title} 현장 사진`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PortfolioFallbackArtwork item={item} indexLabel={indexLabel} />
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex flex-col flex-1">
                        {/* Unboxed Metadata (Zero-Pill) */}
                        <div className="flex items-center gap-2 text-xs text-[#1E6B4B] font-bold mb-2">
                          <span className="tabular-nums">{indexLabel}</span>
                          <span aria-hidden="true" className="text-gray-300">
                            ·
                          </span>
                          <span>{item.category}</span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-2">
                          {item.title}
                        </h3>

                        <div className="text-xs sm:text-sm text-[#5A5A60] space-y-1 mb-5 flex-1">
                          <p>
                            <span className="font-semibold text-gray-700">클라이언트</span>
                            <span className="mx-1.5 text-gray-300">/</span>
                            <span>{item.client}</span>
                          </p>
                          {item.role && (
                            <p className="text-xs text-[#727278]">{item.role}</p>
                          )}
                        </div>

                        <div className="space-y-2 mt-auto">
                          <button
                            type="button"
                            onClick={() => openExternal(item.videoUrl)}
                            className="w-full py-2.5 px-4 rounded-xl border border-black/[0.12] bg-[#FAFAFA] hover:bg-[#ECFDF5] hover:border-[#1E6B4B]/40 text-gray-900 hover:text-[#1E6B4B] font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B4B]"
                          >
                            <YouTubeIcon className="w-4 h-4 text-[#FF0000] shrink-0" />
                            <span>유튜브 현장 영상 보기</span>
                          </button>

                          {isAdminEditing && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => openEditCardModal(item)}
                                className="py-2 px-3 rounded-xl bg-[#ECFDF5] hover:bg-[#DDF7EB] text-[#1E6B4B] font-bold text-xs transition cursor-pointer"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteCard(item)}
                                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Bottom Fixed Floating Bar */}
      <footer
        className="bg-white/95 backdrop-blur-md border-t border-black/[0.08] px-4 sm:px-6 py-3 shrink-0 sticky bottom-0 z-20"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {profile.name} ({profile.nickname}) · 한·영·베 비즈니스 통역 &amp; MC
            </p>
            <p className="text-xs text-[#5A5A60] truncate">
              기업 미팅, MOU 체결식, VIP 의전 및 행사 일정을 카카오톡으로 바로 상담하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openExternal(kakaoUrl)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#1E6B4B] hover:bg-[#16533A] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1E6B4B]"
          >
            <span>💬</span>
            <span>전담 통역 및 의전 견적 문의하기 (카카오톡)</span>
          </button>
        </div>
      </footer>

      {/* Admin Password Verification Dialog */}
      {showAuthDialog && (
        <div
          className="fixed inset-0 z-[10030] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAuthDialog(false)}
        >
          <form
            onSubmit={handleVerifyAdminSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-sm p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900">
                관리자 인증
              </h3>
              <button
                type="button"
                onClick={() => setShowAuthDialog(false)}
                className="w-8 h-8 rounded-full bg-[#F2F2F7] text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#5A5A60] leading-relaxed">
              통역사 프로필 및 포트폴리오 카드를 수정하려면 관리자 비밀번호를 입력해 주세요.
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                관리자 비밀번호
              </label>
              <input
                type="password"
                autoFocus
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="관리자 비밀번호 입력"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E6B4B] text-sm"
              />
              {adminAuthError && (
                <p className="mt-1.5 text-xs font-semibold text-rose-600">
                  {adminAuthError}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAuthDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#F2F2F7] text-gray-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isVerifyingAdmin}
                className="flex-1 py-2.5 rounded-xl bg-[#1E6B4B] hover:bg-[#16533A] text-white font-bold text-xs sm:text-sm disabled:opacity-60 cursor-pointer"
              >
                {isVerifyingAdmin ? '확인 중...' : '인증 후 편집'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <div
          className="fixed inset-0 z-[10030] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowProfileEditor(false)}
        >
          <form
            onSubmit={handleSaveProfile}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-xl max-h-[90dvh] flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between shrink-0">
              <h3 className="text-base font-extrabold text-gray-900">
                통역사 프로필 정보 수정
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileEditor(false)}
                className="w-8 h-8 rounded-full bg-[#F2F2F7] text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    성명 (본명)
                  </label>
                  <input
                    type="text"
                    required
                    value={profileDraft.name}
                    onChange={(e) =>
                      setProfileDraft({ ...profileDraft, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    활동명 / 호칭
                  </label>
                  <input
                    type="text"
                    value={profileDraft.nickname}
                    onChange={(e) =>
                      setProfileDraft({ ...profileDraft, nickname: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  타이틀 / 한 줄 소개
                </label>
                <input
                  type="text"
                  required
                  value={profileDraft.title}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>

              <div className="rounded-2xl border border-black/[0.08] bg-[#F8FBF9] p-3.5 space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  프로필 사진 변경 (PNG, JPG 업로드 또는 URL 입력)
                </label>
                <div className="flex items-center gap-3.5">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#ECFDF5] border border-[#1E6B4B]/20 shrink-0">
                    {!profilePreviewError && sanitizeSafeUrl(profileDraft.portraitUrl, { allowRelative: true }) ? (
                      <img
                        key={profileDraft.portraitUrl}
                        src={sanitizeSafeUrl(profileDraft.portraitUrl, { allowRelative: true })}
                        alt="프로필 사진 미리보기"
                        referrerPolicy="no-referrer"
                        onError={() => setProfilePreviewError(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1E6B4B] text-white font-bold text-base">
                        MT
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      ref={profileFileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isUploadingProfileImage}
                        onClick={() => profileFileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-[#1E6B4B] hover:bg-[#16533A] disabled:opacity-60 text-white text-xs font-bold transition cursor-pointer"
                      >
                        {isUploadingProfileImage
                          ? `업로드 중... ${profileUploadProgress}%`
                          : '📷 사진 파일 업로드 (PNG/JPG)'}
                      </button>
                      <button
                        type="button"
                        disabled={isUploadingProfileImage}
                        onClick={() => {
                          setProfilePreviewError(false);
                          setProfileDraft({
                            ...profileDraft,
                            portraitUrl: DEFAULT_INTERPRETER_PROFILE.portraitUrl,
                          });
                        }}
                        className="px-3 py-2 rounded-xl bg-white border border-black/[0.1] hover:bg-gray-50 text-gray-700 text-xs font-semibold transition cursor-pointer"
                      >
                        기본 사진 복원
                      </button>
                    </div>
                    <input
                      type="text"
                      value={profileDraft.portraitUrl}
                      onChange={(e) => {
                        setProfilePreviewError(false);
                        setProfileDraft({ ...profileDraft, portraitUrl: e.target.value });
                      }}
                      placeholder="또는 이미지 URL 입력 (https://...)"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[0, 1, 2].map((bIdx) => (
                  <div key={bIdx}>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      핵심 자격 뱃지 {bIdx + 1}
                    </label>
                    <input
                      type="text"
                      value={profileDraft.badges[bIdx] || ''}
                      onChange={(e) => {
                        const nextBadges = [...profileDraft.badges] as [
                          string,
                          string,
                          string,
                        ];
                        nextBadges[bIdx] = e.target.value;
                        setProfileDraft({ ...profileDraft, badges: nextBadges });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  학력 요약
                </label>
                <input
                  type="text"
                  value={profileDraft.educationTitle}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      educationTitle: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
                <textarea
                  rows={2}
                  value={profileDraft.educationDesc}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      educationDesc: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  자격증 및 어학 역량
                </label>
                <input
                  type="text"
                  value={profileDraft.certTitle}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, certTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
                <textarea
                  rows={2}
                  value={profileDraft.certDesc}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, certDesc: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  전문 수행 영역 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={specialtiesText}
                  onChange={(e) => setSpecialtiesText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  카카오톡 상담 링크
                </label>
                <input
                  type="url"
                  value={profileDraft.kakaoUrl}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, kakaoUrl: e.target.value })
                  }
                  placeholder="https://open.kakao.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-black/[0.06] bg-white flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileEditor(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#F2F2F7] text-gray-700 font-bold text-sm cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#1E6B4B] hover:bg-[#16533A] text-white font-bold text-sm cursor-pointer"
              >
                프로필 저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Portfolio Card Add / Edit Modal */}
      {(isAddingItem || editingItem) && (
        <div
          className="fixed inset-0 z-[10030] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => {
            setIsAddingItem(false);
            setEditingItem(null);
          }}
        >
          <form
            onSubmit={handleSaveCard}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between shrink-0">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingItem ? '포트폴리오 카드 수정' : '새 포트폴리오 카드 추가'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingItem(false);
                  setEditingItem(null);
                }}
                className="w-8 h-8 rounded-full bg-[#F2F2F7] text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  value={cardDraft.category}
                  onChange={(e) =>
                    setCardDraft({
                      ...cardDraft,
                      category: e.target.value as PortfolioItemCategory,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  행사명 *
                </label>
                <input
                  type="text"
                  required
                  value={cardDraft.title}
                  onChange={(e) =>
                    setCardDraft({ ...cardDraft, title: e.target.value })
                  }
                  placeholder="예: 베트남 비즈니스 성장 전략 세미나 & MOU"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  클라이언트 *
                </label>
                <input
                  type="text"
                  required
                  value={cardDraft.client}
                  onChange={(e) =>
                    setCardDraft({ ...cardDraft, client: e.target.value })
                  }
                  placeholder="예: Fiin Group, KODATA, Allianz Trade"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  수행 역할 (선택)
                </label>
                <input
                  type="text"
                  value={cardDraft.role}
                  onChange={(e) =>
                    setCardDraft({ ...cardDraft, role: e.target.value })
                  }
                  placeholder="예: 한·영·베 3개국어 공식 MC 및 동시 통역"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>

              <div className="rounded-2xl border border-black/[0.08] bg-[#F8FBF9] p-3.5 space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  현장 사진 변경 (PNG, JPG 업로드 또는 URL 입력)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                  <div className="w-full sm:w-36 aspect-[4/3] rounded-xl overflow-hidden bg-[#EEF3F0] border border-black/[0.08] shrink-0 flex items-center justify-center">
                    {!cardPreviewError && sanitizeSafeUrl(cardDraft.image, { allowRelative: true }) ? (
                      <img
                        key={cardDraft.image}
                        src={sanitizeSafeUrl(cardDraft.image, { allowRelative: true })}
                        alt="현장 사진 미리보기"
                        referrerPolicy="no-referrer"
                        onError={() => setCardPreviewError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold text-[#5A5A60] px-2 text-center">
                        기본 그래픽 카드
                      </span>
                    )}
                  </div>

                  <div className="flex-1 w-full min-w-0 space-y-2">
                    <input
                      ref={cardFileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      onChange={handleCardImageUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isUploadingCardImage}
                        onClick={() => cardFileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-[#1E6B4B] hover:bg-[#16533A] disabled:opacity-60 text-white text-xs font-bold transition cursor-pointer"
                      >
                        {isUploadingCardImage
                          ? `업로드 중... ${cardUploadProgress}%`
                          : '📷 사진 파일 업로드 (PNG/JPG)'}
                      </button>
                      {cardDraft.image && (
                        <button
                          type="button"
                          disabled={isUploadingCardImage}
                          onClick={() => {
                            setCardPreviewError(false);
                            setCardDraft({ ...cardDraft, image: '' });
                          }}
                          className="px-3 py-2 rounded-xl bg-white border border-black/[0.1] hover:bg-gray-50 text-gray-700 text-xs font-semibold transition cursor-pointer"
                        >
                          사진 제거
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={cardDraft.image}
                      onChange={(e) => {
                        setCardPreviewError(false);
                        setCardDraft({ ...cardDraft, image: e.target.value });
                      }}
                      placeholder="또는 이미지 URL 입력 (비워두면 기본 그래픽 카드 표시)"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  유튜브 현장 영상 링크 (URL)
                </label>
                <input
                  type="text"
                  value={cardDraft.videoUrl}
                  onChange={(e) =>
                    setCardDraft({ ...cardDraft, videoUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4B]"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-black/[0.06] bg-white flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddingItem(false);
                  setEditingItem(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#F2F2F7] text-gray-700 font-bold text-sm cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#1E6B4B] hover:bg-[#16533A] text-white font-bold text-sm cursor-pointer"
              >
                {editingItem ? '수정 저장' : '추가 저장'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
};

export default InterpreterPortfolioModal;
