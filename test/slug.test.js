'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify, channelName, MAX_CHANNEL_NAME_LENGTH } = require('../src/utils/slug');

test('slugify: lowercases and hyphenates spaces', () => {
  assert.equal(slugify('Mario Pizzeria'), 'mario-pizzeria');
});

test('slugify: strips punctuation', () => {
  assert.equal(slugify("Mario's Pizzeria!"), 'marios-pizzeria');
});

test('slugify: collapses repeated separators', () => {
  assert.equal(slugify('Taco   Town -- Downtown'), 'taco-town-downtown');
});

test('slugify: trims leading/trailing hyphens', () => {
  assert.equal(slugify('  -Wingstop-  '), 'wingstop');
});

test('slugify: returns empty string for non-string input', () => {
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
  assert.equal(slugify(42), '');
});

test('channelName: applies prefix and slugifies company name', () => {
  assert.equal(channelName("Mario's Pizzeria", 'cust-'), 'cust-marios-pizzeria');
});

test('channelName: caps at 80 characters', () => {
  const longName = 'A'.repeat(200);
  const result = channelName(longName, 'cust-');
  assert.ok(result.length <= MAX_CHANNEL_NAME_LENGTH);
});

test('channelName: falls back to "customer" when name has no usable characters', () => {
  assert.equal(channelName('!!!', 'cust-'), 'cust-customer');
  assert.equal(channelName('', ''), 'customer');
});

test('channelName: works without a prefix', () => {
  assert.equal(channelName('Taco Town'), 'taco-town');
});
