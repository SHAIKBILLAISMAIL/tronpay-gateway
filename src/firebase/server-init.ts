import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

function getAdminSdks(app: App) {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}

export function initializeFirebase() {
  if (!getApps().length) {
    const app = initializeApp({
      projectId: firebaseConfig.projectId,
    });
    return getAdminSdks(app);
  } else {
    return getAdminSdks(getApp());
  }
}
