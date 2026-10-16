import test from 'node:test';
import assert from 'node:assert/strict';
import { readBackendConfig } from '../src/domain/backendConfig.ts';
import { demoAccountFillEnabled } from '../src/domain/demoAccess.ts';
import { createSessionController } from '../src/domain/sessionController.ts';
import { createPreviewAuthRepository, AuthAccessError } from '../src/repositories/auth.ts';

const publicConfig = { VITE_DATA_MODE: 'supabase', VITE_SUPABASE_URL: 'https://fictional-project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abcdefghijklmnopqrstuvwx' };
test('fictional cloud credential filling requires exact delivery opt-in and never enables invalid config', () => {
  const cloud=readBackendConfig(publicConfig);
  assert.equal(demoAccountFillEnabled(cloud),false);
  for(const flag of ['false','1','TRUE','yes',''])assert.equal(demoAccountFillEnabled(cloud,flag),false);
  assert.equal(demoAccountFillEnabled(cloud,'true'),true);
  assert.equal(demoAccountFillEnabled({mode:'invalid',message:'missing'},'true'),false);
  assert.equal(demoAccountFillEnabled({mode:'preview'}),true);
});
const identity = { workspaceId: 'fictional-workspace', profile: { id: 'fictional-user', email: 'user@bardakos.example', name: 'Deniz Kaya', role: 'admin', workNote: '' } };
const deferred = () => { let resolve, reject; const promise = new Promise((yes,no) => { resolve=yes; reject=no; }); return { promise,resolve,reject }; };
const tick = () => new Promise(resolve => setTimeout(resolve, 8));
function fixture(overrides = {}) {
  let callback = () => {};
  const repository = { read: async () => identity, signIn: async () => identity, saveProfile: async (_,input) => ({...identity,profile:{...identity.profile,...input}}), signOut: async () => {},
    subscribe: cb => { callback = cb; return () => { callback = () => {}; }; }, ...overrides };
  return { repository, event: event => callback(event) };
}
test('backend configuration fails closed for partial/invalid cloud config, accepts only public key types', () => {
  assert.equal(readBackendConfig({}).mode,'preview');
  assert.equal(readBackendConfig(publicConfig).mode,'supabase');
  assert.equal(readBackendConfig({...publicConfig,VITE_DATA_MODE:'preview'}).mode,'preview');
  for (const values of [{VITE_DATA_MODE:'supabase'}, {VITE_SUPABASE_URL:publicConfig.VITE_SUPABASE_URL}, {...publicConfig,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_forbidden'}, {...publicConfig,VITE_SUPABASE_URL:'http://unsafe.invalid'}, {...publicConfig,VITE_SUPABASE_URL:'https://u:p@fictional-project.supabase.co'}, {...publicConfig,VITE_SUPABASE_URL:'https://fictional-project.supabase.co?secret=x'}, {VITE_DATA_MODE:'anything'}]) assert.equal(readBackendConfig(values).mode,'invalid');
  const jwt = role => `e30.${Buffer.from(JSON.stringify({role})).toString('base64url')}.fake`;
  assert.equal(readBackendConfig({...publicConfig,VITE_SUPABASE_PUBLISHABLE_KEY:jwt('anon')}).mode,'supabase');
  assert.equal(readBackendConfig({...publicConfig,VITE_SUPABASE_PUBLISHABLE_KEY:jwt('service_role')}).mode,'invalid');
  assert.doesNotMatch(JSON.stringify(readBackendConfig({...publicConfig,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_forbidden'})), /sb_secret_forbidden/);
});
test('session refresh retains its key; server role change replaces the authenticated subtree', async () => {
  let current = identity;
  const f = fixture({read:async()=>current}); const c=createSessionController(f.repository); const stop=c.start();
  await tick(); const key=c.snapshot().key; assert.equal(c.snapshot().status,'ready');
  f.event('changed'); await tick(); assert.equal(c.snapshot().key,key);
  current={...identity,profile:{...identity.profile,role:'field'}};
  f.event('changed'); await tick(); assert.notEqual(c.snapshot().key,key); assert.equal(c.snapshot().identity.profile.role,'field'); stop();
});
test('sign-out and cleanup invalidate late async identity reads and cannot resurrect a user', async () => {
  const pending=deferred(); const f=fixture({read:()=>pending.promise}); const c=createSessionController(f.repository); const stop=c.start();
  f.event('signed_out'); pending.resolve(identity); await tick(); assert.equal(c.snapshot().status,'signed_out'); assert.equal(c.snapshot().identity,null); stop();
  const next=deferred(); const g=fixture({read:()=>next.promise}); const d=createSessionController(g.repository); const finish=d.start(); finish(); next.resolve(identity); await tick(); assert.equal(d.snapshot().identity,null);
});
test('auth/profile/logout failures retain appropriate state; successful logout removes it', async () => {
  let failLogout=true;
  const f=fixture({saveProfile:async()=>{throw new Error('Profil kaydedilemedi.');},signOut:async()=>{if(failLogout)throw new Error('Ağ yok.');}});
  const c=createSessionController(f.repository); const stop=c.start(); await tick(); const key=c.snapshot().key;
  await assert.rejects(c.saveProfile({name:'Deniz Aras',workNote:''})); assert.equal(c.snapshot().identity.profile.name,'Deniz Kaya'); assert.equal(c.snapshot().key,key);
  await assert.rejects(c.signOut()); assert.equal(c.snapshot().status,'ready'); assert.equal(c.snapshot().key,key);
  failLogout=false; await c.signOut(); assert.equal(c.snapshot().identity,null); stop();
});
test('invalid credentials stay at login; verified Auth without membership is blocked and never falls back', async () => {
  const f=fixture({read:async()=>null,signIn:async()=>{throw new Error('Giriş başarısız.');}}); const c=createSessionController(f.repository);const stop=c.start(); await tick();
  await assert.rejects(c.signIn('x','x'));assert.equal(c.snapshot().status,'signed_out');stop();
  const g=fixture({read:async()=>null,signIn:async()=>{throw new AuthAccessError('Üyelik eksik.');}});const d=createSessionController(g.repository);const done=d.start();await tick();
  await assert.rejects(d.signIn('x','x'));assert.equal(d.snapshot().status,'error');assert.equal(d.snapshot().identity,null);done();
});
test('concurrent actions are rejected and auth event cannot revive a pending sign-in after logout', async () => {
  const pending=deferred();const f=fixture({read:async()=>null,signIn:()=>pending.promise});const c=createSessionController(f.repository);const stop=c.start();await tick();
  const login=c.signIn('x','x');await assert.rejects(c.signIn('x','x'),/devam/);f.event('signed_out');pending.resolve(identity);await login;assert.equal(c.snapshot().identity,null);stop();
});
test('preview remains explicitly memory-only and starts new collection repositories without cross-session edits', async () => {
  const p=createPreviewAuthRepository();assert.equal(await p.read(),null);
  const user=await p.signIn('yonetici@bardakos.example','Yonetim2026!');const a=p.collections(user);const rows=await a.list();await a.remove(rows[0].id);
  await p.signOut();assert.equal(await p.read(),null);const next=await p.signIn('yonetici@bardakos.example','Yonetim2026!');assert.equal((await p.collections(next).list()).length,rows.length);
});
