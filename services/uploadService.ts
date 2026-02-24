
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";
import { compressImage } from "../utils/imageUtils";

/**
 * 파일을 Firebase Storage 또는 Cloudinary에 업로드하며 진행률을 추적합니다.
 * @param file 업로드할 파일 객체
 * @param folder 저장할 폴더 경로
 * @param onProgress 진행률 콜백 (0-100)
 * @returns 업로드된 파일의 다운로드 URL
 */
export const uploadFile = async (
  file: File, 
  folder: string = "uploads", 
  onProgress?: (progress: number) => void
): Promise<string> => {
  const cloudName = localStorage.getItem('cloudinary_cloud_name') || "Cloud Name"; 
  const uploadPreset = localStorage.getItem('cloudinary_upload_preset') || "mango-tour";

  // 이미지 파일인 경우 압축 시도
  let uploadData: Blob | File = file;
  if (file.type.startsWith('image/')) {
    try {
      uploadData = await compressImage(file);
      console.log(`Image compressed: ${file.size} -> ${uploadData.size}`);
    } catch (e) {
      console.warn("Image compression failed, using original file:", e);
    }
  }

  // 1. Cloudinary (XHR for progress)
  if (cloudName && uploadPreset && cloudName !== "Cloud Name") {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          let errorMsg = 'Cloudinary upload failed';
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.error?.message) errorMsg += `: ${response.error.message}`;
          } catch (e) {}
          reject(new Error(`${errorMsg} (Status: ${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('Cloudinary upload network error'));

      const formData = new FormData();
      formData.append('file', uploadData);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      xhr.send(formData);
    });
  }

  // 2. Firebase Storage (uploadBytesResumable for progress)
  if (!storage) {
    throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  }

  const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
  const uploadTask = uploadBytesResumable(storageRef, uploadData);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error("Firebase upload failed:", error);
        reject(new Error("파일 업로드에 실패했습니다."));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};
