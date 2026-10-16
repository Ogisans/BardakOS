import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_COLLECTIONS } from '../src/demo/collections.ts';
import { collectionFormValues, collectionResult, parseCollectionForm, summarizeCollections, validateCollection, CollectionValidationError } from '../src/domain/collections.ts';
import { createMemoryCollectionsRepository, CollectionNotFoundError } from '../src/repositories/collections.ts';
import { parseMoneyAmount, parseExpenseAmount } from '../src/domain/money.ts';

const draft = (overrides = {}) => parseCollectionForm({ ...collectionFormValues(), name: 'Yeni seri', ...overrides });
const record = (overrides = {}) => ({ ...INITIAL_COLLECTIONS[0], ...overrides });

test('fictional seeds cover unknown, zero, positive and negative finance without actual business sources', () => {
  for (const collection of INITIAL_COLLECTIONS) {
    assert.deepEqual(validateCollection(collection), {});
    assert.doesNotMatch(collection.name + collection.description + collection.notes, /demo|kurgusal|senaryo/i);
    assert.equal(collection.source, null);
    assert.notEqual(collection.financeQuality, 'confirmed');
  }
  const [planning, positive, negative, zero] = INITIAL_COLLECTIONS;
  assert.equal(planning.productionTarget, 40);
  assert.equal(planning.plannedBudget, 6500);
  assert.equal(planning.actualRevenue, null);
  assert.equal(planning.actualExpense, null);
  assert.equal(planning.targetDate, null);
  assert.equal(collectionResult(planning), null);
  assert.equal(collectionResult(positive), 1200);
  assert.equal(collectionResult(negative), -900);
  assert.equal(negative.financeQuality, 'approximate');
  assert.equal(collectionResult(zero), 0);
  assert.equal(zero.producedQuantity, 0);
});

test('unknown and explicit zero remain distinct through form round-trips', () => {
  const empty = draft();
  assert.equal(empty.actualRevenue, null);
  assert.equal(collectionResult(empty), null);
  const zero = draft({ actualRevenue: '0', actualExpense: '0' });
  assert.equal(zero.actualRevenue, 0);
  assert.equal(collectionResult(zero), 0);
  assert.equal(collectionFormValues(zero).actualRevenue, '0');
  assert.equal(collectionFormValues(empty).actualRevenue, '');
  assert.equal(parseMoneyAmount('0', true), 0);
  assert.equal(parseExpenseAmount('0'), null);
});

test('financial result subtracts cents consistently, independent of planned budget', () => {
  const input = draft({ actualRevenue: '1.10', actualExpense: '0.99', plannedBudget: '6500', financeQuality: 'confirmed' });
  assert.equal(collectionResult(input), 0.11);
  assert.equal(draft({ actualRevenue: '1e3' }).actualRevenue, 1000);
});

test('summary never subtracts an expense-only record from a revenue-only record', () => {
  const result = summarizeCollections([record({ actualRevenue: 100, actualExpense: null }), record({ id: 'other', actualRevenue: null, actualExpense: 40 })]);
  assert.deepEqual(result.revenue, { amount: 100, count: 1 });
  assert.deepEqual(result.expense, { amount: 40, count: 1 });
  assert.deepEqual(result.result, { amount: null, count: 0 });
});

test('synthetic summary reports partial coverage and approximate data', () => {
  const summary = summarizeCollections(INITIAL_COLLECTIONS);
  assert.deepEqual(summary.result, { amount: 300, count: 3 });
  assert.equal(summary.revenue.amount, 7800);
  assert.equal(summary.expense.amount, 7500);
  assert.equal(summary.includesUnconfirmed, true);
  assert.equal(summary.active, 3);
  assert.equal(summarizeCollections([]).result.amount, null);
});

