import test from 'node:test';
import assert from 'node:assert/strict';
import { parseExpenseAmount } from '../src/domain/money.ts';
import { localDateKey, startOfMonth } from '../src/domain/dates.ts';
import { applySaleToStock, applyTransferToStock } from '../src/domain/stock.ts';
import { getRecentOperations } from '../src/features/management/recentOperations.ts';

test('expense input preserves scientific notation and decimal currency', () => {
  for (const [input, expected] of [['1e3', 1000], ['1250.50', 1250.5], ['0.29', 0.29], ['1e-2', 0.01]]) {
    assert.equal(parseExpenseAmount(input), expected, input);
  }
});

test('expense input rejects invalid, nonpositive, sub-cent and unsafe values', () => {
  for (const input of ['', ' ', '0', '-2', 'NaN', 'Infinity', '1e309', '0.001', '1.234', '1e20', '0x10', '1,50']) {
    assert.equal(parseExpenseAmount(input), null, input);
  }
});

test('calendar dates use the local day, including midnight and year boundaries', () => {
  assert.equal(localDateKey(new Date(2026, 0, 1, 0, 15)), '2026-01-01');
  assert.equal(localDateKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  const source = new Date(2026, 9, 10, 16, 30);
  assert.equal(localDateKey(startOfMonth(source)), '2026-10-01');
  assert.equal(source.getDate(), 10);
});

const initialStock = () => [
  { color: 'green', size: 'M', truck: 10, stand: 5 },
  { color: 'white', size: 'L', truck: 7, stand: 3 },
];
const cart = [{ id: 'cart-1', color: 'green', size: 'M', quantity: 2, price: 600 }];
const transfer = [{ id: 't-1', batchId: 'b-1', color: 'green', size: 'M', qty: 3 }];

test('sale and undo restore stock without mutating the source or another variant', () => {
  const before = initialStock();
  const sold = applySaleToStock(before, cart);
  assert.equal(sold[0].stand, 3);
  assert.equal(sold[0].truck, 10);
  assert.deepEqual(sold[1], before[1]);
  assert.deepEqual(applySaleToStock(sold, cart, true), before);
  assert.deepEqual(before, initialStock());
});

test('transfer reserves truck units, then completion moves them to stand', () => {
  const before = initialStock();
  const pending = applyTransferToStock(before, transfer, 'create');
  assert.equal(pending[0].truck, 7);
  assert.equal(pending[0].stand, 5);
  const completed = applyTransferToStock(pending, transfer, 'complete');
  assert.equal(completed[0].truck, 7);
  assert.equal(completed[0].stand, 8);
  assert.equal(completed[0].truck + completed[0].stand, before[0].truck + before[0].stand);
});

test('cancel restores the reserved truck quantity, without increasing stand', () => {
  const before = initialStock();
  const pending = applyTransferToStock(before, transfer, 'create');
  assert.deepEqual(applyTransferToStock(pending, transfer, 'cancel'), before);
});

test('repeated variant lines aggregate and unrelated stock stays unchanged', () => {
  const before = initialStock();
  const result = applySaleToStock(before, [...cart, { ...cart[0], id: 'cart-2', quantity: 1 }]);
  assert.equal(result[0].stand, 2);
  assert.deepEqual(result[1], before[1]);
});

test('the existing demo stock clamp is preserved during extraction', () => {
  const result = applySaleToStock(initialStock(), [{ ...cart[0], quantity: 99 }]);
  assert.equal(result[0].stand, 0);
});

const sale = (id, timestamp) => ({ id, timestamp, items: cart, method: 'cash', total: 600 });
const canceled = (timestamp) => ({ id: 'transfer-canceled', batchId: 'batch', timestamp, items: transfer, action: 'canceled' });

test('recent activity orders sales and transfers together by actual timestamp', () => {
  const sales = [sale('sale-new', 200), sale('sale-old', 100)];
  const transfers = [canceled(300)];
  const result = getRecentOperations(sales, transfers);
  assert.deepEqual(result.slice(0, 3).map(item => item.id), ['transfer-canceled', 'sale-new', 'sale-old']);
  assert.match(result[0].subtitle, /Araca iade/);
  assert.equal(sales[0].id, 'sale-new');
  assert.equal(transfers[0].timestamp, 300);
});

test('recent activity takes the latest four records before filling with demo data', () => {
  const result = getRecentOperations([sale('s1', 10), sale('s5', 50), sale('s2', 20), sale('s4', 40), sale('s3', 30)], []);
  assert.deepEqual(result.map(item => item.id), ['s5', 's4', 's3', 's2']);
  const empty = getRecentOperations([], []);
  assert.equal(empty.length, 4);
  assert.ok(empty.every(item => item.id.startsWith('mock-')));
});
