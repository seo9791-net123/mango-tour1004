/**
 * Google Drive Backup & Restore Service
 * 구글 드라이브를 통한 망고투어 데이터 백업 및 복원 서비스
 */

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILE_NAME = 'mango_tour_data.json';

class GoogleDriveService {
  private gapiInited = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;

  isInitialized(): boolean {
    return this.gapiInited;
  }

  /**
   * Google API (gapi) 클라이언트 스크립트 로드 대기
   */
  private async waitForGapi(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (window.gapi && window.gapi.load) return;

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.gapi && window.gapi.load) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('Google API 스크립트 로드 실패. index.html의 gapi 스크립트 로딩을 확인해주세요.'));
        }
      }, 200);
    });
  }

  /**
   * Google Identity Services (GSI) 로드 대기
   */
  private async waitForGsi(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (window.google?.accounts?.oauth2) return;

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('Google Identity Services 스크립트 로드 실패. index.html의 gsi 스크립트 로딩을 확인해주세요.'));
        }
      }, 200);
    });
  }

  /**
   * 1. GAPI Client 초기화
   */
  async initGapiClient(apiKey: string): Promise<void> {
    await this.waitForGapi();

    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: apiKey.trim(),
            discoveryDocs: [DISCOVERY_DOC]
          });
          this.gapiInited = true;
          console.log('✅ Google Drive GAPI Client initialized.');
          resolve();
        } catch (err) {
          console.error('Failed to initialize GAPI client:', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 2. Token Client 초기화
   */
  async initTokenClient(clientId: string, callback: (response: any) => void): Promise<void> {
    await this.waitForGsi();

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: SCOPES,
      callback: (response: any) => {
        if (response && response.access_token) {
          this.accessToken = response.access_token;
          if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken({ access_token: response.access_token });
          }
        }
        callback(response);
      }
    });
  }

  /**
   * 3. 액세스 토큰 요청 (구글 로그인 팝업 호출)
   */
  requestAccessToken(): void {
    if (!this.tokenClient) {
      throw new Error('Token Client가 초기화되지 않았습니다. 먼저 initTokenClient를 실행하세요.');
    }
    // 기존 토큰이 없거나 만료된 경우 prompt: 'consent'
    this.tokenClient.requestAccessToken({ prompt: this.accessToken ? '' : 'consent' });
  }

  /**
   * 현재 유효한 Access Token 반환
   */
  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (window.gapi?.client?.getToken()) {
      return window.gapi.client.getToken().access_token || null;
    }
    return null;
  }

  /**
   * 구글 드라이브에서 mango_tour_data.json 파일 검색
   */
  private async findBackupFileId(): Promise<string | null> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
        fields: 'files(id, name, modifiedTime)',
        spaces: 'drive'
      });

      const files = response.result?.files;
      if (files && files.length > 0) {
        return files[0].id;
      }
      return null;
    } catch (e) {
      console.warn('Error searching for backup file on Google Drive:', e);
      return null;
    }
  }

  /**
   * 4. 데이터 저장 (Google Drive Backup)
   */
  async saveData(backupData: any): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('구글 드라이브 인증 토큰이 없습니다. 먼저 로그인해주세요.');
    }

    const fileContent = JSON.stringify(backupData, null, 2);
    const existingFileId = await this.findBackupFileId();

    if (existingFileId) {
      // 파일이 이미 존재하면 내용 업데이트 (PATCH upload)
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: fileContent
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`구글 드라이브 파일 업데이트 실패: ${errorText}`);
      }
      console.log('✅ Google Drive backup updated:', existingFileId);
    } else {
      // 새 파일 생성 (Multipart upload: 메타데이터 + 본문)
      const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json'
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`구글 드라이브 파일 생성 실패: ${errorText}`);
      }
      console.log('✅ Google Drive backup created successfully.');
    }
  }

  /**
   * 5. 데이터 불러오기 (Google Drive Restore)
   */
  async loadData(): Promise<any | null> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('구글 드라이브 인증 토큰이 없습니다. 먼저 로그인해주세요.');
    }

    const fileId = await this.findBackupFileId();
    if (!fileId) {
      return null;
    }

    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`구글 드라이브 데이터 다운로드 실패: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Google Drive backup loaded successfully:', fileId);
    return data;
  }
}

export const driveService = new GoogleDriveService();
