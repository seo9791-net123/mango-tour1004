
import { Product, VideoItem, CommunityPost, PageContent, PopupNotification, CustomTripPackage, MasterOptionPool } from './types';

export const LOCATIONS = ['호치민', '붕따우', '무이네', '나트랑', '달랏'];
export const THEMES = ['골프', '관광', '먹거리', '비지니스'];
export const ACCOMMODATIONS = ['3성급', '4성급', '호텔 숙박(고급 호텔)', '풀빌라'];

export const DURATIONS = ['3박 5일', '4박 6일', '5박 7일', '기타(직접상담)'];
export const VEHICLE_OPTIONS = ['선택안함', '7인승', '16인승', '26인승', '기타'];

export const TERMS_OF_SERVICE = `
[제1조 예약 및 결제 안내]
1. 예약 확정 시 상품가액의 30%를 예약금으로 입금하셔야 합니다.
2. 잔금은 여행 출발 7일 전까지 전액 완납을 원칙으로 합니다.
3. 모든 결제는 MANGO TOUR 지정 계좌를 통해 이루어져야 유효합니다.

[제2조 취소 및 환불 규정]
1. 여행 출발 15일 전 취소: 예약금 100% 환불
2. 여행 출발 14일 ~ 8일 전 취소: 총 상품가의 20% 위약금 발생
3. 여행 출발 7일 ~ 3일 전 취소: 총 상품가의 50% 위약금 발생
4. 여행 출발 2일 전 ~ 당일 취소: 환불 불가 (총 상품가의 100% 위약금)
※ 단, 골프장 및 호텔 자체 규정에 따라 별도의 위약금이 추가될 수 있습니다.

[제3조 불포함 사항 안내]
1. 국제선 및 국내선 항공권 (별도 문의 시 대행 가능)
2. 가이드 및 기사 매너팁 (1일 1인당 $10 권장)
3. 골프 캐디팁 (18홀당 $15~20 현지 지불)
4. 개인 일정 중 발생하는 개인 비용 및 유료 어트랙션

[제4조 책임의 한계]
1. 당사는 천재지변, 항공 지연, 현지 사정에 따른 일정 변경에 대해 책임지지 않으나, 최선의 조치를 다해 지원합니다.
2. 여행 중 개인의 부주의로 인한 사고나 분실물에 대해서는 당사의 책임이 제한됩니다.
`;

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: '호치민 3색 명문 골프 투어',
    description: '떤선녓 + 롱탄 + 송베 CC 라운딩. 호치민 최고의 코스만을 엄선했습니다.',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
    price: 970,
    location: '호치민',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 픽업 및 호텔 체크인', '환영 석식(고급 현지식)', '자유 시간 및 휴식'] },
      { day: 2, activities: ['떤선녓 CC 18홀 라운딩', '오후 시내 관광 (노트르담 성당, 우체국)', '전신 마사지 90분 및 석식'] },
      { day: 3, activities: ['롱탄 CC 18홀 라운딩', '무제한 삼겹살 석식', '루프탑바 관람 및 야경 감상'] },
      { day: 4, activities: ['송베 CC 18홀 라운딩', '벤탄 시장 쇼핑 및 휴식', '공항 샌딩'] }
    ],
    costItems: [
      { category: '항공권', detail: '국제선 왕복 항공권 (개별 발권 또는 망고투어 실시간 발권 대행)', quantity: '{personCount}인', amountUSD: 0, pricingType: 'person' },
      { category: '골프(그린피)', detail: '호치민 3색 명문 골프 투어 - 정규 18홀 라운딩 그린피 일체', quantity: '{personCount}인', amountUSD: 437.5, pricingType: 'person' },
      { category: '숙박(호텔)', detail: '호치민 고급 호텔/리조트 (전 일정 1인 1실 단독 투숙, 조식 뷔페 포함)', quantity: '{personCount}실 (1인실)', amountUSD: 340, pricingType: 'person' },
      { category: '투어/차량', detail: '전 일정 단독 VIP 7인승 전용 리무진 밴 (공항 픽업/샌딩 + 골프장 + 시내 전용 기사/유류비 포함)', quantity: '{vehicleCount}대 (전일정 {days}일)', amountUSD: 100, pricingType: 'vehicle', perDay: true },
      { category: '가이드', detail: '한국어 전문 가이드 전 일정 단독 동행 케어 (1일 $120 기준)', quantity: '{guideCount}명 (전일정 {days}일)', amountUSD: 120, pricingType: 'guide', perDay: true }
    ]
  },
  {
    id: 'p2',
    title: '붕따우 더 그랜드 호짬 카지노 & 골프',
    description: '베트남 최고의 카지노 복합 리조트와 명문 블러프 골프 코스 이용.',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800',
    price: 1140,
    location: '붕따우',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['공항 미팅 후 호짬 리조트 이동', '리조트 체크인 및 휴식', '리조트 석식 및 카지노 이용'] },
      { day: 2, activities: ['더 블러프 CC 18홀 라운딩', '리조트 내 수영장 및 스파 이용', '씨푸드 석식'] },
      { day: 3, activities: ['더 블러프 CC 18홀 라운딩', '붕따우 시내 관광 (예수상)', '석식 및 자유 시간'] },
      { day: 4, activities: ['오전 자유 시간 및 체크아웃', '호치민 이동 및 쇼핑', '공항 샌딩'] }
    ]
  },
  {
    id: 'p3',
    title: '무이네 사막 지프투어 & 골프 패키지',
    description: '사막의 낭만과 해변 골프의 즐거움을 동시에. 씨링크 CC 포함.',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800',
    price: 840,
    location: '무이네',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 픽업 및 무이네 이동', '리조트 체크인', '해변 석식 및 휴식'] },
      { day: 2, activities: ['화이트샌듄 일출 지프투어', '씨링크 CC 18홀 라운딩', '전신 마사지'] },
      { day: 3, activities: ['씨링크 CC 18홀 라운딩', '요정의 샘물 산책', '로컬 씨푸드 파티'] },
      { day: 4, activities: ['리조트 자유시간 및 체크아웃', '호치민 복귀 및 쇼핑', '공항 샌딩'] }
    ]
  },
  {
    id: 'p4',
    title: '달랏 꽃의 도시 힐링 골프',
    description: '해발 1,500m의 시원한 기후에서 즐기는 고원 골프 투어.',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
    price: 900,
    location: '달랏',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['달랏 공항 픽업 및 체크인', '달랏 시내 관광', '달랏 야시장 투어'] },
      { day: 2, activities: ['달랏 팔레스 CC 18홀 라운딩', '사랑의 계곡 투어', '현지식 석식'] },
      { day: 3, activities: ['사콤 투옌람 CC 18홀 라운딩', '죽림 선원 투어', '특식 석식'] },
      { day: 4, activities: ['다딴라 폭포 관람', '쇼핑 및 자유시간', '공항 샌딩'] }
    ]
  },
  {
    id: 'p5',
    title: '호치민 VIP 의전 비지니스 투어',
    description: '성공적인 비지니스를 위한 전문 통역과 리무진 의전 패키지.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800',
    price: 1300,
    location: '호치민',
    duration: '3박 5일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['VIP 리무진 공항 픽업', '호텔 체크인', '미팅 준비 및 휴식'] },
      { day: 2, activities: ['비지니스 미팅 지원', '오찬 및 휴식', '전문 스파 케어'] },
      { day: 3, activities: ['현지 업체 방문', '네트워킹 석식', '카지노 의전 및 여가'] },
      { day: 4, activities: ['자유 시간', '기념품 구매', '공항 샌딩'] }
    ]
  },
  {
    id: 'p6',
    title: '붕따우 프라이빗 풀빌라 힐링',
    description: '가족, 친구와 함께 즐기는 대형 독채 풀빌라와 씨푸드 만찬.',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=800',
    price: 700,
    location: '붕따우',
    duration: '3박 5일',
    type: 'hotel',
    itinerary: [
      { day: 1, activities: ['전용 차량 붕따우 이동', '풀빌라 체크인', '수영 및 휴식'] },
      { day: 2, activities: ['오전 자유 수영', '풀빌라 야외 바베큐 파티', '해변 산책'] },
      { day: 3, activities: ['붕따우 랜드마크 투어', '현지 맛집 탐방', '무제한 해산물 석식'] },
      { day: 4, activities: ['늦은 오전 체크아웃', '호치민 이동', '공항 샌딩'] }
    ]
  },
  {
    id: 'p7',
    title: '트윈도브스 명문 코스 정복',
    description: 'KLPGA 대회가 열리는 호치민 인근 최고의 멤버십 코스 라운딩.',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800',
    price: 1020,
    location: '호치민',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['공항 미팅', '시내 호텔 체크인', '자유 시간'] },
      { day: 2, activities: ['트윈도브스 CC 18홀 라운딩', '클럽하우스 중식', '마사지 및 석식'] },
      { day: 3, activities: ['트윈도브스 CC 18홀 라운딩', '시내 관광', '무제한 소고기 석식'] },
      { day: 4, activities: ['오전 휴식', '시내 쇼핑', '공항 샌딩'] }
    ]
  },
  {
    id: 'p8',
    title: '호치민 미식 & 쇼핑 테마 투어',
    description: '베트남 미쉐린 맛집과 로컬 숨은 카페를 찾아 떠나는 3박 5일.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800',
    price: 630,
    location: '호치민',
    duration: '3박 5일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['공항 픽업', '호텔 체크인', '부이비엔 여행자거리 관광'] },
      { day: 2, activities: ['미쉐린 선정 쌀국수 조식', '유명 카페 투어', '파인다이닝 석식'] },
      { day: 3, activities: ['벤탄 시장 및 사이공 스퀘어', '쇼핑몰 투어', '사이공 강 디너 크루즈'] },
      { day: 4, activities: ['쿠킹 클래스 체험', '최후의 만찬', '공항 샌딩'] }
    ]
  },
  {
    id: 'p9',
    title: '호치민 야간 골프 & FOR MEN',
    description: '낮에는 여유로운 휴식, 밤에는 화려한 야간 라운딩과 나이트 라이프.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800',
    price: 1190,
    location: '호치민',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['공항 픽업', '호텔 체크인', '밤문화 투어 오리엔테이션'] },
      { day: 2, activities: ['오전 자유 휴식', '떤선녓 야간 라운딩', '마사지'] },
      { day: 3, activities: ['오후 롱탄 CC 라운딩', '석식', '가라오케/칠바 투어'] },
      { day: 4, activities: ['해장 조식 및 마사지', '쇼핑', '공항 샌딩'] }
    ]
  },
  {
    id: 'p10',
    title: '메콩강 어드벤처 & 관광 패키지',
    description: '호치민 시내의 화려함과 메콩강의 소박한 자연을 동시에 만나는 일정.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800',
    price: 580,
    location: '호치민',
    duration: '3박 5일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['공항 미팅', '통일궁/중앙우체국 관광', '호텔 체크인'] },
      { day: 2, activities: ['미토 메콩강 투어(쪽배 체험)', '코끼리 귀 생선 중식', '석식 및 휴식'] },
      { day: 3, activities: ['구찌 터널 탐방', '호치민 스카이덱 야경 감상', '자유 시간'] },
      { day: 4, activities: ['벤탄 시장 기념품 쇼핑', '마사지', '공항 샌딩'] }
    ]
  },

  // =========================================================================
  // 3박 5일 추천 신규 패키지 (10개: 골프 7개 + 관광 3개 / 5대 지역)
  // =========================================================================
  {
    id: 'p-35-1',
    title: '호치민 태광정산·롱탄 명문 3색 골프 3박 5일',
    description: '전용 스피드보트로 입장하는 태광정산 CC와 롱탄·송베 CC를 아우르는 호치민 54홀 실속 골프.',
    image: '/images/products/hcm-golf-day.jpg',
    detailImages: ['/images/products/hcm-golf-day.jpg', '/images/products/hcm-golf-resort.jpg'],
    detailContent: '동나이 강 위의 프라이빗 아일랜드 코스 태광정산 CC와 아시아 100대 명문 롱탄 CC, 전통의 송베 CC를 3박 5일간 모두 경험할 수 있는 호치민 대표 54홀 라운딩 패키지입니다.\n\n• 포함 코스: 태광정산 CC(18H) + 롱탄 CC(18H) + 송베 CC(18H)\n• 숙박: 호치민 1군 고급 호텔 1인 1실 (조식 포함)\n• 이동: 전 일정 단독 VIP 7인승 리무진 밴 & 한국어 가이드 케어',
    price: 990,
    location: '호치민',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 떤선녓 공항 VIP 미팅 및 호텔 체크인', '사이공 강변 웰컴 석식', '전신 힐링 마사지 90분'] },
      { day: 2, activities: ['태광정산 CC 18홀 라운딩 (스피드보트 이동)', '클럽하우스 중식 및 호치민 시내 카페 투어', '베트남 정통 씨푸드 석식'] },
      { day: 3, activities: ['롱탄 CC 18홀 라운딩', '오후 휴식 및 사이공 스카이 루프탑 바', '특선 삼겹살 & 소고기 바베큐 석식'] },
      { day: 4, activities: ['송베 CC 18홀 라운딩', '벤탄 시장·타카시마야 기념품 쇼핑 및 석식', '호치민 공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-2',
    title: '호치민 도심 나이트 라운딩 & 떤선녓 3박 5일',
    description: '시내 20분 거리 떤선녓 CC 주·야간 라운딩과 트윈도브스 CC를 결합한 이동 최소화 일정.',
    image: '/images/products/hcm-golf-night.jpg',
    detailImages: ['/images/products/hcm-golf-night.jpg', '/images/products/hcm-golf-day.jpg'],
    detailContent: '장거리 이동 피로 없이 호치민 도심의 화려한 야경 아래서 시원한 야간 라운딩과 주간 명문 코스를 동시에 즐길 수 있는 효율적인 3박 5일 일정입니다.\n\n• 포함 코스: 떤선녓 CC 주간(18H) + 떤선녓 야간(18H) + 트윈도브스 CC(18H)\n• 특징: 짧은 이동 동선으로 휴식, 미식, 나이트라이프 시간 극대화',
    price: 1030,
    location: '호치민',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 픽업 후 1군 고급 호텔 체크인', '호치민 시내 야경 투어 및 웰컴 디너'] },
      { day: 2, activities: ['트윈도브스 CC 18홀 오전 라운딩', '전신 스파 케어 90분 및 휴식', '현지 유명 스테이크 & 와인 석식'] },
      { day: 3, activities: ['오전 자유 휴식 및 미쉐린 맛집 중식', '떤선녓 CC 18홀 야간(나이트) 라운딩', '호치민 칠바 루프탑 자유 시간'] },
      { day: 4, activities: ['떤선녓 CC 18홀 오전 라운딩', '호텔 체크아웃 및 시내 쇼핑·석식', '떤선녓 국제공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-3',
    title: '붕따우 더 블러프 오션 링크스 VIP 3박 5일',
    description: '그렉 노먼이 설계한 세계 100대 해안 링크스 코스 더 블러프 CC와 호짬 고급 리조트.',
    image: '/images/products/vungtau-golf-links.jpg',
    detailImages: ['/images/products/vungtau-golf-links.jpg', '/images/products/vungtau-golf-club.jpg'],
    detailContent: '남중국해의 시원한 바닷바람과 자연 모래 언덕을 그대로 살린 세계 100대 명문 코스 더 블러프 호짬 스트립 CC를 중심으로 구성된 프리미엄 오션 골프 투어입니다.\n\n• 포함 코스: 더 블러프 호짬 CC 36홀 + 파라다이스 CC 18홀\n• 숙박: 더 그랜드 호짬 리조트 오션뷰 1인 1실',
    price: 1180,
    location: '붕따우',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 미팅 후 붕따우 호짬 리조트 전용 차량 이동', '오션뷰 리조트 체크인 및 해산물 웰컴 석식'] },
      { day: 2, activities: ['더 블러프 호짬 CC 18홀 라운딩', '리조트 인피니티 풀 휴양 및 마사지 90분', '호짬 랍스터 씨푸드 만찬'] },
      { day: 3, activities: ['더 블러프 호짬 CC 2차 18홀 라운딩', '리조트 카지노 및 스카이 라운지 자유 이용'] },
      { day: 4, activities: ['붕따우 파라다이스 CC 18홀 라운딩', '호치민 시내 복귀 및 석식 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-4',
    title: '붕따우 파라다이스 해변 2색 골프 3박 5일',
    description: '해변 소나무 숲과 바다가 어우러진 파라다이스 CC와 쩌우득 CC 실속 54홀 라운딩.',
    image: '/images/products/vungtau-golf-club.jpg',
    detailImages: ['/images/products/vungtau-golf-club.jpg', '/images/products/vungtau-tour-beach.jpg'],
    detailContent: '합리적인 가격으로 붕따우의 아름다운 해안 골프와 여유로운 휴양을 동시에 즐길 수 있는 가성비 최강 54홀 골프 상품입니다.\n\n• 포함 코스: 파라다이스 CC 36홀 + 쩌우득 CC 18홀\n• 특전: 붕따우 해변 씨푸드 야시장 탐방 및 마사지 케어 포함',
    price: 890,
    location: '붕따우',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 도착 후 붕따우 해변 리조트 이동', '해변 산책 및 붕따우 로컬 씨푸드 석식'] },
      { day: 2, activities: ['붕따우 파라다이스 CC 18홀 라운딩', '붕따우 예수상 전망대 및 백비치 드라이브', '전신 아로마 마사지 90분'] },
      { day: 3, activities: ['쩌우득 CC 18홀 라운딩', '해변 카페 휴식 및 바베큐 석식'] },
      { day: 4, activities: ['파라다이스 CC 18홀 오전 라운딩', '호치민 이동 및 기념품 쇼핑 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-5',
    title: '무이네 씨링크스 오션뷰 힐링 골프 3박 5일',
    description: '붉은 모래 사구와 푸른 바다가 내려다보이는 무이네 씨링크스 CC 36홀 & 사막 투어.',
    image: '/images/products/muine-golf-ocean.jpg',
    detailImages: ['/images/products/muine-golf-ocean.jpg', '/images/products/muine-tour-dunes.jpg'],
    detailContent: '베트남에서 가장 도전적이고 아름다운 해안 링크스 중 하나인 무이네 씨링크스 골프 앤 컨트리클럽에서의 라운딩과 환상적인 사막 지프투어를 함께 즐기는 일정입니다.\n\n• 포함 코스: 무이네 씨링크스 CC 36홀 + 호치민 송베 CC 18홀\n• 체험: 화이트 샌듄 일출 지프투어 & 보케 거리 해산물 만찬',
    price: 870,
    location: '무이네',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 픽업 및 무이네 해변 리조트 이동', '리조트 체크인 후 보케 거리 랍스터 석식'] },
      { day: 2, activities: ['무이네 씨링크스 CC 18홀 오션뷰 라운딩', '요정의 샘물 산책 및 피싱 빌리지 일몰 감상'] },
      { day: 3, activities: ['이른 아침 화이트샌듄 일출 지프투어', '씨링크스 CC 2차 18홀 라운딩 및 스파 마사지'] },
      { day: 4, activities: ['호치민 이동 후 송베 CC 18홀 라운딩', '석식 후 떤선녓 국제공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-6',
    title: '나트랑 빈펄 아일랜드 오션 골프 3박 5일',
    description: '천혜의 섬 나트랑 혼쩨섬 빈펄 CC와 KN 골프링크스를 함께 즐기는 54홀 오션 골프.',
    image: '/images/products/nhatrang-golf-island.jpg',
    detailImages: ['/images/products/nhatrang-golf-island.jpg', '/images/products/nhatrang-golf-mountain.jpg'],
    detailContent: '나트랑 베이의 에메랄드빛 바다를 삼면으로 조망하는 혼쩨섬 빈펄 CC와 그렉 노먼 설계의 KN 깜란 골프링크스를 경험하는 나트랑 대표 3박 5일 골프 패키지입니다.\n\n• 포함 코스: 빈펄 나트랑 CC 18홀 + KN 골프링크스 18홀 + 다이아몬드베이 CC 18홀\n• 숙박: 나트랑 오션뷰 5성 리조트 1인 1실',
    price: 1050,
    location: '나트랑',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['나트랑 깜란 공항 픽업 및 비치 리조트 체크인', '나트랑 해변 웰컴 씨푸드 석식'] },
      { day: 2, activities: ['빈펄 나트랑 CC 18홀 라운딩 (스피드보트 이동)', '아이리조트 천연 온천 머드 스파 체험', '시내 루프탑 바 및 석식'] },
      { day: 3, activities: ['KN 골프링크스 깜란 18홀 라운딩', '전신 오일 마사지 90분 및 야시장 투어'] },
      { day: 4, activities: ['다이아몬드베이 CC 18홀 라운딩', '롯데마트 쇼핑 및 공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-7',
    title: '달랏 팔레스·투옌람 고원 명문 3박 5일',
    description: '해발 1,500m 연중 선선한 봄 날씨 속에서 즐기는 달랏 황제 코스 54홀 라운딩.',
    image: '/images/products/dalat-golf-pine.jpg',
    detailImages: ['/images/products/dalat-golf-pine.jpg', '/images/products/dalat-tour-garden.jpg'],
    detailContent: '한낮에도 22~25도의 쾌적한 기온을 유지하는 베트남의 작은 알프스 달랏에서 소나무 숲과 호수를 배경으로 땀 흘리지 않는 최상급 라운딩을 즐겨보세요.\n\n• 포함 코스: 달랏 팔레스 CC 18홀 + SAM 투옌람 CC 18홀 + 더 달랏 1200 CC 18홀',
    price: 920,
    location: '달랏',
    duration: '3박 5일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['달랏 리엔크엉 공항 미팅 후 고원 리조트 체크인', '쑤언흐엉 호수 산책 및 달랏 야시장 투어'] },
      { day: 2, activities: ['달랏 팔레스 헤리티지 CC 18홀 라운딩', '바오다이 황제 여름 별장 관광 및 와인 디너'] },
      { day: 3, activities: ['SAM 투옌람 CC 18홀 라운딩', '죽림 선원 케이블카 체험 및 허브 스파'] },
      { day: 4, activities: ['더 달랏 1200 CC 18홀 라운딩', '고원 특선 샤브샤브 석식 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-8',
    title: '호치민 사이공 야경 크루즈 & 시티 3박 5일',
    description: '동양의 파리 호치민의 역사와 미쉐린 맛집, 사이공 강 디너 크루즈를 담은 알찬 관광.',
    image: '/images/products/hcm-tour-city.jpg',
    detailImages: ['/images/products/hcm-tour-city.jpg', '/images/products/dalat-tour-garden.jpg'],
    detailContent: '노트르담 성당, 중앙 우체국, 통일궁 등 프랑스풍 건축물 투어부터 메콩강 이색 쪽배 체험과 럭셔리 사이공강 디너 크루즈까지 포함된 품격 있는 관광 패키지입니다.\n\n• 핵심 코스: 호치민 시티 투어 + 메콩강 미토 투어 + 사이공강 디너 크루즈 + 전신 마사지',
    price: 610,
    location: '호치민',
    duration: '3박 5일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['떤선녓 공항 픽업 및 시내 고급 호텔 체크인', '오페라하우스·응우옌 후에 거리 야경 산책'] },
      { day: 2, activities: ['통일궁·중앙우체국·전쟁박물관 역사 투어', '미쉐린 선정 로컬 맛집 중식', '사이공 강 럭셔리 디너 크루즈 승선'] },
      { day: 3, activities: ['미토 메콩강 크루즈 & 전통 쪽배 체험', '열대과일 농장 시식 및 코끼리 귀 생선 특식', 'VIP 아로마 전신 마사지 90분'] },
      { day: 4, activities: ['벤탄 시장 & 동커이 거리 카페·쇼핑 투어', '최후의 만찬 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-9',
    title: '무이네 사막 선라이즈 지프 & 와이너리 3박 5일',
    description: '화이트·레드 샌듄 일출 지프투어와 와인 캐슬, 해변 리조트 휴양이 어우러진 이색 투어.',
    image: '/images/products/muine-tour-dunes.jpg',
    detailImages: ['/images/products/muine-tour-dunes.jpg', '/images/products/vungtau-tour-beach.jpg'],
    detailContent: '사막과 바다가 맞닿은 신비로운 휴양지 무이네에서 전용 오픈 지프를 타고 사구를 달리며 인생 사진을 남기고, 해변 리조트에서 여유를 만끽하는 3박 5일 힐링 여행입니다.',
    price: 640,
    location: '무이네',
    duration: '3박 5일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['호치민 픽업 후 고속도로 전용 차량으로 무이네 이동', '비치 프론트 리조트 체크인 및 석식'] },
      { day: 2, activities: ['화이트샌듄 일출 지프투어 & ATV 체험', '요정의 샘물 맨발 트레킹 & 피싱 빌리지', '보케 거리 신선한 씨푸드 만찬'] },
      { day: 3, activities: ['레드샌듄 & 무이네 RD 와인 캐슬 시음 투어', '리조트 수영장 자유 휴양 및 해변 스파 마사지'] },
      { day: 4, activities: ['리조트 체크아웃 후 호치민 복귀', '호치민 시내 쇼핑 및 공항 샌딩'] }
    ]
  },
  {
    id: 'p-35-10',
    title: '나트랑 산호섬 요트 호핑 & 머드스파 3박 5일',
    description: '에메랄드 나트랑 베이 요트 호핑투어, 포나가르 사원, 천연 머드 온천을 즐기는 휴양 투어.',
    image: '/images/products/nhatrang-tour-bay.jpg',
    detailImages: ['/images/products/nhatrang-tour-bay.jpg', '/images/products/nhatrang-golf-island.jpg'],
    detailContent: '연중 맑고 따뜻한 나트랑의 바다에서 스노클링과 선셋 요트를 즐기고, 고대 참파 유적지와 아이리조트 머드 온천으로 몸과 마음을 치유하는 완벽한 3박 5일 관광 상품입니다.',
    price: 690,
    location: '나트랑',
    duration: '3박 5일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['나트랑 공항 픽업 및 해변 5성 호텔 체크인', '나트랑 해변 산책 및 웰컴 씨푸드 디너'] },
      { day: 2, activities: ['혼문섬·혼땀섬 산호초 스노클링 호핑 투어', '선상 해산물 바베큐 중식', '전신 힐링 스파 90분 및 야시장 구경'] },
      { day: 3, activities: ['포나가르 참 탑 & 롱선사 관광', '아이리조트 프라이빗 머드 온천 스파', '스카이라이트 루프탑 전망대 석식'] },
      { day: 4, activities: ['담시장 및 롯데마트 기념품 쇼핑', '나트랑 특선 분짜 중식 후 공항 샌딩'] }
    ]
  },

  // =========================================================================
  // 4박 6일 추천 신규 패키지 (10개: 골프 7개 + 관광 3개 / 5대 지역)
  // =========================================================================
  {
    id: 'p-46-1',
    title: '호치민 4대 명문(떤선녓·롱탄·트윈도브스·정산) 72홀 4박 6일',
    description: '호치민을 대표하는 최상급 4개 명문 골프장을 매일 한 곳씩 정복하는 골퍼의 로망 72홀.',
    image: '/images/products/hcm-golf-resort.jpg',
    detailImages: ['/images/products/hcm-golf-resort.jpg', '/images/products/hcm-golf-day.jpg'],
    detailContent: '4박 6일의 여유로운 일정 동안 호치민 최고의 코스 4곳을 중복 없이 모두 라운딩하는 명문 골프 투어입니다. 전 일정 1인 1실 고급 호텔과 전용 리무진으로 피로도를 최소화했습니다.',
    price: 1320,
    location: '호치민',
    duration: '4박 6일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 VIP 미팅 후 1군 고급 호텔 체크인', '환영 특식 및 자유 휴식'] },
      { day: 2, activities: ['떤선녓 CC 18홀 라운딩', '시내 유명 스파 마사지 90분 & 미식 석식'] },
      { day: 3, activities: ['롱탄 CC 18홀 라운딩', '호치민 랜드마크 81 전망대 & 강변 디너'] },
      { day: 4, activities: ['트윈도브스 CC 18홀 라운딩', '무제한 한우/삼겹살 바베큐 특식'] },
      { day: 5, activities: ['태광정산 CC 18홀 라운딩 (스피드보트 입장)', '체크아웃 후 쇼핑·마사지 및 공항 샌딩'] }
    ]
  },
  {
    id: 'p-46-2',
    title: '호치민 비즈니스 VIP 의전 & 3색 골프 4박 6일',
    description: '접대 및 비즈니스 라운딩에 최적화된 전용 통역·리무진 의전과 정산·베트남G.C·롱탄 54홀.',
    image: '/images/products/hcm-golf-day.jpg',
    detailImages: ['/images/products/hcm-golf-day.jpg', '/images/products/hcm-tour-city.jpg'],
    detailContent: '중요한 비즈니스 파트너나 지인들과의 품격 있는 일정을 위해 멤버십 회원제 구장 중심 라운딩과 미팅·만찬 의전을 완벽하게 지원하는 4박 6일 VIP 패키지입니다.',
    price: 1390,
    location: '호치민',
    duration: '4박 6일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['공항 VIP 패스트트랙(선택) 및 전용 리무진 픽업', '호치민 고급 럭셔리 호텔 체크인 & 웰컴 만찬'] },
      { day: 2, activities: ['롱탄 CC 18홀 비즈니스 라운딩', '오후 기업 미팅/시내 투어 지원 & 파인다이닝 석식'] },
      { day: 3, activities: ['태광정산 CC 18홀 라운딩', 'VIP 풋·전신 스파 120분 & 프라이빗 룸 디너'] },
      { day: 4, activities: ['베트남 G.C 18홀 라운딩', '루프탑 라운지 칵테일 및 네트워킹 석식'] },
      { day: 5, activities: ['오전 여유로운 호텔 조식·휴식', '기념품 쇼핑 및 공항 VIP 샌딩'] }
    ]
  },
  {
    id: 'p-46-3',
    title: '붕따우 호짬 그랜드 & 더 블러프 72홀 4박 6일',
    description: '오션뷰 5성 카지노 리조트 4박 숙박과 더 블러프·파라다이스 CC 총 72홀 오션 골프.',
    image: '/images/products/vungtau-golf-links.jpg',
    detailImages: ['/images/products/vungtau-golf-links.jpg', '/images/products/vungtau-golf-club.jpg'],
    detailContent: '더 그랜드 호짬 리조트에 머무르며 세계 100대 링크스 코스인 더 블러프 CC 2회와 바다 전망 파라다이스 CC 2회 총 72홀을 여유롭게 라운딩하는 오션 프리미엄 일정입니다.',
    price: 1460,
    location: '붕따우',
    duration: '4박 6일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 픽업 후 호짬 리조트 이동 (약 2시간)', '체크인 및 리조트 웰컴 디너'] },
      { day: 2, activities: ['더 블러프 호짬 CC 1차 18홀 라운딩', '리조트 수영장 휴양 & 스파 마사지'] },
      { day: 3, activities: ['붕따우 파라다이스 CC 1차 18홀 라운딩', '붕따우 케이블카·해변 씨푸드 특식'] },
      { day: 4, activities: ['더 블러프 호짬 CC 2차 18홀 라운딩', '카지노·라운지 나이트 휴식'] },
      { day: 5, activities: ['파라다이스 CC 2차 18홀 라운딩', '호치민 공항 이동 및 샌딩'] }
    ]
  },
  {
    id: 'p-46-4',
    title: '붕따우 독채 풀빌라 & 해변 골프 4박 6일',
    description: '우리 일행만 사용하는 대형 전용 수영장 풀빌라 숙박과 바베큐 풀파티, 54홀 라운딩.',
    image: '/images/products/vungtau-golf-club.jpg',
    detailImages: ['/images/products/vungtau-golf-club.jpg', '/images/products/vungtau-tour-beach.jpg'],
    detailContent: '소중한 동반자들과 프라이빗하게 즐기는 붕따우 해변 독채 풀빌라(1인 1실 침실 배정)와 전담 셰프 출장 바베큐 파티, 그리고 3회 54홀 라운딩이 결합된 인기 휴양 골프입니다.',
    price: 1280,
    location: '붕따우',
    duration: '4박 6일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['공항 픽업 후 붕따우 프라이빗 독채 풀빌라 입실', '풀사이드 웰컴 파티 및 해산물 그릴 석식'] },
      { day: 2, activities: ['더 블러프 CC 18홀 라운딩', '풀빌라 자유 수영 및 전담 셰프 통돼지 바베큐 파티'] },
      { day: 3, activities: ['파라다이스 CC 18홀 라운딩', '풀빌라 출장 VIP 전신 마사지 120분'] },
      { day: 4, activities: ['쩌우득 CC 18홀 라운딩', '붕따우 활어 다금바리·랍스터 회 만찬'] },
      { day: 5, activities: ['여유로운 풀빌라 조식 후 체크아웃', '호치민 시내 쇼핑 및 공항 샌딩'] }
    ]
  },
  {
    id: 'p-46-5',
    title: '무이네 씨링크스 리조트 스테이 & 54홀 4박 6일',
    description: '해변 리조트 풀빌라에서 숙박하며 씨링크스 CC 54홀과 사막 지프투어를 만끽하는 4박 6일.',
    image: '/images/products/muine-golf-ocean.jpg',
    detailImages: ['/images/products/muine-golf-ocean.jpg', '/images/products/muine-tour-dunes.jpg'],
    detailContent: '고속도로 개통으로 2시간 반 만에 닿는 무이네에서 바다를 낀 씨링크스 CC 3회 라운딩과 사막·와이너리·씨푸드 휴양을 여유롭게 즐기는 4박 6일 스테이 패키지입니다.',
    price: 1150,
    location: '무이네',
    duration: '4박 6일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 픽업 및 무이네 씨링크스 리조트 이동', '해변 석식 및 휴식'] },
      { day: 2, activities: ['씨링크스 CC 1차 18홀 라운딩', '오후 리조트 풀사이드 휴양 및 마사지'] },
      { day: 3, activities: ['화이트샌듄 일출 지프투어 & 요정의 샘물', '씨링크스 CC 2차 18홀 라운딩 & 와인 캐슬'] },
      { day: 4, activities: ['씨링크스 CC 3차 18홀 라운딩', '보케 거리 랍스터·씨푸드 굿바이 파티'] },
      { day: 5, activities: ['리조트 조식 후 체크아웃', '호치민 이동 및 시내 쇼핑 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-46-6',
    title: '나트랑 KN 골프링크스·다이아몬드베이 3색 4박 6일',
    description: '나트랑 최고의 명문 구장 KN 링크스·빈펄·다이아몬드베이를 여유롭게 도는 72홀.',
    image: '/images/products/nhatrang-golf-mountain.jpg',
    detailImages: ['/images/products/nhatrang-golf-mountain.jpg', '/images/products/nhatrang-golf-island.jpg'],
    detailContent: '깜란 반도의 바람과 웅장한 산맥, 에메랄드 바다가 조화된 나트랑 3대 골프장을 4박 6일 동안 총 72홀 라운딩하며 고급 비치 리조트에서 쉼을 얻는 최고의 휴양 골프입니다.',
    price: 1350,
    location: '나트랑',
    duration: '4박 6일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['나트랑 깜란 공항 픽업 및 고급 비치 리조트 체크인', '해변 웰컴 디너'] },
      { day: 2, activities: ['KN 골프링크스 깜란 18홀 라운딩', '아이리조트 머드 온천 & 전신 마사지'] },
      { day: 3, activities: ['빈펄 나트랑 CC 18홀 라운딩', '빈원더스 야경·분수쇼 관람 및 씨푸드 석식'] },
      { day: 4, activities: ['다이아몬드베이 CC 18홀 라운딩', '나트랑 베이 선셋 요트 & 루프탑 바'] },
      { day: 5, activities: ['KN 골프링크스 2차 18홀 라운딩', '체크아웃 후 시내 쇼핑 및 공항 샌딩'] }
    ]
  },
  {
    id: 'p-46-7',
    title: '달랏 3색(팔레스·투옌람·더달랏1200) 72홀 4박 6일',
    description: '베트남 고원 3대 명문 구장에서 매일 시원한 솔바람과 함께하는 72홀 힐링 골프.',
    image: '/images/products/dalat-golf-pine.jpg',
    detailImages: ['/images/products/dalat-golf-pine.jpg', '/images/products/dalat-tour-waterfall.jpg'],
    detailContent: '1922년 개장한 역사 깊은 달랏 팔레스 CC, 투옌람 호수를 품은 SAM 투옌람 CC, 아시안투어 코스 더 달랏 1200 CC를 모두 정복하는 4박 6일 72홀 프리미엄 고원 골프입니다.',
    price: 1240,
    location: '달랏',
    duration: '4박 6일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['달랏 공항 미팅 및 프렌치 헤리티지 리조트 체크인', '쑤언흐엉 호수 티타임 & 석식'] },
      { day: 2, activities: ['달랏 팔레스 CC 18홀 라운딩', '달랏 화원·기차역 산책 & 흑돼지 바베큐'] },
      { day: 3, activities: ['SAM 투옌람 CC 18홀 라운딩', '고원 허브 스파 90분 및 와인 디너'] },
      { day: 4, activities: ['더 달랏 1200 CC 18홀 라운딩', '랑비앙 전망대 야경 & 특식 만찬'] },
      { day: 5, activities: ['달랏 팔레스 CC 2차 18홀 라운딩', '달랏 야시장 쇼핑 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-46-8',
    title: '붕따우 오션 케이블카 & 풀빌라 씨푸드 4박 6일',
    description: '호마이 파크 오션 케이블카, 해안 드라이브, 프라이빗 풀빌라 바베큐로 채운 4박 6일 휴양.',
    image: '/images/products/vungtau-tour-beach.jpg',
    detailImages: ['/images/products/vungtau-tour-beach.jpg', '/images/products/vungtau-golf-links.jpg'],
    detailContent: '가족, 친목 모임에 가장 인기 높은 붕따우 해변 독채 풀빌라 휴양 상품입니다. 아름다운 해안선 관광과 싱싱한 활어 씨푸드 만찬, 매일 즐기는 스파 케어가 포함됩니다.',
    price: 790,
    location: '붕따우',
    duration: '4박 6일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['호치민 도착 후 붕따우 해변 풀빌라 이동', '수영장 휴식 및 웰컴 씨푸드 만찬'] },
      { day: 2, activities: ['붕따우 호마이 파크 케이블카·전망대 투어', '백비치 오션 카페 & 전신 스파 90분'] },
      { day: 3, activities: ['예수상·화이트 팰리스·등대 해안 드라이브', '풀빌라 전담 셰프 바베큐 & 풀사이드 파티'] },
      { day: 4, activities: ['미네랄 온천 비치 리조트 반일 힐링', '붕따우 수산시장 랍스터 특식'] },
      { day: 5, activities: ['호치민 시내 복귀 및 벤탄시장·백화점 쇼핑', '석식 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-46-9',
    title: '나트랑 빈원더스 & 럭셔리 아일랜드 요트 4박 6일',
    description: '에메랄드 바다 위 요트 호핑, 빈원더스 테마파크, 머드 온천을 4박 6일간 여유롭게.',
    image: '/images/products/nhatrang-tour-bay.jpg',
    detailImages: ['/images/products/nhatrang-tour-bay.jpg', '/images/products/nhatrang-golf-mountain.jpg'],
    detailContent: '바다와 휴양을 사랑하는 여행자를 위한 나트랑 4박 6일 완벽 코스입니다. 전용 요트 스노클링부터 아시아 최대 규모 해상 케이블카 빈원더스, 프라이빗 마사지까지 알차게 구성했습니다.',
    price: 850,
    location: '나트랑',
    duration: '4박 6일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['나트랑 공항 픽업 및 오션뷰 5성 리조트 체크인', '해변 산책 및 웰컴 디너'] },
      { day: 2, activities: ['프라이빗 요트 3개 섬 호핑 & 산호초 스노클링', '선셋 샴페인 & 씨푸드 디너'] },
      { day: 3, activities: ['빈원더스 나트랑 종일 프리패스 (워터파크·사파리·타타쇼)', '귀환 후 발·전신 마사지'] },
      { day: 4, activities: ['포나가르 사원·나트랑 대성당·담시장 시티 투어', '아이리조트 VIP 머드 온천 힐링'] },
      { day: 5, activities: ['오전 리조트 인피니티풀 자유 시간', '쇼핑 후 깜란 공항 샌딩'] }
    ]
  },
  {
    id: 'p-46-10',
    title: '달랏 프렌치 헤리티지·호수·화원 힐링 4박 6일',
    description: '시원한 고원 도시 달랏의 수국 정원, 다딴라 폭포, 클레이 터널을 여유롭게 여행하는 일정.',
    image: '/images/products/dalat-tour-garden.jpg',
    detailImages: ['/images/products/dalat-tour-garden.jpg', '/images/products/dalat-tour-waterfall.jpg'],
    detailContent: '사계절 꽃이 피고 안개가 감도는 낭만 도시 달랏에서 프랑스풍 빌라에 머무르며 수국 농장, 랑비앙 산, 다딴라 폭포, 고원 커피 농장을 체험하는 감성 힐링 투어입니다.',
    price: 760,
    location: '달랏',
    duration: '4박 6일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['달랏 공항 픽업 및 프렌치 헤리티지 리조트 체크인', '쑤언흐엉 호수 석양 산책 & 야시장'] },
      { day: 2, activities: ['랑비앙 마운틴 지프 정상 투어', '달랏 플라워 가든·수국 농장 사진 투어', '고원 특선 아티초크 전골 석식'] },
      { day: 3, activities: ['다딴라 폭포 알파인 코스터 체험', '죽림 선원 & 투옌람 호수 보트 유람'] },
      { day: 4, activities: ['달랏 옛 기차역 빈티지 열차 체험 & 린푸억 사원', '아라비카 커피 농장 티타임 & 허브 스파 90분'] },
      { day: 5, activities: ['클레이 터널 조각공원 관람', '기념품 구매 후 공항 샌딩'] }
    ]
  },

  // =========================================================================
  // 5박 7일 추천 신규 패키지 (10개: 골프 7개 + 관광 3개 / 5대 지역)
  // =========================================================================
  {
    id: 'p-57-1',
    title: '호치민 그랜드 슬램 5대 명문 90홀 5박 7일',
    description: '떤선녓·롱탄·트윈도브스·태광정산·송베 호치민 5대 명문 구장을 모두 돌며 90홀 완주.',
    image: '/images/products/hcm-golf-day.jpg',
    detailImages: ['/images/products/hcm-golf-day.jpg', '/images/products/hcm-golf-resort.jpg'],
    detailContent: '골프 마니아를 위한 호치민 결정판! 5박 7일간 호치민 최고 평점 5개 명문 구장을 하루에 하나씩 라운딩하며 총 90홀을 완주하는 최상위 골프 패키지입니다.\n\n• 5대 코스: 떤선녓 CC + 롱탄 CC + 트윈도브스 CC + 태광정산 CC + 송베 CC\n• 케어: 매일 저녁 마사지·미식 투어 선택 연계 가능',
    price: 1650,
    location: '호치민',
    duration: '5박 7일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 떤선녓 공항 픽업 및 고급 호텔 체크인', '환영 만찬 및 컨디션 조절'] },
      { day: 2, activities: ['떤선녓 CC 18홀 라운딩', '전신 아로마 마사지 90분 & 로컬 씨푸드 석식'] },
      { day: 3, activities: ['롱탄 CC 18홀 라운딩', '사이공 강 디너 크루즈 야경'] },
      { day: 4, activities: ['트윈도브스 CC 18홀 라운딩', '호치민 시내 루프탑 바 투어'] },
      { day: 5, activities: ['태광정산 CC 18홀 라운딩 (스피드보트)', '무제한 스테이크 & 와인 디너'] },
      { day: 6, activities: ['송베 CC 18홀 라운딩', '시내 쇼핑·마사지 후 떤선녓 공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-2',
    title: '호치민 럭셔리 리무진 무제한 힐링 골프 5박 7일',
    description: '오전엔 여유로운 호캉스·스파, 오후·야간엔 쾌적한 명문 라운딩을 즐기는 VIP 5박 7일.',
    image: '/images/products/hcm-golf-night.jpg',
    detailImages: ['/images/products/hcm-golf-night.jpg', '/images/products/hcm-golf-resort.jpg'],
    detailContent: '뙤약볕을 피하고 싶은 골퍼분들을 위해 오전엔 호텔 수영장과 브런치·VIP 마사지를 즐기고, 선선한 오후 및 야간 타임에 맞춰 72~90홀 라운딩을 배치한 럭셔리 슬로우 골프 일정입니다.',
    price: 1580,
    location: '호치민',
    duration: '5박 7일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['공항 픽업 및 1군 5성급 호텔 체크인', '럭셔리 파인다이닝 웰컴 디너'] },
      { day: 2, activities: ['오전 호텔 조식·수영 & 90분 스파', '떤선녓 CC 오후·야간 18홀 라운딩'] },
      { day: 3, activities: ['오전 미쉐린 쌀국수·카페 투어', '롱탄 CC 18홀 오후 라운딩'] },
      { day: 4, activities: ['베트남 G.C 18홀 라운딩', '사이공 나이트 칠바 & 가라오케 VIP 체험'] },
      { day: 5, activities: ['트윈도브스 CC 18홀 라운딩', '굿바이 갈라 디너 & 야경 감상'] },
      { day: 6, activities: ['오전 느긋한 레이트 체크아웃', '동커이 쇼핑·전신 스파 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-3',
    title: '붕따우 더 블러프·파라다이스 장박 황제 골프 5박 7일',
    description: '바다 전망 오션 스위트 리조트 5박 투숙과 더 블러프·파라다이스·쩌우득 90홀 황제 골프.',
    image: '/images/products/vungtau-golf-links.jpg',
    detailImages: ['/images/products/vungtau-golf-links.jpg', '/images/products/vungtau-golf-club.jpg'],
    detailContent: '5박 7일 동안 짐을 싸고 푸는 번거로움 없이 붕따우 호짬 고급 리조트 한 곳에 머물며 더 블러프 3회 + 파라다이스 1회 + 쩌우득 1회 총 90홀의 오션 링크스 라운딩을 만끽하는 황제 투어입니다.',
    price: 1790,
    location: '붕따우',
    duration: '5박 7일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 픽업 및 호짬 오션 리조트 이동', '체크인 및 리조트 웰컴 디너'] },
      { day: 2, activities: ['더 블러프 호짬 CC 1차 18홀 라운딩', '오션뷰 수영장 휴식 & 씨푸드 석식'] },
      { day: 3, activities: ['파라다이스 CC 18홀 라운딩', '붕따우 해안 드라이브 & 마사지 120분'] },
      { day: 4, activities: ['더 블러프 호짬 CC 2차 18홀 라운딩', '리조트 내 VIP 카지노·스카이바 이용'] },
      { day: 5, activities: ['쩌우득 CC 18홀 라운딩', '호짬 랍스터 & 스테이크 특식'] },
      { day: 6, activities: ['더 블러프 호짬 CC 3차 18홀 피날레 라운딩', '호치민 이동 및 공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-4',
    title: '붕따우 프라이빗 풀빌라 동호회·비즈니스 골프 5박 7일',
    description: '4~12인 단체에 맞춘 독채 풀빌라 연박, 출장 셰프 만찬, 총 72홀 여유로운 친목 골프.',
    image: '/images/products/vungtau-golf-club.jpg',
    detailImages: ['/images/products/vungtau-golf-club.jpg', '/images/products/vungtau-tour-beach.jpg'],
    detailContent: '골프 동호회나 가족·지인 소그룹이 눈치 보지 않고 전용 수영장, 노래방, 야외 바베큐장이 완비된 대형 독채 풀빌라에서 5박 7일을 함께 보내며 72홀 라운딩과 휴식을 누리는 일정입니다.',
    price: 1620,
    location: '붕따우',
    duration: '5박 7일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['공항 픽업 후 붕따우 대형 독채 풀빌라 체크인', '풀사이드 웰컴 샴페인 파티'] },
      { day: 2, activities: ['더 블러프 CC 18홀 라운딩', '풀빌라 출장 셰프 통돼지 바베큐 만찬'] },
      { day: 3, activities: ['파라다이스 CC 1차 18홀 라운딩', '붕따우 케이블카 관광 및 출장 마사지'] },
      { day: 4, activities: ['전일 자유 휴식 (수영장·해변 요트 또는 추가 라운딩 선택)', '활어 회·랍스터 파티'] },
      { day: 5, activities: ['파라다이스 CC 2차 18홀 & 친목 미니 대회', '시상식 갈라 디너'] },
      { day: 6, activities: ['쩌우득 CC 18홀 라운딩 후 호치민 이동', '공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-5',
    title: '무이네 낭만 사막 리조트 & 무제한 골프 5박 7일',
    description: '사막과 바다가 만나는 무이네 리조트에서 72홀 라운딩과 사막 일출·와이너리·스파 장박 휴양.',
    image: '/images/products/muine-golf-ocean.jpg',
    detailImages: ['/images/products/muine-golf-ocean.jpg', '/images/products/muine-tour-dunes.jpg'],
    detailContent: '조용하고 이국적인 무이네 리조트에서 5박 7일간 천천히 머물며 씨링크스 CC 4회(72홀) 라운딩과 사막 오프로드 지프투어, 매일의 해변 석양 식사를 즐기는 힐링 골프 여행입니다.',
    price: 1420,
    location: '무이네',
    duration: '5박 7일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['호치민 공항 픽업 및 무이네 씨링크스 리조트 이동', '해변 리조트 체크인'] },
      { day: 2, activities: ['씨링크스 CC 1차 18홀 라운딩', '전신 스파 90분 & 보케 씨푸드'] },
      { day: 3, activities: ['화이트샌듄 일출 지프투어 & 로터스 레이크', '씨링크스 CC 2차 18홀 라운딩'] },
      { day: 4, activities: ['씨링크스 CC 3차 18홀 라운딩', 'RD 와인 캐슬 시음 투어 & 레드샌듄 일몰'] },
      { day: 5, activities: ['씨링크스 CC 4차 18홀 라운딩', '리조트 프라이빗 해변 바베큐 만찬'] },
      { day: 6, activities: ['오전 여유로운 리조트 자유 휴양 후 호치민 이동', '쇼핑 및 공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-6',
    title: '나트랑 올인클루시브 오션 3색 90홀 5박 7일',
    description: '나트랑 빈펄·KN골프링크스·다이아몬드베이를 5일간 모두 라운딩하는 오션 90홀 마스터.',
    image: '/images/products/nhatrang-golf-island.jpg',
    detailImages: ['/images/products/nhatrang-golf-island.jpg', '/images/products/nhatrang-golf-mountain.jpg'],
    detailContent: '5박 7일의 긴 휴가를 나트랑의 찬란한 태양 아래에서 보내는 프리미엄 90홀 오션 골프! 3대 명문 구장 순회 라운딩과 요트 호핑·머드 스파까지 균형 있게 담았습니다.',
    price: 1720,
    location: '나트랑',
    duration: '5박 7일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['나트랑 깜란 공항 픽업 및 비치 리조트 체크인', '나트랑 해변 웰컴 디너'] },
      { day: 2, activities: ['KN 골프링크스 깜란 1차 18홀 라운딩', '전신 힐링 스파 90분'] },
      { day: 3, activities: ['빈펄 나트랑 CC 1차 18홀 라운딩', '섬 내 비치 클럽 휴양 & 석식'] },
      { day: 4, activities: ['다이아몬드베이 CC 18홀 라운딩', '아이리조트 VIP 머드 온천 체험'] },
      { day: 5, activities: ['KN 골프링크스 깜란 2차 18홀 라운딩', '선셋 요트 샴페인 투어 & 특식 만찬'] },
      { day: 6, activities: ['빈펄 CC 2차 18홀 피날레 라운딩', '시내 쇼핑 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-7',
    title: '달랏 알프스 장박 90홀 쾌적 라운딩 5박 7일',
    description: '무더위 없는 달랏 고원에서 팔레스·투옌람·더달랏1200 3개 명문 구장을 여유롭게 90홀.',
    image: '/images/products/dalat-golf-pine.jpg',
    detailImages: ['/images/products/dalat-golf-pine.jpg', '/images/products/dalat-tour-garden.jpg'],
    detailContent: '1년 내내 시원한 봄 날씨를 자랑하는 달랏에서 장박 라운딩의 진수를 느껴보세요. 고풍스러운 헤리티지 빌라에 머물며 5회 90홀 라운딩과 고원 관광을 여유롭게 즐깁니다.',
    price: 1540,
    location: '달랏',
    duration: '5박 7일',
    type: 'golf',
    itinerary: [
      { day: 1, activities: ['달랏 공항 픽업 및 프렌치 리조트 체크인', '쑤언흐엉 호수 산책 및 와인 웰컴 디너'] },
      { day: 2, activities: ['달랏 팔레스 CC 1차 18홀 라운딩', '다딴라 폭포 산책 및 허브 스파 90분'] },
      { day: 3, activities: ['SAM 투옌람 CC 1차 18홀 라운딩', '죽림 선원 & 호수 보트 유람'] },
      { day: 4, activities: ['더 달랏 1200 CC 1차 18홀 라운딩', '랑비앙 마운틴 석양 투어 & 흑돼지 바베큐'] },
      { day: 5, activities: ['SAM 투옌람 CC 2차 18홀 라운딩', '아라비카 로스터리 카페 & 달랏 야시장'] },
      { day: 6, activities: ['달랏 팔레스 CC 2차 18홀 피날레 라운딩', '기념품 쇼핑 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-8',
    title: '호치민·메콩강 시그니처 완전 정복 5박 7일',
    description: '호치민 랜드마크, 구찌 터널, 메콩강 프라이빗 투어, 미쉐린 미식, 스파를 모두 담은 프리미엄 관광.',
    image: '/images/products/hcm-tour-city.jpg',
    detailImages: ['/images/products/hcm-tour-city.jpg', '/images/products/muine-tour-dunes.jpg'],
    detailContent: '5박 7일 동안 호치민의 과거와 현재, 메콩 델타의 자연, 베트남 최고의 미쉐린 미식과 나이트 크루즈까지 여유롭고 품격 있게 모두 체험하는 완벽한 시그니처 관광 상품입니다.',
    price: 920,
    location: '호치민',
    duration: '5박 7일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['호치민 공항 VIP 픽업 및 1군 고급 호텔 체크인', '사이공 스카이 라운지 야경 & 환영 만찬'] },
      { day: 2, activities: ['통일궁·노트르담 성당·중앙우체국 시티 투어', '미쉐린 스타 레스토랑 중식', '사이공 강 럭셔리 디너 크루즈'] },
      { day: 3, activities: ['구찌 터널 역사 탐방', '베트남 전통 아오자이 체험 & 스냅 촬영', 'VIP 전신 힐링 스파 120분'] },
      { day: 4, activities: ['미토 메콩강 프라이빗 보트·코코넛 농장 체험', '부이비엔·동커이 야경 투어'] },
      { day: 5, activities: ['호치민 아트 뮤지엄 & 쿠킹 클래스 체험', '랜드마크 81 전망대 & 굿바이 갈라 디너'] },
      { day: 6, activities: ['벤탄 시장 & 타카시마야 기념품 쇼핑', '마사지 후 공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-9',
    title: '붕따우 오션 스파 & 프라이빗 휴양 5박 7일',
    description: '남중국해를 마주한 오션뷰 리조트에서 매일 즐기는 스파와 해산물 미식, 해변 슬로우 여행.',
    image: '/images/products/vungtau-tour-beach.jpg',
    detailImages: ['/images/products/vungtau-tour-beach.jpg', '/images/products/nhatrang-tour-bay.jpg'],
    detailContent: '바쁜 일상을 완전히 내려놓고 붕따우의 따스한 햇살과 바다 앞에서 온전한 쉼을 누리는 5박 7일 슬로우 힐링 패키지입니다. 온천, 마사지, 해안 명소, 랍스터 미식이 조화를 이룹니다.',
    price: 960,
    location: '붕따우',
    duration: '5박 7일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['호치민 픽업 후 붕따우 오션 리조트 이동', '해변 산책 & 웰컴 씨푸드 디너'] },
      { day: 2, activities: ['예수상 전망대 & 화이트 팰리스 문화 탐방', '오션뷰 스파 마사지 90분'] },
      { day: 3, activities: ['빈쩌우 천연 온천 머드 스파 반일 휴양', '해변 선셋 라운지 티타임'] },
      { day: 4, activities: ['호마이 파크 케이블카 & 전망대 투어', '활어 다금바리·랍스터 특식 만찬'] },
      { day: 5, activities: ['전일 리조트 프라이빗 비치 & 풀장 자유 휴식', '굿바이 바베큐 만찬'] },
      { day: 6, activities: ['체크아웃 후 호치민 이동', '기념품 쇼핑 및 공항 샌딩'] }
    ]
  },
  {
    id: 'p-57-10',
    title: '달랏 에코 폭포·다비치·랑비앙 고원 투어 5박 7일',
    description: '다딴라 폭포, 랑비앙 전망대, 린푸억 사원, 쑤언흐엉 호수를 5박 7일 동안 천천히 감상하는 에코 투어.',
    image: '/images/products/dalat-tour-waterfall.jpg',
    detailImages: ['/images/products/dalat-tour-waterfall.jpg', '/images/products/dalat-tour-garden.jpg'],
    detailContent: '안개 낀 아침 호수에서 시작해 청정 소나무 숲, 에메랄드빛 폭포, 다채로운 고원 화원까지 달랏이 가진 모든 자연과 낭만을 빠짐없이 경험하는 5박 7일 프리미엄 에코 힐링 투어입니다.',
    price: 890,
    location: '달랏',
    duration: '5박 7일',
    type: 'tour',
    itinerary: [
      { day: 1, activities: ['달랏 공항 픽업 및 고원 헤리티지 리조트 체크인', '쑤언흐엉 호수 야간 마차 투어 & 석식'] },
      { day: 2, activities: ['다딴라 폭포 알파인 코스터 & 퐁구르 폭포 탐방', '고원 특선 와인 디너'] },
      { day: 3, activities: ['랑비앙 마운틴 지프 정상 투어 & 소수민족 문화 체험', '아로마 허브 스파 90분'] },
      { day: 4, activities: ['달랏 플라워 가든·수국 정원 & 크레이지 하우스', '달랏 야시장 로컬 길거리 미식'] },
      { day: 5, activities: ['달랏 빈티지 기차역 탑승 & 린푸억 모자이크 사원', '투옌람 호수 카약·죽림 선원 명상 산책'] },
      { day: 6, activities: ['아라비카 커피 로스터리 쇼핑 후 리조트 체크아웃', '달랏 공항 샌딩'] }
    ]
  }
];

export const INITIAL_VIDEOS: VideoItem[] = [
  { 
    id: 'v1', 
    title: '베트남 호치민 골프 탄손넛CC 소개영상', 
    url: 'https://res.cloudinary.com/ducor31pp/video/upload/v1793346063/videos/xkuicmmjpql8zm55msrw.mp4',
    category: '골프',
    thumbnail: 'https://res.cloudinary.com/ducor31pp/video/upload/v1793346063/videos/xkuicmmjpql8zm55msrw.jpg'
  },
];

export const INITIAL_POSTS: CommunityPost[] = [
  { 
    id: 'post1', 
    title: '베트남 골프 여행, MANGO TOUR 덕분에 정말 편하게 다녀왔어요!', 
    content: '떤선녓 CC에서 야간 골프 쳤는데 분위기 너무 좋네요. 가이드님이 티타임 예약도 딱 맞춰주시고, 차량도 럭셔리해서 이동할 때 너무 편했습니다. 다음에도 꼭 이용할게요!', 
    author: '골프매니아79', 
    date: '2024-03-15',
    views: 852,
    comments: [],
    image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=800'
  },
  { 
    id: 'post2', 
    title: '붕따우 풀빌라 가족 여행 후기입니다.', 
    content: '대가족이 이동하는거라 걱정 많았는데, 16인승 차량이 너무 쾌적해서 다들 좋아했어요. 풀빌라에서 씨푸드 바베큐 파티 해먹은 건 정말 잊지 못할 추억입니다.', 
    author: '행복한가장', 
    date: '2024-03-20',
    views: 421,
    comments: [],
    image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?q=80&w=800'
  },
  { 
    id: 'post3', 
    title: '무이네 지프투어는 선택이 아니라 필수네요!', 
    content: '새벽에 화이트샌듄 일출 보는거 좀 힘들었지만 가보니까 정말 감동이었어요. 지프차 타고 모래 언덕 달리는 것도 스릴 만점! 사진 정말 많이 건졌습니다.', 
    author: '인생샷장인', 
    date: '2024-03-25',
    views: 633,
    comments: [],
    image: 'https://images.unsplash.com/photo-1623122046188-4b775494d49e?q=80&w=800'
  },
  { 
    id: 'post4', 
    title: '비지니스 접대 골프, 의전 서비스가 완벽했습니다.', 
    content: '중요한 손님 모시고 간 자리라 신경이 많이 쓰였는데, MANGO TOUR 매니저님이 전문적으로 대응해주셔서 아주 만족스러운 결과를 얻었습니다. 카지노 의전도 훌륭했습니다.', 
    author: 'VIP파트너', 
    date: '2024-04-01',
    views: 312,
    comments: [],
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800'
  },
  { 
    id: 'post5', 
    title: '호치민 밤문화 투어, 안전하고 즐거웠어요.', 
    content: '남자들끼리 간 여행이라 밤에 노는게 주 목적이었는데, 바가지 걱정 없이 유명한 곳들만 쏙쏙 골라주셔서 정말 재밌게 놀았습니다. 칠바 야경은 필수코스네요.', 
    author: '사이공나이트', 
    date: '2024-04-05',
    views: 1250,
    comments: [],
    image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?q=80&w=800'
  }
];

export const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1628753232870-6da09a967c9c?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557750255-c76072a7bb56?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1920&auto=format&fit=crop',
];

export const SUB_MENU_ITEMS = [
  { label: '추천 상품', icon: 'https://cdn-icons-png.flaticon.com/512/3504/3504445.png' },
  { label: '동영상', icon: 'https://cdn-icons-png.flaticon.com/512/3670/3670163.png' },
  { label: '커뮤니티', icon: 'https://cdn-icons-png.flaticon.com/512/2822/2822949.png' },
  { label: '골프', icon: 'https://cdn-icons-png.flaticon.com/512/1039/1039328.png' },
  { label: '호텔&빌라', icon: 'https://cdn-icons-png.flaticon.com/512/2903/2903388.png' },
  { label: '관광', icon: 'https://cdn-icons-png.flaticon.com/512/2929/2929949.png' },
  { label: '비지니스', icon: 'https://cdn-icons-png.flaticon.com/512/3281/3281307.png' },
  { label: '여행 만들기', icon: 'https://cdn-icons-png.flaticon.com/512/3504/3504445.png' },
  { label: '이벤트', icon: 'https://cdn-icons-png.flaticon.com/512/4213/4213645.png' },
  { label: '베트남 문화', icon: 'https://cdn-icons-png.flaticon.com/512/4323/4323945.png' },
  { label: '먹거리', icon: 'https://cdn-icons-png.flaticon.com/512/2819/2819194.png' },
  { label: 'FOR MEN', icon: 'https://cdn-icons-png.flaticon.com/512/3596/3596091.png' },
];

export const INITIAL_PAGE_CONTENTS: Record<string, PageContent> = {
  business: {
    id: 'business',
    title: '비지니스',
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
    heroTitle: 'VIP CASINO & BIZ',
    heroSubtitle: 'Luxury Business Protocol Service',
    introTitle: '베트남 비지니스의 정점, 하이엔드 의전 서비스',
    introText: 'MANGO TOUR는 단순한 여행을 넘어 고객님의 비지니스 성공을 위한 최상의 파트너입니다. 호치민, 붕따우의 주요 카지노 VIP 의전부터 현지 기업 미팅 지원, 전용 리무진 서비스까지 완벽한 비지니스 환경을 제공합니다.',
    introImage: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
      'https://images.unsplash.com/photo-1544979188-f24594c7b203?w=800&q=80',
      'https://images.unsplash.com/photo-1511384611221-da3028cb7044?w=800&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
      'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&q=80'
    ],
    sections: [
      { title: '카지노 VIP 의전', content: '호치민 그랜드 호짬 등 주요 카지노에서 VIP 테이블 및 롤링 시스템 안내, 정산 대행 등 모든 과정을 투명하고 전문적으로 지원합니다.' },
      { title: '기업 미팅 & 통역 지원', content: '베트남 현지 기업 방문 시 전문 비지니스 통역사 배정 및 미팅 장소 예약 등 실무적인 도움을 드립니다.' },
      { title: '프라이빗 리무진 서비스', content: '전 일정 최신형 리무진 차량과 전문 드라이버를 배치하여 품격 있는 이동을 책임집니다.' }
    ]
  },
  golf: {
    id: 'golf',
    title: '골프',
    heroImage: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop',
    heroTitle: 'PREMIUM GOLF',
    heroSubtitle: 'Best Courses in Southern Vietnam',
    introTitle: '사계절 푸른 필드, 베트남 남부 명문 골프장',
    introText: '아시아 100대 코스로 선정된 명문 구장부터 도심 속 야간 라운딩까지. 떤선녓, 롱탄, 정산, 트윈도브스 등 최상의 컨디션을 유지하는 골프장 예약을 MANGO TOUR가 책임집니다.',
    introImage: 'https://images.unsplash.com/photo-1623567340632-49dfc9723223?w=800&q=80',
    galleryImages: [
       'https://images.unsplash.com/photo-1592919505780-30395071b483?w=800&q=80',
       'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800&q=80',
       'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
       'https://images.unsplash.com/photo-1628753232870-6da09a967c9c?w=800&q=80',
       'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=800&q=80',
       'https://images.unsplash.com/photo-1592919505780-30395071b483?w=800&q=80'
    ],
    sections: [
      { title: '떤선녓 골프 클럽', content: '호치민 공항 인근에 위치하여 뛰어난 접근성을 자랑하며, 야간 라운딩 시설이 완벽하게 갖추어져 있습니다.' },
      { title: '롱탄 골프 리조트', content: '베트남에서 가장 아름다운 코스로 손꼽히며, 정통 멤버십 골프장 특유의 철저한 관리가 특징입니다.' },
      { title: '트윈도브스 골프 클럽', content: '호치민 인근 빈증에 위치한 명문 구장으로, 세련된 조경과 도전적인 코스 디자인이 돋보입니다.' }
    ]
  },
  hotel: {
    id: 'hotel',
    title: '호텔&빌라',
    heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop',
    heroTitle: 'STAY IN LUXURY',
    heroSubtitle: 'Premium Hotels & Private Pool Villas',
    introTitle: '당신만을 위한 프라이빗한 휴식처',
    introText: '호치민 1군의 고급 호텔부터 붕따우, 무이네의 럭셔리 독채 풀빌라까지. MANGO TOUR는 엄선된 숙소만을 고집합니다. 가족, 친구, 비지니스 파트너와 함께 완벽한 프라이버시를 누리세요.',
    introImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
    ],
    sections: [
      { title: '특급 호텔 셀렉션', content: '파크 하얏트, 쉐라톤 등 호치민 시내 중심가에 위치한 고급 호텔들을 특별한 조건으로 예약해 드립니다.' },
      { title: '럭셔리 독채 풀빌라', content: '붕따우와 무이네 해변에 위치한 대규모 풀빌라는 단체 여행이나 가족 여행에 최적화된 프라이빗한 환경을 제공합니다.' },
      { title: '숙소 케어 서비스', content: '체크인/체크아웃 지원은 물론, 숙소 내에서의 식사 주문이나 각종 편의 사항을 실시간으로 케어해 드립니다.' }
    ]
  },
  food: {
    id: 'food',
    title: '먹거리',
    heroImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2070&auto=format&fit=crop',
    heroTitle: 'TASTE OF VIETNAM',
    heroSubtitle: 'Authentic Cuisines & Hidden Gems',
    introTitle: '호치민 미식 여행의 시작',
    introText: '전통 쌀국수부터 미쉐린 선정 레스토랑, 사이공 강의 낭만적인 디너 크루즈까지. 현지인이 사랑하는 숨은 맛집과 품격 있는 정찬을 모두 경험해 보세요.',
    introImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
      'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?w=800&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      'https://images.unsplash.com/photo-1515544078713-333d8c835061?w=800&q=80'
    ],
    sections: [
      { title: '베트남 정통 퀴진', content: '깊은 국물 맛의 현지 쌀국수(Pho)와 고소한 반미, 숯불향 가득한 분짜 등 정통 베트남 요리의 정수를 안내합니다.' },
      { title: '프리미엄 해산물 요리', content: '붕따우 산지에서 직송된 신선한 랍스터, 게, 조개 요리 등 화려한 해산물 만찬을 정찰제로 즐기실 수 있습니다.' },
      { title: '미쉐린 스타 가이드', content: '호치민 미쉐린 가이드에 선정된 최고급 레스토랑 예약을 대행하며, 특별한 미식 코스를 제안합니다.' }
    ]
  },
  culture: {
    id: 'culture',
    title: '베트남 문화',
    heroImage: 'https://images.unsplash.com/photo-1557750255-c76072a7bb56?q=80&w=2070&auto=format&fit=crop',
    heroTitle: 'CULTURE & WELLNESS',
    heroSubtitle: 'Tradition, Spa and Art',
    introTitle: '지친 일상의 회복, 베트남 웰니스 문화',
    introText: '전통 건축 양식의 사찰 투어부터 최고급 천연 오일을 사용하는 스파 마사지, 화려한 아오자이 체험까지. 베트남의 깊은 문화적 향기와 힐링을 선사합니다.',
    introImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80',
      'https://images.unsplash.com/photo-1553174241-0b28d763cafa?w=800&q=80',
      'https://images.unsplash.com/photo-1506466010722-395aa2bef877?w=800&q=80',
      'https://images.unsplash.com/photo-1518349619113-03114f06ac3a?w=800&q=80',
      'https://images.unsplash.com/photo-1557750255-c76072a7bb56?w=800&q=80'
    ],
    sections: [
      { title: '명품 스파 & 마사지', content: '전문 자격증을 보유한 테라피스트들이 상주하는 최고급 스파만을 선별하여 전신 피로 회복을 돕습니다.' },
      { title: '아오자이 전통 체험', content: '베트남 전통 의상인 아오자이를 맞춤 제작하거나 대여하여 역사적인 배경에서 인생 사진을 남기실 수 있습니다.' },
      { title: '역사 사찰 및 랜드마크', content: '통일궁, 노트르담 성당 등 호치민의 역사가 깃든 장소들을 전문 가이드의 설명과 함께 탐방합니다.' }
    ]
  },
  men: {
    id: 'men',
    title: 'FOR MEN',
    heroImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop',
    heroTitle: 'GENTLEMANS CLUB',
    heroSubtitle: 'Nightlife, Chill Bars and Karaoke',
    introTitle: '남성들을 위한 품격 있는 밤의 문화',
    introText: '세련된 루프탑 바에서의 칵테일 한 잔, 프라이빗한 고급 가라오케, 활기찬 칠바까지. 호치민의 밤을 가장 안전하고 즐겁게 즐길 수 있는 방법을 제안합니다.',
    introImage: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1572116469696-958721b7d6ca?w=800&q=80',
      'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80',
      'https://images.unsplash.com/photo-1536935338788-843bb6319105?w=800&q=80',
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80',
      'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80'
    ],
    sections: [
      { title: '루프탑 칠바(Chill Bar)', content: '호치민 시내의 화려한 스카이라인을 조망하며 세련된 음악과 함께 즐길 수 있는 루프탑 바 서비스를 제공합니다.' },
      { title: '프리미엄 가라오케', content: '검증된 시설과 투명한 가격 정책을 가진 현지 최고급 가라오케 예약을 대행하며 안전한 귀가까지 케어합니다.' },
      { title: 'VIP 밤문화 투어', content: '현지 문화를 잘 아는 매니저가 동행하여 낭비 없는 효율적이고 즐거운 밤의 일정을 가이드해 드립니다.' }
    ]
  },
  tour: {
    id: 'tour',
    title: '관광',
    heroImage: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?q=80&w=2070&auto=format&fit=crop',
    heroTitle: 'ESSENTIAL VIETNAM',
    heroSubtitle: 'Explore Southern Landscapes',
    introTitle: '도시에서 사막까지, 다채로운 베트남 남부',
    introText: '프랑스풍 건축물의 호치민, 드넓은 사구의 무이네, 아름다운 항구도시 붕따우, 꽃의 도시 달랏. 베트남 남부의 정수를 MANGO TOUR와 함께 발견해 보세요.',
    introImage: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1623122046188-4b775494d49e?w=800&q=80',
      'https://images.unsplash.com/photo-1605639636683-9b434cb28204?w=800&q=80',
      'https://images.unsplash.com/photo-1625407985904-44b46244df44?w=800&q=80',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
      'https://images.unsplash.com/photo-1518349619113-03114f06ac3a?w=800&q=80'
    ],
    sections: [
      { title: '호치민 시티 투어', content: '전쟁박물관, 통일궁 등 역사의 흔적을 따라가며 현대 베트남의 역동성을 함께 느낄 수 있는 대표 코스입니다.' },
      { title: '무이네 사막 지프 투어', content: '광활한 모래 언덕에서 일출과 일몰을 감상하며 지프를 타고 달리는 이색적인 모험을 즐기실 수 있습니다.' },
      { title: '붕따우 해변 휴양', content: '호치민에서 가장 가까운 바다, 붕따우 예수상 전망대와 아름다운 해안도로 드라이브를 제공합니다.' }
    ]
  },
  event: {
    id: 'event',
    title: '이벤트',
    heroImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2070&auto=format&fit=crop',
    heroTitle: 'MANGO TOUR SPECIAL',
    heroSubtitle: 'Limited Offers & Tournaments',
    introTitle: 'MANGO TOUR 회원만을 위한 특별한 혜택',
    introText: '매월 개최되는 아마추어 골프 대회, 계절별 특가 프로모션, 신규 호텔 오픈 기념 패키지 등 MANGO TOUR에서만 만날 수 있는 특별한 이벤트를 확인하세요.',
    introImage: 'https://images.unsplash.com/photo-1595842858599-4c274b3d3278?w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1623567340632-49dfc9723223?w=800&q=80',
      'https://images.unsplash.com/photo-1628753232870-6da09a967c9c?w=800&q=80',
      'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=800&q=80',
      'https://images.unsplash.com/photo-1531050171669-7df9b2089a61?w=800&q=80',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'
    ],
    sections: [
      { 
        title: '월간 골프 챌린지', 
        content: '매달 다른 명문 골프장에서 개최되는 아마추어 골프 대회로 푸짐한 경품과 네트워킹 시간을 제공합니다.',
        detailContent: '매월 셋째 주 토요일, 베트남 남부 최고의 명문 골프장에서 아마추어 골프 대회가 열립니다.\n\n[참가 안내]\n- 대상: MANGO TOUR 회원 누구나\n- 장소: 매월 공지 (떤선녓, 롱탄, 트윈도브스 등)\n- 혜택: 우승자 트로피 및 골프 용품, 참가자 전원 기념품 증정\n\n많은 참여 부탁드립니다.',
        detailImages: [
          'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
          'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
          'https://images.unsplash.com/photo-1592919505780-30395071b483?w=800'
        ]
      },
      { 
        title: '얼리버드 프로모션', 
        content: '3개월 전 예약 시 고급 호텔 업그레이드 또는 카트비 무료 등 특별한 가격 혜택을 드립니다.',
        detailContent: '미리 준비하는 여행자를 위한 특별한 혜택!\n\n3개월 전 사전 예약 시 다음과 같은 혜택 중 하나를 선택하실 수 있습니다.\n\n1. 일반 호텔 -> 고급 호텔 무료 업그레이드\n2. 전 일정 그린피 10% 추가 할인\n3. 공항 VIP 의전 서비스 무료 제공\n\n지금 바로 상담 신청하세요.',
        detailImages: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
        ]
      },
      { 
        title: '신규 지역 오픈 이벤트', 
        content: '달랏, 다낭 등 신규 서비스 지역 오픈 시 MANGO TOUR 회원 전용 특별 할인가를 적용해 드립니다.',
        detailContent: 'MANGO TOUR가 달랏과 다낭으로 서비스를 확장했습니다!\n\n오픈 기념으로 해당 지역 상품 예약 시 20% 할인 혜택을 드립니다.\n\n- 기간: 오픈일로부터 1개월간\n- 대상: 선착순 50팀\n- 혜택: 상품가 20% 할인 + 현지 맛집 바우처 증정',
        detailImages: [
          'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
          'https://images.unsplash.com/photo-1528127269322-539801943592?w=800'
        ]
      }
    ]
  }
};

export const INITIAL_POPUP: PopupNotification = {
  id: 'p1',
  title: 'MANGO TOUR 공지사항',
  content: '베트남 남부 명문 골프 투어 및 VIP 의전 서비스 전문 MANGO TOUR에 오신 것을 환영합니다.',
  isActive: false,
  image: 'https://images.unsplash.com/photo-1628753232870-6da09a967c9c?q=80&w=800',
  imageFit: 'contain',
  imageHeight: '16:9'
};

export const INITIAL_CUSTOM_PACKAGES: CustomTripPackage[] = [
  {
    id: 'pkg-1',
    title: '호치민 3색 명문 54홀 & 미식 럭셔리 투어',
    subtitle: '떤선녓 CC + 롱탄 CC + 트윈도브스 CC 3회 라운딩 & 고급 호텔',
    location: '호치민',
    duration: '4박 5일',
    golfCourses: ['떤선녓 CC (18홀)', '롱탄 CC (18홀)', '트윈도브스 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
    ],
    basePriceUSD: 1135,
    summary: '호치민 최고 인기 3대 명문 코스에서 매일 여유로운 라운딩을 즐기고, 1군 고급 호텔과 호치민 명품 미식을 결합한 정통 프리미엄 골프 투어입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '3회 54홀 라운딩', '호치민 고급 호텔', '전용 리무진 밴'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 체크인', activities: ['호치민 떤선녓 국제공항 VIP 단독 픽업 미팅', '호치민 1군 고급 호텔 체크인 및 휴식', '웰컴 디너: 베트남 고급 정통 코스 요리', '호치민 랜드마크 81 야경 감상 및 자유 시간'] },
      { day: 2, title: '떤선녓 CC 18홀 & 시내 관광', activities: ['호텔 조식 뷔페 후 골프장 이동 (약 20분 소요)', '떤선녓 CC 18홀 라운딩', '클럽하우스 또는 시내 유명 한식당 중식', '노트르담 대성당, 중앙우체국, 통일궁 시티투어', '석식: 1군 사이공 강변 루프탑 스테이크 & 와인', '피로를 풀어주는 VIP 전신 힐링 마사지 (90분)'] },
      { day: 3, title: '롱탄 CC 18홀 & 해산물 특식', activities: ['호텔 조식 후 롱탄 CC로 이동 (약 45분)', '베트남 최고 뷰를 자랑하는 롱탄 CC 18홀 라운딩', '클럽하우스 여유로운 중식', '사이공 스카이덱 전망대 관람 및 쇼핑', '석식: 칠리크랩 & 대하구이 프리미엄 씨푸드 만찬', '자유 일정 또는 추천 라이브 바 투어'] },
      { day: 4, title: '트윈도브스 CC 18홀 & 나이트 라이프', activities: ['호텔 조식 후 빈증 트윈도브스 CC 이동 (약 50분)', 'KLPGA 개최 명문 트윈도브스 CC 18홀 라운딩', '골프 라운딩 후 개운한 샤워 및 중식', '호치민 벤탄 시장 및 고급 마켓 쇼핑 투어', '굿바이 디너: 최고급 숯불 와규 & 특식 바베큐', '사이공 강 디너 크루즈 및 야경 투어'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 여유로운 오전 휴식 후 체크아웃', '호치민 인기 카페거리 카페 쓰어다 티타임', '마지막 쇼핑 및 마사지 (옵션)', '공항 이동 및 떤선녓 국제공항 샌딩 (귀국)'] }
    ],
    options: [
      { id: 'opt-1-1', category: 'golf', name: '3대 명문 코스 그린피 (54홀)', description: '떤선녓 18H + 롱탄 18H + 트윈도브스 18H 그린피 일체', priceUSD: 450, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-1-3', category: 'hotel', name: '호치민 1군 고급 호텔 (4박/1인 객실 기준)', description: '호텔 조식 뷔페 포함 (1인 1실 단독 객실 사용, 카라벨 / 르메르디앙 급)', priceUSD: 360, isDefaultIncluded: true },
      { id: 'opt-1-4', category: 'vehicle', name: '전 일정 단독 VIP 전용 리무진 밴 (5일간 / 1일 $100 기준)', description: '공항 픽업/샌딩 + 골프장 + 시내 투어 기사/유류비 포함 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-1-5', category: 'guide', name: '한국어 전문 가이드 전 일정 동행 (5일간 / 1일 기준 $120)', description: '골프 체크인/아웃 지원 및 시내 일정 올케어 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: true },
      { id: 'opt-1-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 입국 시 VIP 전용 패스트트랙 라인으로 대기 없이 초고속 입국 심사 및 수하물 수취 케어', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-1-7', category: 'activity', name: 'VIP 전신 힐링 마사지 (90분)', description: '골프 라운딩 후 피로를 풀어주는 프리미엄 마사지 & 스파 케어 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-1-6', category: 'meal', name: '프리미엄 웰컴 & 굿바이 특식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 고급 정통 베트남식, 씨푸드 만찬, 루프탑 디너, 숯불 바베큐', priceUSD: 200, isDefaultIncluded: false },
      { id: 'opt-1-8', category: 'hotel', name: '호텔 프리미엄 스위트룸 (Suite) 업그레이드', description: '기본 1인실에서 최상급 럭셔리 이그제큐티브 스위트 객실로 룸 업그레이드', priceUSD: 180, isDefaultIncluded: false },
      { id: 'opt-1-9', category: 'golf', name: '4일차 9홀 추가 라운딩 (총 27홀)', description: '트윈도브스 CC 9홀 추가 그린피', priceUSD: 90, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-2',
    title: '호치민 VIP 마스터스 4색 72홀 익스트림 골프',
    subtitle: '매일 18홀 라운딩 (떤선녓 + 롱탄 + 정산 + 송베 CC) & 풀빌라/스위트',
    location: '호치민',
    duration: '4박 5일',
    golfCourses: ['떤선녓 CC (18홀)', '롱탄 CC (18홀)', '태광 정산 CC (18홀)', '송베 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800'
    ],
    basePriceUSD: 1175,
    summary: '오직 골프만을 위한 궁극의 마스터스 투어! 4박 5일간 매일 다른 4개 명문 골프장에서 총 72홀을 정복하는 VIP 골퍼 맞춤 상품입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '4회 72홀 완주', 'VIP 전용 보트/스피드보트', '매일 마사지 케어'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 떤선녓 CC 야간 18홀', activities: ['오전 떤선녓 국제공항 도착 후 전용 의전 픽업', '호치민 떤선녓 CC 이동 후 첫 18홀 라운딩', '호텔 체크인 및 휴식', '석식: 한국인 입맛에 맞춘 프리미엄 숯불 갈비 특식'] },
      { day: 2, title: '보트 타고 떠나는 태광 정산 CC 18홀', activities: ['호텔 조식 후 전용 선착장 이동', '스피드보트 타고 동나이강을 건너 정산 CC 도착 (이색 체험)', '정산 CC 18홀 라운딩 (한국식 잔디 & 최상급 관리)', '클럽하우스 중식 및 스피드보트로 호치민 복귀', '전신 스포츠 마사지 90분 & 저녁 특식'] },
      { day: 3, title: '롱탄 CC 18홀 챔피언십 코스', activities: ['호텔 조식 후 롱탄 CC 출발', '롱탄 CC 레이크 & 힐 18홀 라운딩', '라운딩 후 호치민 시내 복귀', '석식: 최고급 생선회 & 랍스터 씨푸드 파티', '호치민 2군 타오디엔 펍 투어'] },
      { day: 4, title: '송베 CC 18홀 & 환송 만찬', activities: ['호텔 조식 후 송베 CC 이동', '송베 CC 로터스/사막 코스 18홀 라운딩', '클럽하우스 중식 후 시내 복귀 및 쇼핑', '굿바이 갈라 디너 & 와인 파티'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 레이트 체크아웃', '호치민 시내 기념품 쇼핑 및 공항 샌딩'] }
    ],
    options: [
      { id: 'opt-2-1', category: 'golf', name: '4개 골프장 그린피 (총 72홀)', description: '떤선녓 + 정산 + 롱탄 + 송베 매일 18홀 그린피', priceUSD: 590, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-2-3', category: 'vehicle', name: '정산 CC 왕복 전용 스피드보트', description: '동나이강 럭셔리 스피드보트 왕복 승선권', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-2-4', category: 'hotel', name: '호치민 고급 호텔 숙박 (4박/1인 객실 기준)', description: '전 일정 1인 1실 단독 객실 & 조식 뷔페 및 수영장/사우나 이용', priceUSD: 360, isDefaultIncluded: true },
      { id: 'opt-2-5', category: 'vehicle', name: '전 일정 단독 VIP 전용 리무진 밴 (5일간 / 1일 $100 기준)', description: '기사 포함 단독 전용 차량 및 유류비/통행료 일체 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-2-8', category: 'guide', name: '한국인 골프 전문 투어 매니저 동행 (5일간 / 1일 기준 $120)', description: '전 일정 티타임 조율 및 VIP 의전 전담 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: false },
      { id: 'opt-2-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 입국 시 VIP 전용 패스트트랙 라인으로 대기 없이 초고속 입국 심사 케어', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-2-6', category: 'activity', name: 'VIP 전신 힐링 마사지 (90분)', description: '라운딩 피로회복 전문 오일 & 핫스톤 마사지 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-2-meal', category: 'meal', name: '프리미엄 웰컴 & 굿바이 특식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 최고급 생선회, 랍스터 씨푸드, 바베큐', priceUSD: 200, isDefaultIncluded: false },
      { id: 'opt-2-7', category: 'hotel', name: '단독 럭셔리 프라이빗 풀빌라 업그레이드 (1인 1실 배정)', description: '호텔 대신 4베드룸 단독 풀빌라 전체 대여 (각자 단독 객실 1인 1실 사용)', priceUSD: 220, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-3',
    title: '붕따우 더 그랜드 호짬 카지노 & 세계 100대 블러프 골프',
    subtitle: '더 블러프 CC 36홀 + 붕따우 파라다이스 CC 18홀 & 고급 카지노 리조트',
    location: '붕따우',
    duration: '4박 5일',
    golfCourses: ['더 블러프 호짬 스트립 CC (36홀)', '붕따우 파라다이스 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
    ],
    basePriceUSD: 1115,
    summary: '그렉 노먼이 설계한 세계 100대 링크스 코스 "더 블러프 CC"에서 바다를 조망하며 즐기는 럭셔리 골프와 고급 카지노 복합 리조트의 환상적인 휴양 패키지입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '세계 100대 코스', '고급 카지노 리조트', '오션뷰 풀사이드 BBQ'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 호짬 리조트 이동', activities: ['호치민 공항 전용 픽업 미팅 후 붕따우 호짬으로 이동 (약 2시간)', '고급 더 그랜드 호짬 카지노 리조트 체크인', '인피니티 풀 수영 및 전용 비치 산책', '석식: 리조트 내 프리미엄 인터내셔널 뷔페 & 카지노 나이트'] },
      { day: 2, title: '더 블러프 CC 1차 18홀 라운딩', activities: ['리조트 조식 후 골프장 이동 (리조트 바로 옆 3분 거리)', '세계 100대 명문 더 블러프 CC 18홀 라운딩 (오션뷰 링크스 코스)', '인피니티 레스토랑 중식', '리조트 스파 & 사우나 휴식', '석식: 호짬 로컬 활어 씨푸드 바베큐 만찬'] },
      { day: 3, title: '더 블러프 CC 2차 18홀 라운딩', activities: ['리조트 조식 뷔페', '더 블러프 CC 2차 18홀 라운딩 (역방향 또는 다른 티박스 공략)', '클럽하우스 중식 및 해변 카바나 휴식', '붕따우 시내 예수상 & 등대 관광', '석식: 붕따우 야시장 해산물 특식'] },
      { day: 4, title: '붕따우 파라다이스 CC 18홀 & 호치민 복귀', activities: ['체크아웃 후 붕따우 파라다이스 CC 이동', '해변 소나무 숲길을 따라 펼쳐진 파라다이스 CC 18홀 라운딩', '중식 후 호치민 시내로 이동 (호치민 1군 호텔 1박)', '호치민 1군 명품 쇼핑 및 루프탑 바'] },
      { day: 5, title: '호치민 시내 관광 & 공항 샌딩', activities: ['호텔 조식 후 체크아웃', '호치민 시내 주요 명소 관광 & 기념품 쇼핑', '공항 샌딩 후 귀국'] }
    ],
    options: [
      { id: 'opt-3-1', category: 'golf', name: '더 블러프 CC 2회 (36홀) + 파라다이스 1회 (18홀) 그린피', description: '총 54홀 그린피 전액 포함', priceUSD: 520, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-3-3', category: 'hotel', name: '고급 더 그랜드 호짬 리조트 3박 + 호치민 1박 (1인 객실 기준)', description: '전 일정 1인 1실 단독 객실 & 조식 뷔페 및 리조트 부대시설 이용', priceUSD: 420, isDefaultIncluded: true },
      { id: 'opt-3-4', category: 'vehicle', name: '전 일정 단독 VIP 전용 리무진 밴 (5일간 / 1일 $100 기준)', description: '호치민-붕따우 왕복 및 전 일정 기사/유류비/통행료 포함 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-3-guide', category: 'guide', name: '한국어 전문 가이드 전 일정 동행 (5일간 / 1일 기준 $120)', description: '붕따우 및 호치민 전 일정 골프/투어 케어 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: false },
      { id: 'opt-3-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 도착 시 VIP 패스트트랙 초고속 입국 심사 지원', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-3-spa', category: 'activity', name: 'VIP 전신 힐링 마사지 (90분)', description: '골프 라운딩 후 피로를 풀어주는 프리미엄 마사지 & 스파 케어 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-3-5', category: 'meal', name: '호짬 활어 씨푸드 & 특식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 대형 바닷가재, 칠리크랩, 리조트 디너 뷔페', priceUSD: 200, isDefaultIncluded: false },
      { id: 'opt-3-6', category: 'activity', name: '카지노 웰컴 칩 바우처 ($50 상당)', description: '더 그랜드 호짬 카지노 게임 이용 바우처', priceUSD: 50, isDefaultIncluded: false },
      { id: 'opt-3-7', category: 'hotel', name: '오션뷰 스위트룸 업그레이드 (단독 룸)', description: '남중국해가 파노라마로 펼쳐지는 1인 단독 스위트 객실', priceUSD: 150, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-4',
    title: '호치민+붕따우 콤보 4박 5일 오션 & 시티 3색 골프',
    subtitle: '더 블러프 CC + 롱탄 CC + 떤선녓 CC (붕따우 2박 + 호치민 2박)',
    location: '호치민+붕따우',
    duration: '4박 5일',
    golfCourses: ['더 블러프 호짬 CC (18홀)', '롱탄 CC (18홀)', '떤선녓 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
      'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800'
    ],
    basePriceUSD: 1195,
    summary: '호치민의 화려한 도심 골프와 붕따우의 시원한 오션뷰 링크스 코스를 한 번에 누리는 완벽한 2-in-1 콤비네이션 상품입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '시티+오션 3색 골프', '붕따우 2박+호치민 2박', '최고 인기 베스트셀러'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 붕따우 해변 이동', activities: ['호치민 공항 픽업 후 붕따우 해변 리조트로 이동', '붕따우 풀빌라 또는 고급 호텔 체크인', '해변 노을 감상 및 웰컴 씨푸드 디너', '붕따우 비치 프론트 나이트 산책'] },
      { day: 2, title: '더 블러프 호짬 CC 18홀 라운딩', activities: ['리조트 조식 후 더 블러프 CC로 이동', '더 블러프 CC 18홀 라운딩', '클럽하우스 중식 및 리조트 복귀', '전신 마사지 90분 & 바베큐 특식'] },
      { day: 3, title: '롱탄 CC 18홀 & 호치민 도심 입성', activities: ['붕따우 체크아웃 후 롱탄 CC로 이동', '롱탄 CC 18홀 라운딩', '호치민 1군 고급 호텔 체크인', '호치민 야시장 & 나이트 시티투어'] },
      { day: 4, title: '떤선녓 CC 18홀 & 명품 쇼핑', activities: ['호텔 조식 후 떤선녓 CC 18홀 라운딩', '클럽하우스 중식 후 시내 쇼핑 투어', '굿바이 만찬: 호치민 프리미엄 비프 스테이크'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 체크아웃', '호치민 명소 관광 및 공항 샌딩'] }
    ],
    options: [
      { id: 'opt-4-1', category: 'golf', name: '3대 명문 코스 그린피 54홀 (더블러프+롱탄+떤선녓)', description: '각 골프장 주중/주말 정규 18홀 그린피', priceUSD: 490, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-4-3', category: 'hotel', name: '붕따우 리조트 2박 + 호치민 고급 호텔 2박 (1인 객실 기준)', description: '전 일정 1인 1실 단독 사용 및 조식 뷔페 포함', priceUSD: 380, isDefaultIncluded: true },
      { id: 'opt-4-4', category: 'vehicle', name: '전 일정 단독 VIP 전용 리무진 밴 (5일간 / 1일 $100 기준)', description: '공항-붕따우-골프장-호치민-공항 풀코스 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-4-5', category: 'guide', name: '한국어 전문 가이드 전 일정 동행 (5일간 / 1일 기준 $120)', description: '전 일정 이동 및 체크인/골프 백 드랍 케어 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: true },
      { id: 'opt-4-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 도착 시 VIP 패스트트랙 초고속 입국 심사', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-4-7', category: 'activity', name: 'VIP 전신 힐링 마사지 (90분)', description: '붕따우 + 호치민 프리미엄 힐링 마사지 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-4-6', category: 'meal', name: '지역별 대표 미식 특식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 붕따우 씨푸드, 롱탄 특식, 호치민 바베큐 등', priceUSD: 200, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-5',
    title: '달랏 영원한 봄의 도시 18~24°C 힐링 3색 골프',
    subtitle: '달랏 팔레스 CC + SAM 투옌람 CC + 달랏 1200 CC & 고급 헤리티지 리조트',
    location: '달랏',
    duration: '4박 5일',
    golfCourses: ['달랏 팔레스 헤리티지 CC (18홀)', 'SAM 투옌람 CC (18홀)', '더 달랏 1200 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
      'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800'
    ],
    basePriceUSD: 1145,
    summary: '해발 1,500m 고원에 위치하여 연중 18~24°C의 쾌적하고 서늘한 날씨! 땀 흘리지 않고 시원한 바람을 맞으며 즐기는 베트남 유일의 알프스풍 힐링 골프입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '연중 18~24°C 봄날씨', '고원 3색 54홀', '달랏 고급 리조트'],
    itinerary: [
      { day: 1, title: '달랏 리엔크엉 공항 도착 & 체크인', activities: ['달랏 공항 도착 후 전용 차량 미팅', '프랑스풍 고급 아나만다라 리조트 체크인', '달랏 시내 쑤언흐엉 호수 산책 및 티타임', '석식: 달랏 특산 아티초크 갈비탕 & 와규 특식', '달랏 낭만 야시장 투어'] },
      { day: 2, title: '1922년 역사와 전통의 달랏 팔레스 CC 18홀', activities: ['호텔 조식 후 달랏 팔레스 CC로 이동', '황제의 골프장 달랏 팔레스 CC 18홀 라운딩 (소나무 숲 코스)', '클럽하우스 중식', '다딴라 폭포 및 루지 체험 관광', '석식: 달랏 로컬 와인 & 훈제 바베큐 만찬', '달랏 고원 힐링 허브 스파 (90분)'] },
      { day: 3, title: '호수 뷰 SAM 투옌람 CC 18홀 & 케이블카', activities: ['리조트 조식 후 SAM 투옌람 CC 이동', '투옌람 호수를 둘러싼 명품 SAM 투옌람 CC 18홀 라운딩', '클럽하우스 중식', '죽림선원 케이블카 관람 및 린푸옥 사원 투어', '석식: 달랏 철판 구이 & 고원 쌈밥 특식'] },
      { day: 4, title: '더 달랏 1200 CC 18홀 & 와이너리 투어', activities: ['리조트 조식 후 더 달랏 1200 CC 이동', '해발 1200m에 위치한 챔피언십 더 달랏 1200 CC 18홀 라운딩', '클럽하우스 중식', '달랏 와인 양조장 방문 및 와인 시음회', '굿바이 디너: 프렌치 정통 코스 요리'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['리조트 조식 및 체크아웃', '랑비앙 마운틴 전망대 관광', '기념품(달랏 커피, 건과일, 와인) 쇼핑 후 공항 샌딩'] }
    ],
    options: [
      { id: 'opt-5-1', category: 'golf', name: '달랏 3대 명문 코스 그린피 54홀', description: '달랏 팔레스 + SAM 투옌람 + 더 달랏 1200', priceUSD: 460, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-5-3', category: 'hotel', name: '달랏 고급 리조트 4박 (1인 객실 기준)', description: '아나만다라 빌라 / 달랏 팔레스 헤리티지 급 (1인 1실 단독 객실)', priceUSD: 360, isDefaultIncluded: true },
      { id: 'opt-5-4', category: 'vehicle', name: '전 일정 달랏 전용 VIP 리무진 밴 (5일간 / 1일 $100 기준)', description: '공항 픽업/샌딩 + 골프장 + 관광 전용 기사 포함 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-5-5', category: 'guide', name: '한국어 전문 가이드 전 일정 동행 (5일간 / 1일 기준 $120)', description: '골프 체크인 및 달랏 맞춤 관광 안내 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: true },
      { id: 'opt-5-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 도착 시 VIP 패스트트랙 초고속 입국 심사', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-5-8', category: 'activity', name: '달랏 고원 힐링 허브 스파 마사지 (90분)', description: '고원 천연 허브를 이용한 릴랙싱 스파 케어 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-5-6', category: 'meal', name: '달랏 특산 미식 & 와인 특식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 아티초크 갈비탕, 달랏 와인 바베큐, 프렌치 디너 등', priceUSD: 200, isDefaultIncluded: false },
      { id: 'opt-5-7', category: 'activity', name: '달랏 와이너리 투어 & 와인 시음', description: '달랏 정통 와인 양조장 투어 및 프리미엄 시음', priceUSD: 40, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-6',
    title: '달랏 VIP 헤리티지 팰리스 & 호수뷰 4회 라운딩 휴양',
    subtitle: '달랏 팔레스 CC 2회 + SAM 투옌람 CC 2회 (총 72홀) & 프렌치 독채 빌라',
    location: '달랏',
    duration: '4박 5일',
    golfCourses: ['달랏 팔레스 헤리티지 CC (36홀)', 'SAM 투옌람 CC (36홀)'],
    image: 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
    ],
    basePriceUSD: 1135,
    summary: '달랏의 양대 최고 명문 코스에서 집중적으로 4회(72홀) 라운딩하며, 프랑스 식민지 시절의 고풍스러운 독채 프렌치 빌라에서 럭셔리한 휴식을 즐기는 황제 골프 코스입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '명문 코스 72홀 집중', '프렌치 헤리티지 빌라', '전 일정 프라이빗 케어'],
    itinerary: [
      { day: 1, title: '달랏 도착 & 프렌치 빌라 입실', activities: ['달랏 리엔크엉 공항 VIP 단독 픽업', '헤리티지 프렌치 럭셔리 빌라 체크인', '쑤언흐엉 호수 뷰 카페 애프터눈 티', '석식: 프랑스풍 퐁듀 & 와인 스페셜 만찬'] },
      { day: 2, title: '달랏 팔레스 CC 1차 18홀 라운딩', activities: ['빌라 조식 후 달랏 팔레스 CC 이동', '달랏 팔레스 CC 1차 18홀 라운딩', '클럽하우스 중식 및 빌라 휴식', '온천 스파 & 전신 마사지 90분', '석식: 달랏 흑돼지 참숯 바베큐 파티'] },
      { day: 3, title: 'SAM 투옌람 CC 1차 18홀 라운딩', activities: ['빌라 조식 후 SAM 투옌람 CC 이동', 'SAM 투옌람 CC 18홀 라운딩 (호수 전경 코스)', '클럽하우스 중식', '투옌람 호수 전용 보트 유람 및 힐링 산책', '석식: 철판 스테이크 & 달랏 수제 맥주'] },
      { day: 4, title: '달랏 팔레스 CC 2차 18홀 라운딩 & 환송연', activities: ['빌라 조식 후 달랏 팔레스 CC 2차 라운딩', '18홀 라운딩 후 클럽하우스 중식', '달랏 야시장 및 프렌치 베이커리 투어', '굿바이 갈라 디너 & 와인 파티'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['빌라 조식 후 여유로운 체크아웃', '커피 농장 방문 (루왁/위즐 커피 시음)', '공항 샌딩 및 출국'] }
    ],
    options: [
      { id: 'opt-6-1', category: 'golf', name: '달랏 팔레스 2회 + 투옌람 2회 그린피 (총 72홀)', description: '정규 18홀 그린피 4회분 전액', priceUSD: 560, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-6-3', category: 'hotel', name: '고급 독채 프렌치 빌라 숙박 (4박/1인 객실 기준)', description: '전 일정 1인 1실 단독 객실 배정 및 조식 포함, 전용 버틀러 서비스', priceUSD: 400, isDefaultIncluded: true },
      { id: 'opt-6-4', category: 'vehicle', name: '달랏 전용 VIP 리무진 밴 (5일간 / 1일 $100 기준)', description: '전 일정 기사 및 유류비 일체 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-6-guide', category: 'guide', name: '한국어 전문 가이드 전 일정 동행 (5일간 / 1일 기준 $120)', description: '달랏 명문 골프 및 전 일정 맞춤 안내 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: false },
      { id: 'opt-6-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 도착 시 VIP 패스트트랙 초고속 입국 심사', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-6-6', category: 'activity', name: '달랏 천연 온천 & 허브 마사지 (90분)', description: '고급 온천욕 및 전신 아로마 스파 마사지 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-6-5', category: 'meal', name: '특식 디너 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 프렌치 퐁듀, 흑돼지 바베큐, 스테이크 등', priceUSD: 200, isDefaultIncluded: false },
      { id: 'opt-6-7', category: 'activity', name: '투옌람 호수 전용 프라이빗 보트 투어', description: '단독 보트 탑승 및 호수 힐링 투어', priceUSD: 40, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-7',
    title: '호치민+달랏 연계 4박 5일 메트로폴리스 & 고원 힐링 3색 골프',
    subtitle: '호치민 롱탄 CC + 달랏 팔레스 CC + SAM 투옌람 CC (국내선 항공 연계)',
    location: '호치민+달랏',
    duration: '4박 5일',
    golfCourses: ['호치민 롱탄 CC (18홀)', '달랏 팔레스 CC (18홀)', 'SAM 투옌람 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800'
    ],
    basePriceUSD: 1285,
    summary: '열정적인 대도시 호치민의 명문 골프장과 시원한 고원 휴양지 달랏의 힐링 골프장을 국내선 항공으로 편리하게 연결한 최고의 복합 패키지입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '호치민 2박 + 달랏 2박', '국내선 항공권 포함', '도심+고원 완벽 조화'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 시티 체크인', activities: ['호치민 떤선녓 공항 픽업', '호치민 1군 고급 호텔 체크인', '석식: 사이공 강변 고급 레스토랑 디너', '호치민 시티 야경 감상 및 자유 시간'] },
      { day: 2, title: '호치민 롱탄 CC 18홀 라운딩 & 달랏 항공 이동', activities: ['호텔 조식 후 롱탄 CC 이동', '롱탄 CC 18홀 라운딩 후 샤워 및 중식', '떤선녓 국내선 공항 이동 후 달랏행 항공 탑승 (약 50분 소요)', '달랏 공항 픽업 후 고급 리조트 체크인', '석식: 달랏 와인 & 로컬 특식'] },
      { day: 3, title: '달랏 팔레스 CC 18홀 & 시내 투어', activities: ['리조트 조식 후 달랏 팔레스 CC 이동', '달랏 팔레스 CC 18홀 라운딩 (상쾌한 18도 기온)', '클럽하우스 중식', '달랏 사랑의 계곡 및 크레이지 하우스 관광', '석식: 달랏 야시장 특식 및 전신 마사지 90분'] },
      { day: 4, title: 'SAM 투옌람 CC 18홀 & 힐링 휴식', activities: ['리조트 조식 후 SAM 투옌람 CC 이동', 'SAM 투옌람 CC 18홀 라운딩', '클럽하우스 중식 및 리조트 복귀', '달랏 커피 농장 투어', '굿바이 디너: 고원 특선 코스 요리'] },
      { day: 5, title: '달랏 체크아웃 & 귀국', activities: ['리조트 조식 후 체크아웃', '달랏 공항 이동 및 호치민 경유 / 인천행 귀국'] }
    ],
    options: [
      { id: 'opt-7-1', category: 'golf', name: '호치민 롱탄 18H + 달랏 팔레스 18H + 투옌람 18H 그린피', description: '3개 명문 골프장 총 54홀 그린피', priceUSD: 470, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-7-3', category: 'etc', name: '호치민-달랏 편도 국내선 항공권 (수하물 20kg+골프백)', description: '베트남항공 국내선 항공권 및 골프백 위탁 수하물', priceUSD: 110, isDefaultIncluded: true },
      { id: 'opt-7-4', category: 'hotel', name: '호치민 고급 호텔 2박 + 달랏 고급 리조트 2박 (1인 객실 기준)', description: '전 일정 1인 1실 단독 객실 & 조식 뷔페 포함', priceUSD: 380, isDefaultIncluded: true },
      { id: 'opt-7-5', category: 'vehicle', name: '호치민 & 달랏 각 지역 단독 전용 리무진 (5일간 / 1일 $100 기준)', description: '공항 픽업/샌딩 + 골프장 + 시내 전용 차량 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-7-6', category: 'guide', name: '지역별 전담 한국어 가이드 (5일간 / 1일 기준 $120)', description: '호치민 및 달랏 현지 가이드 풀케어 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: true },
      { id: 'opt-7-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 도착 시 VIP 패스트트랙 초고속 입국 심사', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-7-spa', category: 'activity', name: 'VIP 전신 힐링 마사지 (90분)', description: '골프 라운딩 피로 회복 프리미엄 스파 케어 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-7-7', category: 'meal', name: '호치민 & 달랏 대표 특식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 지역별 대표 미식 석식 코스', priceUSD: 200, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-8',
    title: '호치민 실속 올인클루시브 4박 5일 가성비 3색 골프',
    subtitle: '송베 CC + 동나이 CC + 떤선녓 CC (4성급 중심가 호텔 & 실속 풀패키지)',
    location: '호치민',
    duration: '4박 5일',
    golfCourses: ['송베 CC (18홀)', '동나이 CC (18홀)', '떤선녓 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800'
    ],
    basePriceUSD: 775,
    summary: '부담 없는 합리적인 가격에 호치민 인기 골프장 3곳을 알차게 라운딩할 수 있는 실속파 골퍼를 위한 넘버원 가성비 올인클루시브 상품입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '실속 가성비 No.1', '3회 54홀 올포함', '호치민 시내 4성급'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 시내 체크인', activities: ['호치민 공항 픽업 후 4성급 중심가 호텔 체크인', '석식: 베트남 대표 쌀국수 & 분짜 로컬 특식', '호치민 여행자 거리(부이비엔) 자유 탐방'] },
      { day: 2, title: '송베 CC 18홀 & 마사지', activities: ['호텔 조식 후 송베 CC 이동 (약 40분)', '송베 CC 18홀 라운딩', '클럽하우스 중식 및 시내 복귀', '발 & 전신 마사지 90분', '석식: 한국인 맞춤 무제한 삼겹살 특식'] },
      { day: 3, title: '동나이 CC 18홀 호수 코스', activities: ['호텔 조식 후 동나이 CC 출발', '동나이 CC 18홀 라운딩 (아름다운 호수 전경)', '클럽하우스 중식 후 시내 복귀', '벤탄 시장 및 사이공 센터 쇼핑', '석식: 베트남 로컬 해산물 요리'] },
      { day: 4, title: '떤선녓 CC 18홀 & 굿바이 디너', activities: ['호텔 조식 후 떤선녓 CC 이동', '떤선녓 CC 18홀 라운딩', '샤워 후 시내 복귀', '굿바이 디너: 숯불 바베큐', '사이공 스카이덱 야경 감상'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 체크아웃', '시내 마트 쇼핑 후 공항 샌딩'] }
    ],
    options: [
      { id: 'opt-8-1', category: 'golf', name: '송베 18H + 동나이 18H + 떤선녓 18H 그린피 (총 54홀)', description: '3개 골프장 주중 정규 그린피 일체', priceUSD: 380, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-8-3', category: 'hotel', name: '호치민 시내 4성급 호텔 숙박 (4박/1인 객실 기준)', description: '호텔 조식 뷔페 포함 (1인 1실 단독 중심가 위치)', priceUSD: 220, isDefaultIncluded: true },
      { id: 'opt-8-4', category: 'vehicle', name: '전 일정 단독 전용 차량 (5일간 / 1대 1일 $100 기준)', description: '공항 픽업/샌딩 및 골프장 이동 전용차량 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-8-8', category: 'guide', name: '한국어 가이드 전 일정 동행 (5일간 / 1일 기준 $120)', description: '전 일정 전담 가이드 케어 추가 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: false },
      { id: 'opt-8-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 도착 시 VIP 패스트트랙 초고속 입국 심사', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-8-6', category: 'activity', name: '전신 마사지 (90분)', description: '라운딩 후 개운한 전신 릴랙싱 마사지 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-8-5', category: 'meal', name: '실속 석식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 삼겹살, 해산물, 바베큐 등 알찬 석식', priceUSD: 200, isDefaultIncluded: false },
      { id: 'opt-8-7', category: 'hotel', name: '고급 호텔로 업그레이드 (4박)', description: '일반 호텔 대신 1군 고급 호텔 1인실로 업그레이드', priceUSD: 140, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-9',
    title: '붕따우 독채 프라이빗 풀빌라 & VIP 골프 + 씨푸드 풀파티',
    subtitle: '더 블러프 CC + 파라다이스 CC & 최고급 독채 풀빌라 + 통돼지 바베큐',
    location: '붕따우',
    duration: '4박 5일',
    golfCourses: ['더 블러프 호짬 CC (18홀)', '붕따우 파라다이스 CC (36홀)'],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800',
      'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800'
    ],
    basePriceUSD: 1245,
    summary: '우리 팀만을 위한 대형 프라이빗 독채 풀빌라에서 수영과 BBQ 풀파티를 즐기고, 더 블러프 CC와 파라다이스 CC에서 여유로운 라운딩을 펼치는 동반자/비즈니스 맞춤 최고급 여행입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '단독 독채 풀빌라', '통돼지 바베큐 풀파티', '프라이빗 골프 휴양'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 붕따우 독채 풀빌라 입실', activities: ['호치민 공항 전용 픽업 미팅 후 붕따우로 이동', '붕따우 최고급 프라이빗 독채 풀빌라 체크인 (대형 개인 수영장, 노래방 완비)', '풀빌라 웰컴 풀사이드 파티', '석식: 풀빌라 전담 셰프의 통돼지 바베큐 & 씨푸드 그릴'] },
      { day: 2, title: '더 블러프 호짬 CC 18홀 라운딩', activities: ['풀빌라 조식 후 더 블러프 CC로 이동', '세계 100대 코스 더 블러프 CC 18홀 라운딩', '클럽하우스 중식 및 풀빌라 복귀', '프라이빗 풀빌라 수영 & 자유 휴식', '석식: 붕따우 최고급 랍스터 & 다금바리 회 파티'] },
      { day: 3, title: '붕따우 파라다이스 CC 1차 18홀 라운딩', activities: ['풀빌라 조식 후 파라다이스 CC 이동', '파라다이스 CC 18홀 라운딩', '중식 후 붕따우 케이블카 및 호마이 파크 관광', '풀빌라 출장 전신 마사지 120분 케어', '석식: 베트남 로컬 바베큐 & 맥주 파티'] },
      { day: 4, title: '붕따우 파라다이스 CC 2차 18홀 & 호치민 이동', activities: ['풀빌라 조식 후 파라다이스 CC 2차 18홀 라운딩', '샤워 후 호치민 시내로 이동', '호치민 고급 호텔 체크인 및 쇼핑', '굿바이 갈라 디너 & 사이공 스카이 라운지'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 여유로운 오전 휴식 후 체크아웃', '호치민 시내 관광 및 공항 샌딩 (귀국)'] }
    ],
    options: [
      { id: 'opt-9-1', category: 'golf', name: '더 블러프 18H + 파라다이스 36H 그린피 (총 54홀)', description: '3회 54홀 그린피 전액', priceUSD: 480, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-9-3', category: 'hotel', name: '럭셔리 독채 프라이빗 풀빌라 3박 + 호치민 1박 (1인 객실 기준)', description: '개인 수영장, 침실 4~5개 독채 각자 1인 1실 단독 사용 (조식 포함)', priceUSD: 440, isDefaultIncluded: true },
      { id: 'opt-9-4', category: 'vehicle', name: '전 일정 단독 전용 VIP 리무진 밴 (5일간 / 1일 $100 기준)', description: '호치민-붕따우 왕복 및 전 일정 전용 기사 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-9-7', category: 'guide', name: '한국어 VIP 가이드 전 일정 풀케어 (5일간 / 1일 기준 $120)', description: '골프 체크인 및 풀빌라 바베큐 파티 지원 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: true },
      { id: 'opt-9-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 도착 시 VIP 패스트트랙 초고속 입국 심사', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-9-6', category: 'activity', name: '풀빌라 출장 VIP 전신 마사지 (120분)', description: '풀빌라에서 편안하게 받는 프라이빗 출장 스파 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-9-5', category: 'meal', name: '풀빌라 전담 셰프 통돼지 바베큐 & 랍스터 특식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 풀사이드 통돼지 바베큐 & 해산물 파티 4회', priceUSD: 200, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-10',
    title: '달랏+붕따우 알프스 & 오션 4박 5일 산과 바다 3색 골프',
    subtitle: '달랏 팔레스 CC + SAM 투옌람 CC + 붕따우 더 블러프 CC (고원과 해변의 만남)',
    location: '달랏+붕따우',
    duration: '4박 5일',
    golfCourses: ['달랏 팔레스 CC (18홀)', 'SAM 투옌람 CC (18홀)', '더 블러프 호짬 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
      'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=800'
    ],
    basePriceUSD: 1255,
    summary: '해발 1,500m 시원한 달랏 고원에서 2일간 상쾌한 힐링 골프를 즐기고, 붕따우 해변으로 내려와 세계 100대 더 블러프 CC에서 남중국해 바다를 가르는 이색 하이브리드 투어입니다.',
    highlightBadges: ['4박 5일', '1인 1실 숙박', '달랏 2박 + 붕따우 2박', '산과 바다 3색 골프', '국내 최고 이색 코스'],
    itinerary: [
      { day: 1, title: '달랏 도착 & 고원 힐링 체크인', activities: ['달랏 공항 픽업 미팅 후 고급 리조트 체크인', '달랏 쑤언흐엉 호수 산책 및 힐링 티타임', '석식: 달랏 특선 와규 & 와인 디너', '달랏 야시장 투어'] },
      { day: 2, title: '달랏 팔레스 CC 18홀 & SAM 투옌람 뷰', activities: ['리조트 조식 후 달랏 팔레스 CC 18홀 라운딩', '클럽하우스 중식 및 달랏 주요 명소 관광', '달랏 힐링 허브 스파 (90분)', '석식: 달랏 흑돼지 참숯 바베큐'] },
      { day: 3, title: 'SAM 투옌람 CC 18홀 & 붕따우 해변 이동', activities: ['리조트 조식 후 SAM 투옌람 CC 18홀 라운딩', '클럽하우스 중식 후 붕따우 호짬 리조트로 전용 차량 이동', '고급 더 그랜드 호짬 리조트 체크인', '석식: 붕따우 활어 씨푸드 만찬 & 카지노'] },
      { day: 4, title: '더 블러프 호짬 CC 18홀 & 오션 나이트', activities: ['리조트 조식 후 더 블러프 CC 18홀 라운딩 (바다 조망 링크스 코스)', '인피니티 레스토랑 중식 및 해변 수영', '석식: 리조트 풀사이드 디너 뷔페'] },
      { day: 5, title: '체크아웃 & 호치민 공항 샌딩', activities: ['리조트 조식 후 체크아웃', '호치민 시내로 이동 후 쇼핑', '떤선녓 공항 샌딩 및 출국'] }
    ],
    options: [
      { id: 'opt-10-1', category: 'golf', name: '달랏 팔레스 18H + SAM 투옌람 18H + 더 블러프 18H 그린피', description: '고원 2회 + 해변 1회 총 54홀 정규 그린피', priceUSD: 510, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-10-3', category: 'hotel', name: '달랏 고급 리조트 2박 + 붕따우 호짬 리조트 2박 (1인 객실 기준)', description: '전 일정 고급 호텔/리조트 1인 1실 조식 포함 숙박', priceUSD: 420, isDefaultIncluded: true },
      { id: 'opt-10-4', category: 'vehicle', name: '전 일정 단독 전용 VIP 리무진 밴 (달랏-붕따우 이동 포함 / 5일간 1일 $100 기준)', description: '전용 기사, 유류비, 통행료 일체 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)', priceUSD: 125, isDefaultIncluded: true },
      { id: 'opt-10-5', category: 'guide', name: '한국어 전문 가이드 전 일정 동행 (5일간 / 1일 기준 $120)', description: '골프 및 지역 이동 풀케어 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)', priceUSD: 150, isDefaultIncluded: true },
      { id: 'opt-10-fasttrack', category: 'etc', name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)', description: '공항 도착 시 VIP 패스트트랙 초고속 입국 심사', priceUSD: 60, isDefaultIncluded: false },
      { id: 'opt-10-7', category: 'activity', name: '달랏 고원 스파 & 붕따우 마사지 (90분)', description: '달랏 + 붕따우 힐링 마사지 (기본 선택 포함)', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-10-6', category: 'meal', name: '고원 특식 & 해변 씨푸드 석식 만찬 (석식 4회 / 1일 $50)', description: '1인 1일 $50 × 4일 = 총 $200 / 달랏 와인 바베큐, 붕따우 랍스터 만찬 등', priceUSD: 200, isDefaultIncluded: false }
    ]
  }
];

export const INITIAL_MASTER_OPTION_POOL: MasterOptionPool = {
  diyRegions: [
    { id: 'reg-hcm', name: '호치민', subtitle: '명문 36홀 & 도심 나이트라이프', icon: '🏙️', baseFeeUSD: 0 },
    { id: 'reg-vt', name: '붕따우', subtitle: '오션뷰 링크스 & 해변 휴양', icon: '🌊', baseFeeUSD: 0 },
    { id: 'reg-mn', name: '무이네', subtitle: '사막 투어 & 해안 리조트 골프', icon: '🏜️', baseFeeUSD: 0 },
    { id: 'reg-nt', name: '나트랑', subtitle: '에메랄드 바다 & 섬 리조트', icon: '🏝️', baseFeeUSD: 0 },
    { id: 'reg-dl', name: '달랏', subtitle: '해발 1,500m 고원 힐링 투어', icon: '🌲', baseFeeUSD: 0 },
  ],

  golfCourses: [
    // Ho Chi Minh
    { id: 'gc-hcm-1', name: '떤선녓 CC (18홀)', location: '호치민', holes: 18, priceUSD: 155, priceDeltaUSD: 0, description: '호치민 시내 20분 거리, 최상급 관리와 야간 라운딩 시설을 갖춘 최고 인기 36홀 명문 코스', badge: '인기 1위' },
    { id: 'gc-hcm-2', name: '롱탄 CC (18홀)', location: '호치민', holes: 18, priceUSD: 155, priceDeltaUSD: 0, description: '아시아 최고 경관을 자랑하는 36홀 챔피언십 힐 & 레이크 코스, 아름다운 조경과 완벽한 잔디', badge: '베스트 뷰' },
    { id: 'gc-hcm-3', name: '트윈도브스 CC (18홀)', location: '호치민', holes: 18, priceUSD: 170, priceDeltaUSD: 15, description: 'KLPGA 정규 투어 개최 멤버십 명문 코스, 까다롭고 도전적인 그린과 최고급 클럽하우스', badge: 'KLPGA 대회 코스' },
    { id: 'gc-hcm-4', name: '송베 CC (18홀)', location: '호치민', holes: 18, priceUSD: 145, priceDeltaUSD: -10, description: '베트남 최초 국제 챔피언십 인증 코스, 자연 야자수와 사막/로터스 코스의 환상적 조화', badge: '전통 명문' },
    { id: 'gc-hcm-5', name: '태광 정산 CC (18홀)', location: '호치민', holes: 18, priceUSD: 170, priceDeltaUSD: 15, description: '전용 스피드보트로 동나이강을 건너 진입하는 이색 럭셔리 아일랜드 골프 코스', badge: '스피드보트 이색체험' },
    { id: 'gc-hcm-6', name: '베트남 G.C (18홀)', location: '호치민', holes: 18, priceUSD: 140, priceDeltaUSD: -15, description: '호치민 시내 중심 30분 거리, 동코스 & 서코스 36홀 정통 챔피언십 회원제 코스', badge: '정통 36홀' },
    { id: 'gc-hcm-7', name: '동나이 CC (18홀)', location: '호치민', holes: 18, priceUSD: 135, priceDeltaUSD: -20, description: '자연 호수를 끼고 도는 27홀의 시원하고 여유로운 가성비 힐링 코스', badge: '가성비 추천' },
    { id: 'gc-hcm-8', name: '로얄 아일랜드 CC (18홀)', location: '호치민', holes: 18, priceUSD: 145, priceDeltaUSD: -10, description: '동나이 강변 쾌적한 18홀 정규 코스, 평탄하고 편안한 페어웨이', badge: '강변 코스' },

    // Vung Tau
    { id: 'gc-vt-1', name: '더 블러프 호짬 스트립 CC (18홀)', location: '붕따우', holes: 18, priceUSD: 205, priceDeltaUSD: 50, description: '그렉 노먼 설계 세계 100대 오션뷰 링크스 코스, 남중국해 파도와 해풍을 마주하는 최고 명문', badge: '세계 100대 명문' },
    { id: 'gc-vt-2', name: '붕따우 파라다이스 CC (18홀)', location: '붕따우', holes: 18, priceUSD: 125, priceDeltaUSD: -30, description: '남중국해 바다와 울창한 해변 소나무 숲이 어우러진 시원한 27홀 씨사이드 코스', badge: '해변 링크스' },
    { id: 'gc-vt-3', name: '쩌우득 CC (18홀)', location: '붕따우', holes: 18, priceUSD: 115, priceDeltaUSD: -40, description: '넓은 페어웨이와 현대적 시설을 갖춘 붕따우 인근 실속 골프 코스', badge: '신규 코스' },

    // Mui Ne
    { id: 'gc-mn-1', name: '씨링크스 골프 & 컨트리 클럽 (18홀)', location: '무이네', holes: 18, priceUSD: 150, priceDeltaUSD: 0, description: '아시아 최고 수준 오션뷰 모래언덕 링크스 코스, 모든 홀에서 무이네 바다가 내려다보이는 절경', badge: '오션뷰 명문' },
    { id: 'gc-mn-2', name: '노바월드 판티엣 PGA 오션 코스 (18홀)', location: '무이네', holes: 18, priceUSD: 165, priceDeltaUSD: 15, description: '그렉 노먼 설계 PGA 공식 인증 국제 토너먼트 규격 챔피언십 코스', badge: 'PGA 인증' },

    // Nha Trang
    { id: 'gc-nt-1', name: '빈펄 골프 나트랑 CC (18홀)', location: '나트랑', holes: 18, priceUSD: 175, priceDeltaUSD: 20, description: '혼쩨섬 프라이빗 아일랜드 내 위치한 에메랄드빛 바다 조망 아일랜드 명문 코스', badge: '아일랜드 명문' },
    { id: 'gc-nt-2', name: 'KN 골프 링크스 깜란 CC (18홀)', location: '나트랑', holes: 18, priceUSD: 170, priceDeltaUSD: 15, description: '그렉 노먼 설계 아시아 베스트 뉴 코스, 백사장 해안선을 따라 펼쳐지는 정통 링크스', badge: '링크스 명작' },
    { id: 'gc-nt-3', name: '다이아몬드 베이 골프 & 빌라 (18홀)', location: '나트랑', holes: 18, priceUSD: 145, priceDeltaUSD: -10, description: '산과 바다가 어우러진 다이나믹한 18홀 리조트 코스, 쾌적한 라운딩 환경', badge: '리조트 골프' },

    // Da Lat
    { id: 'gc-dl-1', name: '달랏 팔레스 헤리티지 CC (18홀)', location: '달랏', holes: 18, priceUSD: 165, priceDeltaUSD: 10, description: '1922년 개장한 베트남 최고(最古) 황제의 골프장, 고풍스러운 소나무 숲과 쑤언흐엉 호수 전망', badge: '1922년 황제 코스' },
    { id: 'gc-dl-2', name: 'SAM 투옌람 CC (18홀)', location: '달랏', holes: 18, priceUSD: 155, priceDeltaUSD: 0, description: '투옌람 호수 계곡과 울창한 고원 소나무 숲에 둘러싸인 천혜의 힐링 챔피언십 코스', badge: '호수 전경 힐링' },
    { id: 'gc-dl-3', name: '더 달랏 1200 CC (18홀)', location: '달랏', holes: 18, priceUSD: 165, priceDeltaUSD: 10, description: '해발 1,200m에 위치하여 한여름에도 시원한 바람이 부는 아시안투어 대회 개최 코스', badge: '해발 1200m 고원' },
  ],

  tourOptions: [
    { id: 'tour-free', name: '자유 여행 (내 맘대로 자유 일정)', location: '전체', priceUSD: 0, description: '패키지 투어 없이 전용 차량·숙박·옵션만 조합해 내 맘대로 자유롭게 여행합니다.', badge: '자유 일정', isFreeTravel: true },
    { id: 'tour-hcm-1', name: '호치민 시티 랜드마크 & 메콩델타 VIP 투어', location: '호치민', priceUSD: 85, description: '통일궁·노트르담·중앙우체국 핵심 시내 관광과 메콩강 프라이빗 크루즈 체험', badge: '호치민 인기' },
    { id: 'tour-hcm-2', name: '구찌터널 역사 탐방 & 사이공 디너 크루즈', location: '호치민', priceUSD: 95, description: '역사적인 구찌터널 오전 투어 후 저녁 사이공강 야경 선상 디너 크루즈', badge: '야경 디너' },
    { id: 'tour-vt-1', name: '붕따우 거대 예수상 & 해안 케이블카 웰빙 투어', location: '붕따우', priceUSD: 80, description: '남중국해 절경을 한눈에 담는 예수상, 호마이 파크 케이블카 및 씨푸드 미식 코스', badge: '붕따우 필수' },
    { id: 'tour-mn-1', name: '무이네 선라이즈 지프 사막 투어 (화이트&레드샌듄)', location: '무이네', priceUSD: 75, description: '전용 지프를 타고 달리는 이국적인 사막 투어 & 요정의 샘, 피싱 빌리지 감상', badge: '지프 투어' },
    { id: 'tour-mn-2', name: '무이네 RD 와인 캐슬 시음 & 해변 힐링 투어', location: '무이네', priceUSD: 65, description: '유럽식 와인 캐슬 투어 및 해안 절벽 카페·씨푸드 레스토랑 코스', badge: '힐링 코스' },
    { id: 'tour-nt-1', name: '나트랑 아일랜드 호핑 VIP 요트 스노클링', location: '나트랑', priceUSD: 95, description: '에메랄드빛 나트랑 바다 스노클링 & 선상 씨푸드 BBQ 파티 프라이빗 요트 투어', badge: '해양 액티비티' },
    { id: 'tour-nt-2', name: '빈원더스 테마파크 & 나트랑 시내 랜드마크 투어', location: '나트랑', priceUSD: 85, description: '혼쩨섬 케이블카 빈원더스 종일 입장 및 포나가르 사원·담시장 핵심 시내 투어', badge: '가족 추천' },
    { id: 'tour-dl-1', name: '달랏 다딴라 알파인코스터 & 랑비앙 지프 투어', location: '달랏', priceUSD: 85, description: '고원 숲속 짜릿한 알파인 코스터, 랑비앙 정상 지프 등반 및 크레이지 하우스 관람', badge: '달랏 시그니처' },
    { id: 'tour-dl-2', name: '달랏 클레이 터널 & 야시장 커피 투어', location: '달랏', priceUSD: 70, description: '포토존 클레이 터널과 아라비카 고원 커피 농장, 달랏 밤도깨비 야시장 탐방', badge: '감성 투어' },
  ],

  accommodationTiers: [
    { id: 'hotel_5star', name: '고급 호텔', pricePerNightUSD: 90, description: '시내 중심, 조식 뷔페, 수영장 완비', icon: '⭐', badge: '1인 1실 기준' },
    { id: 'pool_villa', name: '럭셔리 프라이빗 풀빌라', pricePerNightUSD: 110, description: '단독 수영장, 바베큐 파티 가능', icon: '🏊', badge: '프라이빗 독채' },
    { id: 'hotel_4star', name: '4성급 실속 호텔', pricePerNightUSD: 60, description: '가성비 뛰어난 중심가 호텔', icon: '🏢', badge: '가성비 추천' },
    { id: 'resort', name: '골프&비치 리조트', pricePerNightUSD: 100, description: '해변/골프장 인접 최고급 휴양', icon: '🏖️', badge: '프리미엄 휴양' },
  ],

  accommodations: [
    // Ho Chi Minh
    { id: 'acc-hcm-1', name: '호치민 1군 고급 호텔 (카라벨/르메르디앙 급, 1인 객실 기준)', location: '호치민', type: 'hotel_5star', priceDeltaUSD: 0, description: '호치민 중심가 1군 고급 호텔, 1인 1실 단독 사용, 조식 뷔페 및 수영장/사우나 무료 이용', badge: '고급 호텔 1인실' },
    { id: 'acc-hcm-2', name: '단독 럭셔리 프라이빗 풀빌라 (전용 수영장 4~5베드룸, 1인 1실 배정)', location: '호치민', type: 'pool_villa', priceDeltaUSD: 60, description: '개인 전용 수영장, 바베큐 시설, 거실/주방 전체 단독 대여 (1인 1실 배정)', badge: '독채 풀빌라' },
    { id: 'acc-hcm-3', name: '호텔 프리미엄 스위트룸 (Suite) 단독 업그레이드', location: '호치민', type: 'hotel_5star', priceDeltaUSD: 180, description: '4박 전 일정 최상급 럭셔리 이그제큐티브 스위트 객실로 룸 업그레이드', badge: '스위트룸' },
    { id: 'acc-hcm-4', name: '호치민 1군 4성급 중심가 가성비 호텔 (알라곤/리버티 급, 1인 객실 기준)', location: '호치민', type: 'hotel_4star', priceDeltaUSD: -50, description: '가성비 뛰어난 1군 중심가 4성급 부티크 호텔 1인실, 시내 관광 및 야경 도보 이동', badge: '실속 4성급' },

    // Vung Tau
    { id: 'acc-vt-1', name: '고급 더 그랜드 호짬 카지노 & 리조트 (디럭스 오션뷰, 1인 객실 기준)', location: '붕따우', type: 'resort', priceDeltaUSD: 0, description: '오션뷰 인피니티 풀 및 카지노 복합 고급 리조트 1인실, 전 일정 최고급 조식 뷔페', badge: '고급 카지노' },
    { id: 'acc-vt-2', name: '붕따우 비치 프라이빗 단독 풀빌라 (개인 수영장 독채, 1인 1실)', location: '붕따우', type: 'pool_villa', priceDeltaUSD: 50, description: '해변 인접 전용 수영장 단독 풀빌라 1인 1실 사용 & 야외 풀사이드 바베큐 가능', badge: '오션뷰 풀빌라' },
    { id: 'acc-vt-3', name: '붕따우 4성급 비치 프론트 호텔 (1인 객실 기준)', location: '붕따우', type: 'hotel_4star', priceDeltaUSD: -40, description: '해변 도로 위치 가성비 오션뷰 4성 호텔 1인실, 야시장 및 해변 도보 5분', badge: '실속 4성급' },

    // Mui Ne / Nha Trang
    { id: 'acc-mn-1', name: '무이네 아난타라 / 센타라 미라지 비치 리조트 (1인 객실 기준)', location: '무이네', type: 'resort', priceDeltaUSD: 0, description: '무이네 프라이빗 비치와 인피니티 풀을 품은 특급 오션 리조트 1인 1실', badge: '비치 리조트' },
    { id: 'acc-nt-1', name: '나트랑 빈펄 / 아미아나 프라이빗 풀빌라 & 리조트 (1인 객실 기준)', location: '나트랑', type: 'resort', priceDeltaUSD: 20, description: '에메랄드 해변을 조망하는 나트랑 대표 고급 오션 리조트 1인 1실', badge: '오션 럭셔리' },

    // Da Lat
    { id: 'acc-dl-1', name: '달랏 고급 프랑스풍 헤리티지 리조트 (아나만다라 빌라 급, 1인 객실 기준)', location: '달랏', type: 'resort', priceDeltaUSD: 0, description: '소나무 숲속 고풍스러운 프렌치 콜로니얼 빌라 리조트 1인실, 최고급 힐링 휴양', badge: '고급 헤리티지' },
    { id: 'acc-dl-2', name: '달랏 프라이빗 독채 럭셔리 빌라 (전용 정원 & 벽난로, 1인 1실)', location: '달랏', type: 'pool_villa', priceDeltaUSD: 60, description: '가족/팀 전용 프라이빗 정원과 벽난로가 구비된 프랑스풍 독채 빌라 1인실 배정', badge: '프라이빗 독채' },
    { id: 'acc-dl-3', name: '달랏 4성급 중심가 시티 호텔 (호텔 콜린 급, 1인 객실 기준)', location: '달랏', type: 'hotel_4star', priceDeltaUSD: -40, description: '달랏 야시장 인접 도보 이동 가능한 최신 중심가 4성급 호텔 1인실', badge: '중심가 4성급' },
  ],

  vehicles: [
    { id: 'veh-4', shortName: '7인승', name: '7인승 프리미엄 SUV / 밴', pricePerDayUSD: 18, priceDeltaUSD: -35, description: '소수 인원(2~3인)의 빠르고 안락한 이동 최적화', icon: '🚗', badge: '소수 정예' },
    { id: 'veh-1', shortName: '9인승', name: '9인승 VIP 리무진 밴', pricePerDayUSD: 25, priceDeltaUSD: 0, description: '최고급 가죽 리클라이너 좌석, 전용 기사/유류비 일체', icon: '👑', badge: '인기 1위' },
    { id: 'veh-2', shortName: '16인승', name: '16인승 대용량 전용 밴', pricePerDayUSD: 20, priceDeltaUSD: -25, description: '여유로운 실내와 골프백 대량 적재 가능한 단체 밴', icon: '🚐', badge: '단체 실속' },
    { id: 'veh-3', shortName: '26인승', name: '26인승 대형 리무진 버스', pricePerDayUSD: 35, priceDeltaUSD: 50, description: '대규모 단체 골퍼/관광을 위한 최고급 대형 리무진 버스', icon: '🚌', badge: '대형 단체용' },
  ],

  extraServices: [
    { id: 'guide', name: '가이드', priceUSD: 30, pricingUnit: 'per_day', description: '한국어 전문 가이드 전 일정 동행 올케어 (1일 $30 · 팀 기준)', icon: '👨‍💼', badge: '전 일정 통역', defaultSelected: true },
    { id: 'fasttrack', name: '패스트 트랙', priceUSD: 60, pricingUnit: 'per_person', description: '공항 VIP 전용 입국 심사 초고속 패스 (1인 $60)', icon: '🛫', badge: 'VIP 의전', defaultSelected: false },
    { id: 'massage', name: '마사지', priceUSD: 50, pricingUnit: 'per_person', description: '피로 회복 VIP 전신 힐링 마사지 90분 (1인 $50)', icon: '💆', badge: '힐링 스파', defaultSelected: true },
  ],

  guides: [
    { id: 'gui-1', name: '베테랑 한국어 가이드 전 일정 동행 (5일간 / 1일 기준 $120)', priceDeltaUSD: 0, description: '골프장 체크인/티타임 조율, 시내 관광 및 맛집/야경 전담 밀착 케어 (가이드 1일 $120 × 여행 일수 · 인원수 무관 팀 기준)', badge: '1일 $120' },
    { id: 'gui-2', name: 'VIP 비즈니스 의전 전문 가이드 (동시통역 가능 / 1일 기준 $150)', priceDeltaUSD: 30, description: '전문 비즈니스 통역 및 VIP 단독 의전, 만찬 미팅 케어 (가이드 1일 $150 × 여행 일수 · 인원수 무관 팀 기준)', badge: 'VIP 통역' },
    { id: 'gui-3', name: '가이드 미포함 (전용 차량 기사만 배정)', priceDeltaUSD: -150, description: '가이드 없이 기사만 배정되어 일행끼리 자유롭게 골프와 일정을 즐기는 코스', badge: '가이드 제외' },
  ],

  meals: [
    { id: 'meal-1', name: '프리미엄 웰컴 디너 & 씨푸드 바베큐 만찬 (석식 4회 / 1일 $50)', priceDeltaUSD: 0, description: '1인 1일 $50 × 4일 = $200 / 고급 정통 베트남식, 씨푸드 만찬, 루프탑 스테이크, 바베큐', badge: '특식 만찬' },
    { id: 'meal-2', name: '로컬 스트리트 & 베트남 미식 탐방 코스 (석식 4회 / 1일 $25)', priceDeltaUSD: -100, description: '1인 1일 $25 × 4일 = $100 / 분짜, 쌀국수, 반쎄오, 해산물 거리 미식 투어', badge: '로컬 미식' },
    { id: 'meal-3', name: '자유 식사 (미포함 / 골프장 클럽하우스 및 시내 개별 결제)', priceDeltaUSD: -200, description: '식사비 미포함 ($0)으로 원하는 식당을 직접 방문하여 자유롭게 결제', badge: '자유 식사' },
  ]
};
