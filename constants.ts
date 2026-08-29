
import { Product, VideoItem, CommunityPost, PageContent, PopupNotification, CustomTripPackage } from './types';

export const LOCATIONS = ['호치민', '붕따우', '무이네', '달랏'];
export const THEMES = ['골프', '관광', '먹거리', '비지니스'];
export const ACCOMMODATIONS = ['3성급', '4성급', '호텔 숙박(5성급)', '풀빌라'];

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
    image: 'https://images.unsplash.com/photo-1623122046188-4b775494d49e?q=80&w=800',
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
  }
];

export const INITIAL_VIDEOS: VideoItem[] = [
  { id: 'v1', title: '롱탄 골프 클럽 드론 뷰', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
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
    introText: '호치민 1군의 5성급 호텔부터 붕따우, 무이네의 럭셔리 독채 풀빌라까지. MANGO TOUR는 엄선된 숙소만을 고집합니다. 가족, 친구, 비지니스 파트너와 함께 완벽한 프라이버시를 누리세요.',
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
      { title: '특급 호텔 셀렉션', content: '파크 하얏트, 쉐라톤 등 호치민 시내 중심가에 위치한 5성급 호텔들을 특별한 조건으로 예약해 드립니다.' },
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
        content: '3개월 전 예약 시 5성급 호텔 업그레이드 또는 카트비 무료 등 특별한 가격 혜택을 드립니다.',
        detailContent: '미리 준비하는 여행자를 위한 특별한 혜택!\n\n3개월 전 사전 예약 시 다음과 같은 혜택 중 하나를 선택하실 수 있습니다.\n\n1. 4성급 -> 5성급 호텔 무료 업그레이드\n2. 전 일정 그린피 10% 추가 할인\n3. 공항 VIP 의전 서비스 무료 제공\n\n지금 바로 상담 신청하세요.',
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
  image: 'https://images.unsplash.com/photo-1628753232870-6da09a967c9c?q=80&w=800'
};

export const INITIAL_CUSTOM_PACKAGES: CustomTripPackage[] = [
  {
    id: 'pkg-1',
    title: '호치민 3색 명문 54홀 & 미식 럭셔리 투어',
    subtitle: '떤선녓 CC + 롱탄 CC + 트윈도브스 CC 3회 라운딩 & 5성급 호텔',
    location: '호치민',
    duration: '4박 5일',
    golfCourses: ['떤선녓 CC (18홀)', '롱탄 CC (18홀)', '트윈도브스 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
    ],
    basePriceUSD: 1180,
    summary: '호치민 최고 인기 3대 명문 코스에서 매일 여유로운 라운딩을 즐기고, 1군 5성급 호텔과 호치민 명품 미식을 결합한 정통 프리미엄 골프 투어입니다.',
    highlightBadges: ['4박 5일', '3회 54홀 라운딩', '호치민 5성급', '전용 리무진 밴'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 체크인', activities: ['호치민 떤선녓 국제공항 VIP 단독 픽업 미팅', '호치민 1군 5성급 호텔 체크인 및 휴식', '웰컴 디너: 베트남 고급 정통 코스 요리', '호치민 랜드마크 81 야경 감상 및 자유 시간'] },
      { day: 2, title: '떤선녓 CC 18홀 & 시내 관광', activities: ['호텔 조식 뷔페 후 골프장 이동 (약 20분 소요)', '떤선녓 CC 18홀 라운딩 (1인 1캐디 & 2인 1카트)', '클럽하우스 또는 시내 유명 한식당 중식', '노트르담 대성당, 중앙우체국, 통일궁 시티투어', '석식: 1군 사이공 강변 루프탑 스테이크 & 와인', '피로를 풀어주는 VIP 전신 힐링 마사지 (90분)'] },
      { day: 3, title: '롱탄 CC 18홀 & 해산물 특식', activities: ['호텔 조식 후 롱탄 CC로 이동 (약 45분)', '베트남 최고 뷰를 자랑하는 롱탄 CC 18홀 라운딩', '클럽하우스 여유로운 중식', '사이공 스카이덱 전망대 관람 및 쇼핑', '석식: 칠리크랩 & 대하구이 프리미엄 씨푸드 만찬', '자유 일정 또는 추천 라이브 바 투어'] },
      { day: 4, title: '트윈도브스 CC 18홀 & 나이트 라이프', activities: ['호텔 조식 후 빈증 트윈도브스 CC 이동 (약 50분)', 'KLPGA 개최 명문 트윈도브스 CC 18홀 라운딩', '골프 라운딩 후 개운한 샤워 및 중식', '호치민 벤탄 시장 및 고급 마켓 쇼핑 투어', '굿바이 디너: 최고급 숯불 와규 & 특식 바베큐', '사이공 강 디너 크루즈 및 야경 투어'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 여유로운 오전 휴식 후 체크아웃', '호치민 인기 카페거리 카페 쓰어다 티타임', '마지막 쇼핑 및 마사지 (옵션)', '공항 이동 및 떤선녓 국제공항 샌딩 (귀국)'] }
    ],
    options: [
      { id: 'opt-1-1', category: 'golf', name: '3대 명문 코스 그린피 (54홀)', description: '떤선녓 18H + 롱탄 18H + 트윈도브스 18H 그린피 일체', priceUSD: 450, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-1-2', category: 'golf', name: '전동카트 & 1인 1캐디 피', description: '전 일정 2인 1카트 및 1인 1캐디 서비스 피 포함 (캐디팁 별도)', priceUSD: 120, isDefaultIncluded: true },
      { id: 'opt-1-3', category: 'hotel', name: '호치민 1군 5성급 호텔 (4박/2인1실)', description: '호텔 조식 뷔페 포함 (카라벨 / 르메르디앙 급)', priceUSD: 360, isDefaultIncluded: true },
      { id: 'opt-1-4', category: 'vehicle', name: '전 일정 단독 VIP 전용 리무진 밴', description: '공항 픽업/샌딩 + 골프장 + 시내 투어 기사 포함 전용 차량', priceUSD: 110, isDefaultIncluded: true },
      { id: 'opt-1-5', category: 'guide', name: '한국어 전문 가이드 전 일정 동행', description: '골프 체크인/아웃 지원 및 시내 일정 올케어', priceUSD: 60, isDefaultIncluded: true },
      { id: 'opt-1-6', category: 'meal', name: '프리미엄 웰컴 & 굿바이 특식 (석식 4회)', description: '고급 정통 베트남식, 씨푸드 만찬, 루프탑 디너, 숯불 바베큐', priceUSD: 80, isDefaultIncluded: true },
      { id: 'opt-1-7', category: 'activity', name: 'VIP 전신 힐링 마사지 (90분 2회)', description: '골프 라운딩 후 피로를 풀어주는 프리미엄 마사지 & 스파', priceUSD: 50, isDefaultIncluded: false },
      { id: 'opt-1-8', category: 'hotel', name: '호텔 싱글룸 (1인 1실) 업그레이드', description: '4박 동안 혼자 객실을 단독 사용하는 독방 업그레이드', priceUSD: 180, isDefaultIncluded: false },
      { id: 'opt-1-9', category: 'golf', name: '4일차 9홀 추가 라운딩 (총 27홀)', description: '트윈도브스 CC 9홀 추가 그린피+카트+캐디', priceUSD: 90, isDefaultIncluded: false }
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
    basePriceUSD: 1390,
    summary: '오직 골프만을 위한 궁극의 마스터스 투어! 4박 5일간 매일 다른 4개 명문 골프장에서 총 72홀을 정복하는 VIP 골퍼 맞춤 상품입니다.',
    highlightBadges: ['4박 5일', '4회 72홀 완주', 'VIP 전용 보트/스피드보트', '매일 마사지 케어'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 떤선녓 CC 야간 18홀', activities: ['오전 떤선녓 국제공항 도착 후 전용 의전 픽업', '호치민 떤선녓 CC 이동 후 첫 18홀 라운딩', '호텔 체크인 및 휴식', '석식: 한국인 입맛에 맞춘 프리미엄 숯불 갈비 특식'] },
      { day: 2, title: '보트 타고 떠나는 태광 정산 CC 18홀', activities: ['호텔 조식 후 전용 선착장 이동', '스피드보트 타고 동나이강을 건너 정산 CC 도착 (이색 체험)', '정산 CC 18홀 라운딩 (한국식 잔디 & 최상급 관리)', '클럽하우스 중식 및 스피드보트로 호치민 복귀', '전신 스포츠 마사지 90분 & 저녁 특식'] },
      { day: 3, title: '롱탄 CC 18홀 챔피언십 코스', activities: ['호텔 조식 후 롱탄 CC 출발', '롱탄 CC 레이크 & 힐 18홀 라운딩', '라운딩 후 호치민 시내 복귀', '석식: 최고급 생선회 & 랍스터 씨푸드 파티', '호치민 2군 타오디엔 펍 투어'] },
      { day: 4, title: '송베 CC 18홀 & 환송 만찬', activities: ['호텔 조식 후 송베 CC 이동', '송베 CC 로터스/사막 코스 18홀 라운딩', '클럽하우스 중식 후 시내 복귀 및 쇼핑', '굿바이 갈라 디너 & 와인 파티'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 레이트 체크아웃', '호치민 시내 기념품 쇼핑 및 공항 샌딩'] }
    ],
    options: [
      { id: 'opt-2-1', category: 'golf', name: '4개 골프장 그린피 (총 72홀)', description: '떤선녓 + 정산 + 롱탄 + 송베 매일 18홀 그린피', priceUSD: 590, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-2-2', category: 'golf', name: '전동카트 & 1인 1캐디 피 (4회)', description: '전 일정 카트비 및 1인 1캐디 피 포함', priceUSD: 160, isDefaultIncluded: true },
      { id: 'opt-2-3', category: 'vehicle', name: '정산 CC 왕복 전용 스피드보트', description: '동나이강 럭셔리 스피드보트 왕복 승선권', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-2-4', category: 'hotel', name: '호치민 5성급 호텔 숙박 (4박/2인1실)', description: '호텔 조식 뷔페 및 수영장/사우나 이용', priceUSD: 360, isDefaultIncluded: true },
      { id: 'opt-2-5', category: 'vehicle', name: '전 일정 전용 16인승/VIP 리무진', description: '기사 포함 단독 전용 차량 및 유류비/통행료 일체', priceUSD: 120, isDefaultIncluded: true },
      { id: 'opt-2-6', category: 'activity', name: '매일 라운딩 후 전신 마사지 (90분 3회)', description: '피로회복 전문 오일 & 핫스톤 마사지', priceUSD: 80, isDefaultIncluded: true },
      { id: 'opt-2-7', category: 'hotel', name: '단독 럭셔리 프라이빗 풀빌라 업그레이드', description: '호텔 대신 4베드룸 단독 풀빌라 전체 대여 (팀당)', priceUSD: 220, isDefaultIncluded: false },
      { id: 'opt-2-8', category: 'guide', name: '한국인 골프 전문 투어 매니저 동행', description: '전 일정 티타임 조율 및 VIP 의전 전담', priceUSD: 70, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-3',
    title: '붕따우 더 그랜드 호짬 카지노 & 세계 100대 블러프 골프',
    subtitle: '더 블러프 CC 36홀 + 붕따우 파라다이스 CC 18홀 & 5성급 카지노 리조트',
    location: '붕따우',
    duration: '4박 5일',
    golfCourses: ['더 블러프 호짬 스트립 CC (36홀)', '붕따우 파라다이스 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
    ],
    basePriceUSD: 1290,
    summary: '그렉 노먼이 설계한 세계 100대 링크스 코스 "더 블러프 CC"에서 바다를 조망하며 즐기는 럭셔리 골프와 5성급 카지노 복합 리조트의 환상적인 휴양 패키지입니다.',
    highlightBadges: ['4박 5일', '세계 100대 코스', '5성급 카지노 리조트', '오션뷰 풀사이드 BBQ'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 호짬 리조트 이동', activities: ['호치민 공항 전용 픽업 미팅 후 붕따우 호짬으로 이동 (약 2시간)', '5성급 더 그랜드 호짬 카지노 리조트 체크인', '인피니티 풀 수영 및 전용 비치 산책', '석식: 리조트 내 프리미엄 인터내셔널 뷔페 & 카지노 나이트'] },
      { day: 2, title: '더 블러프 CC 1차 18홀 라운딩', activities: ['리조트 조식 후 골프장 이동 (리조트 바로 옆 3분 거리)', '세계 100대 명문 더 블러프 CC 18홀 라운딩 (오션뷰 링크스 코스)', '인피니티 레스토랑 중식', '리조트 스파 & 사우나 휴식', '석식: 호짬 로컬 활어 씨푸드 바베큐 만찬'] },
      { day: 3, title: '더 블러프 CC 2차 18홀 라운딩', activities: ['리조트 조식 뷔페', '더 블러프 CC 2차 18홀 라운딩 (역방향 또는 다른 티박스 공략)', '클럽하우스 중식 및 해변 카바나 휴식', '붕따우 시내 예수상 & 등대 관광', '석식: 붕따우 야시장 해산물 특식'] },
      { day: 4, title: '붕따우 파라다이스 CC 18홀 & 호치민 복귀', activities: ['체크아웃 후 붕따우 파라다이스 CC 이동', '해변 소나무 숲길을 따라 펼쳐진 파라다이스 CC 18홀 라운딩', '중식 후 호치민 시내로 이동 (호치민 1군 호텔 1박)', '호치민 1군 명품 쇼핑 및 루프탑 바'] },
      { day: 5, title: '호치민 시내 관광 & 공항 샌딩', activities: ['호텔 조식 후 체크아웃', '호치민 시내 주요 명소 관광 & 기념품 쇼핑', '공항 샌딩 후 귀국'] }
    ],
    options: [
      { id: 'opt-3-1', category: 'golf', name: '더 블러프 CC 2회 (36홀) + 파라다이스 1회 (18홀) 그린피', description: '총 54홀 그린피 전액 포함', priceUSD: 520, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-3-2', category: 'golf', name: '전동카트 & 1인 1캐디 피', description: '전 일정 카트비 및 캐디비 일체 포함', priceUSD: 120, isDefaultIncluded: true },
      { id: 'opt-3-3', category: 'hotel', name: '5성급 더 그랜드 호짬 리조트 3박 + 호치민 1박', description: '전 일정 조식 뷔페 및 리조트 부대시설 이용', priceUSD: 420, isDefaultIncluded: true },
      { id: 'opt-3-4', category: 'vehicle', name: '전 일정 단독 전용 리무진 밴 (호치민-붕따우 왕복 포함)', description: '전 일정 기사/유류비/통행료 포함', priceUSD: 130, isDefaultIncluded: true },
      { id: 'opt-3-5', category: 'meal', name: '호짬 활어 씨푸드 & 특식 석식 (4회)', description: '대형 바닷가재, 칠리크랩, 리조트 디너 뷔페', priceUSD: 90, isDefaultIncluded: true },
      { id: 'opt-3-6', category: 'activity', name: '카지노 웰컴 칩 바우처 ($50 상당)', description: '더 그랜드 호짬 카지노 게임 이용 바우처', priceUSD: 50, isDefaultIncluded: false },
      { id: 'opt-3-7', category: 'hotel', name: '오션뷰 스위트룸 업그레이드 (팀당)', description: '남중국해가 파노라마로 펼쳐지는 스위트 객실', priceUSD: 150, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-4',
    title: '호치민+붕따우 콤보 4박 5일 오션 & 시티 3색 골프',
    subtitle: '더 블러프 CC + 롱탄 CC + 떤선녓 CC (붕따우 2박 + 호치민 2박)',
    location: '호치민+붕따우',
    duration: '4박 5일',
    golfCourses: ['더 블러프 호짬 CC (18홀)', '롱탄 CC (18홀)', '떤선녓 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
      'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800'
    ],
    basePriceUSD: 1240,
    summary: '호치민의 화려한 도심 골프와 붕따우의 시원한 오션뷰 링크스 코스를 한 번에 누리는 완벽한 2-in-1 콤비네이션 상품입니다.',
    highlightBadges: ['4박 5일', '시티+오션 3색 골프', '붕따우 2박+호치민 2박', '최고 인기 베스트셀러'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 붕따우 해변 이동', activities: ['호치민 공항 픽업 후 붕따우 해변 리조트로 이동', '붕따우 풀빌라 또는 5성급 호텔 체크인', '해변 노을 감상 및 웰컴 씨푸드 디너', '붕따우 비치 프론트 나이트 산책'] },
      { day: 2, title: '더 블러프 호짬 CC 18홀 라운딩', activities: ['리조트 조식 후 더 블러프 CC로 이동', '더 블러프 CC 18홀 라운딩', '클럽하우스 중식 및 리조트 복귀', '전신 마사지 90분 & 바베큐 특식'] },
      { day: 3, title: '롱탄 CC 18홀 & 호치민 도심 입성', activities: ['붕따우 체크아웃 후 롱탄 CC로 이동', '롱탄 CC 18홀 라운딩', '호치민 1군 5성급 호텔 체크인', '호치민 야시장 & 나이트 시티투어'] },
      { day: 4, title: '떤선녓 CC 18홀 & 명품 쇼핑', activities: ['호텔 조식 후 떤선녓 CC 18홀 라운딩', '클럽하우스 중식 후 시내 쇼핑 투어', '굿바이 만찬: 호치민 프리미엄 비프 스테이크'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 체크아웃', '호치민 명소 관광 및 공항 샌딩'] }
    ],
    options: [
      { id: 'opt-4-1', category: 'golf', name: '3대 명문 코스 그린피 54홀 (더블러프+롱탄+떤선녓)', description: '각 골프장 주중/주말 정규 18홀 그린피', priceUSD: 490, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-4-2', category: 'golf', name: '전동카트 & 1인 1캐디 피', description: '전 일정 2인 1카트 & 1인 1캐디 서비스', priceUSD: 120, isDefaultIncluded: true },
      { id: 'opt-4-3', category: 'hotel', name: '붕따우 리조트 2박 + 호치민 5성급 2박', description: '전 일정 조식 뷔페 포함 (2인 1실)', priceUSD: 380, isDefaultIncluded: true },
      { id: 'opt-4-4', category: 'vehicle', name: '전 일정 단독 전용 리무진 밴 (지역간 이동 일체)', description: '공항-붕따우-골프장-호치민-공항 풀코스', priceUSD: 140, isDefaultIncluded: true },
      { id: 'opt-4-5', category: 'guide', name: '한국어 가이드 전 일정 동행', description: '전 일정 이동 및 체크인/골프 백 드랍 케어', priceUSD: 60, isDefaultIncluded: true },
      { id: 'opt-4-6', category: 'meal', name: '지역별 대표 미식 특식 4회', description: '붕따우 씨푸드, 롱탄 특식, 호치민 바베큐 등', priceUSD: 80, isDefaultIncluded: true },
      { id: 'opt-4-7', category: 'activity', name: 'VIP 마사지 90분 (2회)', description: '붕따우 1회 + 호치민 1회 힐링 마사지', priceUSD: 50, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-5',
    title: '달랏 영원한 봄의 도시 18~24°C 힐링 3색 골프',
    subtitle: '달랏 팔레스 CC + SAM 투옌람 CC + 달랏 1200 CC & 5성급 헤리티지 리조트',
    location: '달랏',
    duration: '4박 5일',
    golfCourses: ['달랏 팔레스 헤리티지 CC (18홀)', 'SAM 투옌람 CC (18홀)', '더 달랏 1200 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
      'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800'
    ],
    basePriceUSD: 1190,
    summary: '해발 1,500m 고원에 위치하여 연중 18~24°C의 쾌적하고 서늘한 날씨! 땀 흘리지 않고 시원한 바람을 맞으며 즐기는 베트남 유일의 알프스풍 힐링 골프입니다.',
    highlightBadges: ['4박 5일', '연중 18~24°C 봄날씨', '고원 3색 54홀', '달랏 5성급 리조트'],
    itinerary: [
      { day: 1, title: '달랏 리엔크엉 공항 도착 & 체크인', activities: ['달랏 공항 도착 후 전용 차량 미팅', '프랑스풍 5성급 아나만다라 리조트 체크인', '달랏 시내 쑤언흐엉 호수 산책 및 티타임', '석식: 달랏 특산 아티초크 갈비탕 & 와규 특식', '달랏 낭만 야시장 투어'] },
      { day: 2, title: '1922년 역사와 전통의 달랏 팔레스 CC 18홀', activities: ['호텔 조식 후 달랏 팔레스 CC로 이동', '황제의 골프장 달랏 팔레스 CC 18홀 라운딩 (소나무 숲 코스)', '클럽하우스 중식', '다딴라 폭포 및 루지 체험 관광', '석식: 달랏 로컬 와인 & 훈제 바베큐 만찬', '달랏 고원 힐링 허브 스파 (90분)'] },
      { day: 3, title: '호수 뷰 SAM 투옌람 CC 18홀 & 케이블카', activities: ['리조트 조식 후 SAM 투옌람 CC 이동', '투옌람 호수를 둘러싼 명품 SAM 투옌람 CC 18홀 라운딩', '클럽하우스 중식', '죽림선원 케이블카 관람 및 린푸옥 사원 투어', '석식: 달랏 철판 구이 & 고원 쌈밥 특식'] },
      { day: 4, title: '더 달랏 1200 CC 18홀 & 와이너리 투어', activities: ['리조트 조식 후 더 달랏 1200 CC 이동', '해발 1200m에 위치한 챔피언십 더 달랏 1200 CC 18홀 라운딩', '클럽하우스 중식', '달랏 와인 양조장 방문 및 와인 시음회', '굿바이 디너: 프렌치 정통 코스 요리'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['리조트 조식 및 체크아웃', '랑비앙 마운틴 전망대 관광', '기념품(달랏 커피, 건과일, 와인) 쇼핑 후 공항 샌딩'] }
    ],
    options: [
      { id: 'opt-5-1', category: 'golf', name: '달랏 3대 명문 코스 그린피 54홀', description: '달랏 팔레스 + SAM 투옌람 + 더 달랏 1200', priceUSD: 460, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-5-2', category: 'golf', name: '전동카트 & 1인 1캐디 피', description: '전 일정 카트비 및 1인 1캐디 서비스', priceUSD: 120, isDefaultIncluded: true },
      { id: 'opt-5-3', category: 'hotel', name: '달랏 5성급 리조트 4박 (2인 1실)', description: '아나만다라 빌라 / 달랏 팔레스 헤리티지 급', priceUSD: 360, isDefaultIncluded: true },
      { id: 'opt-5-4', category: 'vehicle', name: '전 일정 달랏 전용 VIP 리무진 밴', description: '공항 픽업/샌딩 + 골프장 + 관광 전용 기사 포함', priceUSD: 110, isDefaultIncluded: true },
      { id: 'opt-5-5', category: 'guide', name: '한국어 전문 가이드 전 일정 동행', description: '골프 체크인 및 달랏 맞춤 관광 안내', priceUSD: 60, isDefaultIncluded: true },
      { id: 'opt-5-6', category: 'meal', name: '달랏 특산 미식 & 와인 특식 4회', description: '아티초크 갈비탕, 달랏 와인 바베큐, 프렌치 디너 등', priceUSD: 80, isDefaultIncluded: true },
      { id: 'opt-5-7', category: 'activity', name: '달랏 와이너리 투어 & 와인 시음', description: '달랏 정통 와인 양조장 투어 및 프리미엄 시음', priceUSD: 40, isDefaultIncluded: false },
      { id: 'opt-5-8', category: 'activity', name: '달랏 고원 힐링 허브 스파 (90분 2회)', description: '고원 천연 허브를 이용한 릴랙싱 스파', priceUSD: 60, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-6',
    title: '달랏 VIP 헤리티지 팰리스 & 호수뷰 4회 라운딩 휴양',
    subtitle: '달랏 팔레스 CC 2회 + SAM 투옌람 CC 2회 (총 72홀) & 프렌치 독채 빌라',
    location: '달랏',
    duration: '4박 5일',
    golfCourses: ['달랏 팔레스 헤리티지 CC (36홀)', 'SAM 투옌람 CC (36홀)'],
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
    ],
    basePriceUSD: 1350,
    summary: '달랏의 양대 최고 명문 코스에서 집중적으로 4회(72홀) 라운딩하며, 프랑스 식민지 시절의 고풍스러운 독채 프렌치 빌라에서 럭셔리한 휴식을 즐기는 황제 골프 코스입니다.',
    highlightBadges: ['4박 5일', '명문 코스 72홀 집중', '프렌치 헤리티지 빌라', '전 일정 프라이빗 케어'],
    itinerary: [
      { day: 1, title: '달랏 도착 & 프렌치 빌라 입실', activities: ['달랏 리엔크엉 공항 VIP 단독 픽업', '헤리티지 프렌치 럭셔리 빌라 체크인', '쑤언흐엉 호수 뷰 카페 애프터눈 티', '석식: 프랑스풍 퐁듀 & 와인 스페셜 만찬'] },
      { day: 2, title: '달랏 팔레스 CC 1차 18홀 라운딩', activities: ['빌라 조식 후 달랏 팔레스 CC 이동', '달랏 팔레스 CC 1차 18홀 라운딩', '클럽하우스 중식 및 빌라 휴식', '온천 스파 & 전신 마사지 90분', '석식: 달랏 흑돼지 참숯 바베큐 파티'] },
      { day: 3, title: 'SAM 투옌람 CC 1차 18홀 라운딩', activities: ['빌라 조식 후 SAM 투옌람 CC 이동', 'SAM 투옌람 CC 18홀 라운딩 (호수 전경 코스)', '클럽하우스 중식', '투옌람 호수 전용 보트 유람 및 힐링 산책', '석식: 철판 스테이크 & 달랏 수제 맥주'] },
      { day: 4, title: '달랏 팔레스 CC 2차 18홀 라운딩 & 환송연', activities: ['빌라 조식 후 달랏 팔레스 CC 2차 라운딩', '18홀 라운딩 후 클럽하우스 중식', '달랏 야시장 및 프렌치 베이커리 투어', '굿바이 갈라 디너 & 와인 파티'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['빌라 조식 후 여유로운 체크아웃', '커피 농장 방문 (루왁/위즐 커피 시음)', '공항 샌딩 및 출국'] }
    ],
    options: [
      { id: 'opt-6-1', category: 'golf', name: '달랏 팔레스 2회 + 투옌람 2회 그린피 (총 72홀)', description: '정규 18홀 그린피 4회분 전액', priceUSD: 560, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-6-2', category: 'golf', name: '전동카트 & 1인 1캐디 피 (4회)', description: '전 일정 2인 1카트 & 1인 1캐디 피', priceUSD: 160, isDefaultIncluded: true },
      { id: 'opt-6-3', category: 'hotel', name: '5성급 독채 프렌치 빌라 숙박 (4박)', description: '전 일정 조식 포함 및 전용 버틀러 서비스', priceUSD: 400, isDefaultIncluded: true },
      { id: 'opt-6-4', category: 'vehicle', name: '달랏 전용 VIP 리무진 밴', description: '전 일정 기사 및 유류비 일체', priceUSD: 110, isDefaultIncluded: true },
      { id: 'opt-6-5', category: 'meal', name: '특식 디너 4회 (와인 포함)', description: '프렌치 퐁듀, 흑돼지 바베큐, 스테이크 등', priceUSD: 90, isDefaultIncluded: true },
      { id: 'opt-6-6', category: 'activity', name: '달랏 천연 온천 & 허브 마사지 (120분)', description: '고급 온천욕 및 전신 아로마 스파', priceUSD: 60, isDefaultIncluded: true },
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
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800'
    ],
    basePriceUSD: 1380,
    summary: '열정적인 대도시 호치민의 명문 골프장과 시원한 고원 휴양지 달랏의 힐링 골프장을 국내선 항공으로 편리하게 연결한 최고의 복합 패키지입니다.',
    highlightBadges: ['4박 5일', '호치민 2박 + 달랏 2박', '국내선 항공권 포함', '도심+고원 완벽 조화'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 시티 체크인', activities: ['호치민 떤선녓 공항 픽업', '호치민 1군 5성급 호텔 체크인', '석식: 사이공 강변 고급 레스토랑 디너', '호치민 시티 야경 감상 및 자유 시간'] },
      { day: 2, title: '호치민 롱탄 CC 18홀 라운딩 & 달랏 항공 이동', activities: ['호텔 조식 후 롱탄 CC 이동', '롱탄 CC 18홀 라운딩 후 샤워 및 중식', '떤선녓 국내선 공항 이동 후 달랏행 항공 탑승 (약 50분 소요)', '달랏 공항 픽업 후 5성급 리조트 체크인', '석식: 달랏 와인 & 로컬 특식'] },
      { day: 3, title: '달랏 팔레스 CC 18홀 & 시내 투어', activities: ['리조트 조식 후 달랏 팔레스 CC 이동', '달랏 팔레스 CC 18홀 라운딩 (상쾌한 18도 기온)', '클럽하우스 중식', '달랏 사랑의 계곡 및 크레이지 하우스 관광', '석식: 달랏 야시장 특식 및 전신 마사지 90분'] },
      { day: 4, title: 'SAM 투옌람 CC 18홀 & 힐링 휴식', activities: ['리조트 조식 후 SAM 투옌람 CC 이동', 'SAM 투옌람 CC 18홀 라운딩', '클럽하우스 중식 및 리조트 복귀', '달랏 커피 농장 투어', '굿바이 디너: 고원 특선 코스 요리'] },
      { day: 5, title: '달랏 체크아웃 & 귀국', activities: ['리조트 조식 후 체크아웃', '달랏 공항 이동 및 호치민 경유 / 인천행 귀국'] }
    ],
    options: [
      { id: 'opt-7-1', category: 'golf', name: '호치민 롱탄 18H + 달랏 팔레스 18H + 투옌람 18H 그린피', description: '3개 명문 골프장 총 54홀 그린피', priceUSD: 470, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-7-2', category: 'golf', name: '전동카트 & 1인 1캐디 피 (3회)', description: '전 일정 카트비 및 캐디비 일체', priceUSD: 120, isDefaultIncluded: true },
      { id: 'opt-7-3', category: 'etc', name: '호치민-달랏 편도 국내선 항공권 (수하물 20kg+골프백)', description: '베트남항공 국내선 항공권 및 골프백 위탁 수하물', priceUSD: 110, isDefaultIncluded: true },
      { id: 'opt-7-4', category: 'hotel', name: '호치민 5성급 2박 + 달랏 5성급 2박 (2인 1실)', description: '전 일정 조식 뷔페 포함', priceUSD: 380, isDefaultIncluded: true },
      { id: 'opt-7-5', category: 'vehicle', name: '호치민 & 달랏 각 지역 단독 전용 리무진', description: '공항 픽업/샌딩 + 골프장 + 시내 전용 차량', priceUSD: 140, isDefaultIncluded: true },
      { id: 'opt-7-6', category: 'guide', name: '지역별 전담 한국어 가이드', description: '호치민 및 달랏 현지 가이드 풀케어', priceUSD: 80, isDefaultIncluded: true },
      { id: 'opt-7-7', category: 'meal', name: '호치민 & 달랏 대표 특식 4회', description: '지역별 대표 미식 석식 코스', priceUSD: 80, isDefaultIncluded: true }
    ]
  },
  {
    id: 'pkg-8',
    title: '호치민 실속 올인클루시브 4박 5일 가성비 3색 골프',
    subtitle: '송베 CC + 동나이 CC + 떤선녓 CC (4성급 중심가 호텔 & 실속 풀패키지)',
    location: '호치민',
    duration: '4박 5일',
    golfCourses: ['송베 CC (18홀)', '동나이 CC (18홀)', '떤선녓 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1592919505780-30395071b483?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1592919505780-30395071b483?q=80&w=800',
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800'
    ],
    basePriceUSD: 890,
    summary: '부담 없는 합리적인 가격에 호치민 인기 골프장 3곳을 알차게 라운딩할 수 있는 실속파 골퍼를 위한 넘버원 가성비 올인클루시브 상품입니다.',
    highlightBadges: ['4박 5일', '실속 가성비 No.1', '3회 54홀 올포함', '호치민 시내 4성급'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 시내 체크인', activities: ['호치민 공항 픽업 후 4성급 중심가 호텔 체크인', '석식: 베트남 대표 쌀국수 & 분짜 로컬 특식', '호치민 여행자 거리(부이비엔) 자유 탐방'] },
      { day: 2, title: '송베 CC 18홀 & 마사지', activities: ['호텔 조식 후 송베 CC 이동 (약 40분)', '송베 CC 18홀 라운딩', '클럽하우스 중식 및 시내 복귀', '발 & 전신 마사지 90분', '석식: 한국인 맞춤 무제한 삼겹살 특식'] },
      { day: 3, title: '동나이 CC 18홀 호수 코스', activities: ['호텔 조식 후 동나이 CC 출발', '동나이 CC 18홀 라운딩 (아름다운 호수 전경)', '클럽하우스 중식 후 시내 복귀', '벤탄 시장 및 사이공 센터 쇼핑', '석식: 베트남 로컬 해산물 요리'] },
      { day: 4, title: '떤선녓 CC 18홀 & 굿바이 디너', activities: ['호텔 조식 후 떤선녓 CC 이동', '떤선녓 CC 18홀 라운딩', '샤워 후 시내 복귀', '굿바이 디너: 숯불 바베큐', '사이공 스카이덱 야경 감상'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 체크아웃', '시내 마트 쇼핑 후 공항 샌딩'] }
    ],
    options: [
      { id: 'opt-8-1', category: 'golf', name: '송베 18H + 동나이 18H + 떤선녓 18H 그린피 (총 54홀)', description: '3개 골프장 주중 정규 그린피 일체', priceUSD: 380, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-8-2', category: 'golf', name: '전동카트 & 1인 1캐디 피', description: '전 일정 2인 1카트 & 1인 1캐디 피', priceUSD: 110, isDefaultIncluded: true },
      { id: 'opt-8-3', category: 'hotel', name: '호치민 시내 4성급 호텔 숙박 (4박/2인1실)', description: '호텔 조식 뷔페 포함 (중심가 위치)', priceUSD: 220, isDefaultIncluded: true },
      { id: 'opt-8-4', category: 'vehicle', name: '전 일정 단독 전용 차량 (기사/유류비 포함)', description: '공항 픽업/샌딩 및 골프장 이동 전용차량', priceUSD: 90, isDefaultIncluded: true },
      { id: 'opt-8-5', category: 'meal', name: '실속 석식 4회 (삼겹살, 해산물, 바베큐 등)', description: '한국인 입맛에 딱 맞춘 알찬 석식', priceUSD: 60, isDefaultIncluded: true },
      { id: 'opt-8-6', category: 'activity', name: '전신 마사지 90분 (1회)', description: '라운딩 후 개운한 전신 릴랙싱 마사지', priceUSD: 30, isDefaultIncluded: true },
      { id: 'opt-8-7', category: 'hotel', name: '5성급 호텔로 업그레이드 (4박)', description: '4성급 대신 1군 5성급 호텔로 업그레이드', priceUSD: 140, isDefaultIncluded: false },
      { id: 'opt-8-8', category: 'guide', name: '한국어 가이드 전 일정 동행', description: '전 일정 전담 가이드 케어 추가', priceUSD: 50, isDefaultIncluded: false }
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
    basePriceUSD: 1320,
    summary: '우리 팀만을 위한 대형 프라이빗 독채 풀빌라에서 수영과 BBQ 풀파티를 즐기고, 더 블러프 CC와 파라다이스 CC에서 여유로운 라운딩을 펼치는 동반자/비즈니스 맞춤 최고급 여행입니다.',
    highlightBadges: ['4박 5일', '단독 독채 풀빌라', '통돼지 바베큐 풀파티', '프라이빗 골프 휴양'],
    itinerary: [
      { day: 1, title: '호치민 도착 & 붕따우 독채 풀빌라 입실', activities: ['호치민 공항 전용 픽업 미팅 후 붕따우로 이동', '붕따우 최고급 프라이빗 독채 풀빌라 체크인 (대형 개인 수영장, 노래방 완비)', '풀빌라 웰컴 풀사이드 파티', '석식: 풀빌라 전담 셰프의 통돼지 바베큐 & 씨푸드 그릴'] },
      { day: 2, title: '더 블러프 호짬 CC 18홀 라운딩', activities: ['풀빌라 조식 후 더 블러프 CC로 이동', '세계 100대 코스 더 블러프 CC 18홀 라운딩', '클럽하우스 중식 및 풀빌라 복귀', '프라이빗 풀빌라 수영 & 자유 휴식', '석식: 붕따우 최고급 랍스터 & 다금바리 회 파티'] },
      { day: 3, title: '붕따우 파라다이스 CC 1차 18홀 라운딩', activities: ['풀빌라 조식 후 파라다이스 CC 이동', '파라다이스 CC 18홀 라운딩', '중식 후 붕따우 케이블카 및 호마이 파크 관광', '풀빌라 출장 전신 마사지 120분 케어', '석식: 베트남 로컬 바베큐 & 맥주 파티'] },
      { day: 4, title: '붕따우 파라다이스 CC 2차 18홀 & 호치민 이동', activities: ['풀빌라 조식 후 파라다이스 CC 2차 18홀 라운딩', '샤워 후 호치민 시내로 이동', '호치민 5성급 호텔 체크인 및 쇼핑', '굿바이 갈라 디너 & 사이공 스카이 라운지'] },
      { day: 5, title: '체크아웃 & 귀국', activities: ['호텔 조식 및 여유로운 오전 휴식 후 체크아웃', '호치민 시내 관광 및 공항 샌딩 (귀국)'] }
    ],
    options: [
      { id: 'opt-9-1', category: 'golf', name: '더 블러프 18H + 파라다이스 36H 그린피 (총 54홀)', description: '3회 54홀 그린피 전액', priceUSD: 480, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-9-2', category: 'golf', name: '전동카트 & 1인 1캐디 피', description: '전 일정 2인 1카트 & 1인 1캐디 피', priceUSD: 120, isDefaultIncluded: true },
      { id: 'opt-9-3', category: 'hotel', name: '럭셔리 독채 프라이빗 풀빌라 3박 + 호치민 1박', description: '개인 수영장, 침실 4~5개 독채 전체 사용 (조식 포함)', priceUSD: 440, isDefaultIncluded: true },
      { id: 'opt-9-4', category: 'vehicle', name: '전 일정 단독 전용 VIP 리무진 밴', description: '호치민-붕따우 왕복 및 전 일정 전용 기사', priceUSD: 130, isDefaultIncluded: true },
      { id: 'opt-9-5', category: 'meal', name: '풀빌라 전담 셰프 통돼지 바베큐 & 랍스터 만찬', description: '풀사이드 특선 통돼지 구이 및 해산물 파티 (4회)', priceUSD: 100, isDefaultIncluded: true },
      { id: 'opt-9-6', category: 'activity', name: '풀빌라 출장 VIP 전신 마사지 (120분)', description: '풀빌라에서 편안하게 받는 프라이빗 출장 스파', priceUSD: 50, isDefaultIncluded: true },
      { id: 'opt-9-7', category: 'guide', name: '한국어 VIP 가이드 전 일정 풀케어', description: '골프 체크인 및 풀빌라 바베큐 파티 지원', priceUSD: 60, isDefaultIncluded: false }
    ]
  },
  {
    id: 'pkg-10',
    title: '달랏+붕따우 알프스 & 오션 4박 5일 산과 바다 3색 골프',
    subtitle: '달랏 팔레스 CC + SAM 투옌람 CC + 붕따우 더 블러프 CC (고원과 해변의 만남)',
    location: '달랏+붕따우',
    duration: '4박 5일',
    golfCourses: ['달랏 팔레스 CC (18홀)', 'SAM 투옌람 CC (18홀)', '더 블러프 호짬 CC (18홀)'],
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800',
    detailImages: [
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
      'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800'
    ],
    basePriceUSD: 1420,
    summary: '해발 1,500m 시원한 달랏 고원에서 2일간 상쾌한 힐링 골프를 즐기고, 붕따우 해변으로 내려와 세계 100대 더 블러프 CC에서 남중국해 바다를 가르는 이색 하이브리드 투어입니다.',
    highlightBadges: ['4박 5일', '달랏 2박 + 붕따우 2박', '산과 바다 3색 골프', '국내 최고 이색 코스'],
    itinerary: [
      { day: 1, title: '달랏 도착 & 고원 힐링 체크인', activities: ['달랏 공항 픽업 미팅 후 5성급 리조트 체크인', '달랏 쑤언흐엉 호수 산책 및 힐링 티타임', '석식: 달랏 특선 와규 & 와인 디너', '달랏 야시장 투어'] },
      { day: 2, title: '달랏 팔레스 CC 18홀 & SAM 투옌람 뷰', activities: ['리조트 조식 후 달랏 팔레스 CC 18홀 라운딩', '클럽하우스 중식 및 달랏 주요 명소 관광', '달랏 힐링 허브 스파 (90분)', '석식: 달랏 흑돼지 참숯 바베큐'] },
      { day: 3, title: 'SAM 투옌람 CC 18홀 & 붕따우 해변 이동', activities: ['리조트 조식 후 SAM 투옌람 CC 18홀 라운딩', '클럽하우스 중식 후 붕따우 호짬 리조트로 전용 차량 이동', '5성급 더 그랜드 호짬 리조트 체크인', '석식: 붕따우 활어 씨푸드 만찬 & 카지노'] },
      { day: 4, title: '더 블러프 호짬 CC 18홀 & 오션 나이트', activities: ['리조트 조식 후 더 블러프 CC 18홀 라운딩 (바다 조망 링크스 코스)', '인피니티 레스토랑 중식 및 해변 수영', '석식: 리조트 풀사이드 디너 뷔페'] },
      { day: 5, title: '체크아웃 & 호치민 공항 샌딩', activities: ['리조트 조식 후 체크아웃', '호치민 시내로 이동 후 쇼핑', '떤선녓 공항 샌딩 및 출국'] }
    ],
    options: [
      { id: 'opt-10-1', category: 'golf', name: '달랏 팔레스 18H + SAM 투옌람 18H + 더 블러프 18H 그린피', description: '고원 2회 + 해변 1회 총 54홀 정규 그린피', priceUSD: 510, isDefaultIncluded: true, isRequired: true },
      { id: 'opt-10-2', category: 'golf', name: '전동카트 & 1인 1캐디 피', description: '전 일정 2인 1카트 & 1인 1캐디 피', priceUSD: 120, isDefaultIncluded: true },
      { id: 'opt-10-3', category: 'hotel', name: '달랏 5성급 리조트 2박 + 붕따우 호짬 리조트 2박', description: '전 일정 5성급 조식 포함 숙박', priceUSD: 420, isDefaultIncluded: true },
      { id: 'opt-10-4', category: 'vehicle', name: '전 일정 단독 전용 VIP 리무진 밴 (달랏-붕따우 이동 포함)', description: '전용 기사, 유류비, 통행료 일체', priceUSD: 160, isDefaultIncluded: true },
      { id: 'opt-10-5', category: 'guide', name: '한국어 전문 가이드 전 일정 동행', description: '골프 및 지역 이동 풀케어', priceUSD: 80, isDefaultIncluded: true },
      { id: 'opt-10-6', category: 'meal', name: '고원 특식 & 해변 씨푸드 석식 4회', description: '달랏 와인 바베큐, 붕따우 랍스터 만찬 등', priceUSD: 90, isDefaultIncluded: true },
      { id: 'opt-10-7', category: 'activity', name: '달랏 고원 스파 & 붕따우 마사지 패키지', description: '달랏 90분 + 붕따우 90분 총 2회 마사지', priceUSD: 60, isDefaultIncluded: false }
    ]
  }
];

