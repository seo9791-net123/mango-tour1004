import { compressImage } from "../utils/imageUtils";

// 인메모리 및 로컬스토리지 연동 설정
let inMemoryCloudName: string = "";
let inMemoryUploadPreset: string = "";

/**
 * Cloudinary 설정 가져오기
 * 1. 메모리 설정 -> 2. 로컬스토리지 -> 3. 환경변수(Vite) -> 4. 망고투어 기본값('ducor31pp')
 */
export const getCloudinaryConfig = () => {
  const envCloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || "";
  const envUploadPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || "";

  const cloudName = inMemoryCloudName || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('cloudinary_cloud_name') : '') || 
    envCloudName || 
    "ducor31pp"; // 망고투어 등록 완료된 기본 Cloud Name

  const uploadPreset = inMemoryUploadPreset || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('cloudinary_upload_preset') : '') || 
    envUploadPreset || 
    "mangotour";

  return { cloudName: cloudName.trim(), uploadPreset: uploadPreset.trim() };
};

export const setCloudinaryConfig = (cloudName: string, uploadPreset: string) => {
  inMemoryCloudName = (cloudName || "").trim();
  inMemoryUploadPreset = (uploadPreset || "").trim();
  if (typeof localStorage !== 'undefined') {
    if (inMemoryCloudName) localStorage.setItem('cloudinary_cloud_name', inMemoryCloudName);
    if (inMemoryUploadPreset) localStorage.setItem('cloudinary_upload_preset', inMemoryUploadPreset);
  }
};

/**
 * URL이 Cloudinary에 업로드된 미디어인지 확인
 */
export const isCloudinaryUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

/**
 * Cloudinary URL에 가속 옵션(f_auto, q_auto 등)을 적용하여 로딩 속도 최적화
 */
export const getCloudinaryOptimizedUrl = (url?: string, width?: number): string => {
  if (!url) return '';
  if (!isCloudinaryUrl(url) || url.includes('/f_auto,q_auto/')) {
    return url;
  }
  const transform = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
  return url.replace('/upload/', `/upload/${transform}/`);
};

/**
 * Same-origin Server Upload (/api/upload)
 * Uses XHR for accurate upload progress and avoids 3rd-party CORS issues.
 */
const uploadToServer = (
  uploadData: Blob | File,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.url) {
            console.log("Server upload success:", res.url);
            return resolve(res.url);
          }
        } catch {
          // ignore
        }
      }
      reject(new Error(`Server upload responded with status: ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error('Server upload network error'));
    };

    const formData = new FormData();
    formData.append('file', uploadData, filename);
    xhr.send(formData);
  });
};

/**
 * Cloudinary Direct Upload
 * Uses /video/upload for videos and /image/upload for images
 */
const uploadToCloudinary = (
  uploadData: Blob | File,
  cloudName: string,
  uploadPreset: string,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const isVideo = (uploadData as File).type?.startsWith('video/') ||
      Boolean((uploadData as File).name && /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test((uploadData as File).name));
    const endpoint = isVideo ? 'video' : 'image';

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log("Cloudinary upload success:", response.secure_url);
          if (onProgress) onProgress(100);
          resolve(response.secure_url);
        } catch (e) {
          reject(new Error("Cloudinary JSON parse error"));
        }
      } else {
        console.warn("Cloudinary upload non-200 status:", xhr.status, xhr.responseText);
        reject(new Error(`Cloudinary returned status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      console.warn("Cloudinary network/CORS error encountered.");
      reject(new Error('Cloudinary CORS / connection error'));
    };

    const formData = new FormData();
    formData.append('file', uploadData);
    if (uploadPreset) {
      formData.append('upload_preset', uploadPreset);
    }
    if (folder) {
      formData.append('folder', folder);
    }
    xhr.send(formData);
  });
};

/**
 * Fallback to Base64 Data URL (images only)
 */
const fileToDataUrl = (file: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 파일 업로드 함수:
 * 1순위: Cloudinary Direct Upload (글로벌 CDN 스트리밍, 이미지/비디오 최적화)
 * 2순위: 동일 오리진 서버 업로드 (/api/upload - CORS 완전 면제)
 * 3순위: 이미지만 비상용 Base64 폴백 (비디오는 로컬 blob/Base64 저장 금지)
 * (Firebase Storage 의존성은 100% 제거되었습니다)
 */
export const uploadFile = async (
  file: File, 
  folder: string = "uploads", 
  onProgress?: (progress: number) => void
): Promise<string> => {
  const isVideo = file.type?.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(file.name);

  // 이미지 파일인 경우 브라우저 내 경량화 압축 시도
  let uploadData: Blob | File = file;
  if (file.type.startsWith('image/')) {
    try {
      uploadData = await compressImage(file);
      console.log(`Image compressed: ${file.size} -> ${uploadData.size}`);
    } catch (e) {
      console.warn("Image compression skipped:", e);
    }
  }

  // 1. Cloudinary Upload (글로벌 CDN, 모바일 부분 스트리밍 및 썸네일 지원)
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const isCloudinaryConfigured = Boolean(
    cloudName && 
    cloudName !== "Cloud Name" && 
    cloudName.trim() !== ""
  );

  if (isCloudinaryConfigured) {
    try {
      console.log(`Uploading ${file.name} to Cloudinary (${cloudName})...`);
      const cUrl = await uploadToCloudinary(uploadData, cloudName, uploadPreset, folder, onProgress);
      if (cUrl) return cUrl;
    } catch (cloudinaryErr) {
      console.warn("Cloudinary upload failed, attempting same-origin server upload:", cloudinaryErr);
    }
  }

  // 2. Same-Origin Server Upload (/api/upload)
  try {
    console.log(`Uploading ${file.name} to same-origin server (/api/upload)...`);
    const serverUrl = await uploadToServer(uploadData, file.name, onProgress);
    if (serverUrl) return serverUrl;
  } catch (serverErr) {
    console.warn("Server upload (/api/upload) not available, checking other providers:", serverErr);
  }

  // 3. Fallback: 비디오 파일은 절대로 blob: 이나 거대 Base64로 저장하지 않음 (모바일 재생 불가 및 메모리 충돌 방지)
  if (isVideo) {
    throw new Error(
      "동영상 업로드에 실패했습니다. 파일 용량(100MB 이하 권장)과 네트워크 상태를 확인하신 후 MP4(H.264) 형식으로 다시 시도해주세요."
    );
  }

  // 이미지만 비상용 Base64 폴백
  console.log("Using Base64 fallback for image...");
  if (onProgress) onProgress(100);
  return await fileToDataUrl(uploadData);
};
