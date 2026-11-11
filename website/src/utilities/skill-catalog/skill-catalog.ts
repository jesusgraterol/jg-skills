import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from 'astro:config/server';
import { getCollection } from 'astro:content';

import { SKILL_CATALOG } from '../../site.config.ts';

import { SKILL_CATALOG_ERROR_MESSAGES } from './constants.ts';
import type { ISkill } from './types.ts';
import {
  assertSafeMarkup,
  assertSearchMetadata,
  buildSourceUrl,
  groupReferencesBySkill,
} from './utilities.ts';
import { verifySkillSources } from './verification.ts';

/** Narrows a skill directory name to a catalog key. */
const isCatalogName = (name: string): name is keyof typeof SKILL_CATALOG =>
  Object.hasOwn(SKILL_CATALOG, name);

// the website project root, shared by content loading and source verification
const PROJECT_ROOT = fileURLToPath(root);

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
 * - Skill frontmatter is missing
 * - Skill frontmatter is invalid
 * - Invalid skill or reference frontmatter fields
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
 * - Planning skills have missing, duplicate, extra, or differing protocol sections
 * - Planning runtime pins and setup do not agree
 */
export const loadSkills = async (): Promise<ISkill[]> => {
  await verifySkillSources(resolve(PROJECT_ROOT, '..'));
  const entries = await getCollection('skills');
  const referencesBySkill = groupReferencesBySkill(await getCollection('skillReferences'));
  const skills = entries.map((entry): ISkill => {
    if (!isCatalogName(entry.id)) {
      throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.CatalogMismatch}: ${entry.id}`);
    }
    const catalogEntry = SKILL_CATALOG[entry.id];
    const references = referencesBySkill.get(entry.id) ?? [];
    assertSearchMetadata(entry.id, catalogEntry.searchTitle, catalogEntry.searchDescription);
    assertSafeMarkup(entry.id, entry.rendered?.html);
    for (const reference of references) {
      assertSafeMarkup(`${entry.id}/${reference.path}`, reference.entry.rendered?.html);
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
  });
  return skills.toSorted((first, second) => first.order - second.order);
};
