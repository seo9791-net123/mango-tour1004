
import { Product, VideoItem, CommunityPost, PageContent, PopupNotification } from './types';

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
    price: 24300000,
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
    price: 28500000,
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
    price: 21000000,
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
    price: 22500000,
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
    price: 32500000,
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
    price: 17500000,
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
    price: 25600000,
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
    price: 15900000,
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
    price: 29800000,
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
    price: 14500000,
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
  { label: '여행 만들기', icon: 'https://cdn-icons-png.flaticon.com/512/8212/8212613.png' },
  { label: '동영상', icon: 'https://cdn-icons-png.flaticon.com/512/3670/3670163.png' },
  { label: '커뮤니티', icon: 'https://cdn-icons-png.flaticon.com/512/2822/2822949.png' },
  { label: '골프', icon: 'https://cdn-icons-png.flaticon.com/512/1039/1039328.png' },
  { label: '호텔&빌라', icon: 'https://cdn-icons-png.flaticon.com/512/2903/2903388.png' },
  { label: '관광', icon: 'https://cdn-icons-png.flaticon.com/512/2929/2929949.png' },
  { label: '비지니스', icon: 'https://cdn-icons-png.flaticon.com/512/3281/3281307.png' },
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
      { title: '월간 골프 챌린지', content: '매달 다른 명문 골프장에서 개최되는 아마추어 골프 대회로 푸짐한 경품과 네트워킹 시간을 제공합니다.' },
      { title: '얼리버드 프로모션', content: '3개월 전 예약 시 5성급 호텔 업그레이드 또는 카트비 무료 등 특별한 가격 혜택을 드립니다.' },
      { title: '신규 지역 오픈 이벤트', content: '달랏, 다낭 등 신규 서비스 지역 오픈 시 MANGO TOUR 회원 전용 특별 할인가를 적용해 드립니다.' }
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
