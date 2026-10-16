export type BackendConfig = { mode: 'preview' } | { mode: 'supabase'; url: string; publicKey: string } | { mode: 'invalid'; message: string };
export const DEMO_WORKSPACE_ID = 'b4d00000-0000-4000-8000-000000000001';

/** Fail closed when cloud intent is present. Never include config values in errors. */
export function readBackendConfig(env: Record<string, string | undefined>): BackendConfig {
  const mode = env.VITE_DATA_MODE?.trim();
  const url = env.VITE_SUPABASE_URL?.trim() ?? '';
  const publicKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY)?.trim() ?? '';
  if (mode === 'preview' || (!mode && !url && !publicKey)) return { mode: 'preview' };
  const invalid: BackendConfig = { mode: 'invalid', message: 'Supabase yapılandırması eksik veya geçersiz. Proje URL’si ve yalnız publishable/anon anahtarıyla yapılandırmayı tamamlayın.' };
  if (mode && mode !== 'supabase') return invalid;
  try {
    const parsed = new URL(url);
    if (!(parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)))) return invalid;
    if (parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) return invalid;
    if (/your-|placeholder|example/i.test(url + publicKey)) return invalid;
    let allowed = /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(publicKey);
    if (!allowed && publicKey.split('.').length === 3) {
      const payload = publicKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      allowed = JSON.parse(atob(payload)).role === 'anon';
    }
    if (!allowed) return invalid;
    return { mode: 'supabase', url: parsed.origin, publicKey };
  } catch { return invalid; }
}
