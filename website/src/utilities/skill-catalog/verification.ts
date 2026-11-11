import { open, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDocument } from 'yaml';

import manifest from '../../../package.json' with { type: 'json' };

import { SkillFrontmatterSchema, SkillReferenceFrontmatterSchema } from '../../content/index.ts';
import { SKILL_CATALOG, SITE_CONFIG } from '../../site.config.ts';

import { SKILL_FILE_BYTE_BUDGET } from './constants.ts';
import type { ISkillDocument } from './types.ts';
import {
  assertBareSkillReferences,
  assertCatalogCoverage,
  assertCopiedSections,
  assertFileBudget,
  assertInvocationSettings,
  assertNoSectionLinks,
  assertPlanningProtocol,
  assertReferenceFiles,
  assertReferenceIsLeaf,
  assertReferences,
  assertSharedSections,
  assertSkillName,
  assertVersionLine,
} from './utilities.ts';

/**
 * Reads at most one byte beyond the skill budget, closing the file after success or failure.
 * @returns The complete source bytes within the budget.
 * @throws
 * - Skill file is larger than its size budget
 */
const readSourceFile = async (repositoryRoot: string, skillName: string, path: string) => {
  const file = await open(join(repositoryRoot, 'skills', skillName, path), 'r');
  try {
    const bytes = Buffer.alloc(SKILL_FILE_BYTE_BUDGET + 1);
    let length = 0;
    while (length < bytes.byteLength) {
      const result = await file.read(bytes, length, bytes.byteLength - length, null);
      if (result.bytesRead === 0) break;
      length += result.bytesRead;
    }
    assertFileBudget(skillName, path, length);
    return bytes.subarray(0, length);
  } finally {
    await file.close();
  }
};

/**
 * Reads one bounded skill document and separates its optional YAML frontmatter.
 * @returns Its body, untrusted metadata and frontmatter presence.
 * @throws
 * - Skill file is larger than its size budget
 * - Skill frontmatter is invalid
 */
const readDocument = async (repositoryRoot: string, skillName: string, path: string) => {
  const bytes = await readSourceFile(repositoryRoot, skillName, path);
  const source = bytes.toString('utf8').replace(/^\uFEFF/u, '');
  const match = /^---\r?\n([\s\S]*?)^---(?:\r?\n|$)/mu.exec(source);
  if (match?.index !== 0) {
    if (/^---\r?\n/u.test(source)) {
      throw new Error(`Skill frontmatter is invalid: ${skillName}/${path}`);
    }
    return { body: source, frontmatter: {}, hasFrontmatter: false };
  }
  const document = parseDocument(match[1] ?? '', { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(
      `Skill frontmatter is invalid: ${skillName}/${path}: ${document.errors.map(({ message }) => message).join('; ')}`,
    );
  }
  return {
    body: source.slice(match[0].length),
    frontmatter: (document.toJS() ?? {}) as unknown,
    hasFrontmatter: true,
  };
};

/**
 * Lists the flat reference files that the owning skill must declare.
 * @returns Their names, or an empty list when the reference folder is absent.
 */
const listReferences = async (repositoryRoot: string, skillName: string): Promise<string[]> => {
  try {
    return await readdir(join(repositoryRoot, 'skills', skillName, 'references'));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
};

/**
 * Checks installable skill metadata, instructions and references without rendering the website.
 * @param repositoryRoot The trusted checkout containing the skills directory.
 * @returns A promise that resolves after all skill source checks pass.
 * @throws
 * - Skill frontmatter is missing
 * - Skill frontmatter is invalid
 * - Invalid skill or reference frontmatter fields
 * - Skill name does not match its directory
 * - Skill catalog does not match the skill folders
 * - Skill invocation settings do not match its catalog kind
 * - Implicit skill has no version line
 * - Skill links to a section of another document
 * - Skill refers to another skill with a / or $ prefix
 * - Explicit skill has reference files
 * - Skill mentions a reference file that does not exist
 * - Skill reference file is not mentioned in its SKILL.md
 * - Skill reference file mentions another reference file
 * - Skill names a reference path that is not a kebab-case Markdown file in references/
 * - Skill references folder holds a nested or non-Markdown file
 * - Skill file is larger than its size budget
 * - Skill shared section differs from the other skills of its kind
 * - Skill section differs from the other skills that carry it
 * - Planning skills have missing, duplicate, extra, or differing protocol sections
 * - Planning runtime pins and setup do not agree
 */
export const verifySkillSources = async (repositoryRoot: string): Promise<void> => {
  const directories = await readdir(join(repositoryRoot, 'skills'), { withFileTypes: true });
  assertCatalogCoverage(
    directories.filter((entry) => entry.isDirectory()).map(({ name }) => name),
    Object.keys(SKILL_CATALOG),
  );
  const documents: ISkillDocument[] = [];
  for (const [name, entry] of Object.entries(SKILL_CATALOG)) {
    const source = await readDocument(repositoryRoot, name, 'SKILL.md');
    if (!source.hasFrontmatter) throw new Error(`Skill frontmatter is missing: ${name}`);
    const frontmatter = SkillFrontmatterSchema.parse(source.frontmatter);
    assertSkillName(name, frontmatter.name);
    assertInvocationSettings(
      name,
      entry.kind,
      frontmatter['disable-model-invocation'],
      (await readSourceFile(repositoryRoot, name, 'agents/openai.yaml')).toString('utf8'),
    );
    const document = { body: source.body, kind: entry.kind, name };
    const references = await listReferences(repositoryRoot, name);
    assertReferenceFiles(name, references);
    assertReferences(
      document,
      references.map((path) => `references/${path}`),
    );
    assertVersionLine(document);
    assertNoSectionLinks(document);
    assertBareSkillReferences(document);
    for (const path of references) {
      const relativePath = `references/${path}`;
      const reference = await readDocument(repositoryRoot, name, relativePath);
      SkillReferenceFrontmatterSchema.parse(reference.frontmatter);
      const referenceDocument = { body: reference.body, name: `${name}/${relativePath}` };
      assertReferenceIsLeaf(name, relativePath, reference.body);
      assertNoSectionLinks(referenceDocument);
      assertBareSkillReferences(referenceDocument);
    }
    documents.push(document);
  }
  assertSharedSections(documents);
  assertCopiedSections(documents);
  assertPlanningProtocol(
    documents,
    SITE_CONFIG.commands.runtimeInstall,
    manifest.devDependencies['jg-plans'],
  );
};
