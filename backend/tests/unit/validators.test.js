import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passwordRule, nameRule, addressRule, emailRule, ratingSchema } from '../../src/validators/schemas.js';

test('password: accepts 8–16 chars with an uppercase and a special character', () => {
  assert.ok(passwordRule.safeParse('Passw0rd!').success);
  assert.ok(passwordRule.safeParse('A@bcdefg').success);
});

test('password: rejects missing uppercase, missing special, bad length', () => {
  assert.equal(passwordRule.safeParse('password!').success, false);
  assert.equal(passwordRule.safeParse('Password1').success, false);
  assert.equal(passwordRule.safeParse('A@b').success, false);
  assert.equal(passwordRule.safeParse('A@bcdefghijklmnop').success, false);
});

test('name: enforces 20–60 characters after trimming', () => {
  assert.equal(nameRule.safeParse('Short name').success, false);
  assert.equal(nameRule.safeParse('   ' + 'a'.repeat(19) + '   ').success, false);
  assert.ok(nameRule.safeParse('a'.repeat(20)).success);
  assert.equal(nameRule.safeParse('a'.repeat(61)).success, false);
});

test('address: max 400 characters', () => {
  assert.ok(addressRule.safeParse('x'.repeat(400)).success);
  assert.equal(addressRule.safeParse('x'.repeat(401)).success, false);
});

test('email: validates format and normalises case', () => {
  assert.equal(emailRule.safeParse('not-an-email').success, false);
  assert.equal(emailRule.parse('  Jane@Example.COM '), 'jane@example.com');
});

test('rating: only whole numbers 1–5', () => {
  assert.ok(ratingSchema.safeParse({ rating: 3 }).success);
  assert.equal(ratingSchema.safeParse({ rating: 0 }).success, false);
  assert.equal(ratingSchema.safeParse({ rating: 6 }).success, false);
  assert.equal(ratingSchema.safeParse({ rating: 2.5 }).success, false);
});
