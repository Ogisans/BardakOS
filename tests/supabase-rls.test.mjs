import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Actual embedded PostgreSQL, with a minimal Auth schema/UID shim.
// Does NOT test Supabase JWT verification, GoTrue, PostgREST or a remote project.
const W = 'b4d00000-0000-4000-8000-000000000001';
const OTHER = 'b4d00000-0000-4000-8000-000000000002';
const C = 'b4d00000-0000-4000-8000-000000000101';
const uuid = n => `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const admin = uuid(1), admin2 = uuid(2), field = uuid(3), outsider = uuid(4), otherAdmin = uuid(5), inactive = uuid(6);
test('PostgreSQL migration, grants, RLS and fictional seed', async t => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth, public to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;`);
    const migration = await readFile(new URL('../supabase/migrations/202610160001_bardak_workspace.sql', import.meta.url), 'utf8');
    const seed = await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(seed);
    for (let n = 1; n <= 6; n++) await db.query('insert into auth.users(id,raw_user_meta_data) values ($1,$2)', [uuid(n), { role: 'admin', workspace_id: W }]);
    await db.query('insert into public.bardak_workspaces(id,name) values ($1,$2)', [OTHER, 'Başka kurgusal çalışma alanı']);
    for (const [user, workspace, role, active] of [[admin,W,'admin',true],[admin2,W,'admin',true],[field,W,'field',true],[otherAdmin,OTHER,'admin',true],[inactive,W,'admin',false]]) {
      await db.query('insert into public.bardak_memberships(user_id,workspace_id,role,active) values ($1,$2,$3,$4)', [user,workspace,role,active]);
    }
    async function as(user, operation, role = 'authenticated') {
      await db.exec('begin');
      try {
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [user ?? '']);
        await db.exec(`set local role ${role}`);
        const result = await operation();
        await db.exec('commit');
        return result;
      } catch (error) { await db.exec('rollback'); throw error; }
    }
    const read = (user, sql, params = []) => as(user, () => db.query(sql, params));
    const denied = (user, sql, params = [], code = '42501') => assert.rejects(read(user,sql,params), error => error.code === code);

    await t.test('all exposed Bardak tables have RLS, anonymous access is denied', async () => {
      const tables = await db.query("select relrowsecurity from pg_class where relnamespace='public'::regnamespace and relname like 'bardak_%' and relkind='r'");
      assert.equal(tables.rows.length, 7); assert.ok(tables.rows.every(row => row.relrowsecurity));
      await assert.rejects(as(null, () => db.query('select * from public.bardak_collections'), 'anon'), error => error.code === '42501');
      assert.equal((await read(null, 'select * from public.bardak_collections')).rows.length, 0);
    });
    await t.test('signup metadata creates only own profile and never a membership', async () => {
      assert.equal((await read(outsider, 'select * from public.bardak_profiles')).rows.length, 1);
      assert.equal((await read(outsider, 'select * from public.bardak_memberships')).rows.length, 0);
      assert.equal((await read(outsider, 'select * from public.bardak_collections')).rows.length, 0);
      await denied(outsider, 'insert into public.bardak_memberships(workspace_id,user_id,role) values ($1,$2,$3)', [W,outsider,'admin']);
    });
    await t.test('admin and second admin share workspace data; field/outsider/inactive/cross-workspace cannot read or write it', async () => {
      assert.equal((await read(admin, 'select * from public.bardak_collections')).rows.length, 4);
      assert.equal((await read(admin2, 'select * from public.bardak_collections')).rows.length, 4);
      for (const user of [field,outsider,inactive,otherAdmin]) {
        for (const table of ['bardak_collections','bardak_entries','bardak_file_references']) assert.equal((await read(user, `select * from public.${table}`)).rows.length, 0);
        await denied(user, 'insert into public.bardak_collections(workspace_id,name) values ($1,$2)', [W,'İzinsiz koleksiyon']);
        assert.equal((await read(user, 'update public.bardak_collections set name=$1 where id=$2 returning id', ['İzinsiz',C])).rows.length, 0);
        assert.equal((await read(user, 'delete from public.bardak_collections where id=$1 returning id', [C])).rows.length, 0);
      }
    });
    await t.test('profiles permit only own name/note; no ID, role, membership or timestamp escalation', async () => {
      const changed = await read(field, 'update public.bardak_profiles set display_name=$1,work_note=$2 where user_id=$3 returning *', ['Ece Aras','Stand koordinasyonu',field]);
      assert.equal(changed.rows[0].display_name, 'Ece Aras');
      assert.equal((await read(field, 'update public.bardak_profiles set display_name=$1 where user_id=$2 returning *', ['Başka',admin])).rows.length, 0);
      await denied(field, 'update public.bardak_profiles set user_id=$1 where user_id=$2', [outsider,field]);
      await denied(field, "update public.bardak_profiles set updated_at=now() where user_id=$1", [field]);
      await denied(field, "update public.bardak_memberships set role='admin' where user_id=$1", [field]);
      await denied(admin, 'delete from public.bardak_memberships where user_id=$1', [field]);
    });
    await t.test('admin creates and updates server-owned records, while parent/workspace/creator/section remain immutable', async () => {
      const created = await read(admin, 'insert into public.bardak_collections(workspace_id,name,actual_revenue,actual_expense) values ($1,$2,0,null) returning *', [W,'Geçici koleksiyon']);
      const record = created.rows[0]; assert.equal(record.created_by, admin); assert.equal(record.actual_revenue, '0'); assert.equal(record.actual_expense, null);
      const edited = await read(admin2, 'update public.bardak_collections set name=$1 where id=$2 returning *', ['Ortak düzenleme',record.id]);
      assert.equal(edited.rows[0].manually_edited, true);
      for (const [column,value] of [['workspace_id',OTHER],['created_by',admin2],['id',uuid(50)]]) await denied(admin, `update public.bardak_collections set ${column}=$1 where id=$2`, [value,record.id]);
      const entry = (await read(admin, "insert into public.bardak_entries(workspace_id,collection_id,kind,title,quantity,unit_price) values ($1,$2,'product',$3,0,0) returning *", [W,record.id,'Pamuklu tişört'])).rows[0];
      for (const [column,value] of [['workspace_id',OTHER],['collection_id',C],['kind','campaign']]) await denied(admin, `update public.bardak_entries set ${column}=$1 where id=$2`, [value,entry.id]);
      await denied(admin, 'insert into public.bardak_collections(id,workspace_id,name) values ($1,$2,$3)', [uuid(60),W,'Kimlik dayatma']);
      await denied(admin, 'insert into public.bardak_collections(workspace_id,name,created_by) values ($1,$2,$3)', [W,'Sahip dayatma',admin2]);
      await read(admin2, 'delete from public.bardak_collections where id=$1', [record.id]);
      assert.equal((await db.query('select * from public.bardak_entries where id=$1',[entry.id])).rows.length, 0);
    });
    await t.test('cross-workspace parent spoofing fails FK; direct field content mutations fail RLS', async () => {
      await denied(otherAdmin, "insert into public.bardak_entries(workspace_id,collection_id,kind,title) values ($1,$2,'product',$3)", [OTHER,C,'Yanlış üst kayıt'], '23503');
      for (const user of [field,outsider,inactive,otherAdmin]) {
        await denied(user, "insert into public.bardak_entries(workspace_id,collection_id,kind,title) values ($1,$2,'product',$3)", [W,C,'İzinsiz ürün']);
        await denied(user, 'insert into public.bardak_file_references(workspace_id,collection_id,asset_id) values ($1,$2,$3)', [W,C,'shooting-plan']);
        assert.equal((await read(user, 'update public.bardak_entries set title=$1 where collection_id=$2 returning id', ['İzinsiz',C])).rows.length,0);
        assert.equal((await read(user, 'delete from public.bardak_entries where collection_id=$1 returning id', [C])).rows.length,0);
        assert.equal((await read(user, 'delete from public.bardak_file_references where collection_id=$1 returning id', [C])).rows.length,0);
      }
    });
    await t.test('DB constraints independently reject unsafe quantities, sub-cent money, invalid dates/status and nonproduct prices', async () => {
      for (const [column,value] of [['actual_revenue','1.001'],['planned_budget','-1'],['actual_expense','NaN'],['actual_expense','90071992547410'],['production_target','-1'],['production_target','9007199254740992'],['status','bad']]) {
        await denied(admin, `update public.bardak_collections set ${column}=$1 where id=$2`, [value,C], '23514');
      }
      await denied(admin, 'update public.bardak_collections set start_date=$1,target_date=$2 where id=$3', ['2026-11-20','2026-11-01',C], '23514');
      await denied(admin, 'update public.bardak_collections set produced_quantity=2,sold_quantity=3 where id=$1', [C], '23514');
      await denied(admin, "insert into public.bardak_entries(workspace_id,collection_id,kind,title,unit_price) values ($1,$2,'production',$3,10)", [W,C,'Üretim'], '23514');
      await denied(admin, 'update public.bardak_profiles set display_name=$1 where user_id=$2', ['',admin], '23514');
    });
    await t.test('file catalogue FK/duplicate constraints and parent cascade preserve isolation', async () => {
      await denied(admin, 'insert into public.bardak_file_references(workspace_id,collection_id,asset_id) values ($1,$2,$3)', [W,C,'external-url'], '23503');
      await denied(admin, 'insert into public.bardak_file_references(workspace_id,collection_id,asset_id) values ($1,$2,$3)', [W,C,'tshirt-sheet'], '23505');
      const added = await read(admin, 'insert into public.bardak_file_references(workspace_id,collection_id,asset_id) values ($1,$2,$3) returning id', [W,C,'shooting-plan']);
      assert.equal((await read(admin2, 'delete from public.bardak_file_references where id=$1 returning id', [added.rows[0].id])).rows.length, 1);
      await denied(admin, 'insert into public.bardak_assets(id,name,path) values ($1,$2,$3)', ['evil','Dosya','/collection-assets/evil.txt']);
    });
    await t.test('repeated seed preserves edits; deleting parent removes content and file references only', async () => {
      await read(admin, 'update public.bardak_collections set name=$1 where id=$2', ['Korunan düzenleme',C]);
      await db.exec(seed); await db.exec(seed);
      assert.equal((await read(admin, 'select * from public.bardak_collections')).rows.length, 4);
      assert.equal((await read(admin, 'select name from public.bardak_collections where id=$1',[C])).rows[0].name,'Korunan düzenleme');
      await read(admin, 'delete from public.bardak_collections where id=$1', [C]);
      assert.equal((await db.query('select * from public.bardak_entries where collection_id=$1',[C])).rows.length,0);
      assert.equal((await db.query('select * from public.bardak_file_references where collection_id=$1',[C])).rows.length,0);
      assert.equal((await db.query('select * from public.bardak_assets')).rows.length,4);
    });
    await t.test('membership revocation immediately denies direct data access', async () => {
      await db.query('update public.bardak_memberships set active=false where user_id=$1',[admin2]);
      assert.equal((await read(admin2,'select * from public.bardak_collections')).rows.length,0);
      await denied(admin2, 'insert into public.bardak_collections(workspace_id,name) values ($1,$2)',[W,'Üyeliği kapalı']);
    });
    await t.test('trusted membership setup fails on missing IDs and preserves existing profiles/roles on repeat', async () => {
      const setup=await readFile(new URL('../supabase/setup/memberships.sql',import.meta.url),'utf8');
      await assert.rejects(db.exec(setup), error=>error.code==='P0001');await db.exec('rollback');
      const configured=setup.replace('admin_user_id uuid := null',`admin_user_id uuid := '${admin}'::uuid`).replace('field_user_id uuid := null',`field_user_id uuid := '${field}'::uuid`);
      await db.exec(configured);await db.exec(configured);
      assert.equal((await read(field,'select display_name from public.bardak_profiles')).rows[0].display_name,'Ece Aras');
      assert.equal((await read(field,'select role from public.bardak_memberships')).rows[0].role,'field');
      assert.equal((await db.query('select count(*)::int as n from public.bardak_memberships')).rows[0].n,5);
    });
  } finally { await db.close(); }
});
