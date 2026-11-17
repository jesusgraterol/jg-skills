import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, expect, test } from 'vitest';

import { readReviewedVersions, syncReviewedVersions } from './index.ts';

const roots: string[] = [];
const source =
  '# Fixture\nThis skill was written for stale. An item marked with a minimum version remains.\n| `jg-first` | Useful guidance |\n';

const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'jg-reviewed-versions-'));
  roots.push(root);
  await mkdir(join(root, 'configs'));
  await mkdir(join(root, 'skills', 'jg-packages'), { recursive: true });
  const configuration = join(root, 'configs', 'reviewed-versions.json');
  const skill = join(root, 'skills', 'jg-packages', 'SKILL.md');
  await writeFile(
    configuration,
    JSON.stringify({
      schemaVersion: 1,
      groups: [{ packages: ['jg-first'], version: '1.2.3' }],
    }),
  );
  await writeFile(skill, source);
  return { root, configuration, skill };
};

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

test('stale checks are inert and generation is deterministic without leftover temporary files', async () => {
  const owned = await fixture();
  const data = await readFile(owned.configuration);
  await expect(syncReviewedVersions(owned.root, 'check')).rejects.toThrow('fragment is stale');
  expect(await readFile(owned.skill, 'utf8')).toBe(source);
  expect(await syncReviewedVersions(owned.root, 'write')).toBe(true);
  expect(await readFile(owned.skill, 'utf8')).toBe(source.replace('stale', 'jg-first 1.2.3'));
  const fixed = new Date('2000-01-01T00:00:00Z');
  await utimes(owned.skill, fixed, fixed);
  const before = await stat(owned.skill);
  expect(await syncReviewedVersions(owned.root, 'check')).toBe(false);
  expect(await syncReviewedVersions(owned.root, 'write')).toBe(false);
  expect((await stat(owned.skill)).mtimeMs).toBe(before.mtimeMs);
  expect(await readFile(owned.configuration)).toStrictEqual(data);
  expect(await readdir(join(owned.root, 'skills', 'jg-packages'))).toStrictEqual(['SKILL.md']);
});

test.each(['not JSON', JSON.stringify({ schemaVersion: 1, groups: [] })])(
  'invalid configuration is rejected before changing the skill: %s',
  async (input) => {
    const owned = await fixture();
    await writeFile(owned.configuration, input);
    await expect(syncReviewedVersions(owned.root, 'write')).rejects.toThrow('data is invalid');
    expect(await readFile(owned.skill, 'utf8')).toBe(source);
    expect(await readdir(join(owned.root, 'skills', 'jg-packages'))).toStrictEqual(['SKILL.md']);
  },
);

test('oversized input is rejected before parsing or changing output', async () => {
  const owned = await fixture();
  await writeFile(owned.configuration, Buffer.alloc(65_537, 32));
  await expect(readReviewedVersions(owned.root)).rejects.toThrow('exceeds its byte limit');
  expect(await readFile(owned.skill, 'utf8')).toBe(source);
});

test('linked output cannot redirect generation to another checkout', async () => {
  const owned = await fixture();
  const outside = await fixture();
  await rm(owned.skill);
  await symlink(outside.skill, owned.skill, 'file');
  await expect(syncReviewedVersions(owned.root, 'write')).rejects.toThrow('must be regular');
  expect(await readFile(outside.skill, 'utf8')).toBe(source);
});

test('a linked source directory cannot import another checkout configuration', async () => {
  const owned = await fixture();
  const outside = await fixture();
  await rm(join(owned.root, 'configs'), { recursive: true });
  await symlink(
    join(outside.root, 'configs'),
    join(owned.root, 'configs'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  await expect(syncReviewedVersions(owned.root, 'write')).rejects.toThrow('must be regular');
  expect(await readFile(owned.skill, 'utf8')).toBe(source);
});

test('the CLI uses its own checkout when started from another directory', async () => {
  const owned = await fixture();
  const script = resolve(import.meta.dirname, '../../../scripts/reviewed-versions/index.ts');
  const result = await promisify(execFile)(process.execPath, [script, '--check'], {
    cwd: owned.root,
    timeout: 4_000,
  });
  expect(result.stdout).toContain('fragment is current');
  expect(await readFile(owned.skill, 'utf8')).toBe(source);
});
