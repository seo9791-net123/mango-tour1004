import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { setCloudinaryConfig } from './uploadService';
import { storageService } from './storageService';
import { 
  Product, 
  VideoItem, 
  CommunityPost, 
  PageContent, 
  PopupNotification, 
  CustomTripPackage,
  ChatMessage,
  User,
  MasterOptionPool
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_VIDEOS, 
  INITIAL_POSTS, 
  HERO_IMAGES, 
  SUB_MENU_ITEMS, 
  INITIAL_PAGE_CONTENTS, 
  INITIAL_POPUP, 
  INITIAL_CUSTOM_PACKAGES,
  INITIAL_MASTER_OPTION_POOL
} from '../constants';

export const supabaseService = {
  /**
   * 앱 로딩 시 Supabase에서 모든 전역 데이터를 가져옵니다.
   * Supabase가 미연동 상태이거나 네트워크 장애 시 안전하게 로컬/기본값으로 동작합니다.
   */
  async loadGlobalData() {
    const fallbackData = {
      heroImages: HERO_IMAGES,
      menuItems: SUB_MENU_ITEMS,
      products: INITIAL_PRODUCTS,
      videos: INITIAL_VIDEOS,
      posts: INITIAL_POSTS,
      pageContents: INITIAL_PAGE_CONTENTS,
      popup: INITIAL_POPUP,
      customPackages: INITIAL_CUSTOM_PACKAGES,
      masterOptionPool: INITIAL_MASTER_OPTION_POOL,
      cloudinaryConfig: { cloudName: 'ducor31pp', uploadPreset: 'mangotour' },
      isSupabaseActive: false,
      isLocal: true
    };

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      console.log("ℹ️ Running with local fallback data (Supabase waiting for credentials).");
      return fallbackData;
    }

    try {
      console.log("🔄 Fetching data from Supabase...");

      // 1. Settings (Hero Images, Menu Items, Cloudinary Config)
      let heroImages = HERO_IMAGES;
      let menuItems = SUB_MENU_ITEMS;
      let cloudinaryConfig = { cloudName: 'ducor31pp', uploadPreset: 'mangotour' };

      // Local storage fallback check
      try {
        const localHero = localStorage.getItem('mango_hero_images_db');
        if (localHero) {
          const parsed = JSON.parse(localHero);
          if (Array.isArray(parsed) && parsed.length > 0) heroImages = parsed;
        }
        const localMenu = localStorage.getItem('mango_menu_items_db');
        if (localMenu) {
          const parsed = JSON.parse(localMenu);
          if (Array.isArray(parsed) && parsed.length > 0) menuItems = parsed;
        }
      } catch {
        // ignore JSON parse error
      }

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (settingsData) {
        if (Array.isArray(settingsData.hero_images) && settingsData.hero_images.length > 0) {
          heroImages = settingsData.hero_images;
        }
        if (Array.isArray(settingsData.menu_items) && settingsData.menu_items.length > 0) {
          menuItems = settingsData.menu_items;
        }
        if (settingsData.cloudinary_config) {
          cloudinaryConfig = settingsData.cloudinary_config;
          if (cloudinaryConfig.cloudName || cloudinaryConfig.uploadPreset) {
            setCloudinaryConfig(cloudinaryConfig.cloudName || 'ducor31pp', cloudinaryConfig.uploadPreset || 'mangotour');
          }
        }
      }

      // 2. Products
      let products: Product[] = INITIAL_PRODUCTS;
      try {
        const localProducts = localStorage.getItem('mango_products_db');
        if (localProducts) {
          const parsed = JSON.parse(localProducts);
          if (Array.isArray(parsed) && parsed.length > 0) products = parsed;
        }
      } catch {
        // ignore
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      if (productsData && productsData.length > 0) {
        products = productsData.map(p => p.data || p);
      }

      // 3. Videos
      let videos: VideoItem[] = INITIAL_VIDEOS;
      try {
        const localVideos = localStorage.getItem('mango_videos_db');
        if (localVideos) {
          const parsed = JSON.parse(localVideos);
          const valid = Array.isArray(parsed) ? parsed.filter((v: any) => v?.url && !v.url.startsWith('blob:')) : [];
          if (valid.length > 0) videos = valid;
        }
      } catch {
        // ignore
      }

      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .order('id', { ascending: true });
      if (videosData && videosData.length > 0) {
        videos = videosData.map(v => v.data || v);
      }

      // 4. Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });
      const posts: CommunityPost[] = (postsData && postsData.length > 0) 
        ? postsData.map(p => p.data || p) 
        : INITIAL_POSTS;

      // 5. Pages
      let pageContents = { ...INITIAL_PAGE_CONTENTS };
      try {
        const localPages = localStorage.getItem('mango_page_contents_db');
        if (localPages) {
          const parsed = JSON.parse(localPages);
          if (parsed && typeof parsed === 'object') {
            pageContents = { ...pageContents, ...parsed };
          }
        }
      } catch {
        // ignore
      }

      let masterOptionPool: MasterOptionPool | null = null;
      const { data: pagesData } = await supabase
        .from('pages')
        .select('*');
      if (pagesData && pagesData.length > 0) {
        pagesData.forEach(row => {
          const content = row.data || row;
          if (row.id === 'master_option_pool') {
            masterOptionPool = content as MasterOptionPool;
          } else if (content.id) {
            pageContents[content.id] = content;
          }
        });
      }

      // 6. Popup
      let popup = INITIAL_POPUP;
      const { data: popupData } = await supabase
        .from('popup')
        .select('*')
        .eq('id', 'main')
        .maybeSingle();
      if (popupData) {
        popup = popupData.data || popupData;
      }

      // 7. Custom Packages
      const { data: packagesData } = await supabase
        .from('custom_packages')
        .select('*')
        .order('id', { ascending: true });
      const customPackages: CustomTripPackage[] = (packagesData && packagesData.length > 0)
        ? packagesData.map(pkg => pkg.data || pkg)
        : INITIAL_CUSTOM_PACKAGES;

      console.log("✅ Supabase data loaded successfully!");
      return {
        heroImages,
        menuItems,
        products,
        videos,
        posts,
        pageContents,
        popup,
        customPackages,
        masterOptionPool,
        cloudinaryConfig,
        isSupabaseActive: true,
        isLocal: false
      };
    } catch (err) {
      console.warn("⚠️ Failed to load from Supabase, reverting to fallback data:", err);
      return fallbackData;
    }
  },

  /**
   * 컬렉션 데이터 동기화 (상품, 비디오, 게시글, 패키지 등)
   */
  async syncCollection(tableName: string, newItems: any[]) {
    // 1. 로컬 IndexedDB에 즉시 보존하여 오프라인에서도 보존
    try {
      await storageService.setItem(`mango_${tableName}`, newItems);
    } catch {
      // ignore
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      // Supabase 테이블에는 id, data(jsonb), updated_at 구조로 저장하여 유연성 극대화
      const rows = newItems.map(item => ({
        id: String(item.id),
        data: item,
        updated_at: new Date().toISOString()
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from(tableName)
          .upsert(rows, { onConflict: 'id' });
        if (error) throw error;
      }

      // 기존 DB에서 삭제된 아이템 정리
      const currentIds = newItems.map(item => String(item.id));
      if (currentIds.length > 0) {
        const { data: existingRows } = await supabase
          .from(tableName)
          .select('id');
        if (existingRows) {
          const toDelete = existingRows
            .map(r => String(r.id))
            .filter(id => !currentIds.includes(id));
          if (toDelete.length > 0) {
            await supabase.from(tableName).delete().in('id', toDelete);
          }
        }
      }
      console.log(`✅ Synced ${tableName} to Supabase successfully.`);
    } catch (e) {
      console.warn(`Failed to sync ${tableName} to Supabase:`, e);
    }
  },

  /**
   * 전역 설정 저장 (슬라이더, 메뉴, Cloudinary 등)
   * 슬라이드나 메뉴 아이콘 변경 시 Supabase의 settings 테이블에 안전하게 자동 저장
   */
  async saveSettings(key: 'heroImages' | 'menuItems' | 'cloudinaryConfig', data: any) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    const columnMap: Record<string, string> = {
      heroImages: 'hero_images',
      menuItems: 'menu_items',
      cloudinaryConfig: 'cloudinary_config'
    };
    const col = columnMap[key] || key;

    try {
      // 기존 설정 데이터를 조회하여 다른 컬럼(슬라이드, 메뉴, Cloudinary 등)이 지워지지 않도록 병합 보존
      const { data: existing } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      const payload: Record<string, any> = {
        id: 'global',
        hero_images: existing?.hero_images ?? null,
        menu_items: existing?.menu_items ?? null,
        cloudinary_config: existing?.cloudinary_config ?? null,
        updated_at: new Date().toISOString()
      };
      payload[col] = data;

      const { error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn(`Supabase settings upsert error for ${key}:`, error.message);
      } else {
        console.log(`✅ Supabase settings [${key}] 자동 저장 완료`);
      }
    } catch (e) {
      console.warn(`Failed to save settings for ${key}:`, e);
    }
  },

  /**
   * Cloudinary 이미지 서버 설정을 Supabase에 저장 및 동기화
   */
  async saveCloudinaryConfig(cloudName: string, uploadPreset: string) {
    const cfg = {
      cloudName: (cloudName || 'ducor31pp').trim(),
      uploadPreset: (uploadPreset || 'mangotour').trim(),
      updatedAt: new Date().toISOString()
    };
    setCloudinaryConfig(cfg.cloudName, cfg.uploadPreset);
    await this.saveSettings('cloudinaryConfig', cfg);
  },

  /**
   * 페이지 내용 저장
   */
  async savePageContent(pageId: string, content: PageContent) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('pages')
        .upsert({
          id: pageId,
          data: content,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn(`Failed to save page ${pageId}:`, e);
    }
  },

  /**
   * DIY 마스터 옵션 풀 저장 (지역, 골프장, 여행, 숙박, 차량, 기타)
   */
  async saveMasterOptionPool(pool: MasterOptionPool) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('pages')
        .upsert({
          id: 'master_option_pool',
          data: pool,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      console.log("✅ Synced master_option_pool to Supabase successfully.");
    } catch (e) {
      console.warn("Failed to save master_option_pool to Supabase:", e);
    }
  },

  /**
   * 팝업 저장
   */
  async savePopup(popup: PopupNotification) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('popup')
        .upsert({
          id: 'main',
          data: popup,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Failed to save popup to Supabase:", e);
    }
  },

  /**
   * 견적/예약 문의 저장
   */
  async saveInquiry(inquiry: any) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const existing = JSON.parse(localStorage.getItem('mango_inquiries') || '[]');
      existing.unshift({ ...inquiry, id: Date.now().toString(), createdAt: new Date().toISOString() });
      localStorage.setItem('mango_inquiries', JSON.stringify(existing));
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('inquiries')
        .insert([{
          data: inquiry,
          created_at: new Date().toISOString()
        }])
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      console.warn("Failed to save inquiry to Supabase:", e);
      return { success: false, error: e };
    }
  },

  /**
   * 실시간 채팅 메시지 전송
   */
  async sendChatMessage(message: { sender: string; text: string }): Promise<ChatMessage> {
    const supabase = getSupabase();
    const now = Date.now();
    const payload = {
      sender: message.sender,
      text: message.text,
      created_at: new Date(now).toISOString()
    };

    if (!supabase || !isSupabaseConfigured) {
      const storageKey = 'mango_tour_public_chat_v1';
      const existing: ChatMessage[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const newMsg: ChatMessage = {
        id: `local-${now}`,
        sender: message.sender,
        text: message.text,
        timestamp: now
      };
      existing.push(newMsg);
      localStorage.setItem(storageKey, JSON.stringify(existing.slice(-100)));
      return newMsg;
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn("Failed to write chat to Supabase, saving locally:", error);
      return {
        id: `local-${now}`,
        sender: message.sender,
        text: message.text,
        timestamp: now
      };
    }

    return {
      id: String(data.id),
      sender: data.sender || message.sender,
      text: data.text,
      timestamp: new Date(data.created_at).getTime()
    };
  },

  /**
   * 실시간 채팅 메시지 구독 (Supabase Realtime)
   */
  subscribeChat(
    onInitialMessages: (msgs: ChatMessage[]) => void,
    onNewMessage: (msg: ChatMessage) => void
  ) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      // 로컬스토리지 기반 초기 메시지 로드
      const storageKey = 'mango_tour_public_chat_v1';
      const localMsgs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      onInitialMessages(localMsgs);
      return () => {};
    }

    // 1. 최근 메시지 로드 (최신 100개)
    supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const formatted: ChatMessage[] = data.map(d => ({
            id: String(d.id),
            sender: d.sender || '여행자',
            text: d.text,
            timestamp: new Date(d.created_at).getTime()
          }));
          onInitialMessages(formatted);
        }
      });

    // 2. 실시간 새 메시지 청취 (Supabase Channel)
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const d = payload.new;
        const msg: ChatMessage = {
          id: String(d.id),
          sender: d.sender || '여행자',
          text: d.text,
          timestamp: new Date(d.created_at).getTime()
        };
        onNewMessage(msg);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * 회원 목록 조회
   */
  async loadUsers(): Promise<User[]> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      return JSON.parse(localStorage.getItem('mango_users_db') || '[]');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(u => ({
        id: String(u.id),
        username: u.username,
        role: u.role || 'user',
        nickname: u.nickname || u.username
      }));
    } catch (e) {
      console.warn("Failed to load users from Supabase:", e);
      return JSON.parse(localStorage.getItem('mango_users_db') || '[]');
    }
  },

  /**
   * 회원 저장 (신규 가입 또는 관리자 추가)
   */
  async saveUser(user: User, password?: string) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const users: User[] = JSON.parse(localStorage.getItem('mango_users_db') || '[]');
      const idx = users.findIndex(u => u.username === user.username);
      if (idx >= 0) users[idx] = user;
      else users.push(user);
      localStorage.setItem('mango_users_db', JSON.stringify(users));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: user.username,
          role: user.role,
          nickname: user.nickname,
          password_hash: password ? btoa(password) : undefined, // 간이 해시 (Supabase Auth 연동 보강)
          updated_at: new Date().toISOString()
        }, { onConflict: 'username' });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn("Failed to save user to Supabase:", e);
      return { success: false, error: e };
    }
  },

  /**
   * 회원 삭제
   */
  async deleteUser(userId: string) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const users: User[] = JSON.parse(localStorage.getItem('mango_users_db') || '[]');
      const filtered = users.filter(u => u.id !== userId);
      localStorage.setItem('mango_users_db', JSON.stringify(filtered));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn("Failed to delete user in Supabase:", e);
      return { success: false, error: e };
    }
  },

  /**
   * 회원 권한 업데이트 (관리자 <-> 일반회원)
   */
  async updateUserRole(userId: string, newRole: 'admin' | 'user') {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      const users: User[] = JSON.parse(localStorage.getItem('mango_users_db') || '[]');
      const user = users.find(u => u.id === userId);
      if (user) {
        user.role = newRole;
        localStorage.setItem('mango_users_db', JSON.stringify(users));
      }
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn("Failed to update user role in Supabase:", e);
      return { success: false, error: e };
    }
  },

  /**
   * 원클릭 전체 데이터 Supabase 클라우드 초기 주입 (Seed All Data)
   */
  async seedAllToSupabase(payload: {
    products: Product[];
    videos: VideoItem[];
    posts: CommunityPost[];
    customPackages: CustomTripPackage[];
    heroImages: string[];
    menuItems: any[];
    cloudinaryConfig: { cloudName: string; uploadPreset: string };
    popup: PopupNotification;
    pageContents: Record<string, PageContent>;
  }) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase가 아직 연결되지 않았습니다. [Supabase DB 설정]에서 URL과 Anon Key를 먼저 저장해주세요.");
    }

    console.log("🚀 Starting one-click full data seeding to Supabase...");

    // 1. Settings
    await supabase.from('settings').upsert({
      id: 'global',
      hero_images: payload.heroImages,
      menu_items: payload.menuItems,
      cloudinary_config: payload.cloudinaryConfig,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    // 2. Popup
    await supabase.from('popup').upsert({
      id: 'main',
      data: payload.popup,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    // 3. Products
    if (payload.products && payload.products.length > 0) {
      const productRows = payload.products.map(p => ({
        id: String(p.id),
        data: p,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('products').upsert(productRows, { onConflict: 'id' });
    }

    // 4. Videos
    if (payload.videos && payload.videos.length > 0) {
      const videoRows = payload.videos.map(v => ({
        id: String(v.id),
        data: v,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('videos').upsert(videoRows, { onConflict: 'id' });
    }

    // 5. Posts
    if (payload.posts && payload.posts.length > 0) {
      const postRows = payload.posts.map(p => ({
        id: String(p.id),
        data: p,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('posts').upsert(postRows, { onConflict: 'id' });
    }

    // 6. Custom Packages
    if (payload.customPackages && payload.customPackages.length > 0) {
      const packageRows = payload.customPackages.map(pkg => ({
        id: String(pkg.id),
        data: pkg,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('custom_packages').upsert(packageRows, { onConflict: 'id' });
    }

    // 7. Pages
    if (payload.pageContents) {
      const pageRows = Object.entries(payload.pageContents).map(([pageId, content]) => ({
        id: pageId,
        data: content,
        updated_at: new Date().toISOString()
      }));
      if (pageRows.length > 0) {
        await supabase.from('pages').upsert(pageRows, { onConflict: 'id' });
      }
    }

    console.log("✅ All data seeded to Supabase successfully!");
    return { success: true };
  }
};
