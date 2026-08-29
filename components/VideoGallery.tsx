
import React, { useState, useRef } from 'react';
import { VideoItem, User } from '../types';
import { uploadFile } from '../services/uploadService';
import { classifyVideoCategory } from '../services/geminiService';
import BackButton from './BackButton';

interface Props {
  videos: VideoItem[];
  user: User | null;
  onUpdateVideos: (videos: VideoItem[]) => void;
  onReqLogin: () => void;
  onBack?: () => void;
}

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

  // Handle New Video File Upload using Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Selected video file:", file.name, file.size, file.type);

    // Reset input immediately to allow re-selection of the same file
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsUploading(true);
    setUploadProgress(0);
    try {
      console.log("Starting upload process...");
      const videoUrl = await uploadFile(file, 'videos', (progress) => {
        setUploadProgress(progress);
      });
      
      console.log("Upload complete. URL:", videoUrl);
      
      const title = file.name.replace(/\.[^/.]+$/, "");
      
      // AI Category Recommendation
      let recommendedCategory = uploadCategory;
      try {
        setIsAnalyzing(true);
        const aiCategory = await classifyVideoCategory(title);
        recommendedCategory = aiCategory;
      } catch (err) {
        console.error("AI Classification failed:", err);
      } finally {
        setIsAnalyzing(false);
      }

      const newVideo: VideoItem = {
        id: Date.now().toString(),
        title,
        url: videoUrl,
        category: recommendedCategory
      };

      // Ensure we are using the latest videos from props
      onUpdateVideos([newVideo, ...videos]);
    } catch (error) {
      console.error("Video upload error:", error);
      alert('동영상 업로드 실패: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle Video Replacement during Edit
  const handleReplaceVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const videoUrl = await uploadFile(file, 'videos', (progress) => {
              setUploadProgress(progress);
            });
            setEditForm(prev => ({ ...prev, url: videoUrl }));
        } catch (error) {
            alert('동영상 교체 실패: ' + error);
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
    setEditingId(null);
  };

  const handleAIRecommend = async () => {
    if (!editForm.title) return;
    setIsAnalyzing(true);
    try {
      const recommended = await classifyVideoCategory(editForm.title);
      setEditForm(prev => ({ ...prev, category: recommended }));
    } catch (err) {
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 동영상을 삭제하시겠습니까?')) {
      const updatedVideos = videos.filter(v => v.id !== id);
      onUpdateVideos(updatedVideos);
    }
  };

  const triggerUpload = () => {
    if (!user) {
      if (confirm('동영상 업로드는 로그인 후 가능합니다. 로그인 하시겠습니까?')) {
        onReqLogin();
      }
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <section className={`py-6 bg-gray-900 text-white ${onBack ? 'min-h-screen' : ''} pb-20 md:pb-0`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <BackButton onClick={onBack} variant="dark" label="메인으로" />
            )}
            <div>
              <h2 className="text-xl font-bold text-gold-400">동영상</h2>
              <p className="text-gray-400 text-xs mt-1">
                {isAdmin ? '기존 영상 수정 및 새로운 영상을 자유롭게 업로드하세요.' : '망고투어의 다양한 현장 영상을 확인해보세요.'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-end">
              <div className="flex flex-col gap-1 w-full md:w-32">
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
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={triggerUpload}
                disabled={isUploading || isAnalyzing}
                className="w-full md:w-auto bg-gold-500 text-white px-6 py-2 rounded-full hover:bg-gold-600 font-bold transition flex flex-col items-center justify-center gap-1 text-xs shadow-lg min-w-[120px] h-[38px]"
              >
                {isUploading ? (
                  <div className="w-full">
                    <div className="flex justify-between mb-1">
                      <span className="animate-pulse">업로드 중...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                ) : isAnalyzing ? (
                  <div className="flex items-center gap-2 animate-pulse">
                    <span>✨</span> AI 분석 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>🎥</span> 새 영상 추가
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

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
              .map((video) => (
              <div key={video.id} className={`group bg-gray-800 rounded-xl overflow-hidden shadow-xl border transition-all duration-300 ${editingId === video.id ? 'border-gold-500 ring-2 ring-gold-500/20' : 'border-gray-700'}`}>
                <div className="aspect-video bg-black relative">
                  <video
                    src={editingId === video.id ? editForm.url : video.url}
                    controls
                    className="w-full h-full object-cover"
                  />
                  {editingId === video.id && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center group/edit">
                      <div className="flex flex-col items-center gap-2 w-full px-4">
                        <button 
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={isUploading}
                          className="bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg border border-white/50 text-[10px] font-bold transition backdrop-blur-md w-full max-w-[140px]"
                        >
                          {isUploading ? '업로드 중...' : '영상 파일 교체 📂'}
                        </button>
                        {isUploading && (
                          <div className="w-full max-w-[140px]">
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
                        accept="video/*" 
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
                      <div className="flex gap-2 justify-end">
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 bg-gray-700 text-gold-400 text-[8px] font-bold rounded uppercase border border-gray-600">
                            {video.category || '기타'}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-gray-100 line-clamp-1 leading-snug">{video.title}</h3>
                        <p className="text-[10px] text-gray-500 mt-1">현장 영상 기록</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-3 shrink-0">
                          <button 
                            type="button"
                            onClick={() => handleEditStart(video)} 
                            className="text-gray-400 hover:text-gold-400 transition flex flex-col items-center gap-0.5"
                            title="수정"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            <span className="text-[8px] font-bold uppercase">Edit</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(video.id)} 
                            className="text-gray-400 hover:text-red-400 transition flex flex-col items-center gap-0.5"
                            title="삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            <span className="text-[8px] font-bold uppercase">Del</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoGallery;
