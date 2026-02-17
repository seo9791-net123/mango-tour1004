
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'mango_tour_data.json';

export const driveService = {
  isInitialized: false,
  tokenClient: null as any,
  accessToken: null as string | null,

  // 구글 스크립트가 로드될 때까지 기다리는 헬퍼 함수
  waitForScript: () => {
    return new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        if (typeof window !== 'undefined' && window.gapi && window.google) {
          clearInterval(interval);
          resolve();
        }
        attempts++;
        if (attempts > 20) { // 10초 대기
          clearInterval(interval);
          reject(new Error("Google API 스크립트 로드 실패. 페이지를 새로고침 해주세요."));
        }
      }, 500);
    });
  },

  async initGapiClient(apiKey: string) {
    await this.waitForScript();

    if (!window.gapi) throw new Error("Google API script missing");
    
    await new Promise<void>((resolve) => window.gapi.load('client', resolve));
    
    try {
      await window.gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: DISCOVERY_DOCS,
      });
      this.isInitialized = true;
    } catch (error: any) {
      console.error("GAPI Init Error:", error);
      // 에러 객체를 그대로 던져서 UI에서 처리하도록 함
      throw error;
    }
  },

  async initTokenClient(clientId: string, callback: (response: any) => void) {
    await this.waitForScript();

    if (!window.google) throw new Error("Google Identity script missing");

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
              console.error("Token Response Error:", tokenResponse);
              alert(`로그인 오류: ${tokenResponse.error_description || tokenResponse.error}`);
              return;
          }
          this.accessToken = tokenResponse.access_token;
          callback(tokenResponse);
        },
      });
    } catch (e) {
      console.error("Token Client Init Error:", e);
      throw e;
    }
  },

  requestAccessToken() {
    if (this.tokenClient) {
      // 팝업 차단을 방지하기 위해 사용자 클릭 이벤트 내에서 호출되는 것이 좋음
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        throw new Error("인증 클라이언트가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.");
    }
  },

  async findFile() {
    if (!this.accessToken) throw new Error('No access token');
    
    try {
        const response = await window.gapi.client.drive.files.list({
          q: `name = '${FILE_NAME}' and trashed = false`,
          fields: 'files(id, name)',
        });
        const files = response.result.files;
        return files && files.length > 0 ? files[0] : null;
    } catch (e) {
        console.error("Error finding file", e);
        throw e;
    }
  },

  async saveData(data: any) {
    if (!this.accessToken) throw new Error('구글 드라이브 접근 권한이 없습니다. 로그인해주세요.');

    const fileContent = JSON.stringify(data, null, 2);
    let fileId = '';

    try {
        const existingFile = await this.findFile();

        if (existingFile) {
          fileId = existingFile.id;
        } else {
          const response = await window.gapi.client.drive.files.create({
            resource: {
              name: FILE_NAME,
              mimeType: 'application/json',
            },
          });
          fileId = response.result.id;
        }

        const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
        await fetch(url, {
            method: 'PATCH',
            headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            },
            body: fileContent,
        });
        
        return true;
    } catch (e) {
        console.error("Save failed", e);
        throw e;
    }
  },

  async loadData() {
    if (!this.accessToken) throw new Error('구글 드라이브 접근 권한이 없습니다. 로그인해주세요.');
    
    try {
        const file = await this.findFile();
        if (!file) return null;

        const response = await window.gapi.client.drive.files.get({
        fileId: file.id,
        alt: 'media',
        });
        return response.result;
    } catch (e) {
        console.error("Load failed", e);
        throw e;
    }
  }
};
