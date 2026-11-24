
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Eye, Lock, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { CommunityPost, User, Comment } from '../types';
import { uploadFile } from '../services/uploadService';
import BackButton from './BackButton';
import { getFreshImageUrl, withImageVersion } from '../utils/imageUtils';
import { VERIFIED_IMAGE_PRESETS } from '../constants';
import { appAlert, appConfirm } from '../services/dialogService';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';

interface Props {
  posts: CommunityPost[];
  user: User | null;
  onUpdatePosts: (posts: CommunityPost[]) => void;
  onReqLogin: () => void;
  onBack?: () => void;
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  onUpdateHeroImage?: (url: string) => void;
}

const DEFAULT_COMMUNITY_HERO = 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1600&q=80';

const CommunityBoard: React.FC<Props> = ({
  posts,
  user,
  onUpdatePosts,
  onReqLogin,
  onBack,
  heroImage,
  heroTitle,
  heroSubtitle,
  onUpdateHeroImage
}) => {
  const isAdmin = user?.role === 'admin';
  const [isAdding, setIsAdding] = useState(false);
  
  // New Post State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostRegion, setNewPostRegion] = useState('호치민');
  const [newPostTheme, setNewPostTheme] = useState('자유 여행');
  const [newPostImage, setNewPostImage] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [postPassword, setPostPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  
  // Detail & Edit Modal State
  const [viewingPost, setViewingPost] = useState<CommunityPost | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle Edit Mode
  const [editForm, setEditForm] = useState<CommunityPost | null>(null); // Temp data for editing
  const [commentInput, setCommentInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<string | null>(null);
  const [adminReplyInput, setAdminReplyInput] = useState('');
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});
  const [viewImageBroken, setViewImageBroken] = useState(false);
  const [editImageBroken, setEditImageBroken] = useState(false);
  const [showEditPresetPicker, setShowEditPresetPicker] = useState(false);
  const [heroImageBroken, setHeroImageBroken] = useState(false);
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const [heroUrlDraft, setHeroUrlDraft] = useState(heroImage || DEFAULT_COMMUNITY_HERO);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  // Category Filter & Card Image Fallback State
  const FILTER_TABS = ['전체', '호치민', '붕따우', '무이네', '달랏', '골프 여행', '자유 여행', '단체 여행'] as const;
  const [selectedFilter, setSelectedFilter] = useState<string>('전체');
  const [brokenCardImageIds, setBrokenCardImageIds] = useState<Record<string, boolean>>({});

  useBodyScrollLock(Boolean((viewingPost && user) || showPasswordPrompt));

  const filteredPosts = useMemo(() => {
    if (selectedFilter === '전체') return posts;
    return posts.filter(
      (post) => post.region === selectedFilter || post.theme === selectedFilter
    );
  }, [posts, selectedFilter]);

  // Handle internal step-by-step back
  const handleTopBack = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    if (viewingPost) {
      setViewingPost(null);
      return;
    }
    if (isAdding) {
      setIsAdding(false);
      return;
    }
    if (showPasswordPrompt) {
      setShowPasswordPrompt(null);
      return;
    }
    onBack?.();
  };

  // Listen for mobile bottom nav "뒤로가기" event
  useEffect(() => {
    const handleSubViewBack = (e: any) => {
      if (isEditing) {
        setIsEditing(false);
        e?.detail?.handled?.();
        return;
      }
      if (viewingPost) {
        setViewingPost(null);
        e?.detail?.handled?.();
        return;
      }
      if (isAdding) {
        setIsAdding(false);
        e?.detail?.handled?.();
        return;
      }
      if (showPasswordPrompt) {
        setShowPasswordPrompt(null);
        e?.detail?.handled?.();
        return;
      }
    };

    window.addEventListener('mango_subview_back', handleSubViewBack as EventListener);
    return () => {
      window.removeEventListener('mango_subview_back', handleSubViewBack as EventListener);
    };
  }, [isEditing, viewingPost, isAdding, showPasswordPrompt]);

  // Handle Image Upload for New Post
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const downloadUrl = await uploadFile(file, 'community_images');
        setNewPostImage(withImageVersion(downloadUrl));
      } catch (error) {
        await appAlert('이미지 업로드 실패: ' + error);
      } finally {
        setIsUploading(false);
      }
    }
    e.target.value = '';
  };

  // Handle Image Upload for Editing Post
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      setIsUploading(true);
      try {
        const downloadUrl = await uploadFile(file, 'community_images');
        setEditForm({ ...editForm, image: withImageVersion(downloadUrl) });
        setEditImageBroken(false);
      } catch (error) {
        await appAlert('이미지 업로드 실패: ' + error);
      } finally {
        setIsUploading(false);
      }
    }
    e.target.value = '';
  };

  // Handle Hero Banner Image Upload for Admin
  const handleHeroBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateHeroImage) {
      setIsUploadingHero(true);
      try {
        const downloadUrl = withImageVersion(await uploadFile(file, 'community_images'));
        setHeroUrlDraft(downloadUrl);
        setHeroImageBroken(false);
        onUpdateHeroImage(downloadUrl);
        setShowHeroEditor(false);
      } catch (error) {
        await appAlert('배너 이미지 업로드 실패: ' + error);
      } finally {
        setIsUploadingHero(false);
      }
    }
    e.target.value = '';
  };

  // Remove Image during Edit
  const handleRemoveEditImage = async () => {
    if (editForm && (await appConfirm('이미지를 삭제하시겠습니까?'))) {
      setEditForm({ ...editForm, image: '' });
      setEditImageBroken(false);
    }
  };

  const handleAddPost = async () => {
    if (!user) {
        onReqLogin();
        return;
    }
    if (!newPostTitle || !newPostContent) {
        await appAlert('제목과 내용을 입력해주세요.');
        return;
    }
    if (isPrivate && !postPassword) {
        await appAlert('비공개 글은 비밀번호가 필요합니다.');
        return;
    }

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      title: newPostTitle,
      content: newPostContent,
      author: user.nickname || user.username,
      date: new Date().toISOString().split('T')[0],
      region: newPostRegion,
      theme: newPostTheme,
      image: newPostImage,
      comments: [],
      views: 0,
      likes: 0,
      isPrivate: isPrivate,
      password: isPrivate ? postPassword : undefined
    };

    onUpdatePosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostRegion('호치민');
    setNewPostTheme('자유 여행');
    setNewPostImage('');
    setIsPrivate(false);
    setPostPassword('');
    setIsAdding(false);
  };

  const handlePostClick = async (post: CommunityPost) => {
    if (!user) {
      if (await appConfirm('게시글 상세 내용과 사진을 보시려면 로그인이 필요합니다. 로그인하시겠습니까?')) {
        onReqLogin();
      }
      return;
    }

    if (post.isPrivate && !isAdmin && post.author !== user?.nickname && post.author !== user?.username) {
      setShowPasswordPrompt(post.id);
      return;
    }

    openPost(post);
  };

  const openPost = (post: CommunityPost, startInEditMode = false) => {
    // Increment view count when opening
    const updatedPost = { ...post, views: post.views + 1 };
    const updatedPosts = posts.map(p => p.id === post.id ? updatedPost : p);
    onUpdatePosts(updatedPosts);
    setViewingPost(updatedPost);
    setViewImageBroken(false);
    setEditImageBroken(false);
    setShowEditPresetPicker(false);
    if (startInEditMode) {
      setEditForm({ ...updatedPost });
      setIsEditing(true);
    } else {
      setIsEditing(false);
      setEditForm(null);
    }
    setAdminReplyInput(post.adminReply || '');
    setShowPasswordPrompt(null);
    setPasswordInput('');
  };

  const handlePasswordSubmit = async () => {
    const post = posts.find(p => p.id === showPasswordPrompt);
    if (post && post.password === passwordInput) {
      openPost(post);
    } else {
      await appAlert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleSaveAdminReply = async () => {
    if (!viewingPost || !isAdmin) return;
    const updatedPost = { ...viewingPost, adminReply: adminReplyInput };
    setViewingPost(updatedPost);
    onUpdatePosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    await appAlert('답변이 저장되었습니다.');
  };

  const handleDelete = async (id: string) => {
    if ((isAdmin || viewingPost?.author === user?.username || viewingPost?.author === user?.nickname) && (await appConfirm('정말 게시글을 삭제하시겠습니까?'))) {
      onUpdatePosts(posts.filter(p => p.id !== id));
      if (viewingPost?.id === id) {
        setViewingPost(null);
        setIsEditing(false);
      }
    }
  };

  // Edit Functions
  const startEdit = () => {
    if (viewingPost) {
      setEditForm({ ...viewingPost });
      setEditImageBroken(false);
      setShowEditPresetPicker(false);
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
    setEditImageBroken(false);
    setShowEditPresetPicker(false);
  };

  const saveEdit = async () => {
    if (!editForm || !viewingPost) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      await appAlert('제목과 내용은 필수입니다.');
      return;
    }

    // Update global posts array
    const updatedPosts = posts.map(p => p.id === editForm.id ? editForm : p);
    onUpdatePosts(updatedPosts);
    
    // Update local viewing state
    setViewingPost(editForm);
    setViewImageBroken(false);
    setIsEditing(false);
    setEditForm(null);
    setShowEditPresetPicker(false);
  };

  const handleAddComment = async () => {
    if (!user) {
        if(await appConfirm('로그인이 필요한 서비스입니다. 로그인 하시겠습니까?')) {
            onReqLogin();
        }
        return;
    }
    if (!commentInput.trim() || !viewingPost) return;

    const newComment: Comment = {
        id: Date.now().toString(),
        author: user.nickname || user.username,
        content: commentInput,
        date: new Date().toISOString().split('T')[0],
        isAdmin: isAdmin
    };

    const updatedPost = { 
        ...viewingPost, 
        comments: [...viewingPost.comments, newComment] 
    };

    // Update both local state and global posts state
    setViewingPost(updatedPost);
    onUpdatePosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    setCommentInput('');
  };

  const handleToggleLike = (post: CommunityPost) => {
    const alreadyLiked = Boolean(likedPostIds[post.id]);
    const currentLikes = post.likes ?? 0;
    const nextLikes = alreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const updatedPost = { ...post, likes: nextLikes };
    setLikedPostIds(prev => ({ ...prev, [post.id]: !alreadyLiked }));
    setViewingPost(updatedPost);
    onUpdatePosts(posts.map(p => p.id === post.id ? updatedPost : p));
  };

  return (
    <div className="bg-[#F2F2F7] text-[#3A3A3C] font-sans overflow-x-clip animate-fade-in">
      {/* Sticky Subpage Hero Banner */}
      {onBack ? (
        <div
          className="sticky z-20 w-full bg-[#F2F2F7]/90 backdrop-blur-md pb-2 md:pb-3"
          style={{ top: 'var(--site-header-height, 45px)' }}
        >
          <div className="max-w-7xl mx-auto px-0 md:px-4 pt-0 md:pt-3">
            <section className="relative h-[140px] sm:h-[164px] md:h-[240px] lg:h-[260px] flex items-center justify-center overflow-hidden bg-black rounded-none md:rounded-[20px] shadow-none md:shadow-sm">
              <div className="absolute inset-0 z-0">
                <img 
                  src={getFreshImageUrl(heroImage || DEFAULT_COMMUNITY_HERO)} 
                  alt="Community Hero" 
                  onLoad={() => setHeroImageBroken(false)}
                  onError={() => setHeroImageBroken(true)}
                  className="w-full h-full object-cover object-center opacity-60" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25"></div>
              </div>
              
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
                <BackButton onClick={handleTopBack} variant="hero" label={viewingPost || isAdding ? '목록으로' : '뒤로가기'} />
              </div>

              {isAdmin && onUpdateHeroImage && (
                <button
                  type="button"
                  onClick={() => {
                    setHeroUrlDraft(heroImage || DEFAULT_COMMUNITY_HERO);
                    setShowHeroEditor(prev => !prev);
                  }}
                  className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-50 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5 backdrop-blur-md border ${
                    heroImageBroken
                      ? 'bg-red-600/95 text-white border-red-300'
                      : 'bg-black/65 hover:bg-[#0A7E54] text-white border-white/25'
                  }`}
                >
                  <span>{heroImageBroken ? '⚠️' : '🖼️'}</span>
                  <span>{heroImageBroken ? '배너 깨짐 · 수정' : '배너 사진 수정'}</span>
                </button>
              )}

              <div className="relative z-10 text-center px-4 pt-4 sm:pt-2 md:pt-0">
                <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow mb-0.5 sm:mb-1 uppercase tracking-tight break-keep">
                  {heroTitle || '커뮤니티 & 여행 후기'}
                </h1>
                <p className="text-[10px] xs:text-[11px] md:text-sm font-semibold tracking-[0.2em] text-emerald-300 uppercase break-keep">
                  {heroSubtitle || 'MEMBER STORIES & REVIEWS'}
                </p>
              </div>
            </section>

            {/* Admin Inline Banner Photo Editor */}
            {isAdmin && onUpdateHeroImage && showHeroEditor && (
              <div className="mt-2.5 bg-white p-3.5 sm:p-4 rounded-2xl shadow-lg border border-emerald-200 space-y-3 animate-fade-in-up">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#0A7E54]">🖼️ 커뮤니티 상단 배너 사진 변경</span>
                  <button
                    type="button"
                    onClick={() => setShowHeroEditor(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 font-bold px-2 py-1"
                  >
                    닫기 ✕
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={heroUrlDraft}
                    onChange={(e) => setHeroUrlDraft(e.target.value)}
                    placeholder="배너 이미지 URL을 입력하거나 파일을 업로드하세요"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#0A7E54]"
                  />
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => heroFileInputRef.current?.click()}
                      disabled={isUploadingHero}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      {isUploadingHero ? '업로드 중...' : '📁 파일 선택'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!heroUrlDraft.trim()) return;
                        setHeroImageBroken(false);
                        onUpdateHeroImage(withImageVersion(heroUrlDraft.trim()));
                        setShowHeroEditor(false);
                      }}
                      className="px-4 py-2 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      적용 저장
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={heroFileInputRef}
                    onChange={handleHeroBannerUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {VERIFIED_IMAGE_PRESETS.slice(0, 8).map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const versioned = withImageVersion(preset.url);
                        setHeroUrlDraft(versioned);
                        setHeroImageBroken(false);
                        onUpdateHeroImage(versioned);
                        setShowHeroEditor(false);
                      }}
                      className="shrink-0 w-24 text-left group cursor-pointer"
                    >
                      <div className="w-24 h-14 rounded-lg overflow-hidden border border-gray-200 group-hover:border-[#0A7E54]">
                        <img src={getFreshImageUrl(preset.url)} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-gray-600 truncate mt-1 font-medium">{preset.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <section className="pt-0 pb-0">
        <div className="max-w-7xl mx-auto px-0 md:px-4 space-y-2.5 md:space-y-4">
          
          {/* Header & Category Filter Bar */}
          <div className="bg-white rounded-none md:rounded-[20px] shadow-none md:shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-row justify-between items-center gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight truncate">
                  생생한 여행 이야기
                </h2>
                <p className="text-xs md:text-sm text-[#8E8E93] font-normal mt-0.5 break-keep">
                  회원님들의 실제 여행 사진과 꿀팁을 확인하고 자유롭게 소통해보세요.
                </p>
              </div>
              
              <button
                type="button"
                onClick={async () => {
                  if (!user) {
                    if (await appConfirm('로그인 후 작성 가능합니다. 로그인 하시겠습니까?')) onReqLogin();
                  } else {
                    setIsAdding(true);
                  }
                }}
                className="bg-[#0A7E54] hover:bg-[#086945] text-white px-4 sm:px-5 py-2.5 rounded-2xl font-semibold transition-all duration-200 flex items-center gap-1.5 text-xs sm:text-sm shrink-0 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <span>글쓰기</span>
              </button>
            </div>

            {/* Interactive Category Filter Tabs */}
            <div className="pt-3 border-t border-black/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {FILTER_TABS.map((tab) => {
                const isActive = selectedFilter === tab;
                const count =
                  tab === '전체'
                    ? posts.length
                    : posts.filter((p) => p.region === tab || p.theme === tab).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedFilter(tab)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#0A7E54] text-white shadow-xs'
                        : 'bg-[#F2F2F7] text-[#3A3A3C] hover:bg-emerald-50 hover:text-[#0A7E54]'
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`text-[10px] sm:text-[11px] tabular-nums ${
                        isActive ? 'text-emerald-100' : 'text-gray-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        {/* Write Post Form */}
        {isAdding && (
          <div className="bg-white p-5 sm:p-6 rounded-none md:rounded-[20px] shadow-none md:shadow-sm animate-fade-in-up">
            <h3 className="font-bold text-sm md:text-base mb-3 text-gray-900">새 글 작성</h3>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newPostRegion}
                    onChange={e => setNewPostRegion(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none text-xs md:text-sm bg-white"
                  >
                    <option value="호치민">호치민</option>
                    <option value="붕따우">붕따우</option>
                    <option value="무이네">무이네</option>
                    <option value="달랏">달랏</option>
                  </select>
                  <select
                    value={newPostTheme}
                    onChange={e => setNewPostTheme(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none text-xs md:text-sm bg-white"
                  >
                    <option value="골프 여행">골프 여행</option>
                    <option value="자유 여행">자유 여행</option>
                    <option value="단체 여행">단체 여행</option>
                  </select>
                </div>
                <input
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none text-xs md:text-sm"
                  placeholder="제목을 입력하세요"
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                />
                
                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative">
                    {isUploading ? (
                        <div className="text-gray-400 text-xs animate-pulse">이미지 업로드 중...</div>
                    ) : newPostImage ? (
                        <div className="relative inline-block">
                            <img src={getFreshImageUrl(newPostImage)} alt="Preview" className="max-h-40 rounded-lg shadow-sm" />
                            <button 
                                onClick={() => setNewPostImage('')}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold shadow hover:bg-red-600 text-xs"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                            <div className="text-2xl mb-1 text-gray-400">📷</div>
                            <p className="text-gray-500 text-[10px]">클릭하여 사진을 업로드하세요</p>
                            <input 
                                type="file" 
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>

                <textarea
                  className="w-full border border-gray-300 p-2.5 rounded-lg h-32 focus:ring-2 focus:ring-gold-500 outline-none resize-none text-xs md:text-sm"
                  placeholder="내용을 입력하세요. (여행 후기, 질문, 자유로운 이야기)"
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                />

                <div className="flex items-center gap-4 p-2.5 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPrivate} 
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 accent-gold-500"
                    />
                    <span className="text-xs md:text-sm font-bold text-gray-600">비공개 설정</span>
                  </label>
                  {isPrivate && (
                    <input 
                      type="password"
                      placeholder="비밀번호 입력"
                      value={postPassword}
                      onChange={(e) => setPostPassword(e.target.value)}
                      className="flex-1 border border-gray-300 p-2 rounded-md text-xs md:text-sm outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  )}
                </div>
                
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setIsAdding(false)} className="px-3.5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition text-xs md:text-sm whitespace-nowrap">취소</button>
                  <button 
                    onClick={handleAddPost} 
                    disabled={isUploading}
                    className="px-4.5 py-2 bg-deepgreen text-white rounded-lg font-bold shadow hover:bg-opacity-90 transition text-xs md:text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {isUploading ? '업로드 대기 중' : '등록하기'}
                  </button>
                </div>
            </div>
          </div>
        )}

        {/* Photo-First 3-Column Card Gallery Grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-none md:rounded-[20px] shadow-none md:shadow-sm py-20 px-4 text-center text-[#8E8E93]">
            <span className="text-4xl block mb-3">🧳</span>
            <p className="text-base font-bold text-gray-900">
              {selectedFilter === '전체'
                ? '등록된 게시글이 없습니다.'
                : `'${selectedFilter}' 카테고리의 게시글이 아직 없습니다.`}
            </p>
            <p className="text-xs text-[#8E8E93] mt-1">
              {selectedFilter === '전체'
                ? '첫 번째 여행 이야기나 후기를 남겨보세요!'
                : '다른 카테고리를 선택하거나 첫 후기를 작성해 보세요.'}
            </p>
            {selectedFilter !== '전체' && (
              <button
                type="button"
                onClick={() => setSelectedFilter('전체')}
                className="mt-4 px-4 py-2 bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                전체 게시글 보기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 pb-4">
            {filteredPosts.map((post) => {
              const commentCount = post.comments ? post.comments.length : 0;
              const categoryText = [post.region, post.theme].filter(Boolean).join('·');
              const hasValidImage = Boolean(post.image) && !brokenCardImageIds[post.id];

              return (
                <article
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className="group bg-white rounded-none md:rounded-2xl overflow-hidden border-y border-x-0 md:border border-black/[0.06] shadow-none md:shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
                >
                  {/* Top Image Area (16:9 Widescreen) */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-100 shrink-0">
                    {hasValidImage ? (
                      <img
                        src={getFreshImageUrl(post.image!)}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={() =>
                          setBrokenCardImageIds((prev) => ({ ...prev, [post.id]: true }))
                        }
                        className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-teal-50/70 to-amber-50/60 flex flex-col items-center justify-center text-[#0A7E54]/70 gap-1 px-4 text-center">
                        <ImageIcon className="w-7 h-7 stroke-[1.5]" />
                        <span className="text-[11px] font-semibold text-gray-500 line-clamp-1">
                          {categoryText || 'MANGO TOUR STORY'}
                        </span>
                      </div>
                    )}

                    {post.isPrivate && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>비공개</span>
                      </div>
                    )}
                  </div>

                  {/* Middle & Bottom Content */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
                    {categoryText && (
                      <span className="inline-flex items-center self-start px-2 py-0.5 rounded-full bg-emerald-50 text-[#0A7E54] text-[10px] sm:text-[11px] font-bold tracking-tight mb-1.5">
                        {categoryText}
                      </span>
                    )}

                    <h3 className="font-bold text-sm sm:text-[15px] text-gray-900 group-hover:text-[#0A7E54] transition-colors line-clamp-2 leading-snug break-keep">
                      {post.title}
                    </h3>

                    {post.content && (
                      <p className="text-xs text-gray-400 line-clamp-1 leading-normal mt-1 mb-2.5 font-normal">
                        {post.content}
                      </p>
                    )}

                    {/* Card Footer Meta */}
                    <div className="mt-auto pt-2.5 border-t border-black/[0.05] flex items-center justify-between gap-2 text-[11px] text-gray-500">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-[#0A7E54] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {post.author.slice(0, 1)}
                        </span>
                        <span className="font-semibold text-gray-700 truncate">
                          {post.author}
                        </span>
                        <span className="text-gray-300 shrink-0" aria-hidden="true">·</span>
                        <span className="text-gray-400 tabular-nums shrink-0 whitespace-nowrap">
                          {post.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 tabular-nums whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 text-gray-400 font-medium" title="조회수">
                          <Eye className="w-3 h-3" />
                          <span>{post.views}</span>
                        </span>
                        <span className="text-amber-600 font-bold" title="댓글수">
                          [{commentCount}]
                        </span>
                        <span className="text-rose-500 font-semibold" title="좋아요">
                          ♥{post.likes ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div
          className="fixed inset-0 bg-black/55 flex items-end md:items-center justify-center z-[60] p-0 md:p-4 backdrop-blur-sm animate-fade-in overscroll-contain"
          onClick={() => setShowPasswordPrompt(null)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] px-5 py-6 md:p-6 w-full max-w-none md:max-w-xs shadow-2xl animate-ios-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden"></div>
            <div className="text-center mb-4">
              <span className="text-3xl">🔒</span>
              <h3 className="font-bold text-gray-900 mt-2">비공개 게시글</h3>
              <p className="text-xs text-[#8E8E93] mt-1">작성자 또는 관리자만 볼 수 있습니다.<br/>비밀번호를 입력해주세요.</p>
            </div>
            <input 
              type="password"
              className="w-full bg-[#F2F2F7] p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white text-center mb-4 transition"
              placeholder="비밀번호"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPasswordPrompt(null)}
                className="flex-1 py-3 bg-[#F2F2F7] text-[#3A3A3C] rounded-2xl font-semibold text-xs hover:bg-gray-200 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                취소
              </button>
              <button 
                onClick={handlePasswordSubmit}
                className="flex-1 py-3 bg-[#0A7E54] text-white rounded-2xl font-semibold text-xs hover:bg-[#086945] transition-all duration-200 active:scale-95 cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail & Edit Modal */}
      {viewingPost && user && (
        <div
          className="fixed inset-0 bg-black/55 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm animate-fade-in overscroll-contain"
          onClick={() => setViewingPost(null)}
        >
          <div
            className="bg-white w-full max-w-none md:max-w-4xl max-h-[90vh] md:h-[82vh] rounded-t-3xl md:rounded-[22px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-ios-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Left/Top: Content & Image */}
            <div className="flex-1 overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-7 sm:py-6 md:px-9 md:py-8 scrollbar-hide">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden"></div>
                <div className="flex justify-between items-start gap-3 mb-5 sm:mb-6">
                     {isEditing && editForm ? (
                       <div className="w-full space-y-2.5">
                         <div className="grid grid-cols-2 gap-2">
                           <select
                             value={editForm.region || '호치민'}
                             onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                             className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-white outline-none focus:border-[#0A7E54]"
                           >
                             <option value="호치민">호치민</option>
                             <option value="붕따우">붕따우</option>
                             <option value="무이네">무이네</option>
                             <option value="달랏">달랏</option>
                           </select>
                           <select
                             value={editForm.theme || '자유 여행'}
                             onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                             className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-white outline-none focus:border-[#0A7E54]"
                           >
                             <option value="골프 여행">골프 여행</option>
                             <option value="자유 여행">자유 여행</option>
                             <option value="단체 여행">단체 여행</option>
                           </select>
                         </div>
                         <input 
                           className="w-full text-lg font-bold text-gray-900 border-b-2 border-gold-500 outline-none pb-1 bg-transparent"
                           value={editForm.title}
                           onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                           placeholder="제목을 입력하세요"
                         />
                       </div>
                     ) : (
                       <div className="min-w-0 flex-1">
                          {(viewingPost.region || viewingPost.theme) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0A7E54] text-[11px] sm:text-xs font-bold mb-2.5">
                              {[viewingPost.region, viewingPost.theme].filter(Boolean).join('·')}
                            </span>
                          )}
                          <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 mb-3 leading-snug break-keep">{viewingPost.title}</h2>
                          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs md:text-sm text-gray-500">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                              <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-deepgreen text-white flex items-center justify-center font-bold text-xs">
                                      {viewingPost.author.slice(0,1)}
                                  </div>
                                  <span className="font-semibold text-gray-800">{viewingPost.author}</span>
                              </div>
                              <span className="text-gray-300">·</span>
                              <span className="font-normal text-gray-400 tabular-nums">{viewingPost.date}</span>
                              <span className="text-gray-300">·</span>
                              <span className="font-normal text-gray-400 tabular-nums">조회 {viewingPost.views}</span>
                              <span className="text-gray-300">·</span>
                              <button
                                type="button"
                                onClick={() => handleToggleLike(viewingPost)}
                                className={`inline-flex items-center gap-1 font-semibold transition cursor-pointer ${
                                  likedPostIds[viewingPost.id] ? 'text-rose-600' : 'text-rose-500 hover:text-rose-600'
                                }`}
                              >
                                <span>{likedPostIds[viewingPost.id] ? '❤️' : '🤍'}</span>
                                <span className="tabular-nums">좋아요 {viewingPost.likes ?? 0}</span>
                              </button>
                            </div>

                            {/* Author / Admin Quick Edit & Delete inside Modal */}
                            {(isAdmin || viewingPost.author === user.nickname || viewingPost.author === user.username) && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={startEdit}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-[#0A7E54] text-[#0A7E54] hover:text-white border border-emerald-200 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>사진·글 편집</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(viewingPost.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>삭제</span>
                                </button>
                              </div>
                            )}
                          </div>
                       </div>
                     )}
                     
                     {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setViewingPost(null)}
                          className="md:hidden w-8 h-8 rounded-full bg-[#F2F2F7] text-gray-500 hover:text-gray-800 flex items-center justify-center text-base shrink-0 cursor-pointer"
                          aria-label="닫기"
                        >
                          ✕
                        </button>
                     )}
                </div>

                {/* Image Section */}
                <div className="mb-6 rounded-2xl overflow-hidden shadow-xs border border-gray-200 bg-gray-50">
                    {isEditing && editForm ? (
                       <div className="space-y-3 p-3">
                          <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            {editForm.image ? (
                              <>
                                <img
                                  src={getFreshImageUrl(editForm.image)}
                                  alt="Editing Post"
                                  onLoad={() => setEditImageBroken(false)}
                                  onError={() => setEditImageBroken(true)}
                                  className="w-full max-h-72 object-cover"
                                />
                                {editImageBroken && (
                                  <div className="p-3 bg-red-50 border-t border-red-200 text-red-700 text-xs font-bold flex items-center justify-between gap-2">
                                    <span>⚠️ 현재 이미지 주소가 깨졌거나 불러올 수 없습니다. 아래에서 새 사진으로 교체해주세요.</span>
                                  </div>
                                )}
                              </>
                            ) : (
                               <div className="w-full h-36 bg-gray-100 flex flex-col items-center justify-center text-gray-400 gap-2">
                                  <span className="text-2xl">🖼️</span>
                                  <span className="text-xs">{isUploading ? '업로드 중...' : '등록된 이미지가 없습니다'}</span>
                               </div>
                            )}
                          </div>

                          {/* Always-visible image editing bar (Mobile & Desktop friendly) */}
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => editFileInputRef.current?.click()}
                                disabled={isUploading}
                                className="px-3.5 py-2 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-lg font-bold text-xs transition cursor-pointer disabled:opacity-50"
                              >
                                {isUploading ? '업로드 중...' : `📷 파일 ${editForm.image ? '교체' : '업로드'}`}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowEditPresetPicker(prev => !prev)}
                                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-xs transition cursor-pointer"
                              >
                                🎨 {showEditPresetPicker ? '추천 사진 닫기' : '추천 사진 선택'}
                              </button>
                              {editForm.image && (
                                <button
                                  type="button"
                                  onClick={handleRemoveEditImage}
                                  className="px-3.5 py-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 rounded-lg font-bold text-xs transition cursor-pointer"
                                >
                                  🗑️ 이미지 삭제
                                </button>
                              )}
                              <input 
                                type="file" 
                                accept="image/*"
                                ref={editFileInputRef}
                                onChange={handleEditImageUpload}
                                className="hidden"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-gray-500 block mb-1">🔗 이미지 URL 직접 입력 / 수정</label>
                              <input
                                type="text"
                                value={editForm.image || ''}
                                onChange={(e) => {
                                  setEditImageBroken(false);
                                  setEditForm({ ...editForm, image: e.target.value });
                                }}
                                placeholder="https://... 또는 /images/products/..."
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0A7E54]"
                              />
                            </div>

                            {showEditPresetPicker && (
                              <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-2">
                                <p className="text-[11px] font-bold text-gray-600">검증된 여행·골프 사진 1클릭 적용</p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                  {VERIFIED_IMAGE_PRESETS.map((preset, pIdx) => (
                                    <button
                                      key={pIdx}
                                      type="button"
                                      onClick={() => {
                                        setEditImageBroken(false);
                                        setEditForm({ ...editForm, image: preset.url });
                                        setShowEditPresetPicker(false);
                                      }}
                                      className="text-left group cursor-pointer"
                                    >
                                      <div className="aspect-video rounded-md overflow-hidden border border-gray-200 group-hover:border-[#0A7E54]">
                                        <img src={getFreshImageUrl(preset.url)} alt={preset.label} className="w-full h-full object-cover" />
                                      </div>
                                      <p className="text-[10px] text-gray-700 truncate mt-0.5 font-medium">{preset.label}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                       </div>
                    ) : (
                       viewingPost.image && (
                          <div className="relative">
                            <img
                              src={getFreshImageUrl(viewingPost.image)}
                              alt="Post"
                              onLoad={() => setViewImageBroken(false)}
                              onError={() => setViewImageBroken(true)}
                              className="w-full h-auto"
                            />
                            {viewImageBroken && (
                              <div className="p-3 bg-red-50 border-t border-red-200 flex items-center justify-between gap-2 text-xs text-red-700 font-bold">
                                <span>⚠️ 이 게시글의 이미지를 불러올 수 없습니다.</span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={startEdit}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer shrink-0"
                                  >
                                    🖼️ 바로 사진 교체
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                       )
                    )}
                </div>

                {/* Content Section */}
                {isEditing && editForm ? (
                   <textarea
                      className="w-full h-60 p-3.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gold-500 resize-none text-xs md:text-sm leading-relaxed"
                      value={editForm.content}
                      onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                      placeholder="내용을 입력하세요"
                   />
                ) : (
                   <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed sm:leading-7 text-sm sm:text-[15px] md:text-base font-normal break-keep">
                       {viewingPost.content}
                   </div>
                )}

                {/* Admin Reply Section */}
                {viewingPost.adminReply && !isEditing && (
                  <div className="mt-8 bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-deepgreen font-bold text-xs md:text-sm">👑 관리자 답변</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingPost.adminReply}</p>
                  </div>
                )}

                {/* Admin Reply Input (Only for Admins) */}
                {isAdmin && !isEditing && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <label className="block text-xs md:text-sm font-bold text-gray-600 mb-2">답변 작성 (관리자 전용)</label>
                    <textarea 
                      className="w-full p-3.5 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-deepgreen h-24 resize-none bg-gray-50"
                      placeholder="답변 내용을 입력하세요..."
                      value={adminReplyInput}
                      onChange={(e) => setAdminReplyInput(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        type="button"
                        onClick={handleSaveAdminReply}
                        className="bg-deepgreen text-white px-4 md:px-5 py-2 rounded-lg text-[11px] md:text-xs font-bold hover:bg-opacity-90 transition cursor-pointer"
                      >
                        답변 저장하기
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-7 pt-4 border-t border-gray-100 flex justify-end gap-2">
                   {isEditing ? (
                      <>
                        <button 
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-300 whitespace-nowrap cursor-pointer"
                        >
                          취소
                        </button>
                        <button 
                          type="button"
                          onClick={saveEdit}
                          disabled={isUploading}
                          className="px-5 py-2 bg-gold-500 text-white rounded-xl font-bold text-xs hover:bg-gold-600 shadow-md disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          {isUploading ? '저장 중...' : '저장 완료'}
                        </button>
                      </>
                   ) : (
                      (isAdmin || viewingPost.author === user.nickname || viewingPost.author === user.username) && (
                          <>
                             <button 
                                type="button"
                                onClick={startEdit}
                                className="inline-flex items-center gap-1 text-[#0A7E54] hover:text-white hover:bg-[#0A7E54] font-bold text-xs bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer"
                             >
                                 <Pencil className="w-3.5 h-3.5" />
                                 <span>사진·글 편집</span>
                             </button>
                             <button 
                                type="button"
                                onClick={() => handleDelete(viewingPost.id)}
                                className="inline-flex items-center gap-1 text-red-500 hover:text-white hover:bg-red-500 font-bold text-xs bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer"
                             >
                                 <Trash2 className="w-3.5 h-3.5" />
                                 <span>삭제하기</span>
                             </button>
                          </>
                      )
                   )}
                </div>
            </div>

            {/* Right/Bottom: Comments */}
            {!isEditing && (
                <div className="w-full md:w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-[40vh] md:h-full">
                    <div className="p-3 border-b border-gray-200 bg-white flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm md:text-base">댓글 ({viewingPost.comments.length})</h3>
                        <button onClick={() => setViewingPost(null)} className="hidden md:block text-gray-400 hover:text-gray-600 text-lg">✕</button>
                    </div>
                    
                    {/* Comment List */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3">
                        {viewingPost.comments.length === 0 ? (
                            <div className="text-center text-gray-400 py-8 text-xs md:text-sm">
                                첫 번째 댓글을 남겨보세요!
                            </div>
                        ) : (
                            viewingPost.comments.map(comment => (
                                <div key={comment.id} className={`p-2.5 rounded-lg shadow-sm border ${comment.isAdmin ? 'bg-deepgreen/5 border-deepgreen/20' : 'bg-white border-gray-100'}`}>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={`font-bold text-[11px] md:text-xs ${comment.isAdmin ? 'text-deepgreen' : 'text-gray-600'}`}>
                                          {comment.isAdmin && '👑 '}
                                          {comment.author}
                                        </span>
                                        <span className="text-[10px] md:text-xs text-gray-400">{comment.date}</span>
                                    </div>
                                    <p className="text-[11px] md:text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="p-3 bg-white border-t border-gray-200">
                        <div className="relative">
                            <input
                                className="w-full bg-gray-100 border-0 rounded-full py-2 md:py-2.5 pl-3.5 pr-9 focus:ring-2 focus:ring-gold-500 outline-none text-xs md:text-sm"
                                placeholder="댓글을 입력하세요..."
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                            />
                            <button 
                                onClick={handleAddComment}
                                className="absolute right-1.5 top-1 p-1 bg-gold-500 text-white rounded-full hover:bg-gold-600 transition"
                            >
                                <svg className="w-3 h-3 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityBoard;
