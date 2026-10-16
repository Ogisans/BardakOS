import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthRepository, Identity } from './auth.ts';
import { AuthAccessError } from './auth.ts';
import { DEMO_WORKSPACE_ID } from '../domain/backendConfig.ts';
import { editLocalProfile } from '../domain/localSession.ts';
import { createSupabaseCollectionsRepository } from './supabaseCollections.ts';

export function createSupabaseAuthRepository(client: SupabaseClient): AuthRepository {
  async function read(): Promise<Identity | null> {
    const { data: session, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw new Error('Oturum okunamadı. Yeniden deneyin.');
    if (!session.session) return null;
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error('Oturum doğrulanamadı. Bağlantıyı kontrol edin veya çıkış yapın.');
    const user = data.user;
    const [profile, membership] = await Promise.all([
      client.from('bardak_profiles').select('display_name,work_note').eq('user_id', user.id).single(),
      client.from('bardak_memberships').select('workspace_id,role,active').eq('user_id', user.id).eq('workspace_id', DEMO_WORKSPACE_ID).eq('active', true).single(),
    ]);
    if (profile.error || membership.error || !['admin', 'field'].includes(membership.data?.role)) throw new Error('Bu çalışma alanına erişim doğrulanamadı. Profil ve aktif üyelik kurulumu gerekli.');
    return { workspaceId: membership.data.workspace_id, profile: { id: user.id, email: user.email ?? '', name: profile.data.display_name, workNote: profile.data.work_note, role: membership.data.role } };
  }
  return {
    read,
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Giriş tamamlanamadı. Bilgilerinizi ve bağlantıyı kontrol edin.');
      let identity;
      try { identity = await read(); } catch { throw new AuthAccessError('Oturum açıldı ancak çalışma alanı erişimi doğrulanamadı. Üyelik ve bağlantıyı kontrol edin.'); }
      if (!identity) throw new Error('Oturum açılamadı. Yeniden deneyin.');
      return identity;
    },
    async saveProfile(identity, input) {
      const valid = editLocalProfile(identity.profile, input);
      const { data, error } = await client.from('bardak_profiles').update({ display_name: valid.name, work_note: valid.workNote }).eq('user_id', identity.profile.id).select('display_name,work_note').single();
      if (error) throw new Error('Profil kaydedilemedi. Bilgileriniz formda duruyor; yeniden deneyin.');
      return { ...identity, profile: { ...identity.profile, name: data.display_name, workNote: data.work_note } };
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Çıkış tamamlanamadı. Bağlantıyı kontrol edip yeniden deneyin.');
    },
    subscribe(callback) {
      // No awaited Supabase call inside the SDK's auth lock.
      const { data: { subscription } } = client.auth.onAuthStateChange(event => {
        callback(event === 'SIGNED_OUT' ? 'signed_out' : 'changed');
      });
      return () => subscription.unsubscribe();
    },
    collections(identity) { return createSupabaseCollectionsRepository(client, identity.workspaceId); },
  };
}
