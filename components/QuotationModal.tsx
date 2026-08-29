import React, { useState } from 'react';
import { Product } from '../types';
import ProductDetailModal from './ProductDetailModal';

interface Props {
  product: Product;
  onClose: () => void;
}

const QuotationModal: React.FC<Props> = ({ product, onClose }) => {
  const [showInquiry, setShowInquiry] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [inquiryText, setInquiryText] = useState('');

  if (!product) return null;

  const title = product.title;
  const price = `${product.price.toLocaleString()} USD`;
  const itinerary = product.itinerary;
  const location = product.location;
  const duration = product.duration;

  const handleCopyText = async (contactType: 'open' | 'id') => {
     const textToCopy = `[MANGO TOUR 여행 견적 문의]
📅 문의 일자: ${new Date().toLocaleDateString()}

📌 상품명: ${product.title}
📍 지역: ${product.location}
⏰ 일정: ${product.duration}
💰 견적가: ${product.price.toLocaleString()} USD
📝 포함사항: ${product.description}

--------------------------------
[🗣️ 추가 문의 내용]
${inquiryText || '(내용 없음)'}
--------------------------------
위 내용으로 상담을 신청합니다.`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      alert('견적서와 문의 내용이 복사되었습니다.\n채팅창에 붙여넣기(Paste) 해주세요.');
      
      if (contactType === 'open') {
        window.open('https://open.kakao.com/o/gSfNsh3h', '_blank');
      } else {
        window.open('https://pf.kakao.com/', '_blank');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  };

  const getTimeLabel = (index: number, total: number) => {
    if (total === 3) {
      if (index === 0) return { text: '오전', color: 'bg-yellow-100 text-yellow-800' };
      if (index === 1) return { text: '오후', color: 'bg-orange-100 text-orange-800' };
      if (index === 2) return { text: '저녁', color: 'bg-indigo-100 text-indigo-800' };
    }
    return { text: '일정', color: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[10000] p-0 sm:p-4 backdrop-blur-sm print:p-0 print:block print:bg-white print:static pt-safe">
      <div className="printable-area bg-white w-full max-w-4xl h-[92vh] sm:h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl relative flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none">
        
        {/* Paper Header */}
        <div className="bg-deepgreen text-white px-4 py-3.5 sm:p-6 sticky top-0 z-10 shadow-sm print:static print:shadow-none print:bg-deepgreen print:text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-base sm:text-2xl font-black tracking-wide">견적서 (QUOTATION)</h2>
            <p className="text-[10px] sm:text-xs opacity-80 font-light">MANGO TOUR VIP CONCIERGE</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold active:scale-95 transition no-print"
          >
            ✕
          </button>
        </div>

        {/* Paper Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-6 print:p-0 print:overflow-visible print:bg-white">
          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-4 sm:p-8 min-h-full relative print:shadow-none print:border-none print:p-0">
            
            {/* Header Info */}
            <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p><strong className="text-gray-900">수신:</strong> 고객님 귀하</p>
                <p><strong className="text-gray-900">날짜:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong className="text-gray-900">발행:</strong> MANGO TOUR</p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gold-500 rounded-2xl flex items-center justify-center text-white font-black text-xl ml-auto mb-1 shadow-sm print:bg-gold-500 print:text-white">M</div>
                <span className="text-[10px] font-bold text-gray-400">OFFICIAL</span>
              </div>
            </div>

            {/* Title Section */}
            <div className="mb-6 avoid-break">
               <h3 className="text-sm sm:text-base font-bold mb-3 border-l-4 border-gold-500 pl-2.5 text-deepgreen">
                 상품 상세 정보
               </h3>
               
               {/* Basic Info Table */}
               <table className="w-full mb-4 text-xs sm:text-sm table-fixed border border-gray-100 rounded-xl overflow-hidden">
                  <tbody>
                     <tr className="border-b border-gray-100">
                       <td className="py-2.5 font-bold w-20 sm:w-24 text-gray-600 bg-gray-50 pl-3">상품명</td>
                       <td className="py-2.5 pl-3 font-semibold text-gray-900">{title}</td>
                     </tr>
                     <tr className="border-b border-gray-100">
                       <td className="py-2.5 font-bold text-gray-600 bg-gray-50 pl-3">지역/일정</td>
                       <td className="py-2.5 pl-3 text-gray-800">{location} / {duration}</td>
                     </tr>
                     <tr className="border-b border-gray-100">
                       <td className="py-2.5 font-bold text-gray-600 bg-gray-50 pl-3">포함사항</td>
                       <td className="py-2.5 pl-3 text-gray-700 leading-relaxed">{product.description}</td>
                     </tr>
                     <tr className="bg-yellow-50/70 print:bg-gray-100">
                       <td className="py-3 font-bold text-red-600 pl-3">
                         견적 금액
                       </td>
                       <td className="py-3 pl-3">
                         <span className="font-black text-base sm:text-lg text-red-600">{price}</span>
                         <span className="text-[10px] sm:text-xs font-medium text-gray-500 ml-1.5">
                           (1인 기준 / 항공권 별도)
                         </span>
                       </td>
                     </tr>
                  </tbody>
               </table>
            </div>

            {/* Detailed Itinerary Timeline */}
            <div className="mb-6">
              <p className="font-bold mb-3 text-deepgreen text-sm sm:text-base border-b pb-2">상세 일정표</p>
              {itinerary ? (
                <div className="space-y-4">
                  {itinerary.map((day) => (
                    <div key={day.day} className="flex gap-3 group break-inside-avoid">
                      <div className="flex flex-col items-center">
                         <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-deepgreen text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm z-10 shrink-0 print:bg-deepgreen print:text-white">
                           D{day.day}
                         </div>
                         <div className="w-0.5 bg-gray-200 h-full group-last:hidden -mt-1"></div>
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 p-3 sm:p-4 rounded-xl shadow-sm">
                        <div className="space-y-2">
                           {day.activities.map((act, i) => {
                             const labelInfo = getTimeLabel(i, day.activities.length);
                             return (
                               <div key={i} className="flex items-start text-xs sm:text-sm text-gray-700 gap-2">
                                 <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 w-10 text-center ${labelInfo.color}`}>
                                    {labelInfo.text}
                                 </span>
                                 <span className="flex-1 pt-0.5 leading-snug">{act}</span>
                                </div>
                             );
                           })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                  상세 일정이 제공되지 않는 상품입니다. 상담원을 통해 문의해주세요.
                </div>
              )}
            </div>

            {/* Footer Terms */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] sm:text-xs text-gray-500 text-center leading-relaxed">
              <p>※ MANGO TOUR : 59 LE VAN THIEM PMH Q7. HOCHIMINH</p>
              <p>Contact: +84 77 803 8743</p>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="no-print bg-white p-3 border-t border-gray-200 flex justify-between gap-2 sticky bottom-0 z-20 pb-safe">
          <button 
            onClick={onClose} 
            className="flex-1 px-3 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 active:scale-95 transition text-xs sm:text-sm"
          >
            닫기
          </button>
          {product && (
            <button 
              onClick={() => setShowPreview(true)} 
              className="flex-1 px-3 py-3 rounded-xl bg-deepgreen text-white font-bold hover:bg-opacity-90 active:scale-95 transition text-xs sm:text-sm flex items-center justify-center gap-1 shadow-sm"
            >
               <span>미리보기</span>
            </button>
          )}
          <button 
            onClick={() => setShowInquiry(true)} 
            className="flex-[1.5] px-3 py-3 rounded-xl bg-gold-500 text-white font-bold hover:bg-gold-600 active:scale-95 transition text-xs sm:text-sm flex items-center justify-center gap-1 shadow-md"
          >
             <span>💬 상담 및 문의</span>
          </button>
        </div>

        {/* Inquiry Overlay */}
        {showInquiry && (
          <div className="no-print absolute inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in pb-safe">
            <div className="bg-white w-full sm:w-[450px] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              <div className="bg-deepgreen p-4 text-white flex justify-between items-center shrink-0">
                <h3 className="font-bold text-base sm:text-lg">상담 및 문의하기</h3>
                <button onClick={() => setShowInquiry(false)} className="text-white hover:text-gray-300 font-bold text-lg w-7 h-7 flex items-center justify-center rounded-full bg-white/10">✕</button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto">
                <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 leading-relaxed">
                  <strong className="text-deepgreen">견적서 내용과 문의사항</strong>이<br/>
                  자동으로 복사되어 상담이 수월해집니다.
                </p>
                
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div 
                    onClick={() => window.open('https://open.kakao.com/o/gSfNsh3h', '_blank')}
                    className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl border border-yellow-200 cursor-pointer hover:bg-yellow-100 active:scale-95 transition text-center"
                  >
                    <div className="bg-yellow-400 px-2 py-0.5 rounded-lg mb-1.5">
                      <span className="text-xs font-black text-black">Talk</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold">오픈채팅</p>
                    <p className="text-xs font-bold text-gray-900">MANGO TOUR</p>
                  </div>

                  <div 
                    onClick={() => {
                      navigator.clipboard.writeText('vnseen1');
                      alert('카카오톡 ID (vnseen1)가 복사되었습니다.\n카카오톡에서 ID로 친구 추가해주세요.');
                    }}
                    className="flex flex-col items-center p-3 bg-blue-50 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-100 active:scale-95 transition text-center"
                  >
                    <div className="bg-blue-500 px-2 py-0.5 rounded-lg mb-1.5">
                      <span className="text-xs font-black text-white">ID</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold">카카오톡 ID</p>
                    <p className="text-xs font-bold text-gray-900">vnseen1</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">✍️ 추가 문의사항 (선택)</label>
                  <textarea 
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none resize-none h-20 bg-gray-50"
                    placeholder="인원, 희망 날짜, 특별 요청사항 등을 입력해주세요."
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                   <button 
                    onClick={() => handleCopyText('open')}
                    className="w-full py-3 px-4 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-500 shadow-sm active:scale-95 transition flex items-center justify-center gap-2 text-xs xs:text-sm"
                  >
                    <span>💬</span> 복사 후 오픈채팅 상담
                  </button>
                  
                  <button 
                    onClick={() => handleCopyText('id')}
                    className="w-full py-3 px-4 bg-gold-500 text-white font-bold rounded-xl hover:bg-gold-600 shadow-sm active:scale-95 transition flex items-center justify-center gap-2 text-xs xs:text-sm"
                  >
                    <span>📋</span> 복사 후 ID 상담 (vnseen1)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPreview && product && (
          <ProductDetailModal product={product} onClose={() => setShowPreview(false)} />
        )}
      </div>
    </div>
  );
};

export default QuotationModal;
