
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

/**
 * 파일을 Firebase Storage에 업로드합니다.
 * @param file 업로드할 파일 객체
 * @param folder 저장할 폴더 경로 (예: 'images', 'videos')
 * @returns 업로드된 파일의 다운로드 URL
 */
export const uploadFile = async (file: File, folder: string = "uploads"): Promise<string> => {
  if (!storage) {
    throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  }

  try {
    // 파일명 중복 방지를 위해 타임스탬프 추가
    const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
    
    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("File upload failed:", error);
    throw new Error("파일 업로드에 실패했습니다.");
  }
};
