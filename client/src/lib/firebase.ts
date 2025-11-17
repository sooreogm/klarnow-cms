import { initializeApp, FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import type { FirebaseSettings } from '@shared/schema';

let firebaseApp: FirebaseApp | null = null;
let firebaseStorage: FirebaseStorage | null = null;

export function initializeFirebase(config: FirebaseSettings) {
  try {
    firebaseApp = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
    firebaseStorage = getStorage(firebaseApp);
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

export async function uploadImageToFirebase(
  file: File,
  path: string
): Promise<string> {
  if (!firebaseStorage) {
    throw new Error('Firebase not initialized. Please configure Firebase settings first.');
  }

  const storageRef = ref(firebaseStorage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export function isFirebaseInitialized(): boolean {
  return firebaseStorage !== null;
}
