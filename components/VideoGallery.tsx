import React, { useState, useRef } from 'react';
import { VideoItem, User } from '../types';
import { uploadFile } from '../services/uploadService';
import { classifyVideoCategory } from '../services/geminiService';
import BackButton from './BackButton';
import { db } from '../services/firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';

interface Props {
  videos: VideoItem[];
  user: User | null;
  onUpdateVideos: (videos: VideoItem[]) => void;
  onReqLogin: () => void;
  onBack?: () => void;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
const extractYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
};

/**
 * Derives the optimal video poster/thumbnail:
 * 1. Custom thumbnail if set
 * 2. YouTube hqdefault thumbnail
 * 3. Cloudinary video automatic snapshot (.jpg)
 */
export const getVideoPoster = (url?: string, customThumbnail?: string): string | undefined => {
  if (customThumbnail && !customThumbnail.startsWith('blob:')) {
    return customThumbnail;
  }
  if (!url) return undefined;

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  if (url.includes('cloudinary.com') && url.includes('/video/upload/')) {
    return url.replace(/\.(mp4|mov|webm|avi|mkv|m4v)(\?.*)?$/i, '.jpg');
  }

  return undefined;
};

/**
 * Extracts a lightweight frame thumbnail from a client video file via Canvas
 */
const extractFrameThumbnail = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.remove();
      };

      video.onloadeddata = () => {
        try {
          video.currentTime = Math.min(1, (video.duration || 1) / 2);
        } catch {
          // ignore
        }
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(640, video.videoWidth || 640);
          canvas.height = Math.min(360, video.videoHeight || 360);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            cleanup();
            return resolve(dataUrl);
          }
        } catch {
          // ignore
        }
        cleanup();
        resolve(null);
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };

      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 4000);
    } catch {
      resolve(null);
    }
  });
};

