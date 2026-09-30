import { test, expect } from 'vitest';
import { rules } from './validation';

test('name must be 20–60 characters', () => {
  expect(rules.name('Too short')).toMatch(/at least 20/);
  expect(rules.name('a'.repeat(20))).toBe('');
});

test('password needs uppercase and special character', () => {
  expect(rules.password('password1!')).toMatch(/uppercase/);
  expect(rules.password('Password1')).toMatch(/special/);
  expect(rules.password('Pass@word')).toBe('');
});
