import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Type declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            getNotDisplayedReason: () => string;
          }) => void) => void;
          renderButton: (parent: HTMLElement, options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
            width?: number | string;
          }) => void;
        };
      };
    };
  }
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    console.log("[Firebase Auth] Attempting sign in with email:", email);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("[Firebase Auth] Sign in successful");
    } catch (err: any) {
      console.error("[Firebase Auth] Sign in error:", err.code, err.message);
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setError(null);
    console.log("[Firebase Auth] Attempting sign up with email:", email);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[Firebase Auth] User created, updating profile...");
      await updateProfile(result.user, { displayName });
      console.log("[Firebase Auth] Sending verification email...");
      await sendEmailVerification(result.user);
      console.log("[Firebase Auth] Sign up complete");
    } catch (err: any) {
      console.error("[Firebase Auth] Sign up error:", err.code, err.message);
      setError(err.message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    console.log("[Firebase Auth] Attempting Google sign in with GIS button");
    
    return new Promise<void>((resolve, reject) => {
      // Check if Google Identity Services is loaded
      const gis = window.google;
      if (!gis?.accounts) {
        console.error("[Firebase Auth] Google Identity Services not loaded");
        const err = new Error("Google Sign-In is loading. Please wait a moment and try again.");
        setError(err.message);
        reject(err);
        return;
      }
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      console.log("[Firebase Auth] Client ID configured:", clientId ? 'Yes' : 'No');
      
      if (!clientId) {
        const err = new Error("Google Sign-In is not configured. Please use email/password.");
        setError(err.message);
        reject(err);
        return;
      }
      
      // Create a temporary button container for Google Sign-In
      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-temp';
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '50%';
      buttonContainer.style.left = '50%';
      buttonContainer.style.transform = 'translate(-50%, -50%)';
      buttonContainer.style.zIndex = '10000';
      buttonContainer.style.background = 'white';
      buttonContainer.style.padding = '20px';
      buttonContainer.style.borderRadius = '12px';
      buttonContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      
      // Add overlay
      const overlay = document.createElement('div');
      overlay.id = 'google-signin-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      overlay.style.zIndex = '9999';
      overlay.onclick = () => {
        cleanup();
        reject(new Error('Sign-in cancelled'));
      };
      
      document.body.appendChild(overlay);
      document.body.appendChild(buttonContainer);
      
      const cleanup = () => {
        const tempButton = document.getElementById('google-signin-temp');
        const tempOverlay = document.getElementById('google-signin-overlay');
        if (tempButton) tempButton.remove();
        if (tempOverlay) tempOverlay.remove();
      };
      
      gis.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            console.log("[Firebase Auth] Got Google credential, signing in to Firebase...");
            cleanup();
            const credential = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, credential);
            console.log("[Firebase Auth] Google sign in successful");
            resolve();
          } catch (err: any) {
            console.error("[Firebase Auth] Google sign in error:", err.code, err.message);
            setError(err.message);
            reject(err);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      
      // Render the Google Sign-In button
      gis.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 280,
      });
      
      console.log("[Firebase Auth] Google button rendered, waiting for user click...");
    });
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const sendVerificationEmail = async () => {
    setError(null);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    setError(null);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, data);
        setUser((prev) => prev ? { ...prev, ...data } : null);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        resetPassword,
        sendVerificationEmail,
        updateUserProfile,
        getIdToken,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}
