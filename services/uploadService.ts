
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
  const cloudName = (localStorage.getItem('cloudinary_cloud_name') || "").trim(); 
  const uploadPreset = (localStorage.getItem('cloudinary_upload_preset') || "").trim();

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
  // Only attempt Cloudinary if BOTH cloudName and uploadPreset are set and valid
  const isCloudinaryConfigured = cloudName && 
                                uploadPreset && 
                                cloudName !== "Cloud Name" && 
                                cloudName.trim() !== "" &&
                                uploadPreset.trim() !== "";

  if (isCloudinaryConfigured) {
    console.log(`Attempting Cloudinary upload to ${cloudName} with preset ${uploadPreset}...`);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      // Use 'auto' for resource type to handle images and videos automatically
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
          console.log("Cloudinary upload success:", response.secure_url);
          resolve(response.secure_url);
        } else {
          let errorMsg = 'Cloudinary 업로드 실패';
          let detailedError = '';
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.error?.message) {
              detailedError = response.error.message;
              errorMsg += `: ${detailedError}`;
            }
          } catch (e) {}
          
          if (xhr.status === 401 || detailedError.includes('API key')) {
            errorMsg += "\n\n[해결 방법]\n1. Cloud Name이 정확한지 확인하세요.\n2. Cloudinary 설정에서 Upload Preset이 'Unsigned'로 설정되어 있는지 확인하세요.\n3. Preset 이름이 정확한지 확인하세요.";
          }
          
          console.error("Cloudinary upload error:", xhr.responseText);
          reject(new Error(`${errorMsg} (Status: ${xhr.status})`));
        }
      };

      xhr.onerror = () => {
        console.error("Cloudinary network error");
        reject(new Error('Cloudinary 업로드 네트워크 오류 (CORS 또는 연결 문제)'));
      };

      const formData = new FormData();
      formData.append('file', uploadData);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      xhr.send(formData);
    });
  }

  // 2. Firebase Storage (uploadBytesResumable for progress)
  if (!storage) {
    console.error("Firebase Storage not initialized");
    throw new Error("Firebase Storage가 초기화되지 않았습니다. 설정(Firebase Config)을 확인해주세요.");
  }

  console.log(`Attempting Firebase Storage upload to folder: ${folder}...`);
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
      (error: any) => {
        console.error("Firebase upload failed:", error);
        let msg = "파일 업로드에 실패했습니다.";
        if (error.code === 'storage/unauthorized') {
          msg = "업로드 권한이 없습니다. Firebase Storage 보안 규칙을 확인하거나 Cloudinary를 사용하세요.";
        } else if (error.code === 'storage/canceled') {
          msg = "업로드가 취소되었습니다.";
        } else if (error.code === 'storage/unknown') {
          msg = `알 수 없는 오류가 발생했습니다: ${error.message}`;
        }
        reject(new Error(msg));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Firebase upload success:", downloadURL);
          resolve(downloadURL);
        } catch (e: any) {
          console.error("Failed to get download URL:", e);
          reject(new Error("업로드는 완료되었으나 URL을 가져오는데 실패했습니다."));
        }
      }
    );
  });
};
