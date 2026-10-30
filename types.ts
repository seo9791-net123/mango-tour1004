
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  nickname?: string;
}

export interface MenuItem {
  label: string;
  icon: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number; // in USD or KRW
  location: string;
  duration: string;
  type: 'golf' | 'tour' | 'hotel';
  itinerary?: Array<{ day: number; activities: string[] }>;
  detailImages?: string[];
  detailContent?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string; // URL or Embed source
  category?: '골프' | '여행' | '먹거리' | '기타';
  thumbnail?: string; // Optional custom or extracted poster thumbnail
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  isAdmin?: boolean;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  image?: string;     // Added for photo uploads
  comments: Comment[]; // Added for reviews/comments
  views: number;      // Added for view count
  isPrivate?: boolean;
  password?: string;
  adminReply?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface PageSlide {
  image: string;
  description: string;
}

export interface PageSection {
  title: string;
  content: string;
  detailImages?: string[]; // Multiple images for the detail popup
  detailContent?: string; // Rich text/detailed content for the popup
}

// Updated Interface for Dynamic Page Content with manageable sections
export interface PageContent {
  id: string;         // e.g., 'business', 'golf', 'food'
  title: string;      // Internal name
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  introTitle: string;
  introText: string;
  introImage: string; 
  galleryImages: string[];
  sections: PageSection[]; // Manageable text blocks for the admin
  slides?: PageSlide[];    // Optional gallery slides
}

export interface AppSettings {
  geminiApiKey?: string;
  isAIPublic: boolean;
}

export interface PopupNotification {
  id: string;
  title: string;
  content: string;
  image?: string;
  isActive: boolean;
  link?: string;
}

// AI Trip Planner Types
export interface TripPlanRequest {
  destination: string;
  theme: string;
  accommodation: string;
  duration: string;
  pax: number;
  guide: '예' | '아니오';
  vehicle: string;
  remarks?: string;
}

export interface TripPlanResult {
  itinerary: Array<{ day: number; activities: string[] }>;
  costBreakdown: Array<{ item: string; cost: string }>;
  totalCost: string;
  summary: string;
  remarks?: string;
  options?: {
    guide: string;
    vehicle: string;
  };
}

export interface OptionChoiceItem {
  id: string;
  name: string;
  category: 'golf' | 'hotel' | 'vehicle' | 'meal' | 'activity' | 'guide' | 'flight' | 'etc';
  location?: string; // '호치민', '붕따우', '달랏', '전체'
  priceDeltaUSD: number; // Delta against base option (can be 0, positive or negative)
  description?: string;
  badge?: string; // e.g. "인기 1위", "최고급", "풀빌라 독채"
}

export interface MasterOptionPool {
  golfCourses: Array<{
    id: string;
    name: string;
    location: string;
    holes: number;
    priceDeltaUSD: number;
    description: string;
    badge?: string;
  }>;
  accommodations: Array<{
    id: string;
    name: string;
    location: string;
    type: 'hotel_5star' | 'hotel_4star' | 'pool_villa' | 'resort';
    priceDeltaUSD: number;
    description: string;
    badge?: string;
  }>;
  vehicles: Array<{
    id: string;
    name: string;
    priceDeltaUSD: number;
    description: string;
    badge?: string;
  }>;
  guides: Array<{
    id: string;
    name: string;
    priceDeltaUSD: number;
    description: string;
    badge?: string;
  }>;
  meals: Array<{
    id: string;
    name: string;
    priceDeltaUSD: number;
    description: string;
    badge?: string;
  }>;
}

export interface PackageOptionItem {
  id: string;
  category: 'golf' | 'hotel' | 'vehicle' | 'meal' | 'activity' | 'guide' | 'flight' | 'etc';
  name: string;
  description?: string;
  priceUSD: number; // Price per person in USD
  isDefaultIncluded: boolean;
  isRequired?: boolean;
  allowCustomSelection?: boolean; // Can customer directly customize/change the item content?
  choices?: OptionChoiceItem[]; // Specific selectable choices for this item
  selectedChoiceId?: string; // Currently chosen choice ID
  selectedChoiceName?: string; // Or custom text
  dayScheduleCourses?: string[]; // E.g., for golf, array of course names chosen for each day: ['떤선녓 CC', '롱탄 CC', '트윈도브스 CC']
}

export interface CustomTripPackage {
  id: string;
  title: string;
  subtitle: string;
  location: string; // '호치민', '붕따우', '달랏', '호치민+붕따우', '호치민+달랏', '달랏+붕따우'
  duration: string; // '4박 5일'
  golfCourses: string[];
  image: string;
  detailImages?: string[];
  basePriceUSD: number;
  summary: string;
  highlightBadges: string[];
  itinerary: Array<{
    day: number;
    title: string;
    activities: string[];
  }>;
  options: PackageOptionItem[];
}

export interface SelectedProduct {
  id: string;
  name: string;
  theme: string;
  price: number;
  weekendPrice?: number;
}

export interface DailyPlan {
  day: number;
  date: string;
  location: string;
  accommodation: string;
  personCount: number;
  activeTheme: string;
  dailyRequests: string;
  selectedProducts: SelectedProduct[];
  transportService: {
    useRentCar: boolean;
    carType: string;
    useGuide: boolean;
  };
}

export interface CustomTripRequest {
  clientName: string;
  defaultPersonCount: number;
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
  durationSummary: string;
  extraRemarks: string;
  dailyPlans: DailyPlan[];
}

export interface UnitPrices {
  hotels: { [key: string]: number };
  cars: { [key: string]: number };
  guide: number;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
