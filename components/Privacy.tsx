import React from 'react';

interface Props {
  onGoHome?: () => void;
}

const Privacy: React.FC<Props> = ({ onGoHome }) => {
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
            <span className="text-xs sm:text-sm font-bold text-gray-700">개인정보처리방침</span>
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
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="inline-block bg-gold-50 text-gold-800 text-[11px] font-black px-3 py-1 rounded-full border border-gold-200 mb-3">
              대한민국 표준 개인정보처리방침 (공식 고지)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
              망고투어(MANGO TOUR) 개인정보처리방침
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              망고투어(이하 &apos;회사&apos;)는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보 보호법」 제30조에 따라 정보주체에게 개인정보 처리에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
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
              <span className="text-gray-400 block font-medium">보호 책임 부서</span>
              <strong className="text-deepgreen font-bold">고객지원팀 / CPO</strong>
            </div>
          </div>
        </div>

        {/* Detailed Sections Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/90 space-y-10 text-xs sm:text-sm text-gray-700 leading-relaxed">
          {/* 제1조 */}
          <section id="section-1" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제1조</span> 개인정보의 처리 목적
            </h2>
            <p>
              회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>회원 가입 및 관리:</strong> 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 등을 목적으로 개인정보를 처리합니다.</li>
              <li><strong>여행 상품 예약 및 계약 이행:</strong> 베트남 호치민, 붕따우, 달랏 등 골프 투어, 호텔/풀빌라 숙박, 전용 리무진 밴 차량 배차, 현지 가이드 배정, 맞춤형 견적서 산출 및 바우처 발권 등 여행 서비스 제공 계약의 성립 및 이행.</li>
              <li><strong>대금 결제 및 정산:</strong> 여행 상품 및 옵션 비용 정산, 예약금/잔금 결제 및 영수증 발행.</li>
              <li><strong>고객 상담 및 실시간 채팅 서비스:</strong> 1:1 여행 상담, 실시간 견적 문의 응대, 불만 처리 및 민원 처리.</li>
            </ul>
          </section>

          {/* 제2조 */}
          <section id="section-2" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제2조</span> 처리하는 개인정보의 항목
            </h2>
            <p>
              회사는 여행 서비스 제공 및 원활한 상담을 위해 다음과 같은 개인정보 항목을 수집 및 처리하고 있습니다.
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-gray-800 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">구분</th>
                    <th className="p-3">수집 항목</th>
                    <th className="p-3">수집 목적</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-600">
                  <tr>
                    <td className="p-3 font-bold text-gray-900 bg-slate-50/50">회원가입 (기본)</td>
                    <td className="p-3">아이디(ID), 비밀번호, 닉네임, 연락처(휴대전화번호)</td>
                    <td className="p-3">회원 식별, 서비스 로그인 및 공지 안내</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-gray-900 bg-slate-50/50">여행 예약 (필수)</td>
                    <td className="p-3">예약자 성명, 영문 성명(여권 기준), 생년월일, 성별, 연락처, 이메일, 탑승 항공편 정보</td>
                    <td className="p-3">골프장 티오프 예약, 호텔 투숙자 등록, 공항 픽업 차량 배차</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-gray-900 bg-slate-50/50">실시간 채팅 / 상담</td>
                    <td className="p-3">대화명(닉네임), 상담 내역, 문의 메시지</td>
                    <td className="p-3">실시간 문의 응대 및 견적 상담</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-gray-900 bg-slate-50/50">자동 수집 항목</td>
                    <td className="p-3">접속 IP 정보, 쿠키(Cookie), 서비스 이용 기록, 접속 로그, 불량 이용 기록</td>
                    <td className="p-3">서비스 안정성 확보 및 부정 이용 방지</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 제3조 */}
          <section id="section-3" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제3조</span> 개인정보의 처리 및 보유 기간
            </h2>
            <p>
              ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br/>
              ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>회원 가입 및 관리 정보:</strong> 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지)</li>
              <li><strong>여행 예약 및 계약 이행 정보:</strong> 여행 종료 및 대금 결제·정산 완료 시까지</li>
              <li><strong>관계 법령에 의한 보존 의무:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-1">
                  <li>「전자상거래 등에서의 소비자보호에 관한 법률」 계약 또는 청약철회 등에 관한 기록: <strong>5년</strong></li>
                  <li>「전자상거래 등에서의 소비자보호에 관한 법률」 대금결제 및 재화 등의 공급에 관한 기록: <strong>5년</strong></li>
                  <li>「전자상거래 등에서의 소비자보호에 관한 법률」 소비자의 불만 또는 분쟁처리에 관한 기록: <strong>3년</strong></li>
                  <li>「통신비밀보호법」 웹사이트 방문 기록: <strong>3개월</strong></li>
                </ul>
              </li>
            </ul>
          </section>

          {/* 제4조 */}
          <section id="section-4" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제4조</span> 개인정보의 제3자 제공 및 국외 이전에 관한 사항
            </h2>
            <p>
              ① 회사는 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.<br/>
              ② 회사는 원활한 베트남 현지 여행 일정 수행을 위하여 아래와 같이 필수적인 제3자(현지 제휴업체)에게 개인정보를 제공하고 있습니다:
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-gray-800 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">제공받는 자</th>
                    <th className="p-3">제공 목적</th>
                    <th className="p-3">제공 항목</th>
                    <th className="p-3">보유 및 이용기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-600">
                  <tr>
                    <td className="p-3 font-bold text-gray-900">현지 예약 골프장<br/>(탄손녓, 트윈도브스, 정산, 블러프 등)</td>
                    <td className="p-3">티오프 시간 배정 및 골퍼 등록</td>
                    <td className="p-3">예약자 성명(영문/국문), 성별, 연락처</td>
                    <td className="p-3">라운딩 이용 완료 시까지</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-gray-900">현지 예약 숙박시설<br/>(호치민/붕따우/달랏 5성 호텔 및 풀빌라)</td>
                    <td className="p-3">체크인 등록 및 객실 배정</td>
                    <td className="p-3">투숙자 영문 성명, 생년월일, 연락처</td>
                    <td className="p-3">투숙 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-gray-900">현지 전용 차량 및 가이드사</td>
                    <td className="p-3">공항 픽업/샌딩 및 전용 기사 배차, 일정 안내</td>
                    <td className="p-3">대표자 성명, 연락처, 도착 항공편 편명</td>
                    <td className="p-3">전 일정 종료 시까지</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 제5조 */}
          <section id="section-5" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제5조</span> 개인정보처리의 위탁에 관한 사항
            </h2>
            <p>
              회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>클라우드 인프라 및 데이터 보관:</strong> Google Cloud Platform (Firebase)</li>
              <li><strong>메시지 발송 및 실시간 채팅 인프라:</strong> Google Firebase Firestore & WebChannel</li>
            </ul>
          </section>

          {/* 제6조 */}
          <section id="section-6" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제6조</span> 정보주체와 법정대리인의 권리·의무 및 행사방법
            </h2>
            <p>
              ① 정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.<br/>
              ② 권리 행사는 회사에 대해 「개인정보 보호법」 시행령 제41조 제1항에 따라 서면, 전자우편, 고객센터 상담 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.<br/>
              ③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.
            </p>
          </section>

          {/* 제7조 */}
          <section id="section-7" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제7조</span> 개인정보의 파기절차 및 파기방법
            </h2>
            <p>
              ① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.<br/>
              ② 파기의 절차 및 방법은 다음과 같습니다:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>파기절차:</strong> 목적이 달성된 개인정보는 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</li>
              <li><strong>파기방법:</strong> 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 기술적 방법(영구삭제)을 사용하여 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>
            </ul>
          </section>

          {/* 제8조 */}
          <section id="section-8" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제8조</span> 개인정보의 안전성 확보 조치
            </h2>
            <p>
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>관리적 조치:</strong> 내부관리계획 수립·시행, 정기적 직원 교육, 개인정보 취급자의 최소화.</li>
              <li><strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화(SSL 보안서버 구축), 보안프로그램 설치.</li>
              <li><strong>물리적 조치:</strong> 전산실, 자료보관실 등의 접근통제.</li>
            </ul>
          </section>

          {/* 제9조 */}
          <section id="section-9" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제9조</span> 개인정보 보호책임자 및 고충처리 연락처
            </h2>
            <p>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
            </p>

            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 block text-xs">개인정보 보호책임자 (CPO)</span>
                  <strong className="text-gray-900 font-bold">김일선 (대표이사)</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">담당 부서</span>
                  <strong className="text-gray-900 font-bold">망고투어 고객지원팀</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">직통 전화</span>
                  <a href="tel:+84377204451" className="text-deepgreen font-bold hover:underline">
                    +84 37 720 4451
                  </a>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">카카오톡 공식 채널</span>
                  <a 
                    href="https://open.kakao.com/o/gprQnKSi" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-gold-700 font-bold hover:underline"
                  >
                    카카오톡: MANGO TOUR
                  </a>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 pt-1">
              정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.
            </p>
          </section>

          {/* 제10조 */}
          <section id="section-10" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제10조</span> 권익침해 구제방법
            </h2>
            <p>
              정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
              <li>경찰청: (국번없이) 182 (ecrm.police.go.kr)</li>
            </ul>
          </section>

          {/* 제11조 */}
          <section id="section-11" className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gold-600">제11조</span> 개인정보 처리방침의 변경
            </h2>
            <p>
              이 개인정보 처리방침은 2026년 11월 07일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
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
        <p className="mt-1">대표이사 / 개인정보보호책임자: 김일선 | 문의: <a href="tel:+84377204451" className="text-gold-400 font-bold">+84 37 720 4451</a></p>
        <p className="mt-2 text-gray-500 text-[11px]">© MANGO TOUR. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Privacy;