const VideoGallery: React.FC<Props> = ({ videos, user, onUpdateVideos, onReqLogin, onBack }) => {
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<VideoItem>({ id: '', title: '', url: '', category: '기타' });
  const [uploadCategory, setUploadCategory] = useState<'골프' | '여행' | '먹거리' | '기타'>('기타');
  const [filterCategory, setFilterCategory] = useState<string>('전체');

  // Video playback error tracking per video ID
  const [failedVideos, setFailedVideos] = useState<Record<string, string>>({});

  // Direct URL / YouTube Link Modal
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlTitle, setUrlTitle] = useState('');
  const [urlLink, setUrlLink] = useState('');
  const [urlCategory, setUrlCategory] = useState<'골프' | '여행' | '먹거리' | '기타'>('기타');

  // Custom in-app delete confirmation & feedback states
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleVideoError = (id: string, url: string) => {
    let reason = "비디오 코덱(아이폰 HEVC 등)이 지원되지 않거나 파일 형식이 올바르지 않습니다.";
    if (url.startsWith('blob:')) {
      reason = "임시 브라우저 주소(blob)로 저장되어 다른 기기에서 열 수 없습니다. 새 영상으로 교체해주세요.";
    } else if (url.startsWith('/uploads/') && !url.includes('http')) {
      reason = "서버 내 영상 파일이 이동되었거나 존재하지 않습니다. 새 파일로 업로드해주세요.";
    } else if (!navigator.onLine) {
      reason = "인터넷 연결이 불안정합니다. 네트워크를 확인해주세요.";
    }
    setFailedVideos(prev => ({ ...prev, [id]: reason }));
  };

  const handleRetryVideo = (id: string) => {
    setFailedVideos(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Handle New Video File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input immediately to allow re-selection
    if (fileInputRef.current) fileInputRef.current.value = '';

    // File format and size checks
    if (file.size > 150 * 1024 * 1024) {
      showToast('⚠️ 파일 크기가 150MB를 초과하여 모바일에서 재생 지연이 발생할 수 있습니다. 100MB 이하 권장합니다.');
    }

    const isHevcOrMov = /\.(mov|hevc)$/i.test(file.name);
    if (isHevcOrMov) {
      console.warn("MOV/HEVC format detected:", file.name);
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Concurrently extract frame thumbnail
      const thumbPromise = extractFrameThumbnail(file);

      // 2. Upload to Cloudinary / server
      const videoUrl = await uploadFile(file, 'videos', (progress) => {
        setUploadProgress(progress);
      });

      const extractedThumbnail = await thumbPromise;

      setIsUploading(false);
      setUploadProgress(0);

      const title = file.name.replace(/\.[^/.]+$/, "");
      const newVideoId = Date.now().toString();

      // Poster fallback: Cloudinary auto .jpg or canvas thumbnail
      const posterThumb = extractedThumbnail || (videoUrl.includes('cloudinary.com') ? videoUrl.replace(/\.[^/.]+$/, '.jpg') : undefined);

      const newVideo: VideoItem = {
        id: newVideoId,
        title,
        url: videoUrl,
        category: uploadCategory,
        thumbnail: posterThumb
      };

      const updatedList = [newVideo, ...videos];
      onUpdateVideos(updatedList);
      showToast('동영상이 성공적으로 등록되었습니다.');

      // AI Category Recommendation in background
      try {
        setIsAnalyzing(true);
        const aiCategory = await classifyVideoCategory(title);
        if (aiCategory && aiCategory !== uploadCategory) {
          const refinedList = updatedList.map(v => v.id === newVideoId ? { ...v, category: aiCategory } : v);
          onUpdateVideos(refinedList);
          showToast(`AI 추천 카테고리('${aiCategory}')가 자동 반영되었습니다.`);
        }
      } catch (err) {
        console.warn("AI Classification skipped:", err);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error: any) {
      console.error("Video upload error:", error);
      showToast(error?.message || '동영상 업로드 중 문제가 발생했습니다.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle Direct Link or YouTube submission
  const handleAddUrlVideo = () => {
    if (!urlTitle.trim() || !urlLink.trim()) {
      showToast('영상 제목과 링크(URL)를 모두 입력해주세요.');
      return;
    }

    const cleanLink = urlLink.trim();
    const newVideoId = Date.now().toString();
    const ytId = extractYouTubeId(cleanLink);
    const poster = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined;

    const newVideo: VideoItem = {
      id: newVideoId,
      title: urlTitle.trim(),
      url: cleanLink,
      category: urlCategory,
      thumbnail: poster
    };

    onUpdateVideos([newVideo, ...videos]);
    setShowUrlModal(false);
    setUrlTitle('');
    setUrlLink('');
    showToast('새 동영상 링크가 등록되었습니다.');
  };

  // Handle Video Replacement during Edit
  const handleReplaceVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const thumbPromise = extractFrameThumbnail(file);
        const videoUrl = await uploadFile(file, 'videos', (progress) => {
          setUploadProgress(progress);
        });
        const extractedThumb = await thumbPromise;
        const posterThumb = extractedThumb || (videoUrl.includes('cloudinary.com') ? videoUrl.replace(/\.[^/.]+$/, '.jpg') : undefined);

        setEditForm(prev => ({ ...prev, url: videoUrl, thumbnail: posterThumb }));
        if (editingId) {
          handleRetryVideo(editingId);
        }
        showToast('동영상 파일이 교체되었습니다.');
      } catch (error: any) {
        showToast(error?.message || '동영상 교체 중 문제가 발생했습니다.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleEditStart = (video: VideoItem) => {
    setEditingId(video.id);
    setEditForm({ category: '기타', ...video });
  };

  const handleSave = () => {
    const newVideos = videos.map(v => v.id === editingId ? editForm : v);
    onUpdateVideos(newVideos);
    if (editingId) {
      handleRetryVideo(editingId);
    }
    setEditingId(null);
    showToast('동영상 정보가 저장되었습니다.');
  };

  const handleAIRecommend = async () => {
    if (!editForm.title) return;
    setIsAnalyzing(true);
    try {
      const recommended = await classifyVideoCategory(editForm.title);
      setEditForm(prev => ({ ...prev, category: recommended }));
      showToast(`AI 추천 카테고리(${recommended})가 설정되었습니다.`);
    } catch {
      showToast("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return;
    const targetId = videoToDelete.id;
    setIsDeleting(true);

    try {
      // 1. Immediate optimistic UI and local persistence
      const updatedVideos = videos.filter(v => v.id !== targetId);
      onUpdateVideos(updatedVideos);
      try {
        localStorage.setItem('mango_videos_db', JSON.stringify(updatedVideos));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }

      // 2. Direct Firestore deletion
      if (db && navigator.onLine) {
        try {
          await deleteDoc(doc(db, 'videos', targetId));
        } catch (fsErr) {
          console.warn('Firestore doc delete failed:', fsErr);
        }
      }

      showToast('동영상이 정상적으로 삭제되었습니다.');
    } catch (err) {
      console.error('Delete video error:', err);
      showToast('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setVideoToDelete(null);
    }
  };

  const triggerUpload = () => {
    if (!user) {
      onReqLogin();
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <section className={`py-6 bg-gray-900 text-white ${onBack ? 'min-h-screen' : ''} pb-20 md:pb-0`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <BackButton onClick={onBack} variant="dark" label="메인으로" />
            )}
            <div>
              <h2 className="text-xl font-bold text-gold-400">동영상</h2>
              <p className="text-gray-400 text-xs mt-1">
                {isAdmin ? '모든 스마트폰 및 PC에서 부드럽게 재생되는 고화질 현장 영상 관리' : '망고투어의 다채로운 베트남 현장 영상을 생생하게 확인해보세요.'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-stretch sm:items-end">
              <div className="flex flex-col gap-1 w-full sm:w-28">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Category</label>
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="bg-gray-800 text-white border border-gray-700 rounded-full px-3 py-2 text-xs outline-none focus:border-gold-500"
                >
                  <option value="골프">골프</option>
                  <option value="여행">여행</option>
                  <option value="먹거리">먹거리</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <input 
                type="file" 
                accept="video/mp4,video/quicktime,video/webm,video/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />

              <div className="flex gap-2">
                <button 
                  onClick={triggerUpload}
                  disabled={isUploading || isAnalyzing}
                  className="flex-1 sm:flex-initial bg-gold-500 hover:bg-gold-600 text-white px-5 py-2 rounded-full font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-lg min-w-[130px] h-[38px]"
                >
                  {isUploading ? (
                    <div className="w-full">
                      <div className="flex justify-between mb-0.5 text-[10px]">
                        <span className="animate-pulse">업로드 중...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/30 rounded-full h-1">
                        <div className="bg-white h-1 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <span>✨</span> AI 분석 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span>🎥</span> 영상 파일 업로드
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setShowUrlModal(true)}
                  disabled={isUploading}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gold-500/50 px-3.5 py-2 rounded-full font-semibold transition flex items-center justify-center gap-1.5 text-xs h-[38px]"
                  title="유튜브 또는 직접 영상 URL 링크 등록"
                >
                  <span>🔗 링크 등록</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Tip: Mobile Video Optimization Notice */}
        {isAdmin && (
          <div className="mb-6 p-3 bg-gray-800/80 border border-gray-700/80 rounded-xl flex items-center justify-between gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">💡</span>
              <p className="text-[11px] leading-relaxed">
                <strong className="text-gold-400">모바일 영상 재생 팁:</strong> 스마트폰(아이폰/갤럭시) 카메라 설정에서 <span className="text-white font-semibold">높은 호환성(MP4 / H.264)</span>으로 촬영된 영상(100MB 이하 권장)이 모든 휴대폰 및 PC 브라우저에서 끊김 없이 즉시 재생됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['전체', '골프', '여행', '먹거리', '기타'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filterCategory === cat 
                ? 'bg-gold-500 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.filter(v => filterCategory === '전체' || v.category === filterCategory).length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-700 rounded-2xl text-gray-500">
               <span className="text-4xl block mb-4">📹</span>
               <p>{filterCategory === '전체' ? '등록된 현장 영상이 없습니다.' : `${filterCategory} 카테고리에 영상이 없습니다.`}</p>
               <p className="text-xs mt-1">첫 번째 영상을 업로드해보세요!</p>
            </div>
          ) : (
            videos
              .filter(v => filterCategory === '전체' || v.category === filterCategory)
              .map((video) => {
                const currentUrl = editingId === video.id ? editForm.url : video.url;
                const ytId = extractYouTubeId(currentUrl);
                const isYT = Boolean(ytId);
                const posterUrl = getVideoPoster(currentUrl, video.thumbnail);
                const hasError = Boolean(failedVideos[video.id]);

                return (
                  <div key={video.id} className={`group bg-gray-800 rounded-xl overflow-hidden shadow-xl border transition-all duration-300 ${editingId === video.id ? 'border-gold-500 ring-2 ring-gold-500/20' : 'border-gray-700'}`}>
                    <div className="aspect-video bg-black relative">
                      {isYT ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&playsinline=1`}
                          title={video.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : hasError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 p-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <p className="text-xs font-bold text-gray-200 mb-1">동영상을 재생할 수 없습니다</p>
                          <p className="text-[10px] text-gray-400 max-w-xs mb-3 leading-relaxed">
                            {failedVideos[video.id]}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRetryVideo(video.id)}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gold-400 text-[10px] font-bold rounded-lg border border-gold-500/30 transition"
                            >
                              다시 시도
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleEditStart(video);
                                  setTimeout(() => editFileInputRef.current?.click(), 100);
                                }}
                                className="px-3 py-1 bg-gold-500 hover:bg-gold-600 text-white text-[10px] font-bold rounded-lg transition"
                              >
                                새 파일 교체 📂
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <video
                          key={currentUrl}
                          src={currentUrl}
                          poster={posterUrl}
                          controls
                          preload="metadata"
                          playsInline
                          className="w-full h-full object-cover bg-black"
                          onError={() => handleVideoError(video.id, currentUrl)}
                          onPlay={(e) => {
                            // Pause other videos to maintain high performance on mobile
                            document.querySelectorAll('video').forEach((v) => {
                              if (v !== e.currentTarget && !v.paused) {
                                v.pause();
                              }
                            });
                          }}
                        />
                      )}

                      {editingId === video.id && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center group/edit z-10">
                          <div className="flex flex-col items-center gap-2 w-full px-4">
                            <button 
                              onClick={() => editFileInputRef.current?.click()}
                              disabled={isUploading}
                              className="bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg border border-white/50 text-[10px] font-bold transition backdrop-blur-md w-full max-w-[150px]"
                            >
                              {isUploading ? '업로드 중...' : '영상 파일 교체 📂'}
                            </button>
                            {isUploading && (
                              <div className="w-full max-w-[150px]">
                                <div className="flex justify-between text-[8px] text-white mb-1">
                                  <span>진행률</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-1">
                                  <div 
                                    className="bg-gold-500 h-1 rounded-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                          <input 
                            type="file" 
                            accept="video/mp4,video/quicktime,video/webm,video/*" 
                            className="hidden" 
                            ref={editFileInputRef}
                            onChange={handleReplaceVideo}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {editingId === video.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] text-gold-400 font-bold mb-1 block uppercase">Title</label>
                            <input
                              className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-gold-500 outline-none text-xs"
                              value={editForm.title}
                              onChange={e => setEditForm({...editForm, title: e.target.value})}
                              placeholder="영상 제목을 입력하세요"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gold-400 font-bold mb-1 block uppercase">URL (동영상 주소 또는 YouTube 링크)</label>
                            <input
                              className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-gold-500 outline-none text-xs"
                              value={editForm.url}
                              onChange={e => setEditForm({...editForm, url: e.target.value})}
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] text-gold-400 font-bold uppercase">Category</label>
                              <button 
                                onClick={handleAIRecommend}
                                disabled={isAnalyzing}
                                className="text-[9px] bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded border border-gold-500/30 hover:bg-gold-500/40 transition flex items-center gap-1"
                              >
                                {isAnalyzing ? '분석 중...' : '✨ AI 추천'}
                              </button>
                            </div>
                            <select 
                              value={editForm.category || '기타'}
                              onChange={(e) => setEditForm({...editForm, category: e.target.value as any})}
                              className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-gold-500 outline-none text-xs"
                            >
                              <option value="골프">골프</option>
                              <option value="여행">여행</option>
                              <option value="먹거리">먹거리</option>
                              <option value="기타">기타</option>
                            </select>
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button 
                              type="button"
                              onClick={handleSave} 
                              className="flex-1 bg-gold-500 text-white px-3 py-2 rounded font-bold text-xs hover:bg-gold-600 transition"
                            >
                              변경사항 저장
                            </button>
                            <button 
                              type="button"
                              onClick={() => setEditingId(null)} 
                              className="px-3 py-2 bg-gray-600 text-white rounded font-bold text-xs hover:bg-gray-700 transition"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-1.5 py-0.5 bg-gray-700 text-gold-400 text-[8px] font-bold rounded uppercase border border-gray-600">
                                {video.category || '기타'}
                              </span>
                              {isYT && (
                                <span className="px-1.5 py-0.5 bg-red-950 text-red-400 text-[8px] font-bold rounded border border-red-800">
                                  YouTube
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-sm text-gray-100 line-clamp-1 leading-snug" title={video.title}>
                              {video.title}
                            </h3>
                            <p className="text-[10px] text-gray-500 mt-1">현장 영상 기록</p>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2 shrink-0">
                              <button 
                                type="button"
                                onClick={() => handleEditStart(video)} 
                                className="text-gray-400 hover:text-gold-400 transition p-1"
                                title="수정"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </button>
                              <button 
                                type="button"
                                onClick={() => setVideoToDelete(video)} 
                                className="text-gray-400 hover:text-red-400 transition p-1"
                                title="삭제"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Direct URL / YouTube Link Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-gray-100 mb-1 flex items-center gap-2">
              <span>🔗</span> 동영상 링크(URL) 직접 등록
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              유튜브 링크(일반 영상/Shorts) 또는 MP4 웹 동영상 링크를 직접 등록할 수 있습니다.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[10px] text-gold-400 font-bold uppercase block mb-1">영상 제목</label>
                <input
                  type="text"
                  placeholder="예: 호치민 트윈도브스 CC 라운딩 현장"
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gold-400 font-bold uppercase block mb-1">동영상 링크 (YouTube 또는 MP4 주소)</label>
                <input
                  type="url"
                  placeholder="예: https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                  value={urlLink}
                  onChange={(e) => setUrlLink(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gold-400 font-bold uppercase block mb-1">카테고리</label>
                <select
                  value={urlCategory}
                  onChange={(e) => setUrlCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:border-gold-500 outline-none"
                >
                  <option value="골프">골프</option>
                  <option value="여행">여행</option>
                  <option value="먹거리">먹거리</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="flex-1 py-2.5 px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold rounded-xl transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddUrlVideo}
                className="flex-1 py-2.5 px-3 bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-gold-500/20"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-gray-800 text-white border border-gold-500/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in text-sm">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {videoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-base font-bold text-center text-gray-100 mb-2">동영상 삭제 확인</h3>
            <p className="text-xs text-gray-300 text-center mb-1">
              다음 동영상을 정말 삭제하시겠습니까?
            </p>
            <div className="bg-gray-900/80 rounded-lg p-2.5 my-3 text-center border border-gray-700">
              <span className="text-xs font-semibold text-gold-400 line-clamp-2">
                {videoToDelete.title}
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                카테고리: {videoToDelete.category || '기타'}
              </span>
            </div>
            <p className="text-[11px] text-red-400 text-center mb-6">
              ※ 삭제 시 복구할 수 없으며 서버와 목록에서 즉시 제거됩니다.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setVideoToDelete(null)}
                className="flex-1 py-2.5 px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold rounded-xl transition"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <span>삭제하기</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoGallery;
