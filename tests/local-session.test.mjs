import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOCAL_TEST_ACCOUNTS } from '../src/demo/localAccounts.ts';
import { canAccessMode, initialLocalMode, signInLocally, editLocalProfile, profileInitials, ProfileValidationError } from '../src/domain/localSession.ts';
import { productImageForName, PRODUCT_IMAGES } from '../src/demo/productImages.ts';

test('local preview accepts exact public fixture credentials and rejects wrong or empty credentials', () => {
  const account = LOCAL_TEST_ACCOUNTS[0];
  const profile = signInLocally('  ' + account.email.toUpperCase() + '  ', account.password);
  assert.equal(profile.id, account.id);
  assert.equal('password' in profile, false);
  assert.equal(signInLocally(account.email, account.password.toLowerCase()), null);
  assert.equal(signInLocally('unknown@bardakos.example', account.password), null);
  assert.equal(signInLocally('', ''), null);
});

test('role preview permits management only for admin and keeps field-only startup at every width', () => {
  assert.equal(canAccessMode('admin', 'management'), true);
  assert.equal(canAccessMode('admin', 'field'), true);
  assert.equal(canAccessMode('field', 'management'), false);
  assert.equal(canAccessMode('field', 'field'), true);
  assert.equal(canAccessMode('unknown', 'field'), false);
  assert.equal(canAccessMode('admin', 'unknown'), false);
  assert.equal(initialLocalMode('admin', true), 'management');
  assert.equal(initialLocalMode('admin', false), 'field');
  assert.equal(initialLocalMode('field', true), 'field');
  assert.equal(initialLocalMode('field', false), 'field');
});

test('profile edits use an explicit allowlist and cannot elevate a field profile', () => {
  const account = LOCAL_TEST_ACCOUNTS[1];
  const profile = signInLocally(account.email, account.password);
  const updated = editLocalProfile(profile, { name: '  Ece Yıldız  ', workNote: '  Stok kontrolü  ', role: 'admin', email: 'changed@bardakos.example', id: 'local-admin' });
  assert.equal(updated.name, 'Ece Yıldız');
  assert.equal(updated.workNote, 'Stok kontrolü');
  assert.equal(updated.role, 'field');
  assert.equal(updated.email, profile.email);
  assert.equal(updated.id, profile.id);
  assert.notEqual(profile.name, updated.name);
});

test('profile rejects empty/oversize values and initials handle Turkish names', () => {
  const profile = signInLocally(LOCAL_TEST_ACCOUNTS[0].email, LOCAL_TEST_ACCOUNTS[0].password);
  for (const input of [{ name: ' ', workNote: '' }, { name: 'x'.repeat(81), workNote: '' }, { name: 'Ad Soyad', workNote: 'x'.repeat(161) }]) assert.throws(() => editLocalProfile(profile, input), ProfileValidationError);
  assert.equal(profileInitials('  İpek  Işık '), 'İI');
  assert.equal(profileInitials('Ece'), 'EC');
});

test('profile fixtures do not retain edits across independently created local sessions', () => {
  const account = LOCAL_TEST_ACCOUNTS[0];
  const first = signInLocally(account.email, account.password);
  first.name = 'Changed in session';
  const next = signInLocally(account.email, account.password);
  assert.equal(next.name, account.name);
  assert.notEqual(first, next);
});

test('product imagery matches garment type, handles Turkish/case and leaves unknown types empty', () => {
  assert.equal(productImageForName('BASIC TİŞÖRT Koleksiyonu 2026'), PRODUCT_IMAGES.tshirt);
  assert.equal(productImageForName('Basic Tshirt'), PRODUCT_IMAGES.tshirt);
  assert.equal(productImageForName('Oversize Hoodie'), PRODUCT_IMAGES.hoodie);
  assert.equal(productImageForName('Ribana Yaka Sweatshirt'), PRODUCT_IMAGES.sweatshirt);
  assert.equal(productImageForName('Fermuarlı Sweatshirt'), PRODUCT_IMAGES.zip);
  assert.equal(productImageForName('Zip Hoodie'), undefined);
  assert.equal(productImageForName('Çanta'), undefined);
  for (const image of Object.values(PRODUCT_IMAGES)) {
    const bytes = readFileSync(new URL('../public' + image.src, import.meta.url));
    assert.equal(bytes[0], 0xff);
    assert.equal(bytes[1], 0xd8);
    assert.ok(image.alt.length > 10);
  }
});
