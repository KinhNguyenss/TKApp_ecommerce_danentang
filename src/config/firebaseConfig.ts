// src/config/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
// Đổi getAuth thành initializeAuth và getReactNativePersistence
import { initializeAuth } from 'firebase/auth';
// @ts-ignore: getReactNativePersistence is not exported in type definitions but works at runtime
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Import thư viện lưu trữ vừa cài
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDcJPXj2ZFnct7zrX3X_qprtNR1hU1_LaE",
  authDomain: "gen-lang-client-0090770884.firebaseapp.com",
  projectId: "gen-lang-client-0090770884",
  storageBucket: "gen-lang-client-0090770884.firebasestorage.app",
  messagingSenderId: "244446867908",
  appId: "1:244446867908:web:b28792760de728e7187491",
  measurementId: "G-QJ4SMSNBG9"
};

const app = initializeApp(firebaseConfig);

// Khởi tạo Auth với cơ chế lưu trữ (Persistence) của React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);



