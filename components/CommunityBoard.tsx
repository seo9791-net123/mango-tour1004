
import React, { useState, useRef } from 'react';
import { CommunityPost, User, Comment } from '../types';

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
  
  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Detail & Edit Modal State
  const [viewingPost, setViewingPost] = useState<CommunityPost | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle Edit Mode
  const [editForm, setEditForm] = useState<CommunityPost | null>(null); // Temp data for editing
  const [commentInput, setCommentInput] = useState('');

  // Handle Image Upload for New Post
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewPostImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Handle Image Upload for Editing Post
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditForm({ ...editForm, image: reader.result });
        }
      };
      reader.readAsDataURL(file);
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

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      title: newPostTitle,
      content: newPostContent,
      author: user.nickname || user.username,
      date: new Date().toISOString().split('T')[0],
      image: newPostImage,
      comments: [],
      views: 0
    };

    onUpdatePosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostImage('');
    setIsAdding(false);
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

  const handlePostClick = (post: CommunityPost) => {
    // Increment view count when opening
    const updatedPost = { ...post, views: post.views + 1 };
    const updatedPosts = posts.map(p => p.id === post.id ? updatedPost : p);
    onUpdatePosts(updatedPosts);
    setViewingPost(updatedPost);
    setIsEditing(false); // Reset edit mode when opening new post
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
        date: new Date().toISOString().split('T')[0]
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
    <section className={`py-8 bg-gray-50 ${onBack ? 'min-h-screen' : ''}`}>
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-3">
          <div className="flex items-center gap-3">
             {onBack && (
                <button
                  onClick={onBack}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition shadow-sm text-gray-600"
                >
                  ←
                </button>
             )}
             <div>
                <h2 className="text-xl font-bold text-deepgreen mb-1">커뮤니티 & 여행 후기</h2>
                <p className="text-gray-500 text-xs">회원님들의 생생한 여행 사진과 이야기를 들려주세요.</p>
             </div>
          </div>
          
          <button
            onClick={() => {
                if(!user) {
                    if(confirm('로그인 후 작성 가능합니다. 로그인 하시겠습니까?')) onReqLogin();
                } else {
                    setIsAdding(true);
                }
            }}
            className="bg-gold-500 text-white px-4 py-2 rounded-full hover:bg-gold-600 transition font-bold shadow-md flex items-center gap-1 text-xs"
          >
            <span>✏️</span> 글쓰기
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
                    {newPostImage ? (
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
                
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition text-xs">취소</button>
                  <button onClick={handleAddPost} className="px-4 py-1.5 bg-deepgreen text-white rounded-lg font-bold shadow hover:bg-opacity-90 transition text-xs">등록하기</button>
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
                    className="bg-white rounded-lg shadow-sm hover:shadow-xl transition duration-300 cursor-pointer border border-gray-100 overflow-hidden flex flex-col h-full group"
                >
                    {/* Image Section */}
                    <div className="h-36 bg-gray-200 overflow-hidden relative">
                        {post.image ? (
                            <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                <span className="text-2xl mb-1">📝</span>
                                <span className="text-[10px]">Text Only</span>
                            </div>
                        )}
                        {!user && (
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <span className="text-white font-bold text-[10px] bg-black/50 px-2 py-1 rounded-full">🔒 로그인 필요</span>
                           </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-3 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded-full">
                                {post.author}
                            </span>
                            <span className="text-[10px] text-gray-400">{post.date}</span>
                        </div>
                        <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-1 group-hover:text-deepgreen transition">
                            {post.title}
                        </h3>
                        <p className="text-gray-500 text-[11px] line-clamp-2 mb-2 flex-1">
                            {post.content}
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 border-t pt-2">
                            <div className="flex gap-2">
                                <span>👀 {post.views}</span>
                                <span>💬 {post.comments.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

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
                          <h2 className="text-lg font-bold text-gray-900 mb-1">{viewingPost.title}</h2>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <div className="flex items-center gap-1">
                                  <div className="w-5 h-5 rounded-full bg-deepgreen text-white flex items-center justify-center font-bold text-[10px]">
                                      {viewingPost.author.slice(0,1)}
                                  </div>
                                  <span className="font-medium text-gray-700">{viewingPost.author}</span>
                              </div>
                              <span>•</span>
                              <span>{viewingPost.date}</span>
                              <span>•</span>
                              <span>조회 {viewingPost.views}</span>
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
                                <span className="text-xs">이미지 없음</span>
                             </div>
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity gap-3">
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
                   <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed text-xs">
                       {viewingPost.content}
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
                          className="px-4 py-1.5 bg-gold-500 text-white rounded-lg font-bold text-[10px] hover:bg-gold-600 shadow-md"
                        >
                          저장 완료
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
                                <div key={comment.id} className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-[11px] text-deepgreen">{comment.author}</span>
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
    </section>
  );
};

export default CommunityBoard;
