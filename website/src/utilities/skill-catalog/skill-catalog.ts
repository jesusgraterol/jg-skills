import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from 'astro:config/server';
import { getCollection } from 'astro:content';

import { SKILL_CATALOG } from '../../site.config.ts';

import { SKILL_CATALOG_ERROR_MESSAGES } from './constants.ts';
import type { ISkill } from './types.ts';
import {
  assertBareSkillReferences,
  assertCatalogCoverage,
  assertCopiedSections,
  assertFileBudget,
  assertInvocationSettings,
  assertNoOrphanedReferences,
  assertNoSectionLinks,
  assertReferenceFiles,
  assertReferenceIsLeaf,
  assertReferences,
  assertSafeMarkup,
  assertSearchMetadata,
  assertSharedSections,
  assertSkillName,
  assertVersionLine,
  buildSourceUrl,
  groupReferencesBySkill,
} from './utilities.ts';

/** Narrows a skill directory name to a catalog key. */
const isCatalogName = (name: string): name is keyof typeof SKILL_CATALOG =>
  Object.hasOwn(SKILL_CATALOG, name);

// the website project root, which content entry file paths are relative to, whatever the working directory
const PROJECT_ROOT = fileURLToPath(root);

/** Resolves a content entry's file path against the project root. */
const resolveEntryPath = (filePath: string | undefined, ...segments: string[]): string =>
  resolve(PROJECT_ROOT, filePath ?? '', ...segments);

/** Reads a content file's size in bytes, failing loudly when the file cannot be read. */
const readFileBytes = async (filePath: string | undefined): Promise<number> =>
  (await readFile(resolveEntryPath(filePath))).byteLength;

/** Lists everything under a skill's references folder, or nothing when it has none. */
const listReferenceFolder = async (skillDirectory: string): Promise<string[]> => {
  try {
    const paths = await readdir(resolve(skillDirectory, 'references'), { recursive: true });

    return paths.map((path) => path.split(sep).join('/'));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

/**
 * Loads every skill under the repository's skills directory, merged with its catalog entry and
 * its reference files. Fails the build when a skill folder and the site disagree, a skill's
 * invocation settings do not match its kind, its search metadata would be cut off in search
 * results, its shared section drifts from the other skills of its kind, an implicit skill has no
 * version line, a skill or reference file links to a section of a document or names another skill
 * with a / or $ prefix, a skill's reference files and its SKILL.md disagree, a reference names
 * another reference, a skill file renders markup Markdown does not produce, an event handler, or
 * a URL with a disallowed scheme, or a skill file exceeds the size budget.
 * @returns A promise that resolves to the skills in catalog order.
 * @throws
 * - Skill name does not match its directory
 * - Skill catalog does not match the skill folders
 * - Skill invocation settings do not match its catalog kind
 * - Skill search metadata is outside its limits
 * - Implicit skill has no version line
 * - Skill links to a section of another document
 * - Skill refers to another skill with a / or $ prefix
 * - Explicit skill has reference files
 * - Skill mentions a reference file that does not exist
 * - Skill reference file is not mentioned in its SKILL.md
 * - Skill reference file mentions another reference file
 * - Skill names a reference path that is not a kebab-case Markdown file in references/
 * - Skill references folder holds a nested or non-Markdown file
 * - Skill file renders markup that Markdown does not produce, an event handler, or a URL with a
 *   disallowed scheme
 * - Skill file is larger than its size budget
 * - Skill shared section differs from the other skills of its kind
 * - Skill section differs from the other skills that carry it
 */
export const loadSkills = async (): Promise<ISkill[]> => {
  const entries = await getCollection('skills');
  const referencesBySkill = groupReferencesBySkill(await getCollection('skillReferences'));

  entries.forEach((entry) => assertSkillName(entry.id, entry.data.name));
  assertCatalogCoverage(
    entries.map(({ id }) => id),
    Object.keys(SKILL_CATALOG),
  );

  assertNoOrphanedReferences(
    entries.map(({ id }) => id),
    referencesBySkill,
  );

  const skills = await Promise.all(
    entries.map(async (entry): Promise<ISkill> => {
      const skillDirectory = dirname(resolveEntryPath(entry.filePath));
      const policyPath = resolve(skillDirectory, 'agents', 'openai.yaml');

      if (!isCatalogName(entry.id)) {
        throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.CatalogMismatch}: ${entry.id}`);
      }

      const catalogEntry = SKILL_CATALOG[entry.id];

      assertInvocationSettings(
        entry.id,
        catalogEntry.kind,
        entry.data['disable-model-invocation'],
        await readFile(policyPath, 'utf8'),
      );

      assertSearchMetadata(entry.id, catalogEntry.searchTitle, catalogEntry.searchDescription);

      const document = { body: entry.body ?? '', kind: catalogEntry.kind, name: entry.id };
      const references = referencesBySkill.get(entry.id) ?? [];

      assertVersionLine(document);
      assertNoSectionLinks(document);
      assertBareSkillReferences(document);
      assertSafeMarkup(entry.id, entry.rendered?.html);
      assertReferenceFiles(entry.id, await listReferenceFolder(skillDirectory));
      assertReferences(
        document,
        references.map(({ path }) => path),
      );
      assertFileBudget(entry.id, 'SKILL.md', await readFileBytes(entry.filePath));

      for (const reference of references) {
        const referenceBody = reference.entry.body ?? '';
        const referenceDocument = { body: referenceBody, name: `${entry.id}/${reference.path}` };

        assertReferenceIsLeaf(entry.id, reference.path, referenceBody);
        assertNoSectionLinks(referenceDocument);
        assertBareSkillReferences(referenceDocument);
        assertSafeMarkup(referenceDocument.name, reference.entry.rendered?.html);
        assertFileBudget(entry.id, reference.path, await readFileBytes(reference.entry.filePath));
      }

      return {
        ...catalogEntry,
        argumentHint: entry.data['argument-hint'],
        description: entry.data.description,
        entry,
        name: entry.id,
        references,
        sourceUrl: buildSourceUrl(entry.id),
      };
    }),
  );

  const documents = skills.map(({ entry, kind, name }) => ({ body: entry.body ?? '', kind, name }));

  assertSharedSections(documents);
  assertCopiedSections(documents);

  return skills.toSorted((first, second) => first.order - second.order);
};
