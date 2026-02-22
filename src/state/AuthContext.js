import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { IS_SUPABASE_CONFIGURED } from '../config/supabase';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

// Auth provider: uses Supabase Auth when configured, stub otherwise.

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Possible states: 'idle' | 'entering_phone' | 'entering_code' | 'verified'
  const [verificationStep, setVerificationStep] = useState('idle');
  const [pendingPhone, setPendingPhone] = useState('');

  const isVerified = user !== null;

  // ── Restore session on mount ──
  useEffect(() => {
    (async () => {
      if (IS_SUPABASE_CONFIGURED) {
        const { user: existing } = await authService.getCurrentUser();
        if (existing) {
          setUser({
            id: existing.id,
            phone: existing.phone,
            display_name: existing.user_metadata?.display_name || 'EventMap User',
            avatar_url: existing.user_metadata?.avatar_url || null,
            created_at: existing.created_at,
          });
          setVerificationStep('verified');
        }
      }
      setLoading(false);
    })();
  }, []);

  // ── Listen for auth changes (Supabase) ──
  useEffect(() => {
    if (!IS_SUPABASE_CONFIGURED) return;
    const { unsubscribe } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          phone: u.phone,
          display_name: u.user_metadata?.display_name || 'EventMap User',
          avatar_url: u.user_metadata?.avatar_url || null,
          created_at: u.created_at,
        });
        setVerificationStep('verified');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setVerificationStep('idle');
      }
    });
    return unsubscribe;
  }, []);

  const startVerification = useCallback(async (phone) => {
    const { error } = await authService.sendOtp(phone);
    if (error) {
      console.error('[Auth] OTP error:', error);
      return { error };
    }
    setPendingPhone(phone);
    setVerificationStep('entering_code');
    return { error: null };
  }, []);

  const submitCode = useCallback(async (code) => {
    const { data, error } = await authService.verifyOtp(pendingPhone, code);
    if (error || !data) {
      console.error('[Auth] Verify error:', error);
      return false;
    }
    // For stub mode (no Supabase), manually set user
    if (!IS_SUPABASE_CONFIGURED && data.user) {
      setUser({
        id: data.user.id,
        phone: data.user.phone || pendingPhone,
        display_name: data.user.user_metadata?.display_name || 'EventMap User',
        avatar_url: null,
        created_at: new Date().toISOString(),
      });
      setVerificationStep('verified');
    }
    return true;
  }, [pendingPhone]);

  const resetVerification = useCallback(() => {
    setVerificationStep('idle');
    setPendingPhone('');
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setVerificationStep('idle');
    setPendingPhone('');
  }, []);

  const value = useMemo(() => ({
    user,
    isVerified,
    loading,
    verificationStep,
    pendingPhone,
    startVerification,
    submitCode,
    resetVerification,
    signOut,
  }), [user, isVerified, loading, verificationStep, pendingPhone,
       startVerification, submitCode, resetVerification, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
