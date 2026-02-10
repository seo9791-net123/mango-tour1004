
import React, { useState, useRef, useEffect } from 'react';
import { User, Product, PageContent, MenuItem } from '../types';
import { INITIAL_PAGE_CONTENTS } from '../constants';

interface Props {
  users: User[];
  heroImages: string[];
  setHeroImages: (images: string[]) => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  pageContents: Record<string, PageContent>;
  setPageContents: (contents: Record<string, PageContent>) => void;
  setCurrentPage: (page: 'home' | 'admin' | 'category') => void;
}

const AdminDashboard: React.FC<Props> = ({
  users,
  heroImages,
  setHeroImages,
  menuItems,
  setMenuItems,
  products,
  setProducts,
  pageContents,
  setPageContents,
  setCurrentPage
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'hero' | 'products' | 'pages' | 'menu'>('users');
  
  // States for Hero Management
  const [newImageUrl, setNewImageUrl] = useState('');
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // States for Product Management
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // States for Page Content
  const [selectedPageId, setSelectedPageId] = useState<string>('business');
  const [pageForm, setPageForm] = useState<PageContent>(pageContents['business'] || INITIAL_PAGE_CONTENTS['business']);

  // Sync pageForm when selecting a different page
  useEffect(() => {
    if (pageContents[selectedPageId]) {
      setPageForm({ ...pageContents[selectedPageId] });
    }
  }, [selectedPageId, pageContents]);

  // Robust File Upload to prevent crashes
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit per image recommended
        alert('이미지 파일이 너무 큽니다. 2MB 이하의 파일을 권장합니다.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.onerror = () => alert('파일을 읽는 중 오류가 발생했습니다.');
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow re-selection
    e.target.value = '';
  };

  // --- Hero Slider ---
  const handleReplaceHeroImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
      const updated = [...heroImages];
      updated[index] = url;
      setHeroImages(updated);
    });
  };

  // --- Products Management Helper Functions ---
  const handleProductFieldChange = (id: string, field: keyof Product, value: any) => {
    const updated = products.map(p => p.id === id ? { ...p, [field]: value } : p);
    setProducts(updated);
  };

  const handleReplaceProductImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
      handleProductFieldChange(id, 'image', url);
    });
  };

  const handleItineraryDayAdd = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newItinerary = [...(product.itinerary || [])];
    newItinerary.push({ day: newItinerary.length + 1, activities: ['새로운 활동을 입력하세요'] });
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleItineraryDayRemove = (productId: string, dayIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.itinerary) return;
    const newItinerary = product.itinerary
      .filter((_, idx) => idx !== dayIndex)
      .map((d, i) => ({ ...d, day: i + 1 }));
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleActivityAdd = (productId: string, dayIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.itinerary) return;
    const newItinerary = [...product.itinerary];
    newItinerary[dayIndex] = {
      ...newItinerary[dayIndex],
      activities: [...newItinerary[dayIndex].activities, '활동 추가']
    };
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleActivityRemove = (productId: string, dayIndex: number, activityIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.itinerary) return;
    const newItinerary = [...product.itinerary];
    newItinerary[dayIndex] = {
      ...newItinerary[dayIndex],
      activities: newItinerary[dayIndex].activities.filter((_, idx) => idx !== activityIndex)
    };
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleActivityChange = (productId: string, dayIndex: number, activityIndex: number, value: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.itinerary) return;
    const newItinerary = [...product.itinerary];
    newItinerary[dayIndex] = {
      ...newItinerary[dayIndex],
      activities: newItinerary[dayIndex].activities.map((act, idx) => idx === activityIndex ? value : act)
    };
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  // --- Pages ---
  const handlePageFieldChange = (field: keyof PageContent, value: any) => {
    const updated = { ...pageForm, [field]: value };
    setPageForm(updated);
    setPageContents({ ...pageContents, [selectedPageId]: updated });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-deepgreen flex items-center gap-2">
           <span className="text-4xl">🛠️</span> MANGO TOUR 관리 센터
        </h1>
        <button onClick={() => setCurrentPage('home')} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition text-sm">나가기</button>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b-2 border-gray-100 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'users', label: '👥 회원' },
          { id: 'hero', label: '🖼️ 슬라이드' },
          { id: 'products', label: '🛍️ 상품' },
          { id: 'pages', label: '📄 페이지' },
          { id: 'menu', label: '🔘 메뉴' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-bold rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-deepgreen text-white shadow-lg -translate-y-1' : 'bg-gray-50 text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-50 min-h-[600px]">
        
        {/* Hero Slide */}
        {activeTab === 'hero' && (
           <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif">메인 슬라이드 이미지 (총 {heroImages.length}개)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {heroImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-video shadow-md border bg-gray-50">
                  <img src={img} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                    <label className="bg-white text-deepgreen px-3 py-1 rounded-full font-bold text-[10px] cursor-pointer hover:bg-gold-50 shadow-md">
                      교체 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReplaceHeroImage(idx, e)} />
                    </label>
                    <button onClick={() => setHeroImages(heroImages.filter((_, i) => i !== idx))} className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-[10px] shadow-md">삭제</button>
                  </div>
                </div>
              ))}
              <button onClick={() => heroFileInputRef.current?.click()} className="aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:border-gold-500 hover:text-gold-500 transition">
                 <span className="text-2xl">+</span>
                 <input type="file" className="hidden" ref={heroFileInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, (url) => setHeroImages([...heroImages, url]))} />
              </button>
            </div>
          </div>
        )}

        {/* Product Catalog Management */}
        {activeTab === 'products' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-800 font-serif">상품 카탈로그 관리</h3>
              <button 
                onClick={() => {
                  const newProd: Product = { id: Date.now().toString(), title: '새 여행 상품', description: '상품 설명을 입력하세요.', image: 'https://via.placeholder.com/800x600', price: 0, location: '지역', duration: '3박 5일', type: 'tour', itinerary: [] };
                  setProducts([newProd, ...products]);
                }} 
                className="bg-gold-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg"
              >
                + 새 상품 추가
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {products.map((p) => (
                 <div key={p.id} className={`flex flex-col border rounded-3xl bg-white shadow-xl overflow-hidden transition-all duration-300 ${editingProductId === p.id ? 'ring-4 ring-gold-400' : 'hover:shadow-2xl'}`}>
                   <div className="h-48 bg-gray-100 relative group">
                     <img src={p.image} className="w-full h-full object-cover" alt={p.title} />
                     <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-white">
                        <span className="text-2xl mb-1">🖼️</span>
                        <span className="text-xs font-bold">사진 교체</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReplaceProductImage(p.id, e)} />
                     </label>
                   </div>
                   
                   <div className="p-6 space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gold-600 uppercase">상품명</label>
                        <input className="w-full font-bold text-gray-800 border-b-2 border-transparent focus:border-gold-500 outline-none transition" value={p.title} onChange={e => handleProductFieldChange(p.id, 'title', e.target.value)} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">가격 (원)</label>
                          <input type="number" className="w-full text-red-600 font-bold border-b outline-none" value={p.price} onChange={e => handleProductFieldChange(p.id, 'price', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">지역</label>
                          <input className="w-full text-gray-600 text-sm border-b outline-none" value={p.location} onChange={e => handleProductFieldChange(p.id, 'location', e.target.value)} />
                        </div>
                     </div>

                     {/* 상세 편집 모드에서만 보이는 추가 필드들 */}
                     {editingProductId === p.id && (
                       <div className="pt-4 border-t space-y-4 animate-fade-in">
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">일정 (예: 4박 6일)</label>
                             <input className="w-full text-xs border-b outline-none" value={p.duration} onChange={e => handleProductFieldChange(p.id, 'duration', e.target.value)} />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">타입</label>
                             <select className="w-full text-xs border-b outline-none bg-transparent" value={p.type} onChange={e => handleProductFieldChange(p.id, 'type', e.target.value)}>
                               <option value="golf">골프</option>
                               <option value="tour">관광</option>
                               <option value="hotel">호텔&빌라</option>
                             </select>
                           </div>
                         </div>
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-400 uppercase">상품 간단 설명</label>
                           <textarea className="w-full text-xs border p-2 rounded outline-none h-16 resize-none" value={p.description} onChange={e => handleProductFieldChange(p.id, 'description', e.target.value)} />
                         </div>

                         {/* 상세 일정(Itinerary) 편집기 */}
                         <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <label className="text-[10px] font-bold text-deepgreen uppercase tracking-tighter">상세 일정 관리</label>
                             <button onClick={() => handleItineraryDayAdd(p.id)} className="bg-deepgreen text-white text-[9px] px-2 py-0.5 rounded shadow">+ 일차 추가</button>
                           </div>
                           <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-hide border-l-2 border-gold-200 pl-2">
                             {p.itinerary?.map((day, dIdx) => (
                               <div key={dIdx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 shadow-sm">
                                 <div className="flex justify-between items-center">
                                   <span className="text-[11px] font-black text-deepgreen italic underline">Day {day.day}</span>
                                   <button onClick={() => handleItineraryDayRemove(p.id, dIdx)} className="text-[9px] text-red-500 font-bold hover:underline">일차 삭제</button>
                                 </div>
                                 <div className="space-y-1">
                                   {day.activities.map((act, aIdx) => (
                                     <div key={aIdx} className="flex gap-1 items-center">
                                       <input className="flex-1 text-[10px] bg-white border border-gray-100 p-1.5 rounded outline-none shadow-inner" value={act} onChange={e => handleActivityChange(p.id, dIdx, aIdx, e.target.value)} />
                                       <button onClick={() => handleActivityRemove(p.id, dIdx, aIdx)} className="text-gray-300 hover:text-red-500 transition">✕</button>
                                     </div>
                                   ))}
                                   <button onClick={() => handleActivityAdd(p.id, dIdx)} className="text-[9px] text-blue-500 hover:font-bold">+ 활동 추가</button>
                                 </div>
                               </div>
                             ))}
                             {(!p.itinerary || p.itinerary.length === 0) && <p className="text-[10px] text-gray-400 italic text-center py-4">등록된 일정이 없습니다.</p>}
                           </div>
                         </div>
                       </div>
                     )}

                     <div className="flex gap-2 pt-2">
                        <button onClick={() => setEditingProductId(editingProductId === p.id ? null : p.id)} className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${editingProductId === p.id ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                           {editingProductId === p.id ? '편집 완료' : '상세 편집'}
                        </button>
                        <button onClick={() => { if(confirm('이 상품을 영구 삭제하시겠습니까?')) setProducts(products.filter(item => item.id !== p.id)) }} className="px-4 py-2 bg-red-50 text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 transition">삭제</button>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Page Editor (Golf, Hotel, etc) */}
        {activeTab === 'pages' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
               <h3 className="text-2xl font-bold text-gray-800 font-serif">서브 페이지 통합 편집기</h3>
               <select 
                className="p-3 bg-white border-2 border-deepgreen rounded-2xl font-bold text-deepgreen shadow-md outline-none"
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
              >
                <option value="golf">골프</option><option value="hotel">호텔&빌라</option><option value="tour">관광</option><option value="business">비지니스</option>
                <option value="event">이벤트</option><option value="culture">베트남 문화</option><option value="food">먹거리</option><option value="men">FOR MEN</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-4">
                  <h4 className="font-bold text-deepgreen uppercase tracking-wider">배너 & 소개</h4>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4 shadow-inner">
                    <input className="w-full p-3 border rounded-xl font-bold shadow-sm" value={pageForm.heroTitle} onChange={(e) => handlePageFieldChange('heroTitle', e.target.value)} placeholder="큰 제목" />
                    <textarea className="w-full p-3 border rounded-xl h-44 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-gold-500" value={pageForm.introText} onChange={(e) => handlePageFieldChange('introText', e.target.value)} placeholder="소개글 본문" />
                    <div className="h-44 bg-white rounded-2xl overflow-hidden relative group border-2 border-white shadow-sm">
                       <img src={pageForm.heroImage} className="w-full h-full object-cover" alt="Banner" />
                       <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white font-bold cursor-pointer text-xs">
                         <span className="text-2xl mb-1">🖼️</span> 사진 교체
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handlePageFieldChange('heroImage', url))} />
                       </label>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="font-bold text-deepgreen uppercase tracking-wider">갤러리 (총 {pageForm.galleryImages.length}개)</h4>
                  <div className="grid grid-cols-4 gap-4">
                     {pageForm.galleryImages.map((img, idx) => (
                        <div key={idx} className="aspect-square bg-gray-50 border rounded-2xl overflow-hidden relative group shadow-sm">
                           <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                           <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2 cursor-pointer">
                             <span className="text-[10px] text-white font-bold">교체</span>
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => {
                               const ng = [...pageForm.galleryImages]; ng[idx] = url; handlePageFieldChange('galleryImages', ng);
                             })} />
                           </label>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="mt-16 flex flex-col items-center">
               <button onClick={() => setCurrentPage('home')} className="bg-deepgreen text-white px-24 py-5 rounded-3xl font-bold text-xl hover:shadow-2xl transition transform active:scale-95 shadow-xl">✅ 모든 수정 저장 및 홈으로</button>
            </div>
          </div>
        )}

        {/* Menu Icon Management */}
        {activeTab === 'menu' && (
           <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif">메인 아이콘 메뉴 관리</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {menuItems.map((item, idx) => (
                <div key={idx} className="border-2 border-gray-50 p-6 rounded-[2.5rem] bg-gray-50 flex flex-col items-center group hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 mb-3 bg-white rounded-3xl shadow-inner flex items-center justify-center p-4 relative overflow-hidden">
                    <img src={item.icon} alt={item.label} className="w-full h-full object-contain transform group-hover:scale-110 transition" />
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white text-[10px] font-bold">
                      변경 
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, (url) => { 
                          const ni = [...menuItems]; 
                          ni[idx] = { ...ni[idx], icon: url }; 
                          setMenuItems(ni); 
                        })} 
                      />
                    </label>
                  </div>
                  <input 
                    className="w-full border-b-2 border-transparent bg-transparent text-center font-bold text-gray-800 focus:border-gold-500 outline-none transition" 
                    value={item.label} 
                    onChange={(e) => { 
                      const ni = [...menuItems]; 
                      ni[idx] = { ...ni[idx], label: e.target.value }; 
                      setMenuItems(ni); 
                    }} 
                  />
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400 text-xs mt-8">※ 아이콘 메뉴의 이름과 이미지를 자유롭게 수정할 수 있습니다. 변경사항은 실시간으로 저장됩니다.</p>
          </div>
        )}

        {/* User Admin */}
        {activeTab === 'users' && (
          <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif">Member Management</h3>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr><th className="p-4 text-left font-bold text-gray-600">ID</th><th className="p-4 text-left font-bold text-gray-600">닉네임</th><th className="p-4 text-left font-bold text-gray-600">권한</th></tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-800">{u.username}</td>
                      <td className="p-4 text-gray-600">{u.nickname || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{u.role.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;