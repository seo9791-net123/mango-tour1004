
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

/**
 * 파일을 Firebase Storage에 업로드합니다.
 * @param file 업로드할 파일 객체
 * @param folder 저장할 폴더 경로 (예: 'images', 'videos')
 * @returns 업로드된 파일의 다운로드 URL
 */
export const uploadFile = async (file: File, folder: string = "uploads"): Promise<string> => {
  // 1. Cloudinary 설정 확인 (우선순위 1)
  // 사용자가 제공한 기본값: Cloud Name: "Cloud Name", Upload Preset: "mango-tour"
  // 주의: "Cloud Name"이 실제 계정 이름이 아닐 수 있으므로 확인이 필요합니다.
  const cloudName = localStorage.getItem('cloudinary_cloud_name') || "Cloud Name"; 
  const uploadPreset = localStorage.getItem('cloudinary_upload_preset') || "mango-tour";

  if (cloudName && uploadPreset) {
    try {
      console.log("Uploading to Cloudinary...");
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      // Cloudinary 실패 시 Firebase로 넘어가거나 에러 발생
    }
  }

  // 2. Firebase Storage (우선순위 2)
  if (!storage) {
    throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  }

  try {
    console.log("Uploading to Firebase Storage...");
    // 파일명 중복 방지를 위해 타임스탬프 추가
    const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
    
    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Firebase upload failed:", error);
    throw new Error("파일 업로드에 실패했습니다. Cloudinary 설정을 검토해보세요.");
  }
};
