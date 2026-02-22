// ─── Auth Service ───
// Phone OTP authentication via Supabase Auth.
// Falls back to stub when Supabase is not configured.

import { supabase, IS_SUPABASE_CONFIGURED } from '../config/supabase';

/**
 * Send OTP code to phone number.
 * @param {string} phone - E.164 format, e.g. '+14165551234'
 * @returns {{ error: string|null }}
 */
export async function sendOtp(phone) {
  if (!IS_SUPABASE_CONFIGURED) {
    console.log('[authService] Mock OTP sent to', phone);
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Verify the OTP code.
 * @param {string} phone - E.164 format
 * @param {string} token - 6-digit code
 * @returns {{ data: { user, session }|null, error: string|null }}
 */
export async function verifyOtp(phone, token) {
  if (!IS_SUPABASE_CONFIGURED) {
    // Stub: accept any 6-digit code
    if (token.length !== 6) return { data: null, error: 'Invalid code' };
    const stubUser = {
      id: 'stub-' + Date.now(),
      phone,
      user_metadata: { display_name: 'EventMap User' },
    };
    console.log('[authService] Mock verified:', stubUser.id);
    return { data: { user: stubUser, session: null }, error: null };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get the currently signed-in user (if any).
 */
export async function getCurrentUser() {
  if (!IS_SUPABASE_CONFIGURED) {
    return { user: null, error: null };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
}

/**
 * Get the current session.
 */
export async function getSession() {
  if (!IS_SUPABASE_CONFIGURED) {
    return { session: null, error: null };
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (err) {
    return { session: null, error: err.message };
  }
}

/**
 * Sign out.
 */
export async function signOut() {
  if (!IS_SUPABASE_CONFIGURED) {
    console.log('[authService] Mock sign out');
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Listen for auth state changes.
 * @param {Function} callback - (event, session) => void
 * @returns {{ unsubscribe: Function }}
 */
export function onAuthStateChange(callback) {
  if (!IS_SUPABASE_CONFIGURED) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return { unsubscribe: () => subscription.unsubscribe() };
}

/**
 * Update the user's profile.
 */
export async function updateProfile(userId, updates) {
  if (!IS_SUPABASE_CONFIGURED) {
    console.log('[authService] Mock profile update:', userId, updates);
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}
