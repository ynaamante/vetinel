import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthCtx { isLoggedIn: boolean; userEmail: string; userName: string; login: (email: string, name?: string) => Promise<void>; logout: () => Promise<void>; }
const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  const login = async (email: string, name = '') => {
    await AsyncStorage.setItem('isLoggedIn', 'true');
    await AsyncStorage.setItem('userEmail', email);
    if (name) await AsyncStorage.setItem('userName', name);
    setIsLoggedIn(true); setUserEmail(email); setUserName(name);
  };
  const logout = async () => {
    await AsyncStorage.multiRemove(['isLoggedIn', 'userEmail', 'userName']);
    setIsLoggedIn(false); setUserEmail(''); setUserName('');
  };
  return <AuthContext.Provider value={{ isLoggedIn, userEmail, userName, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
