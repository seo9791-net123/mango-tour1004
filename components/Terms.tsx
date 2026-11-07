import React from 'react';

interface Props {
  onGoHome?: () => void;
}

const Terms: React.FC<Props> = ({ onGoHome }) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans selection:bg-gold-500 selection:text-white">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs no-print">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={onGoHome} 
              className="flex items-center gap-2 text-deepgreen hover:text-gold-600 transition active:scale-95 cursor-pointer"
              title="망고투어 메인 홈으로 이동"
            >
              <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-xs">
                M
              </div>
              <span className="font-black text-base tracking-tight uppercase">MANGO TOUR</span>
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-xs sm:text-sm font-bold text-gray-700">서비스 이용약관</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 transition cursor-pointer shadow-2xs"
            >
              <span>🖨️ 인쇄 / PDF 저장</span>
            </button>

            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-deepgreen hover:bg-teal-900 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                <span>🏠 메인 홈 이동</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Document Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/90 mb-8">
          <div className="border-b border-gray-100 pb-6 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              대한민국 표준 서비스 이용약관 (전자상거래 및 국외여행 표준약관 준용)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
              망고투어(MANGO TOUR) 서비스 이용약관
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              본 약관은 망고투어(MANGO TOUR TRAVEL AGENCY, 이하 &apos;회사&apos;)가 제공하는 베트남 골프 투어, 호텔·풀빌라 예약, 전용 리무진 차량 배차, 1:1 맞춤 일정 기획 및 견적 상담 등 제반 온라인/오프라인 여행 서비스(이하 &apos;서비스&apos;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </div>

          {/* Quick Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">최초 시행일자</span>
              <strong className="text-gray-800 font-bold">2026년 10월 01일</strong>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">최종 개정일자</span>
              <strong className="text-gray-800 font-bold">2026년 11월 07일 (현행)</strong>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">대표이사</span>
              <strong className="text-deepgreen font-bold">김일선 (MANGO TOUR)</strong>
            </div>
          </div>
        </div>

        {/* Detailed Sections Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/90 space-y-10 text-xs sm:text-sm text-gray-700 leading-relaxed">
          {/* 제1조 */}
          <section id="section-1" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제1조</span> 목적
            </h2>
            <p>
              본 약관은 망고투어(이하 &apos;회사&apos;)가 운영하는 온라인 웹사이트(이하 &apos;몰&apos; 또는 &apos;플랫폼&apos;) 및 모바일 환경에서 제공하는 베트남 전 지역(호치민, 붕따우, 달랏, 다낭, 나트랑 등) 골프 라운딩 예약 대행, 호텔 및 풀빌라 숙박 예약, 7인승 VIP 리무진 밴 등 전용 차량 배차, 1:1 맞춤 일정 상담 및 견적 발송 등 여행 관련 제반 서비스(이하 &apos;서비스&apos;)를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section id="section-2" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제2조</span> 용어의 정의
            </h2>
            <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                <strong>&apos;회사&apos;</strong>란 망고투어(MANGO TOUR TRAVEL AGENCY)를 말하며, 여행 상품 기획, 골프장 및 숙박 예약 대행, 전용 차량 운행 관리, 견적 상담 등의 업무를 수행하는 사업자를 의미합니다.
              </li>
              <li>
                <strong>&apos;이용자&apos;</strong>란 몰에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
              </li>
              <li>
                <strong>&apos;회원&apos;</strong>이란 몰에 개인정보를 제공하여 회원등록을 한 자로서, 몰의 정보를 지속적으로 제공받으며 몰이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
              </li>
              <li>
                <strong>&apos;비회원&apos;</strong>이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.
              </li>
              <li>
                <strong>&apos;여행상품&apos;</strong>이란 회사가 기획하거나 고객의 요구에 따라 구성한 골프 티타임, 호텔/풀빌라 숙박, 단독 전용 차량 및 기사, 공항 패스트트랙, 가이드 케어 등이 포함된 패키지 또는 단품 상품을 말합니다.
              </li>
              <li>
                <strong>&apos;견적서(Quotation)&apos;</strong>란 이용자가 요청한 여행 일정과 옵션(숙소, 라운드 수, 인원수, 차량 등)에 따라 회사가 발행하는 예상 경비 및 확정 비용 명세서를 말합니다.
              </li>
            </ol>
          </section>

          {/* 제3조 */}
          <section id="section-3" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제3조</span> 약관의 명시와 설명 및 개정
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                회사는 본 약관의 내용과 상호, 영업소 소재지, 대표자의 성명, 사업자등록번호(또는 현지 법인 등록정보), 연락처(전화, 이메일, 카카오톡), 개인정보보호책임자 등을 이용자가 쉽게 알 수 있도록 서비스 초기 화면 또는 연결화면에 게시합니다.
              </li>
              <li>
                회사는 「약관의 규제에 관한 법률」, 「전자문서 및 전자거래기본법」, 「전자상거래 등에서의 소비자보호에 관한 법률」, 「관광진흥법」 등 관계 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
              </li>
              <li>
                회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 몰의 초기화면이나 공지사항 게시판에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다. 다만, 이용자에게 불리하게 약관내용을 변경하는 경우에는 최소한 30일 이상의 사전 유예기간을 두고 공지합니다.
              </li>
            </ol>
          </section>

          {/* 제4조 */}
          <section id="section-4" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제4조</span> 서비스의 제공 및 변경
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                회사는 다음과 같은 업무를 수행합니다:
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-gray-600">
                  <li>베트남 주요 명문 골프장 티타임(Tee-off) 예약 대행 및 그린피/카트/캐디피 관리 안내</li>
                  <li>베트남 특급 호텔, 리조트, 프리미엄 프라이빗 풀빌라 예약 대행</li>
                  <li>공항 픽업/샌딩 및 전 일정 7인승 VIP 리무진 밴 등 단독 전용 차량 및 기사 배차 운행</li>
                  <li>공항 VIP 패스트트랙(Fast Track) 입국 수속 지원 대행</li>
                  <li>1:1 맞춤형 여행 견적서 산출, PDF/A4 인쇄 문서 생성 및 실시간 카카오톡/온라인 채팅 상담</li>
                  <li>기타 회사가 정하는 여행 및 레저 관련 부가 서비스</li>
                </ul>
              </li>
              <li>
                회사는 현지 골프장의 잔여 티타임 변동, 호텔 만실, 항공 스케줄 변경 또는 환율의 급격한 변동 등 불가피한 사정이 있는 경우 제공할 서비스의 내용을 변경할 수 있으며, 이 경우 변경된 내용을 이용자에게 즉시 통보합니다.
              </li>
            </ol>
          </section>

          {/* 제5조 */}
          <section id="section-5" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제5조</span> 회원가입 및 계정 관리
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                이용자는 회사가 정한 가입 양식에 따라 회원정보(이름, 이메일, 전화번호, 비밀번호 등)를 기입한 후 본 약관 및 개인정보처리방침에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
              </li>
              <li>
                회원은 등록사항에 변경이 있는 경우 즉시 마이페이지 또는 고객센터를 통해 변경사항을 정정하여야 합니다. 미변경으로 인하여 발생하는 불이익은 회원이 부담합니다.
              </li>
              <li>
                회원의 아이디와 비밀번호에 관한 관리책임은 회원에게 있으며, 제3자에게 이용하게 해서는 안 됩니다. 도난당하거나 제3자가 사용하고 있음을 인지한 경우에는 즉시 회사에 통보하고 회사의 안내에 따라야 합니다.
              </li>
            </ol>
          </section>

          {/* 제6조 */}
          <section id="section-6" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제6조</span> 예약 신청, 견적 발송 및 계약의 성립
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                이용자는 플랫폼의 견적 계산기 또는 1:1 상담 채널을 통해 희망 일정, 인원수, 골프장, 숙소, 차량 등을 선택하여 견적 및 예약을 신청합니다.
              </li>
              <li>
                회사는 신청 내용을 바탕으로 상세 견적서(A4 견적서 및 결제 안내)를 발행하며, 이용자가 계약금(또는 총 여행대금)을 지정된 기일 내에 입금하고 회사가 예약 확정 안내(바우처 또는 확정 문자/카톡)를 발송함으로써 여행 계약이 정식으로 성립합니다.
              </li>
              <li>
                기한 내에 계약금이 입금되지 않을 경우 골프장 티타임 및 숙박 가예약은 사전 예고 없이 자동 취소될 수 있습니다.
              </li>
            </ol>
          </section>

          {/* 제7조 */}
          <section id="section-7" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제7조</span> 대금 지급 및 결제
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                상품 대금은 회사가 제시한 방법(무통장 계좌이체, 온라인 간편송금, 원화(KRW) 환산 결제 또는 현지 미화(USD) 정산 등)으로 지급합니다.
              </li>
              <li>
                기본 표시 가격이 미화(USD)인 경우, 원화 송금 시 결제 당일 외환은행 1회차 매매기준율 또는 회사가 사전에 고지한 고정 환율 규정을 적용하여 환산합니다.
              </li>
            </ol>
          </section>

          {/* 제8조 */}
          <section id="section-8" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제8조</span> 예약 변경, 취소 및 환불 규정 (특별약관)
            </h2>
            <p>
              망고투어의 골프 투어 및 숙박 예약은 현지 골프장 및 리조트/풀빌라와의 사전 확정 계약에 의해 진행되므로, 공정거래위원회 고시 표준약관과 별개로 현지 규정에 따른 <strong>특별약관(Special Terms)</strong>이 우선 적용됩니다.
            </p>
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 text-xs text-amber-950 space-y-2">
              <p className="font-bold text-amber-900">📌 [취소 수수료 안내 (여행 개시일 기준)]</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>여행 개시 30일 전까지 취소 요청 시:</strong> 계약금 및 결제액 전액 환불 (단, 골프장/호텔 선납 취소불가 조건인 경우 실비 공제)</li>
                <li><strong>여행 개시 29일 ~ 20일 전 취소 요청 시:</strong> 총 여행 경비의 10% 위약금 공제 후 환불</li>
                <li><strong>여행 개시 19일 ~ 10일 전 취소 요청 시:</strong> 총 여행 경비의 20% 위약금 공제 후 환불</li>
                <li><strong>여행 개시 9일 ~ 4일 전 취소 요청 시:</strong> 총 여행 경비의 50% 위약금 공제 후 환불</li>
                <li><strong>여행 개시 3일 ~ 당일 취소 또는 No-Show:</strong> 전액 환불 불가 (골프 티타임 및 숙소 비용 100% 위약금 부과)</li>
              </ul>
              <p className="text-[11px] text-amber-800 mt-2">
                ※ 우천 및 기상악화 시 골프 라운드 환불 여부는 현지 골프장의 정식 Rain Check 및 환불 규정을 따르며, 골프장 측에서 정상 플레이를 선언한 경우에는 환불이 불가합니다.
              </p>
            </div>
          </section>

          {/* 제9조 */}
          <section id="section-9" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제9조</span> 회사의 의무
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                회사는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 본 약관이 정하는 바에 따라 지속적이고 안정적으로 서비스를 제공하기 위해 최선을 다합니다.
              </li>
              <li>
                회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함)보호를 위한 보안 시스템을 구축하고 관리합니다.
              </li>
              <li>
                회사는 고객의 요청 일정에 따른 골프장 부킹, 숙박 배정, 단독 차량 및 기사 배차 업무를 성실히 이행하며 현지 진행 상황을 투명하게 안내합니다.
              </li>
            </ol>
          </section>

          {/* 제10조 */}
          <section id="section-10" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제10조</span> 이용자의 의무
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                <strong>여권 및 비자 확인:</strong> 이용자는 베트남 입국 시 여권 잔여 유효기간이 6개월 이상 남아있어야 하며, 대한민국 국적자 무비자 체류 조건(45일) 또는 필요시 비자 발급 요건을 스스로 확인하고 준비해야 합니다. 여권 훼손, 유효기간 만료 등으로 인한 출입국 거부에 대한 책임은 전적으로 이용자에게 있습니다.
              </li>
              <li>
                <strong>정보의 정확성:</strong> 이용자는 예약 신청 시 본인 및 동행자의 정확한 영문 성명(여권상 표기), 생년월일, 연락처를 제공하여야 합니다. 허위 기재로 인한 불이익은 회사가 책임지지 않습니다.
              </li>
              <li>
                <strong>현지 규율 준수:</strong> 이용자는 베트남 현지 법령, 골프장 드레스코드 및 플레이 에티켓, 호텔/풀빌라 시설 이용 수칙을 준수하여야 하며, 고의 또는 과실로 시설물을 파손한 경우 손해배상 책임을 집니다.
              </li>
              <li>
                이용자는 타인의 명의나 계정 정보를 도용하거나 회사의 정상적인 서비스 운영을 방해해서는 안 됩니다.
              </li>
            </ol>
          </section>

          {/* 제11조 */}
          <section id="section-11" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제11조</span> 면책 조항 (불가항력)
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                회사는 천재지변, 태풍, 홍수, 지진, 전쟁, 내란, 폭동, 항공기 결항 및 연착, 정부의 출입국 통제나 전염병 격리 명령 등 불가항력적인 사유로 인하여 서비스를 제공할 수 없거나 일정이 변경된 경우 책임을 지지 않습니다.
              </li>
              <li>
                회사는 이용자의 귀책사유로 인한 서비스 이용 장애 또는 개인 건강 이상, 음주 사고, 개인 부주의로 인한 분실 및 도난 사고에 대하여 책임을 지지 않습니다. (출국 전 해외여행자보험 가입을 강력히 권장합니다.)
              </li>
              <li>
                회사는 이용자가 서비스를 이용하여 기대하는 수익이나 개인적 만족도에 대하여 보증하지 않으며, 제3자(현지 식당, 상점, 현지 마사지샵 등)가 독자적으로 제공하는 서비스에서 발생한 분쟁에 대해서는 회사의 고의·중과실이 없는 한 책임을 지지 않습니다.
              </li>
            </ol>
          </section>

          {/* 제12조 */}
          <section id="section-12" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제12조</span> 분쟁 해결 및 관할 법원
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>
                회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 원만히 보상 처리하기 위하여 고객지원팀 및 카카오톡 1:1 상담 창구를 운영합니다.
              </li>
              <li>
                회사와 이용자 간에 발생한 전자상거래 및 여행 분쟁에 대하여는 상호 원만한 합의를 원칙으로 하되, 소송이 제기될 경우 회사의 본점 소재지를 관할하는 법원을 전속 관할법원으로 합니다.
              </li>
            </ol>
          </section>

          {/* 제13조 (부칙) */}
          <section id="section-13" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">부칙</span> (시행일 및 적용)
            </h2>
            <p>
              본 약관은 2026년 11월 07일부터 적용되며, 종전의 약관은 본 약관으로 대체됩니다.
            </p>
            <div className="pt-2 text-xs text-gray-500 space-y-1">
              <p>• 공고일자: 2026년 10월 01일</p>
              <p>• 시행일자: 2026년 11월 07일</p>
            </div>
          </section>
        </div>

        {/* Back to Home Button at Bottom */}
        <div className="mt-8 text-center no-print">
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="px-8 py-3.5 bg-gradient-to-r from-deepgreen to-teal-800 hover:from-teal-900 hover:to-deepgreen text-white font-bold rounded-2xl shadow-lg transition transform active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <span>🏠 망고투어 메인 홈으로 둘러보기</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6 text-center text-xs border-t border-gray-700 mt-12 no-print">
        <p>MANGO TOUR TRAVEL AGENCY | 호치민 · 붕따우 · 달랏 골프/호텔/풀빌라 단독 투어</p>
        <p className="mt-1">
          대표이사: 김일선 | 직통 문의: <a href="tel:+84377204451" className="text-gold-400 font-bold hover:underline">+84 37 720 4451</a> | 카카오톡: MANGO TOUR
        </p>
        <p className="mt-2 text-gray-500 text-[11px]">© MANGO TOUR. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Terms;
