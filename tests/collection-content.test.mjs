import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { INITIAL_COLLECTIONS } from '../src/demo/collections.ts';
import { INITIAL_COLLECTION_CONTENT } from '../src/demo/collectionContent.ts';
import { createMemoryCollectionsRepository, CollectionNotFoundError } from '../src/repositories/collections.ts';
import { normalizeContentEntry, ContentValidationError } from '../src/domain/collectionContent.ts';
import { calendarMonthDays, localDateKey, moveCalendarDay, moveCalendarMonth, parseLocalDate } from '../src/domain/dates.ts';
import { collectionFormValues, parseCollectionForm } from '../src/domain/collections.ts';

const product = overrides => ({ kind: 'product', title: 'Pamuklu Tişört', notes: '', status: 'planned', date: null, sku: 'TS-02', quantity: null, unitPrice: null, ...overrides });
const [first, second] = INITIAL_COLLECTIONS;
const repository = content => { let sequence = 0; return createMemoryCollectionsRepository(INITIAL_COLLECTIONS, { content, id: () => `generated-${++sequence}` }); };

test('calendar grid starts Monday, includes boundary days and handles leap days', () => {
  const days = calendarMonthDays('2026-02-15');
  assert.equal(days.length, 42);
  assert.equal(days[0], '2026-01-26');
  assert.equal(days.at(-1), '2026-03-08');
  assert.ok(calendarMonthDays('2024-02-01').includes('2024-02-29'));
  assert.equal(parseLocalDate('2026-02-29'), null);
  assert.equal(parseLocalDate('2026-02-30'), null);
  assert.equal(moveCalendarDay('2026-12-31', 1), '2027-01-01');
  assert.equal(moveCalendarMonth('2026-01-31', 1), '2026-02-28');
  assert.equal(moveCalendarMonth('2024-02-29', 12), '2025-02-28');
});

test('business date round-trips stay on the selected day across western/eastern time zones', () => {
  for (const timezone of ['America/Los_Angeles', 'Asia/Tokyo']) {
    const code = `import {localDateKey,parseLocalDate} from './src/domain/dates.ts'; process.stdout.write(['2026-10-15','2026-03-29','2024-02-29'].map(day=>localDateKey(parseLocalDate(day))).join(','));`;
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: new URL('../', import.meta.url), env: { ...process.env, TZ: timezone }, encoding: 'utf8' });
    assert.equal(output, '2026-10-15,2026-03-29,2024-02-29');
  }
  assert.equal(localDateKey(parseLocalDate('2026-10-15')), '2026-10-15');
  assert.throws(() => parseCollectionForm({ ...collectionFormValues(), name: 'Yeni koleksiyon', startDate: '2026-10-20', targetDate: '2026-10-19' }), error => Boolean(error.fields.targetDate));
});

test('content validation preserves unknown/zero and rejects invalid dates, counts, prices and status', () => {
  assert.equal(normalizeContentEntry(product()).quantity, null);
  assert.equal(normalizeContentEntry(product({ quantity: 0, unitPrice: 0 })).unitPrice, 0);
  for (const overrides of [{ title: ' ' }, { status: 'invalid' }, { date: '2026-02-30' }, { quantity: -1 }, { quantity: 1.5 }, { unitPrice: 1.234 }, { kind: 'invalid' }]) {
    assert.throws(() => normalizeContentEntry(product(overrides)), ContentValidationError);
  }
  assert.equal(normalizeContentEntry(product({ title: '  Tişört  ' })).title, 'Tişört');
});

test('content CRUD is isolated by parent ID and cannot change the section or collection financials', async () => {
  const repo = repository();
  const parents = await repo.list();
  const added = await repo.saveEntry(first.id, product({ quantity: 0, unitPrice: 0 }));
  const entry = added.entries[0];
  assert.deepEqual(await repo.getContent(second.id), { entries: [], files: [] });
  await assert.rejects(repo.saveEntry(second.id, product(), entry.id));
  await assert.rejects(repo.removeEntry(second.id, entry.id));
  await assert.rejects(repo.saveEntry(first.id, { kind: 'production', title: 'Kesim', notes: '', status: 'planned', date: null }, entry.id));
  const updated = await repo.saveEntry(first.id, product({ title: 'Rahat Kesim Tişört', quantity: 12, unitPrice: 125.5 }), entry.id);
  assert.equal(updated.entries[0].title, 'Rahat Kesim Tişört');
  await repo.removeEntry(first.id, entry.id);
  assert.deepEqual(await repo.getContent(first.id), { entries: [], files: [] });
  assert.deepEqual(await repo.list(), parents);
});

test('production and campaign plans coexist, retain dates and reject failed edits without mutation', async () => {
  const repo = repository();
  await repo.saveEntry(first.id, { kind: 'production', title: 'Kesim', notes: 'Beden dağılımı', status: 'in_progress', date: '2026-10-20' });
  const current = await repo.saveEntry(first.id, { kind: 'campaign', title: 'Ürün çekimi', notes: 'Düz fon', status: 'planned', date: '2026-10-22' });
  await assert.rejects(repo.saveEntry(first.id, { ...current.entries[0], title: '', date: 'invalid' }, current.entries[0].id), ContentValidationError);
  assert.deepEqual(await repo.getContent(first.id), current);
  assert.deepEqual(current.entries.map(entry => entry.kind), ['production', 'campaign']);
});

test('files accept only catalogue assets and reject duplicates or another collection file ID', async () => {
  const repo = repository();
  await assert.rejects(repo.attachFile(first.id, 'https://example.com/unsafe.svg'));
  const added = await repo.attachFile(first.id, 'tshirt-sheet');
  await assert.rejects(repo.attachFile(first.id, 'tshirt-sheet'));
  await assert.rejects(repo.removeFile(second.id, added.files[0].id));
  await repo.attachFile(second.id, 'tshirt-sheet');
  await repo.removeFile(first.id, added.files[0].id);
  assert.equal((await repo.getContent(first.id)).files.length, 0);
  assert.equal((await repo.getContent(second.id)).files.length, 1);
});

test('content deep copies protect seeds/returns and deleting the parent removes its content', async () => {
  const seed = structuredClone(INITIAL_COLLECTION_CONTENT);
  const repo = repository(seed);
  const returned = await repo.getContent(first.id);
  returned.entries[0].title = 'Outside mutation';
  returned.files[0].assetId = 'Outside mutation';
  assert.deepEqual(await repo.getContent(first.id), seed[first.id]);
  await repo.remove(first.id);
  await assert.rejects(repo.getContent(first.id), CollectionNotFoundError);
  await assert.rejects(repo.saveEntry(first.id, product()), CollectionNotFoundError);
  const created = await repo.create(parseCollectionForm({ ...collectionFormValues(), name: 'Yeni koleksiyon' }));
  assert.deepEqual(await repo.getContent(created.id), { entries: [], files: [] });
  assert.deepEqual(seed, INITIAL_COLLECTION_CONTENT);
});
