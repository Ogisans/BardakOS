import { createClient } from '@supabase/supabase-js';
import { readBackendConfig } from '../domain/backendConfig';
import { createPreviewAuthRepository } from './auth';
import { createSupabaseAuthRepository } from './supabaseAuth';

export const backendConfig = readBackendConfig(import.meta.env);
export const authRepository = backendConfig.mode === 'invalid' ? null : backendConfig.mode === 'preview'
  ? createPreviewAuthRepository()
  : createSupabaseAuthRepository(createClient(backendConfig.url, backendConfig.publicKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  }));
