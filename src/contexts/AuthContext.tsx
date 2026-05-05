// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { AppUser } from '../types';
import { AuthService } from '../services/authService';

interface AuthContextProps {
    currentUser: AppUser | null;
    loading: boolean;
    registerWithEmail: (email: string, pass: string, name: string, role: 'customer' | 'business') => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    loginAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                onSnapshot(userRef, (snap) => {
                    setCurrentUser({ ...user, ...snap.data() } as AppUser);
                    setLoading(false);
                });
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const registerWithEmail = async (email: string, pass: string, name: string, role: 'customer' | 'business') => {
        await AuthService.registerWithEmail(email, pass, role, name);
    };

    const loginWithEmail = async (email: string, pass: string) => {
        await AuthService.loginWithEmail(email, pass);
    };

    const loginAnonymously = async () => {
        await AuthService.loginAnonymously();
    };

    const logout = async () => {
        await AuthService.logout();
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            loading,
            registerWithEmail,
            loginWithEmail,
            loginAnonymously,
            logout
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth phải được dùng trong AuthProvider");
    return context;
};