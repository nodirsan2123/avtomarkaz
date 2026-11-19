import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { UserProfile, VALIDATION_LIMITS } from '../types/car';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  updateProfileDetails: (updates: {
    displayName: string;
    phone: string;
    city: string;
  }) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setAuthReady(true);
        return;
      }

      const userPath = `users/${firebaseUser.uid}`;
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            uid: firebaseUser.uid,
            displayName: String(data.displayName ?? firebaseUser.displayName ?? 'Foydalanuvchi'),
            email: String(data.email ?? firebaseUser.email ?? ''),
            phone: data.phone ? String(data.phone) : '',
            city: data.city ? String(data.city) : 'Toshkent',
          });
        } else {
          const safeName = (firebaseUser.displayName || 'Foydalanuvchi')
            .trim()
            .slice(0, VALIDATION_LIMITS.sellerNameMax) || 'Foydalanuvchi';
          const safeEmail = (firebaseUser.email || '').trim().slice(0, 160);

          if (firebaseUser.emailVerified && safeEmail.length >= 3) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: safeName,
              email: safeEmail,
              phone: '',
              city: 'Toshkent',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          setProfile({
            uid: firebaseUser.uid,
            displayName: safeName,
            email: safeEmail,
            phone: '',
            city: 'Toshkent',
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, userPath);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Kirishda xatolik yuz berdi';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError("Google hisobiga kirishda xatolik yuz berdi. Qayta urinib ko'ring.");
      }
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    setAuthLoading(true);
    try {
      await firebaseSignOut(auth);
      setProfile(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const updateProfileDetails = async (updates: {
    displayName: string;
    phone: string;
    city: string;
  }) => {
    if (!user) return;
    const trimmedName = updates.displayName.trim().slice(0, VALIDATION_LIMITS.sellerNameMax);
    const trimmedPhone = updates.phone.trim();
    const trimmedCity = updates.city.trim().slice(0, VALIDATION_LIMITS.cityMax);

    if (!trimmedName) {
      throw new Error("Ism bo'sh bo'lmasligi kerak");
    }
    if (trimmedPhone && !VALIDATION_LIMITS.optionalPhonePattern.test(trimmedPhone)) {
      throw new Error("Telefon raqami +998901234567 ko'rinishida bo'lishi kerak");
    }

    const userPath = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: trimmedName,
        phone: trimmedPhone,
        city: trimmedCity || 'Toshkent',
        updatedAt: serverTimestamp(),
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              displayName: trimmedName,
              phone: trimmedPhone,
              city: trimmedCity || 'Toshkent',
            }
          : null
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authReady,
        authLoading,
        authError,
        signInWithGoogle,
        signOut,
        updateProfileDetails,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
