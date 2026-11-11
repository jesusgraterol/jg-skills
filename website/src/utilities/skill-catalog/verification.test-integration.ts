import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';

import { SKILL_CATALOG } from '../../site.config.ts';

import { verifySkillSources } from './verification.ts';

const repositoryRoot = resolve(import.meta.dirname, '../../../..');

const createFixture = async (): Promise<string> => {
  const root = join(tmpdir(), `jg-skills-source-${randomUUID()}`);
  await mkdir(root);
  try {
    for (const name of Object.keys(SKILL_CATALOG)) {
      const source = join(repositoryRoot, 'skills', name);
      const destination = join(root, 'skills', name);
      await mkdir(join(destination, 'agents'), { recursive: true });
      await copyFile(join(source, 'SKILL.md'), join(destination, 'SKILL.md'));
      await copyFile(
        join(source, 'agents', 'openai.yaml'),
        join(destination, 'agents', 'openai.yaml'),
      );
      let references;
      try {
        references = await readdir(join(source, 'references'), { withFileTypes: true });
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue;
        throw error;
      }
      await mkdir(join(destination, 'references'));
      for (const reference of references) {
        if (!reference.isFile() || !reference.name.endsWith('.md')) {
          throw new Error('The fixture source must contain flat Markdown references.');
        }
        await copyFile(
          join(source, 'references', reference.name),
          join(destination, 'references', reference.name),
        );
      }
    }
    return root;
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
};

test('verifies the actual installable sources without building the website', async () => {
  await expect(verifySkillSources(repositoryRoot)).resolves.toBeUndefined();
});

test('accepts the exact source byte limit and empty reference frontmatter', async () => {
  const root = await createFixture();
  try {
    const path = join(root, 'skills', 'jg-feedback', 'SKILL.md');
    const source = await readFile(path);
    await writeFile(path, Buffer.concat([source, Buffer.alloc(25_600 - source.byteLength, ' ')]));
    const reference = join(root, 'skills', 'jg-npm-package', 'references', 'monorepos.md');
    await writeFile(reference, `---\n---\n${await readFile(reference, 'utf8')}`);
    await expect(verifySkillSources(root)).resolves.toBeUndefined();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test.each<[string, (root: string) => Promise<void>, string]>([
  [
    'unterminated frontmatter',
    async (root) => {
      await writeFile(join(root, 'skills', 'jg-feedback', 'SKILL.md'), '---\nname: jg-feedback\n');
    },
    'Skill frontmatter is invalid',
  ],
  [
    'oversized policy',
    async (root) => {
      await writeFile(
        join(root, 'skills', 'jg-feedback', 'agents', 'openai.yaml'),
        'a'.repeat(25_601),
      );
    },
    'Skill file is larger than its size budget',
  ],
  [
    'missing frontmatter',
    async (root) => {
      await writeFile(join(root, 'skills', 'jg-feedback', 'SKILL.md'), '# Content\n');
    },
    'Skill frontmatter is missing',
  ],
  [
    'malformed YAML',
    async (root) => {
      await writeFile(
        join(root, 'skills', 'jg-feedback', 'SKILL.md'),
        '---\nname: [\n---\n# Content\n',
      );
    },
    'Skill frontmatter is invalid',
  ],
  [
    'duplicate frontmatter key',
    async (root) => {
      const path = join(root, 'skills', 'jg-feedback', 'SKILL.md');
      await writeFile(
        path,
        (await readFile(path, 'utf8')).replace('---\n', '---\nname: jg-feedback\n'),
      );
    },
    'Skill frontmatter is invalid',
  ],
  [
    'mismatched name',
    async (root) => {
      const path = join(root, 'skills', 'jg-feedback', 'SKILL.md');
      await writeFile(
        path,
        (await readFile(path, 'utf8')).replace('name: jg-feedback', 'name: jg-wrong'),
      );
    },
    'Skill name does not match its directory',
  ],
  [
    'implicit invocation on an explicit skill',
    async (root) => {
      await writeFile(
        join(root, 'skills', 'jg-feedback', 'agents', 'openai.yaml'),
        'policy:\n  allow_implicit_invocation: true\n',
      );
    },
    'Skill invocation settings do not match its catalog kind',
  ],
  [
    'missing reference',
    async (root) => {
      await rm(join(root, 'skills', 'jg-npm-package', 'references', 'monorepos.md'));
    },
    'Skill mentions a reference file that does not exist',
  ],
  [
    'unmentioned reference',
    async (root) => {
      const directory = join(root, 'skills', 'jg-node', 'references');
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, 'unused.md'), '# Unused\n');
    },
    'Skill reference file is not mentioned in its SKILL.md',
  ],
  [
    'nested reference',
    async (root) => {
      const directory = join(root, 'skills', 'jg-node', 'references', 'nested');
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, 'topic.md'), '# Topic\n');
    },
    'Skill references folder holds a nested or non-Markdown file',
  ],
  [
    'oversized source',
    async (root) => {
      await writeFile(join(root, 'skills', 'jg-feedback', 'SKILL.md'), 'a'.repeat(25_601));
    },
    'Skill file is larger than its size budget',
  ],
])('rejects %s through real source files', async (_name, change, message) => {
  const root = await createFixture();
  try {
    await change(root);
    await expect(verifySkillSources(root)).rejects.toThrow(message);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
