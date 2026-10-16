import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { UNIT_PRICE, PRODUCT_NAME, COLORS, SIZES, INITIAL_STOCK, INITIAL_TRANSFERS } from '../src/data.ts';
import { DEMO_RECENT_OPERATIONS } from '../src/demo/dashboard.ts';
import { getRecentOperations } from '../src/features/management/recentOperations.ts';
import { DEMO_CHANNEL_REVENUE, DEMO_CHANNEL_COUNTS } from '../src/demo/finance.ts';
import { DEMO_SALES_BASELINE, DEMO_SIZE_SALES, DEMO_COLOR_SALES } from '../src/demo/dashboard.ts';

test('fictional dashboard, channel and stock-analysis sales baselines stay consistent', () => {
  const sum = object => Object.values(object).reduce((total, value) => total + value, 0);
  for (const channel of Object.keys(DEMO_CHANNEL_COUNTS)) assert.equal(DEMO_CHANNEL_REVENUE[channel], DEMO_CHANNEL_COUNTS[channel] * UNIT_PRICE);
  assert.equal(sum(DEMO_CHANNEL_REVENUE), DEMO_SALES_BASELINE.all.revenue);
  assert.equal(sum(DEMO_CHANNEL_COUNTS), DEMO_SALES_BASELINE.all.count);
  assert.equal(sum(DEMO_SIZE_SALES), DEMO_SALES_BASELINE.all.count);
  assert.equal(sum(DEMO_COLOR_SALES), DEMO_SALES_BASELINE.all.count);
});

test('demo payment view contains no account or active payment destination', () => {
  const source = readFileSync(new URL('../src/components/PaymentTab.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\bTR[\d\s]{18,40}|https?:\/\/|<img\b|\bhref=/);
  assert.match(source, /Hesap tanımlanmamış/);
  assert.match(source, /Ödeme bağlantısı tanımlanmamış/);
});

test('fictional field variants, activity and sales use one product and palette', () => {
  assert.equal(PRODUCT_NAME,'Basic Tişört');
  assert.deepEqual(COLORS.map(color=>color.label),['Adaçayı','Kırık beyaz']);
  const expected=new Set(COLORS.flatMap(color=>SIZES.map(size=>`${color.id}:${size}`)));
  assert.deepEqual(new Set(INITIAL_STOCK.map(row=>`${row.color}:${row.size}`)),expected);
  assert.ok(INITIAL_STOCK.every(row=>[row.truck,row.stand].every(n=>Number.isSafeInteger(n)&&n>=0)));
  assert.equal(INITIAL_STOCK.reduce((sum,row)=>sum+row.truck+row.stand,0),78);
  assert.ok(INITIAL_TRANSFERS.every(row=>expected.has(`${row.color}:${row.size}`)&&row.qty>0));
  const live=getRecentOperations([{id:'synthetic-sale',timestamp:1,items:[{id:'line',color:'green',size:'M',quantity:1,price:UNIT_PRICE}],method:'cash',total:UNIT_PRICE}],[]);
  for(const operation of [...DEMO_RECENT_OPERATIONS,...live])for(const item of operation.items??[]){
    assert.equal(item.name,PRODUCT_NAME);
    assert.ok(COLORS.some(color=>color.label===item.color&&color.swatch===item.colorHex));
  }
});
