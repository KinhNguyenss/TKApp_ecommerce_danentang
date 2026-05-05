// src/services/authService.ts
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  signInAnonymously 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

export const AuthService = {
  // Đăng ký bằng Email/Password
  registerWithEmail: async (email: string, password: string, role: 'customer' | 'business', hoTen: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Lưu thông tin vào Firestore với role mặc định
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        hoTen: hoTen,
        role: role,
        createdAt: serverTimestamp(),
      });

      return user;
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      throw error;
    }
  },

  // Đăng nhập bằng Email/Password
  loginWithEmail: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      throw error;
    }
  },

  // Đăng nhập tài khoản khách
  loginAnonymously: async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    } catch (error) {
      console.error("Lỗi đăng nhập khách:", error);
      throw error;
    }
  },

  // Đăng xuất
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      throw error;
    }
  }
};