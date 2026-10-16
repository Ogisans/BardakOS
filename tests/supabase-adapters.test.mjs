import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAuthRepository } from '../src/repositories/supabaseAuth.ts';
import { createSupabaseCollectionsRepository, collectionPayload, collectionFromRow, entryPayload } from '../src/repositories/supabaseCollections.ts';
import { INITIAL_COLLECTIONS } from '../src/demo/collections.ts';
import { DEMO_WORKSPACE_ID as W } from '../src/domain/backendConfig.ts';

// SDK's real HTTP serialization against an intercepted transport. NO remote Supabase.
const id='a0000000-0000-4000-8000-000000000001';
const user={id,email:'fake@bardakos.example',aud:'authenticated',role:'authenticated',created_at:'2026-01-01T00:00:00Z',app_metadata:{},user_metadata:{role:'admin'}};
const jwt=`e30.${Buffer.from(JSON.stringify({sub:id,exp:4102444800,role:'authenticated'})).toString('base64url')}.fake`;
const session={access_token:jwt,refresh_token:'fictional-refresh',token_type:'bearer',expires_in:3600,user};
function client(handler) {
  return createClient('https://fictional-project.supabase.co','sb_publishable_abcdefghijklmnopqrstuvwx',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(url,options={})=>{
    const body=options.body?JSON.parse(options.body):undefined;
    const result=await handler(new URL(String(url)),options,body);
    return new Response(JSON.stringify(result.body),{status:result.status??200,headers:{'Content-Type':'application/json'}});
  }}});
}
test('real SDK Auth transport uses verified user + membership, ignores metadata role and allowlists profile writes', async () => {
  let logoutFails=true, profile={display_name:'Ece Demir',work_note:''};
  const requests=[];
  const c=client((url,options,body)=>{
    requests.push({url,method:options.method??'GET',body});
    if(url.pathname.endsWith('/token')) return {body:session};
    if(url.pathname.endsWith('/user')) return {body:user};
    if(url.pathname.endsWith('/logout')) return logoutFails?{status:503,body:{msg:'unavailable'}}:{body:{}};
    if(url.pathname.endsWith('/bardak_memberships')) return {body:{workspace_id:W,role:'field',active:true}};
    if(url.pathname.endsWith('/bardak_profiles')) { if(options.method==='PATCH')profile={...profile,...body};return {body:profile}; }
    throw new Error('Unexpected simulated request');
  });
  const repo=createSupabaseAuthRepository(c);assert.equal(await repo.read(),null);
  const identity=await repo.signIn(' fake@bardakos.example ','FictionalPassword');assert.equal(identity.profile.role,'field');assert.equal(identity.profile.id,id);
  assert.ok(requests.some(r=>r.url.pathname.endsWith('/user')));
  const member=requests.find(r=>r.url.pathname.endsWith('/bardak_memberships'));assert.equal(member.url.searchParams.get('workspace_id'),`eq.${W}`);
  const edited=await repo.saveProfile(identity,{name:' Ece Aras ',workNote:' Stand ',role:'admin',id:'other',email:'other@bardakos.example'});
  assert.equal(edited.profile.role,'field');assert.deepEqual(requests.find(r=>r.method==='PATCH').body,{display_name:'Ece Aras',work_note:'Stand'});
  await assert.rejects(repo.signOut(),/Çıkış/);assert.ok((await c.auth.getSession()).data.session);
  logoutFails=false;await repo.signOut();assert.equal((await c.auth.getSession()).data.session,null);
});
test('Auth succeeds but missing membership blocks access; network Auth failure never opens preview', async () => {
  const c=client(url=>url.pathname.endsWith('/token')?{body:session}:url.pathname.endsWith('/user')?{body:user}:url.pathname.endsWith('/bardak_profiles')?{body:{display_name:'Deniz Kaya',work_note:''}}:{status:406,body:{code:'PGRST116',message:'no row'}});
  await assert.rejects(createSupabaseAuthRepository(c).signIn('fake@bardakos.example','FictionalPassword'),error=>error.name==='AuthAccessError');
  const broken=client(()=>({status:503,body:{msg:'unavailable'}}));await assert.rejects(createSupabaseAuthRepository(broken).signIn('x','x'),/Giriş/);
});
test('collection DTO keeps null/zero/decimal dates, excludes ID/owner/role/source and validates writes before HTTP', () => {
  const original={...INITIAL_COLLECTIONS[3],id:'spoof',workspace_id:'spoof',created_by:'spoof',role:'admin'};
  const payload=collectionPayload(original);assert.equal(payload.actual_revenue,0);assert.equal(payload.production_target,null);
  assert.ok(!('id' in payload));assert.ok(!('created_by' in payload));assert.ok(!('role' in payload));assert.ok(!('source' in payload));
  const row={...payload,id:'server-id',created_at:'2026-10-16T00:00:00Z',updated_at:'2026-10-16T00:00:00Z',manually_edited:false};
  assert.equal(collectionFromRow(row).actualRevenue,0);assert.equal(collectionFromRow(row).productionTarget,null);
  assert.throws(()=>collectionPayload({...original,actualExpense:1.001}));
  assert.deepEqual(entryPayload({kind:'production',title:'Kesim',notes:'',status:'planned',date:'2026-10-20',sku:'spoof',quantity:90,unitPrice:1}),{kind:'production',title:'Kesim',notes:'',status:'planned',date:'2026-10-20',sku:'',quantity:null,unit_price:null});
});
test('real PostgREST SDK transport scopes list/CRUD/content/files and never falls back on failed or missing records', async () => {
  const requests=[];let fail=false;
  const row={...collectionPayload(INITIAL_COLLECTIONS[3]),id:'server-collection',created_at:'2026-10-16T00:00:00Z',updated_at:'2026-10-16T00:00:00Z',manually_edited:false};
  const c=client((url,options,body)=>{
    requests.push({url,method:options.method??'GET',body});
    if(fail)return {status:403,body:{code:'42501',message:'forbidden'}};
    const singular=new Headers(options.headers).get('Accept')?.includes('vnd.pgrst.object');
    if(url.pathname.endsWith('/bardak_collections'))return {body:singular?{...row,...body}: [row]};
    if(url.pathname.endsWith('/bardak_entries')||url.pathname.endsWith('/bardak_file_references'))return {body:singular?{id:'server-child'}:[]};
    throw new Error('Unexpected simulated request');
  });
  const repo=createSupabaseCollectionsRepository(c,W);
  assert.equal((await repo.list())[0].id,row.id);
  await repo.create(INITIAL_COLLECTIONS[3]);await repo.update(row.id,INITIAL_COLLECTIONS[3]);await repo.getContent(row.id);
  const product={kind:'product',title:'Tişört',notes:'',status:'planned',date:null,sku:'TS',quantity:0,unitPrice:null};
  await repo.saveEntry(row.id,product);await repo.saveEntry(row.id,product,'server-child');await repo.removeEntry(row.id,'server-child');await repo.attachFile(row.id,'tshirt-sheet');await repo.removeFile(row.id,'server-child');await repo.remove(row.id);
  for(const r of requests) {
    if(r.method==='POST') assert.equal(r.body.workspace_id,W);
    else assert.equal(r.url.searchParams.get('workspace_id'),`eq.${W}`);
    if(r.url.pathname.endsWith('/bardak_entries')||r.url.pathname.endsWith('/bardak_file_references'))assert.equal(r.method==='POST'?r.body.collection_id:r.url.searchParams.get('collection_id'),r.method==='POST'?row.id:`eq.${row.id}`);
  }
  const patch=requests.find(r=>r.method==='PATCH'&&r.url.pathname.endsWith('/bardak_entries'));assert.ok(!('kind'in patch.body));assert.equal(patch.url.searchParams.get('kind'),'eq.product');
  const count=requests.length;await assert.rejects(repo.attachFile(row.id,'unknown'));assert.equal(requests.length,count);
  fail=true;await assert.rejects(repo.list());await assert.rejects(repo.create(INITIAL_COLLECTIONS[0]));await assert.rejects(repo.getContent(row.id));await assert.rejects(repo.remove(row.id));
});
