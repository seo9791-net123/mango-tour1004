
import React, { useState } from 'react';
import { Product, TripPlanResult } from '../types';
import { TERMS_OF_SERVICE } from '../constants';

interface Props {
  product?: Product;
  plan?: TripPlanResult;
  onClose: () => void;
}

const QuotationModal: React.FC<Props> = ({ product, plan, onClose }) => {
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryText, setInquiryText] = useState('');

  if (!product && !plan) return null;

  // Determine content source
  const title = product ? product.title : 'AI 맞춤 여행 견적';
  const price = product ? `${product.price.toLocaleString()} 원` : plan?.totalCost;
  const itinerary = product ? product.itinerary : plan?.itinerary;
  const location = product ? product.location : '맞춤 여행지';
  const duration = product ? product.duration : '일정 협의';

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopyText = async () => {
     const textToCopy = `[MANGO TOUR 여행 견적 문의]
📅 문의 일자: ${new Date().toLocaleDateString()}

${product ? `📌 상품명: ${product.title}
📍 지역: ${product.location}
⏰ 일정: ${product.duration}
💰 견적가: ${product.price.toLocaleString()}원
📝 포함사항: ${product.description}` : `📌 AI 맞춤 플랜
📝 테마: ${plan?.summary}
💰 예상 견적: ${plan?.totalCost}
✅ 옵션: 가이드 ${plan?.options?.guide}, 차량 ${plan?.options?.vehicle}`}

--------------------------------
[🗣️ 추가 문의 내용]
${inquiryText || '(내용 없음)'}
--------------------------------
위 내용으로 상담을 신청합니다.`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      alert('견적서와 문의 내용이 복사되었습니다.\n카카오톡 채팅방에 붙여넣기(Paste) 해주세요.');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:p-0 print:block print:bg-white print:static">
      <div className="printable-area bg-white w-full max-w-2xl h-[90vh] overflow-hidden rounded-xl shadow-2xl relative flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none">
        
        {/* Paper Header */}
        <div className="bg-deepgreen text-white p-6 sticky top-0 z-10 shadow-md print:static print:shadow-none print:bg-deepgreen print:text-white print:print-color-adjust-exact">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1 tracking-wider">견적서 (QUOTATION)</h2>
              <p className="text-sm opacity-80 font-light">MANGO TOUR TRAVEL AGENCY</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gold-400 transition text-2xl font-bold no-print">✕</button>
          </div>
        </div>

        {/* Paper Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 print:p-0 print:overflow-visible print:bg-white">
          <div className="bg-white shadow-lg border border-gray-200 p-6 md:p-8 min-h-full relative print:shadow-none print:border-none print:p-0">
            
            {/* Header Info */}
            <div className="flex justify-between items-end mb-8 border-b-2 border-deepgreen pb-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong className="text-black">수신:</strong> 고객님 귀하</p>
                <p><strong className="text-black">날짜:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong className="text-black">발행:</strong> MANGO TOUR</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold text-2xl ml-auto mb-2 shadow-sm print:bg-gold-500 print:text-white print:print-color-adjust-exact">M</div>
              </div>
            </div>

            {/* Title Section */}
            <div className="mb-8 avoid-break">
               <h3 className="text-lg font-bold mb-4 border-l-4 border-gold-500 pl-3 text-deepgreen">
                 {product ? '상품 상세 정보' : 'AI 맞춤 여행 제안'}
               </h3>
               
               {/* Basic Info Table */}
               <table className="w-full mb-6 text-sm md:text-base">
                  <tbody>
                    {product ? (
                      <>
                        <tr className="border-b">
                          <td className="py-3 font-bold w-32 text-gray-600 bg-gray-50 pl-2">상품명</td>
                          <td className="py-3 pl-4">{product.title}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 font-bold text-gray-600 bg-gray-50 pl-2">지역/일정</td>
                          <td className="py-3 pl-4">{product.location} / {product.duration}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 font-bold text-gray-600 bg-gray-50 pl-2">포함사항</td>
                          <td className="py-3 pl-4 text-gray-700">{product.description}</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr className="border-b">
                          <td className="py-3 font-bold w-32 text-gray-600 bg-gray-50 pl-2">여행 컨셉</td>
                          <td className="py-3 pl-4 italic">"{plan?.summary}"</td>
                        </tr>
                        {plan?.options && (
                          <>
                             <tr className="border-b">
                               <td className="py-3 font-bold text-gray-600 bg-gray-50 pl-2">가이드</td>
                               <td className="py-3 pl-4">{plan.options.guide}</td>
                             </tr>
                             <tr className="border-b">
                               <td className="py-3 font-bold text-gray-600 bg-gray-50 pl-2">차량</td>
                               <td className="py-3 pl-4">{plan.options.vehicle}</td>
                             </tr>
                          </>
                        )}
                      </>
                    )}
                    <tr className="border-b-2 border-deepgreen bg-yellow-50/50 print:bg-gray-100 print:print-color-adjust-exact">
                      <td className="py-4 font-bold text-red-600 pl-2">견적 금액</td>
                      <td className="py-4 pl-4">
                        <span className="font-bold text-xl text-red-600">{price}</span>
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          (항공권 제외{product ? ', 1인 기준' : ''})
                        </span>
                      </td>
                    </tr>
                  </tbody>
               </table>
            </div>

            {/* Detailed Itinerary Timeline */}
            <div className="mb-8">
              <p className="font-bold mb-4 text-deepgreen text-lg border-b pb-2">상세 일정표</p>
              {itinerary ? (
                <div className="space-y-4">
                  {itinerary.map((day) => (
                    <div key={day.day} className="flex gap-4 group break-inside-avoid">
                      <div className="flex flex-col items-center">
                         <div className="w-12 h-12 rounded-full bg-deepgreen text-white flex items-center justify-center font-bold shadow-md z-10 shrink-0 print:bg-deepgreen print:text-white print:print-color-adjust-exact">
                           Day {day.day}
                         </div>
                         <div className="w-0.5 bg-gray-200 h-full group-last:hidden -mt-2"></div>
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition print:shadow-none print:border print:border-gray-300">
                        <ul className="space-y-2">
                           {day.activities.map((act, i) => (
                             <li key={i} className="flex items-start text-sm text-gray-700">
                               <span className="text-gold-500 mr-2 print:text-black">•</span> {act}
                             </li>
                           ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
                  상세 일정이 제공되지 않는 상품입니다. 상담원을 통해 문의해주세요.
                </div>
              )}
            </div>

            {/* Cost Breakdown (Only for AI Plan) */}
            {plan && (
              <div className="mb-8 break-inside-avoid">
                <p className="font-bold mb-4 text-deepgreen text-lg border-b pb-2">포함 내역 상세</p>
                <table className="w-full border-collapse rounded-lg overflow-hidden border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm print:bg-gray-200 print:print-color-adjust-exact">
                      <th className="p-3 text-left font-bold">항목</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {plan.costBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-700">{item.item}</td>
                      </tr>
                    ))}
                    <tr className="bg-deepgreen/10 print:bg-gray-100 print:print-color-adjust-exact">
                      <td className="p-4 flex justify-between items-center">
                        <span className="font-bold text-deepgreen">총 합계 <span className="text-xs font-normal text-gray-500 ml-1">(항공권 제외)</span></span>
                        <span className="text-right font-bold text-xl text-deepgreen">{plan.totalCost}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Terms of Service Section */}
            <div className="mb-8 break-inside-avoid">
              <p className="font-bold mb-4 text-deepgreen text-lg border-b pb-2">이용 약관 및 유의사항</p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs text-gray-600 whitespace-pre-line leading-relaxed h-auto overflow-visible print:bg-white print:border-gray-300">
                {TERMS_OF_SERVICE}
              </div>
            </div>

            {/* Footer Terms */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center leading-relaxed">
              <p>※ MANGO TOUR : 59 LE VAN THIEM PMH Q7. HOCHIMINH</p>
              <p>Contact: +84 77 803 8743</p>
            </div>
            
            {/* Stamp Effect */}
            <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none transform rotate-[-15deg] print:opacity-50">
               <div className="border-4 border-red-800 rounded-full w-32 h-32 flex items-center justify-center">
                 <span className="text-red-800 font-bold text-xl text-center">MANGO TOUR<br/>OFFICIAL</span>
               </div>
            </div>

          </div>
        </div>

        {/* Actions Footer */}
        <div className="no-print bg-gray-100 p-4 border-t flex justify-between md:justify-end gap-3 sticky bottom-0 z-20 shadow-inner">
          <button 
            onClick={onClose} 
            className="flex-1 md:flex-none px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-white transition"
          >
            닫기
          </button>
          <button 
            onClick={() => setShowInquiry(true)} 
            className="flex-1 md:flex-none px-6 py-3 rounded-lg bg-gold-500 text-white font-bold hover:bg-gold-600 shadow-lg flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
          >
             <span>💬</span> 
             <span>상담 및 문의하기</span>
          </button>
        </div>

        {/* Inquiry Overlay */}
        {showInquiry && (
          <div className="no-print absolute inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full md:w-[450px] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="bg-deepgreen p-4 text-white flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg">상담 및 문의하기</h3>
                <button onClick={() => setShowInquiry(false)} className="text-white hover:text-gray-300 font-bold text-xl">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2">
                    <strong className="text-deepgreen">견적서 내용과 문의사항</strong>이<br/>
                    자동으로 복사되어 상담이 수월해집니다.
                  </p>
                </div>
                
                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center p-3 bg-yellow-100 rounded-xl border border-yellow-200 shadow-sm">
                    <div className="bg-yellow-400 p-1.5 rounded-lg mr-3">
                      <span className="text-xl font-bold text-black/80">Talk</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-600 font-bold">카카오톡</p>
                      <p className="text-base font-bold text-gray-800">vnseen1</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                    <div className="bg-green-600 p-1.5 rounded-lg mr-3 text-white">
                      <span className="text-lg">📞</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-600 font-bold">베트남 연락처</p>
                      <p className="text-base font-bold text-gray-800">077 803 8743</p>
                    </div>
                  </div>
                </div>

                {/* Inquiry Input Area */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-600 mb-2">✍️ 추가 문의사항 (선택)</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 outline-none resize-none h-24 bg-gray-50"
                    placeholder="인원, 날짜, 특별 요청사항 등 궁금하신 점을 자유롭게 적어주세요."
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                   <button 
                    onClick={handleCopyText}
                    className="w-full py-4 px-4 bg-gold-500 text-white rounded-xl font-bold hover:bg-gold-600 shadow-md transform active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">📋</span> 
                    <div className="text-left">
                        <div className="text-base">견적서 + 문의내용 복사하기</div>
                        <div className="text-[10px] opacity-80 font-normal">복사 후 카톡 채팅방에 붙여넣기 하세요</div>
                    </div>
                  </button>

                   <button 
                    onClick={handlePrintPDF}
                    className="w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <span className="text-lg">🖨️</span> 
                    <span className="text-sm">PDF 파일로 저장하기</span>
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuotationModal;