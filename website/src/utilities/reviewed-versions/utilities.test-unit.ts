import { expect, test } from 'vitest';

import { parseReviewedVersions, prepareReviewedVersionSource } from './index.ts';

const configuration = {
  schemaVersion: 1,
  groups: [
    { packages: ['jg-first', 'jg-second'], version: '1.2.3' },
    { packages: ['jg-third'], version: '4.5.6' },
  ],
} as const;

test('generation retains the maintained facts and every surrounding UTF-8 byte', () => {
  const data = parseReviewedVersions(configuration);
  const prefix = '\uFEFF# Example café\r\n- This skill was written for ';
  const suffix =
    '. An item marked with a minimum version stays unchanged.\r\n| `jg-first` | First |\r\n| `jg-second` | Second |\r\n| `jg-third` | Third |\r\n';
  const expected = prefix + 'jg-first and jg-second 1.2.3; and jg-third 4.5.6' + suffix;
  const generated = prepareReviewedVersionSource(prefix + 'stale values' + suffix, data);
  expect(Buffer.from(generated)).toStrictEqual(Buffer.from(expected));
  expect(prepareReviewedVersionSource(generated, data)).toBe(expected);
  expect(data).toStrictEqual(configuration);
});

test.each([
  null,
  { schemaVersion: 2, groups: configuration.groups },
  { schemaVersion: 1, groups: [] },
  { schemaVersion: 1, groups: [{ packages: [], version: '1.2.3' }] },
  { schemaVersion: 1, groups: [{ packages: ['../outside'], version: '1.2.3' }] },
  { schemaVersion: 1, groups: [{ packages: ['jg-first'], version: '^1.2.3' }] },
  { schemaVersion: 1, groups: [{ packages: ['jg-first'], version: '1.2' }] },
  { schemaVersion: 1, groups: [{ packages: ['jg-first'], version: '01.2.3' }] },
  { schemaVersion: 1, groups: [{ packages: ['jg-first', 'jg-first'], version: '1.2.3' }] },
  { schemaVersion: 1, groups: [configuration.groups[0], configuration.groups[0]] },
  { ...configuration, unexpected: true },
])('rejects malformed or duplicate maintained facts: %j', (input) => {
  expect(() => parseReviewedVersions(input)).toThrow('Reviewed-version data is invalid.');
});

test.each([
  'No version paragraph.',
  'This skill was written for no end.',
  '. An item marked with a minimum version precedes This skill was written for ',
  'This skill was written for one This skill was written for two. An item marked with a minimum version',
  'This skill was written for one. An item marked with a minimum version. An item marked with a minimum version',
])('refuses missing, repeated or reversed fragment boundaries: %s', (source) => {
  expect(() => prepareReviewedVersionSource(source, parseReviewedVersions(configuration))).toThrow(
    'Reviewed-version fragment boundaries are invalid.',
  );
});

test.each([
  '| `jg-first` | First |',
  '| `jg-first` | First |\n| `jg-second` | Second |\n| `jg-third` | Third |\n| `jg-extra` | Extra |',
  '| `jg-first` | First |\n| `jg-second` | Second |\n| `jg-third` | Third |\n| `jg-third` | Repeated |',
])('rejects incomplete, extra or repeated package guidance: %s', (table) => {
  const source =
    'This skill was written for stale. An item marked with a minimum version\n' + table;
  expect(() => prepareReviewedVersionSource(source, parseReviewedVersions(configuration))).toThrow(
    'Reviewed-version packages do not match skill guidance.',
  );
});
