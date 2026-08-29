
import React, { useState, useRef } from 'react';
import { CommunityPost, User, Comment } from '../types';
import { uploadFile } from '../services/uploadService';
import BackButton from './BackButton';

interface Props {
  posts: CommunityPost[];
  user: User | null;
  onUpdatePosts: (posts: CommunityPost[]) => void;
  onReqLogin: () => void;
  onBack?: () => void;
}

const CommunityBoard: React.FC<Props> = ({ posts, user, onUpdatePosts, onReqLogin, onBack }) => {
  const isAdmin = user?.role === 'admin';
  const [isAdding, setIsAdding] = useState(false);
  
  // New Post State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [postPassword, setPostPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // Detail & Edit Modal State
  const [viewingPost, setViewingPost] = useState<CommunityPost | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle Edit Mode
  const [editForm, setEditForm] = useState<CommunityPost | null>(null); // Temp data for editing
  const [commentInput, setCommentInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<string | null>(null);
  const [adminReplyInput, setAdminReplyInput] = useState('');

  // Handle Image Upload for New Post (Firebase Storage)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const downloadUrl = await uploadFile(file, 'community_images');
        setNewPostImage(downloadUrl);
      } catch (error) {
        alert('이미지 업로드 실패: ' + error);
      } finally {
        setIsUploading(false);
      }
    }
    e.target.value = '';
  };

  // Handle Image Upload for Editing Post (Firebase Storage)
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      setIsUploading(true);
      try {
        const downloadUrl = await uploadFile(file, 'community_images');
        setEditForm({ ...editForm, image: downloadUrl });
      } catch (error) {
        alert('이미지 업로드 실패: ' + error);
      } finally {
        setIsUploading(false);
      }
    }
    e.target.value = '';
  };

  // Remove Image during Edit
  const handleRemoveEditImage = () => {
    if (editForm && confirm('이미지를 삭제하시겠습니까?')) {
      setEditForm({ ...editForm, image: '' });
    }
  };

  const handleAddPost = () => {
    if (!user) {
        onReqLogin();
        return;
    }
    if (!newPostTitle || !newPostContent) {
        alert('제목과 내용을 입력해주세요.');
        return;
    }
    if (isPrivate && !postPassword) {
        alert('비공개 글은 비밀번호가 필요합니다.');
        return;
    }

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      title: newPostTitle,
      content: newPostContent,
      author: user.nickname || user.username,
      date: new Date().toISOString().split('T')[0],
      image: newPostImage,
      comments: [],
      views: 0,
      isPrivate: isPrivate,
      password: isPrivate ? postPassword : undefined
    };

    onUpdatePosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostImage('');
    setIsPrivate(false);
    setPostPassword('');
    setIsAdding(false);
  };

  const handlePostClick = (post: CommunityPost) => {
    if (!user) {
      if (confirm('게시글 상세 내용과 사진을 보시려면 로그인이 필요합니다. 로그인하시겠습니까?')) {
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

  const openPost = (post: CommunityPost) => {
    // Increment view count when opening
    const updatedPost = { ...post, views: post.views + 1 };
    const updatedPosts = posts.map(p => p.id === post.id ? updatedPost : p);
    onUpdatePosts(updatedPosts);
    setViewingPost(updatedPost);
    setIsEditing(false); // Reset edit mode when opening new post
    setAdminReplyInput(post.adminReply || '');
    setShowPasswordPrompt(null);
    setPasswordInput('');
  };

  const handlePasswordSubmit = () => {
    const post = posts.find(p => p.id === showPasswordPrompt);
    if (post && post.password === passwordInput) {
      openPost(post);
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleSaveAdminReply = () => {
    if (!viewingPost || !isAdmin) return;
    const updatedPost = { ...viewingPost, adminReply: adminReplyInput };
    setViewingPost(updatedPost);
    onUpdatePosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    alert('답변이 저장되었습니다.');
  };

  const handleDelete = (id: string) => {
    if ((isAdmin || viewingPost?.author === user?.username || viewingPost?.author === user?.nickname) && confirm('정말 게시글을 삭제하시겠습니까?')) {
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
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm || !viewingPost) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert('제목과 내용은 필수입니다.');
      return;
    }

    // Update global posts array
    const updatedPosts = posts.map(p => p.id === editForm.id ? editForm : p);
    onUpdatePosts(updatedPosts);
    
    // Update local viewing state
    setViewingPost(editForm);
    setIsEditing(false);
    setEditForm(null);
  };

  const handleAddComment = () => {
    if (!user) {
        if(confirm('로그인이 필요한 서비스입니다. 로그인 하시겠습니까?')) {
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

  return (
    <div className={`min-h-screen bg-gray-50 text-black font-sans overflow-x-hidden animate-fade-in pb-safe md:pb-0`}>
      {/* Subpage Hero Banner */}
      {onBack ? (
        <section className="relative h-[160px] xs:h-[180px] sm:h-[220px] md:h-[260px] flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1600&q=80" 
              alt="Community Hero" 
              className="w-full h-full object-cover opacity-60" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
          </div>
          
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
            <BackButton onClick={onBack} variant="hero" label="메인으로" />
          </div>

          <div className="relative z-10 text-center px-4">
            <h1 className="text-2xl xs:text-3xl md:text-4xl font-black text-white drop-shadow-2xl mb-1 uppercase tracking-tight break-keep">
              커뮤니티 & 여행 후기
            </h1>
            <p className="text-[11px] xs:text-xs md:text-sm font-bold tracking-[0.25em] text-gold-400 uppercase break-keep">
              MEMBER STORIES & REVIEWS
            </p>
          </div>
        </section>
      ) : null}

      <section className="py-5 sm:py-8 bg-gray-50 text-black">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          
          {/* Action Bar (Header or Title Bar) */}
          <div className="flex flex-row justify-between items-center mb-5 sm:mb-7 gap-3 bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-black text-deepgreen tracking-tight flex items-center gap-1.5 truncate">
                <span>💬</span>
                <span>생생한 여행 이야기</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 break-keep">
                회원님들의 실제 여행 사진과 꿀팁을 확인하고 자유롭게 소통해보세요.
              </p>
            </div>
            
            <button
              onClick={() => {
                if(!user) {
                  if(confirm('로그인 후 작성 가능합니다. 로그인 하시겠습니까?')) onReqLogin();
                } else {
                  setIsAdding(true);
                }
              }}
              className="bg-gold-500 hover:bg-gold-600 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold transition shadow-sm flex items-center gap-1.5 text-xs sm:text-sm shrink-0 active:scale-95 whitespace-nowrap"
            >
              <span>✏️</span>
              <span>글쓰기</span>
            </button>
          </div>

        {/* Write Post Form */}
        {isAdding && (
          <div className="bg-white p-4 rounded-xl shadow-lg mb-8 border border-gold-200 animate-fade-in-up">
            <h3 className="font-bold text-sm mb-3 text-deepgreen">새 글 작성</h3>
            <div className="space-y-3">
                <input
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none text-xs"
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
                            <img src={newPostImage} alt="Preview" className="max-h-40 rounded-lg shadow-sm" />
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
                  className="w-full border border-gray-300 p-2 rounded-lg h-32 focus:ring-2 focus:ring-gold-500 outline-none resize-none text-xs"
                  placeholder="내용을 입력하세요. (여행 후기, 질문, 자유로운 이야기)"
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                />

                <div className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPrivate} 
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 accent-gold-500"
                    />
                    <span className="text-xs font-bold text-gray-600">비공개 설정</span>
                  </label>
                  {isPrivate && (
                    <input 
                      type="password"
                      placeholder="비밀번호 입력"
                      value={postPassword}
                      onChange={(e) => setPostPassword(e.target.value)}
                      className="flex-1 border border-gray-300 p-1.5 rounded-md text-xs outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  )}
                </div>
                
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition text-xs">취소</button>
                  <button 
                    onClick={handleAddPost} 
                    disabled={isUploading}
                    className="px-4 py-1.5 bg-deepgreen text-white rounded-lg font-bold shadow hover:bg-opacity-90 transition text-xs disabled:opacity-50"
                  >
                    {isUploading ? '업로드 대기 중' : '등록하기'}
                  </button>
                </div>
            </div>
          </div>
        )}

        {/* Post Grid Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
                <div 
                    key={post.id} 
                    onClick={() => handlePostClick(post)}
                    className="bg-white rounded-lg shadow-sm hover:shadow-xl transition duration-300 cursor-pointer border border-gray-100 overflow-hidden flex flex-col h-full group p-4"
                >
                    {/* Content Section */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">
                                {post.author}
                            </span>
                            <span className="text-[10px] text-gray-400">{post.date}</span>
                        </div>
                        <h3 className="font-black text-xl text-gray-800 mb-2 line-clamp-1 group-hover:text-deepgreen transition flex items-center gap-1">
                            {post.isPrivate && <span className="text-base">🔒</span>}
                            {post.title}
                        </h3>
                        <p className="text-gray-600 text-base font-bold line-clamp-2 mb-4 flex-1 leading-relaxed">
                            {post.content}
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 border-t pt-3">
                            <div className="flex gap-3">
                                <span className="flex items-center gap-1">👀 {post.views}</span>
                                <span className="flex items-center gap-1">💬 {post.comments.length}</span>
                                {post.image && <span className="text-gold-600 font-bold">🖼️ 사진포함</span>}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-scale-in">
            <div className="text-center mb-4">
              <span className="text-3xl">🔒</span>
              <h3 className="font-bold text-gray-800 mt-2">비공개 게시글</h3>
              <p className="text-[10px] text-gray-500 mt-1">작성자 또는 관리자만 볼 수 있습니다.<br/>비밀번호를 입력해주세요.</p>
            </div>
            <input 
              type="password"
              className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-gold-500 text-center mb-4"
              placeholder="비밀번호"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPasswordPrompt(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200"
              >
                취소
              </button>
              <button 
                onClick={handlePasswordSubmit}
                className="flex-1 py-3 bg-gold-500 text-white rounded-xl font-bold text-xs hover:bg-gold-600 shadow-md"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail & Edit Modal */}
      {viewingPost && user && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-3xl h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left/Top: Content & Image */}
            <div className="flex-1 overflow-y-auto bg-white p-5 md:p-6 scrollbar-hide">
                <div className="flex justify-between items-start mb-4">
                     {isEditing && editForm ? (
                       <input 
                         className="w-full text-lg font-bold text-gray-900 border-b-2 border-gold-500 outline-none pb-1 bg-transparent"
                         value={editForm.title}
                         onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                         placeholder="제목을 입력하세요"
                       />
                     ) : (
                       <div>
                          <h2 className="text-3xl font-black text-gray-900 mb-2">{viewingPost.title}</h2>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-deepgreen text-white flex items-center justify-center font-bold text-xs">
                                      {viewingPost.author.slice(0,1)}
                                  </div>
                                  <span className="font-bold text-gray-700">{viewingPost.author}</span>
                              </div>
                              <span>•</span>
                              <span className="font-medium">{viewingPost.date}</span>
                              <span>•</span>
                              <span className="font-medium">조회 {viewingPost.views}</span>
                          </div>
                       </div>
                     )}
                     
                     {!isEditing && (
                        <button onClick={() => setViewingPost(null)} className="md:hidden text-gray-500 text-lg">✕</button>
                     )}
                </div>

                {/* Image Section */}
                <div className="mb-4 rounded-lg overflow-hidden shadow-sm border border-gray-100 relative group min-h-[100px] bg-gray-50">
                    {isEditing && editForm ? (
                       <>
                          {editForm.image ? (
                             <img src={editForm.image} alt="Editing Post" className="w-full h-auto opacity-80" />
                          ) : (
                             <div className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center text-gray-400 gap-2">
                                <span className="text-2xl">🖼️</span>
                                <span className="text-xs">{isUploading ? '업로드 중...' : '이미지 없음'}</span>
                             </div>
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                             {!isUploading && (
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={() => editFileInputRef.current?.click()}
                                     className="bg-white text-deepgreen px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gold-50 transition text-[10px]"
                                   >
                                      🖼️ 이미지 {editForm.image ? '교체' : '추가'}
                                   </button>
                                   {editForm.image && (
                                     <button 
                                       onClick={handleRemoveEditImage}
                                       className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-red-600 transition text-[10px]"
                                     >
                                        🗑️ 이미지 삭제
                                     </button>
                                   )}
                                 </div>
                             )}
                             <input 
                               type="file" 
                               accept="image/*"
                               ref={editFileInputRef}
                               onChange={handleEditImageUpload}
                               className="hidden"
                             />
                          </div>
                       </>
                    ) : (
                       viewingPost.image && (
                          <img src={viewingPost.image} alt="Post" className="w-full h-auto" />
                       )
                    )}
                </div>

                {/* Content Section */}
                {isEditing && editForm ? (
                   <textarea
                      className="w-full h-60 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500 resize-none text-xs leading-relaxed"
                      value={editForm.content}
                      onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                      placeholder="내용을 입력하세요"
                   />
                ) : (
                   <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed text-lg font-bold">
                       {viewingPost.content}
                   </div>
                )}

                {/* Admin Reply Section */}
                {viewingPost.adminReply && !isEditing && (
                  <div className="mt-8 bg-deepgreen/5 border-l-4 border-deepgreen p-4 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-deepgreen font-bold text-xs">👑 관리자 답변</span>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{viewingPost.adminReply}</p>
                  </div>
                )}

                {/* Admin Reply Input (Only for Admins) */}
                {isAdmin && !isEditing && (
                  <div className="mt-8 pt-6 border-t">
                    <label className="block text-xs font-bold text-gray-600 mb-2">답변 작성 (관리자 전용)</label>
                    <textarea 
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-deepgreen h-24 resize-none bg-gray-50"
                      placeholder="답변 내용을 입력하세요..."
                      value={adminReplyInput}
                      onChange={(e) => setAdminReplyInput(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={handleSaveAdminReply}
                        className="bg-deepgreen text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-opacity-90 transition"
                      >
                        답변 저장하기
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-6 pt-3 border-t flex justify-end gap-2">
                   {isEditing ? (
                      <>
                        <button 
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg font-bold text-[10px] hover:bg-gray-300"
                        >
                          취소
                        </button>
                        <button 
                          onClick={saveEdit}
                          disabled={isUploading}
                          className="px-4 py-1.5 bg-gold-500 text-white rounded-lg font-bold text-[10px] hover:bg-gold-600 shadow-md disabled:opacity-50"
                        >
                          {isUploading ? '저장 중...' : '저장 완료'}
                        </button>
                      </>
                   ) : (
                      (isAdmin || viewingPost.author === user.nickname || viewingPost.author === user.username) && (
                          <>
                             <button 
                                onClick={startEdit}
                                className="text-blue-600 hover:text-blue-800 font-bold text-[10px] bg-blue-50 px-3 py-1.5 rounded transition"
                             >
                                 ✏️ 수정하기
                             </button>
                             <button 
                                onClick={() => handleDelete(viewingPost.id)}
                                className="text-red-500 hover:text-red-700 font-bold text-[10px] bg-red-50 px-3 py-1.5 rounded transition"
                             >
                                 🗑 삭제하기
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
                        <h3 className="font-bold text-gray-800 text-sm">댓글 ({viewingPost.comments.length})</h3>
                        <button onClick={() => setViewingPost(null)} className="hidden md:block text-gray-400 hover:text-gray-600 text-lg">✕</button>
                    </div>
                    
                    {/* Comment List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {viewingPost.comments.length === 0 ? (
                            <div className="text-center text-gray-400 py-8 text-xs">
                                첫 번째 댓글을 남겨보세요!
                            </div>
                        ) : (
                            viewingPost.comments.map(comment => (
                                <div key={comment.id} className={`p-2.5 rounded-lg shadow-sm border ${comment.isAdmin ? 'bg-deepgreen/5 border-deepgreen/20' : 'bg-white border-gray-100'}`}>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={`font-bold text-[11px] ${comment.isAdmin ? 'text-deepgreen' : 'text-gray-600'}`}>
                                          {comment.isAdmin && '👑 '}
                                          {comment.author}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{comment.date}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-700">{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="p-3 bg-white border-t border-gray-200">
                        <div className="relative">
                            <input
                                className="w-full bg-gray-100 border-0 rounded-full py-2 pl-3 pr-9 focus:ring-2 focus:ring-gold-500 outline-none text-xs"
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
