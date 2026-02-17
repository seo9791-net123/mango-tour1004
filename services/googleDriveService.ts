
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

  async initGapiClient(apiKey: string) {
    if (!window.gapi) {
        throw new Error("Google API script not loaded");
    }
    await new Promise<void>((resolve) => window.gapi.load('client', resolve));
    await window.gapi.client.init({
      apiKey: apiKey,
      discoveryDocs: DISCOVERY_DOCS,
    });
    this.isInitialized = true;
  },

  initTokenClient(clientId: string, callback: (response: any) => void) {
    if (!window.google) {
        throw new Error("Google Identity script not loaded");
    }
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
            console.error(tokenResponse);
            return;
        }
        this.accessToken = tokenResponse.access_token;
        callback(tokenResponse);
      },
    });
  },

  requestAccessToken() {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken();
    } else {
        throw new Error("Token client not initialized");
    }
  },

  async findFile() {
    if (!this.accessToken) throw new Error('No access token');
    
    // GAPI client might not be fully ready for request if initGapiClient wasn't awaited properly in component,
    // but usually user clicks button after init.
    // Using fetch for list to be safe or gapi.
    
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
          // Create new file metadata
          const response = await window.gapi.client.drive.files.create({
            resource: {
              name: FILE_NAME,
              mimeType: 'application/json',
            },
          });
          fileId = response.result.id;
        }

        // Upload/Update content via fetch (Patch)
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