test('invalid fields are rejected with specific errors', () => {
  for (const [field, value] of [['name', '  '], ['status', 'invalid'], ['productionTarget', '-1'], ['producedQuantity', '1.5'], ['actualRevenue', '-20'], ['actualExpense', '1.234'], ['plannedBudget', '1e309'], ['startDate', '2026-02-30'], ['financeQuality', 'invalid']]) {
    assert.throws(() => draft({ [field]: value }), error => error instanceof CollectionValidationError && Boolean(error.fields[field]), field);
  }
  assert.throws(() => draft({ startDate: '2026-10-20', targetDate: '2026-10-10' }), error => Boolean(error.fields.targetDate));
  assert.throws(() => draft({ producedQuantity: '5', soldQuantity: '6' }), error => Boolean(error.fields.soldQuantity));
  assert.equal(draft({ name: '  Yeni seri  ' }).name, 'Yeni seri');
});

test('repository completes create → list → status/finance update → delete with consistent totals', async () => {
  const repository = createMemoryCollectionsRepository([], { id: () => 'manual-1', now: () => '2026-10-10T10:00:00.000Z' });
  const created = await repository.create(draft({ productionTarget: '40', plannedBudget: '6500' }));
  assert.equal(created.id, 'manual-1');
  assert.equal(created.source, null);
  assert.equal((await repository.list())[0].name, 'Yeni seri');
  assert.equal(collectionResult(created), null);
  const updated = await repository.update(created.id, { ...created, status: 'on_sale', actualRevenue: 1250.5, actualExpense: 1000, financeQuality: 'confirmed' });
  assert.equal(updated.id, created.id);
  assert.equal(updated.status, 'on_sale');
  assert.equal(collectionResult(updated), 250.5);
  assert.deepEqual(summarizeCollections(await repository.list()).result, { amount: 250.5, count: 1 });
  await repository.remove(created.id);
  assert.deepEqual(await repository.list(), []);
  assert.equal(summarizeCollections(await repository.list()).result.amount, null);
});

test('list and returned records cannot mutate the memory repository or original seeds', async () => {
  const seed = structuredClone(INITIAL_COLLECTIONS);
  seed[0].source = { title: 'Test kaynağı', date: '2026-04-01', note: 'İzolasyon testi' };
  const originalSeed = structuredClone(seed);
  const repository = createMemoryCollectionsRepository(seed);
  const listed = await repository.list();
  listed[0].name = 'External mutation';
  listed[0].source.note = 'External mutation';
  assert.deepEqual(await repository.list(), seed);
  const updated = await repository.update(seed[0].id, { ...seed[0], name: 'Elle güncellenen seri' });
  assert.equal(updated.manuallyEdited, true);
  assert.deepEqual(updated.source, seed[0].source);
  updated.name = 'Another external mutation';
  assert.equal((await repository.list())[0].name, 'Elle güncellenen seri');
  assert.deepEqual(seed, originalSeed);
  assert.equal(INITIAL_COLLECTIONS[0].source, null);
});

test('invalid mutations and missing records do not corrupt the dataset', async () => {
  const repository = createMemoryCollectionsRepository(INITIAL_COLLECTIONS);
  await assert.rejects(repository.create({ ...draft(), name: '' }), CollectionValidationError);
  await assert.rejects(repository.update('missing', draft()), CollectionNotFoundError);
  await assert.rejects(repository.remove('missing'), CollectionNotFoundError);
  assert.deepEqual(await repository.list(), INITIAL_COLLECTIONS);
});

test('a new memory session restores only seeds; existing sessions remain independent', async () => {
  const first = createMemoryCollectionsRepository(INITIAL_COLLECTIONS);
  await first.create(draft());
  assert.equal((await first.list()).length, INITIAL_COLLECTIONS.length + 1);
  const next = createMemoryCollectionsRepository(INITIAL_COLLECTIONS);
  assert.equal((await next.list()).length, INITIAL_COLLECTIONS.length);
  assert.equal((await first.list()).length, INITIAL_COLLECTIONS.length + 1);
});
