
export const firebaseConfig = {
  projectId: "studio-711426439-67441",
  appId: "1:630560270207:web:340c6536dc892511b55c4a",
  apiKey: "AIzaSyDvL1sCFHBhQGUMPz42QinPoe3cO6CPNGk",
  authDomain: "studio-711426439-67441.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "630560270207"
};

// A function to check if all required Firebase config values are present
export const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey &&
           firebaseConfig.authDomain &&
           firebaseConfig.projectId &&
           firebaseConfig.appId;
};
