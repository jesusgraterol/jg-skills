import { SITE_CONFIG } from '../../site.config.ts';
import { findUnsafeMarkup } from '../rendered-html/index.ts';
import { SEARCH_TEXT_LIMITS } from '../seo/index.ts';

import {
  APPLICATION_AREA_PREFIX,
  APPLICATION_VERSION_MARKER,
  COPIED_SECTION_HEADINGS,
  EXPLICIT_ONLY_OPENAI_POLICY,
  IMPLICIT_OPENAI_POLICY,
  SHARED_SECTION_HEADINGS,
  SKILL_CATALOG_ERROR_MESSAGES,
  SKILL_FILE_BYTE_BUDGET,
} from './constants.ts';
import type { ISkillDocument, ISkillKind } from './types.ts';

// a link to a section of any document, as an inline link, a reference definition, or an autolink
// whose target carries a #fragment; a self-contained skill never needs one
const SECTION_LINK_PATTERN =
  /\]\([^)]*#[^)]*\)|^ {0,3}\[[^\]]+\]:[ \t]*\S*#|<[a-z][a-z\d+.-]*:[^\s>]*#[^\s>]*>/imu;

// a skill name written with a slash-command or mention prefix, but not a path such as skills/jg-x
const PREFIXED_SKILL_REFERENCE_PATTERN = /(?:^|[\s`('"])([/$]jg-[a-z0-9-]+)/mu;

// a reference file named by its path inside the skill folder, but not a path into another folder
const REFERENCE_PATH_PATTERN = /(?<![\w./-])references\/[a-z0-9]+(?:-[a-z0-9]+)*\.md(?![\w-])/gu;

// any path written inside a skill's references folder, valid or not, so a malformed one fails
const REFERENCE_MENTION_PATTERN =
  /(?<![\w./-])(?:\.\/)?references\/[^\s`'"()[\]<>,;]*[^\s`'"()[\]<>,;.:!?]/gu;

// the one form a reference file may take: a kebab-case Markdown file directly inside references/
const REFERENCE_FILE_PATTERN = /^references\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

// the frontmatter flag and Codex policy each kind of skill must ship
const INVOCATION_SETTINGS = {
  explicit: { disableModelInvocation: true, policy: EXPLICIT_ONLY_OPENAI_POLICY },
  implicit: { disableModelInvocation: undefined, policy: IMPLICIT_OPENAI_POLICY },
} as const satisfies Record<
  ISkillKind,
  { disableModelInvocation: true | undefined; policy: string }
>;

/**
 * Asserts that a skill's frontmatter name matches the directory it is installed from.
 * @param directoryName The skill's directory name.
 * @param frontmatterName The `name` declared in the skill's SKILL.md frontmatter.
 * @throws
 * - Skill name does not match its directory
 */
export const assertSkillName = (directoryName: string, frontmatterName: string): void => {
  if (directoryName !== frontmatterName) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.NameMismatch}: ${directoryName}`);
  }
};

/**
 * Asserts that a skill's frontmatter flag and Codex policy match its catalog kind, whatever the
 * policy's line endings: explicit skills disable model invocation in both agents, and implicit
 * skills omit the flag and allow implicit invocation.
 * @param skillName The skill whose settings are checked.
 * @param kind The skill's kind in the site catalog.
 * @param disableModelInvocation The `disable-model-invocation` value in its SKILL.md frontmatter.
 * @param policyText The contents of the skill's agents/openai.yaml.
 * @throws
 * - Skill invocation settings do not match its catalog kind
 */
export const assertInvocationSettings = (
  skillName: string,
  kind: ISkillKind,
  disableModelInvocation: true | undefined,
  policyText: string,
): void => {
  const expected = INVOCATION_SETTINGS[kind];

  if (
    disableModelInvocation !== expected.disableModelInvocation ||
    policyText.replaceAll('\r\n', '\n') !== expected.policy
  ) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.InvocationMismatch}: ${skillName}`);
  }
};

/**
 * Asserts that a skill's search title leads with its name and that its title and description fit
 * in search results.
 * @param skillName The skill whose search metadata is checked.
 * @param searchTitle The page title shown in search results.
 * @param searchDescription The meta description shown in search results.
 * @throws
 * - Skill search metadata is outside its limits
 */
export const assertSearchMetadata = (
  skillName: string,
  searchTitle: string,
  searchDescription: string,
): void => {
  if (
    !searchTitle.startsWith(skillName) ||
    searchTitle.length > SEARCH_TEXT_LIMITS.titleMaxLength ||
    searchDescription.length < SEARCH_TEXT_LIMITS.descriptionMinLength ||
    searchDescription.length > SEARCH_TEXT_LIMITS.descriptionMaxLength
  ) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.InvalidSearchMetadata}: ${skillName}`);
  }
};

/**
 * Asserts that the site catalog describes exactly the skills that exist on disk.
 * @param skillNames The skill directory names found in the repository.
 * @param catalogNames The skill names described by the site catalog.
 * @throws
 * - Skill catalog does not match the skill folders
 */
export const assertCatalogCoverage = (
  skillNames: readonly string[],
  catalogNames: readonly string[],
): void => {
  const missing = skillNames.filter((name) => !catalogNames.includes(name)).toSorted();
  const extra = catalogNames.filter((name) => !skillNames.includes(name)).toSorted();

  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `${SKILL_CATALOG_ERROR_MESSAGES.CatalogMismatch}: missing from catalog [${missing.join(', ')}], missing from skills [${extra.join(', ')}]`,
    );
  }
};

/**
 * Extracts the text of one level-two section from a skill body.
 * @param body The SKILL.md body without its frontmatter.
 * @param heading The section heading, without the leading `## `.
 * @returns The lines between the heading and the next level-two heading, trimmed at the end, or
 * undefined when the section is missing.
 */
export const extractSection = (body: string, heading: string): string | undefined => {
  const lines = body.replaceAll('\r\n', '\n').split('\n');
  const start = lines.indexOf(`## ${heading}`);

  if (start === -1) {
    return undefined;
  }

  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));

  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join('\n')
    .trimEnd();
};

/**
 * Sets aside the lines a skill may change in its shared section: an implicit skill's area sentence
 * and version bullet. An explicit skill's section is compared exactly.
 * @param kind The skill's kind.
 * @param section The text of the skill's shared section.
 * @returns The section with its changeable lines replaced by fixed placeholders.
 */
const normalizeSharedSection = (kind: ISkillKind, section: string): string =>
  kind === 'explicit'
    ? section
    : section
        .split('\n')
        .map((line) => {
          if (line.startsWith(APPLICATION_AREA_PREFIX)) {
            return '<area>';
          }

          return line.startsWith('- ') && line.includes(APPLICATION_VERSION_MARKER)
            ? '- <version>'
            : line;
        })
        .join('\n');

/**
 * Asserts that every skill of a kind carries the same shared section: `## Invocation` for explicit
 * skills and `## Application` for implicit ones, apart from the two lines an implicit skill may
 * change. The skills that differ from the most common version, or lack the section, are named.
 * @param skills The name, kind, and SKILL.md body of every skill.
 * @throws
 * - Skill shared section differs from the other skills of its kind
 */
export const assertSharedSections = (skills: readonly ISkillDocument[]): void => {
  const differing = (['explicit', 'implicit'] as const).flatMap((kind) => {
    const sections = skills
      .filter((skill) => skill.kind === kind)
      .map(({ body, name }) => {
        const section = extractSection(body, SHARED_SECTION_HEADINGS[kind]);

        return {
          name,
          normalized: section === undefined ? undefined : normalizeSharedSection(kind, section),
        };
      });
    const counts = new Map<string, number>();

    sections.forEach(({ normalized }) => {
      if (normalized !== undefined) {
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    });

    const reference = [...counts.entries()].toSorted(
      (first, second) => second[1] - first[1],
    )[0]?.[0];

    return sections
      .filter(({ normalized }) => normalized === undefined || normalized !== reference)
      .map(({ name }) => name);
  });

  if (differing.length > 0) {
    throw new Error(
      `${SKILL_CATALOG_ERROR_MESSAGES.SharedSectionMismatch}: ${differing.toSorted().join(', ')}`,
    );
  }
};

/**
 * Asserts that every skill carrying one of the copied sections carries the same copy:
 * `## Task scope`, because jg-push reuses a jg-review verdict only when both computed the scope
 * and its fingerprint alike, and `## Reading a session`, because the skills that read another
 * session must find it and weigh its messages alike.
 * @param skills The name, kind, and SKILL.md body of every skill.
 * @throws
 * - Skill section differs from the other skills that carry it
 */
export const assertCopiedSections = (skills: readonly ISkillDocument[]): void => {
  COPIED_SECTION_HEADINGS.forEach((heading) => {
    const sections = skills.flatMap(({ body, name }) => {
      const section = extractSection(body, heading);

      return section === undefined ? [] : [{ name, section }];
    });

    if (new Set(sections.map(({ section }) => section)).size > 1) {
      throw new Error(
        `${SKILL_CATALOG_ERROR_MESSAGES.CopiedSectionMismatch}: ${heading} (${sections
          .map(({ name }) => name)
          .toSorted()
          .join(', ')})`,
      );
    }
  });
};

/**
 * Asserts that an implicit skill states the versions it was written for in its Application
 * section.
 * @param skill The skill's name, kind, and SKILL.md body.
 * @throws
 * - Implicit skill has no version line
 */
export const assertVersionLine = ({ body, kind, name }: ISkillDocument): void => {
  if (kind === 'explicit') {
    return;
  }

  const section = extractSection(body, SHARED_SECTION_HEADINGS.implicit) ?? '';
  const hasVersionLine = section
    .split('\n')
    .some((line) => line.startsWith('- ') && line.includes(APPLICATION_VERSION_MARKER));

  if (!hasVersionLine) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.MissingVersionLine}: ${name}`);
  }
};

/**
 * Asserts that a skill never links to a section of a document, in the same file or another one,
 * because skills are self-contained and must not depend on the sections of a particular file.
 * @param skill The skill's name and SKILL.md body.
 * @throws
 * - Skill links to a section of another document
 */
export const assertNoSectionLinks = ({
  body,
  name,
}: Pick<ISkillDocument, 'body' | 'name'>): void => {
  const match = SECTION_LINK_PATTERN.exec(body);

  if (match) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.SectionLink}: ${name} (${match[0]})`);
  }
};

/**
 * Asserts that a skill names other skills bare, such as jg-plan, never as a host command like
 * /jg-plan or $jg-plan, so the same text works in every agent.
 * @param skill The skill's name and SKILL.md body.
 * @throws
 * - Skill refers to another skill with a / or $ prefix
 */
export const assertBareSkillReferences = ({
  body,
  name,
}: Pick<ISkillDocument, 'body' | 'name'>): void => {
  const match = PREFIXED_SKILL_REFERENCE_PATTERN.exec(body);

  if (match) {
    throw new Error(
      `${SKILL_CATALOG_ERROR_MESSAGES.PrefixedSkillReference}: ${name} (${match[1]})`,
    );
  }
};

/**
 * Lists the reference files a skill document names, such as references/migrations.md.
 * @param body The text of a SKILL.md or reference file.
 * @returns The distinct reference paths in sorted order.
 */
export const extractReferencePaths = (body: string): string[] =>
  [...new Set(body.match(REFERENCE_PATH_PATTERN) ?? [])].toSorted();

/**
 * Lists every path a skill document writes inside its references folder, including malformed ones
 * such as nested, uppercase, or non-Markdown paths, so the build can reject them.
 * @param body The text of a SKILL.md or reference file.
 * @returns The distinct mentioned paths in sorted order.
 */
export const extractReferenceMentions = (body: string): string[] =>
  [...new Set(body.match(REFERENCE_MENTION_PATTERN) ?? [])].toSorted();

/**
 * Asserts that a reference path takes the one form the site renders and the size budget covers: a
 * kebab-case Markdown file directly inside references/.
 * @param skillName The skill that names the path.
 * @param path The path as written, such as references/migrations.md.
 * @throws
 * - Skill names a reference path that is not a kebab-case Markdown file in references/
 */
export const assertReferencePathForm = (skillName: string, path: string): void => {
  if (!REFERENCE_FILE_PATTERN.test(path)) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.ReferencePathInvalid}: ${skillName} (${path})`);
  }
};

/**
 * Asserts that a skill's references folder holds only kebab-case Markdown files at its top level,
 * because nested and non-Markdown files are installed with the skill but never rendered or checked.
 * @param skillName The skill that owns the folder.
 * @param relativePaths Every file and directory under references/, relative to it, with `/`
 * separators, as a recursive listing returns them.
 * @throws
 * - Skill references folder holds a nested or non-Markdown file
 */
export const assertReferenceFiles = (skillName: string, relativePaths: readonly string[]): void => {
  const invalid = relativePaths
    .map((path) => `references/${path}`)
    .filter((path) => !REFERENCE_FILE_PATTERN.test(path))
    .toSorted();

  if (invalid.length > 0) {
    throw new Error(
      `${SKILL_CATALOG_ERROR_MESSAGES.ReferenceFileInvalid}: ${skillName} (${invalid.join(', ')})`,
    );
  }
};

/**
 * Groups reference files by the skill directory they belong to, in code-point path order, the same
 * order the build verification lists them in.
 * @param entries Reference entries whose IDs read like jg-postgres/references/naming.
 * @returns Each skill's references with their paths inside the skill folder, keyed by skill name.
 */
export const groupReferencesBySkill = <T extends { id: string }>(
  entries: readonly T[],
): Map<string, { entry: T; path: string }[]> => {
  const referencesBySkill = new Map<string, { entry: T; path: string }[]>();

  for (const entry of entries) {
    const [skillName = '', ...pathSegments] = entry.id.split('/');
    const references = referencesBySkill.get(skillName) ?? [];

    references.push({ entry, path: `${pathSegments.join('/')}.md` });
    referencesBySkill.set(skillName, references);
  }

  referencesBySkill.forEach((references) =>
    references.sort((first, second) => (first.path < second.path ? -1 : 1)),
  );

  return referencesBySkill;
};

/**
 * Asserts that every reference file belongs to a skill folder with a SKILL.md, because a reference
 * in a folder without one can never be read by an agent.
 * @param skillNames The names of the skills that have a SKILL.md.
 * @param referencesBySkill Each folder's reference paths, keyed by folder name.
 * @throws
 * - Skill reference file is not mentioned in its SKILL.md
 */
export const assertNoOrphanedReferences = (
  skillNames: readonly string[],
  referencesBySkill: ReadonlyMap<string, readonly { path: string }[]>,
): void => {
  const orphanedSkill = [...referencesBySkill.keys()].find((name) => !skillNames.includes(name));

  if (orphanedSkill !== undefined) {
    const orphanedPaths = (referencesBySkill.get(orphanedSkill) ?? []).map(({ path }) => path);

    throw new Error(
      `${SKILL_CATALOG_ERROR_MESSAGES.ReferenceUnmentioned}: ${orphanedSkill} (${orphanedPaths.join(', ')})`,
    );
  }
};

/**
 * Asserts that a skill file's rendered HTML holds only markup Markdown produces, with no event
 * handler or URL whose scheme is not http, https, or mailto, because the site renders skill Markdown without sanitizing it: a stray tag
 * hides or reshapes the page, and a script would run in readers' browsers. The rendered output is
 * checked, rather than the source, so no Markdown syntax or character encoding can slip past it.
 * @param name The file's name, such as jg-react or jg-react/references/client-data.md.
 * @param html The file's rendered HTML, or undefined when the content layer did not render it.
 * @throws
 * - Skill file renders markup that Markdown does not produce, an event handler, or a URL with a
 *   disallowed scheme
 */
export const assertSafeMarkup = (name: string, html: string | undefined): void => {
  const problem = html === undefined ? 'not rendered' : findUnsafeMarkup(html);

  if (problem !== undefined) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.UnsafeMarkup}: ${name} (${problem})`);
  }
};

/**
 * Asserts that a skill's reference files and its SKILL.md agree: only implicit skills have them,
 * every reference SKILL.md names exists, and every reference file is named, so the agent can
 * find each one and none sits unused.
 * @param skill The skill's name, kind, and SKILL.md body.
 * @param referencePaths The paths of the skill's reference files, such as references/naming.md.
 * @throws
 * - Explicit skill has reference files
 * - Skill names a reference path that is not a kebab-case Markdown file in references/
 * - Skill mentions a reference file that does not exist
 * - Skill reference file is not mentioned in its SKILL.md
 */
export const assertReferences = (
  { body, kind, name }: ISkillDocument,
  referencePaths: readonly string[],
): void => {
  if (kind === 'explicit' && referencePaths.length > 0) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.ExplicitSkillReferences}: ${name}`);
  }

  extractReferenceMentions(body).forEach((path) => assertReferencePathForm(name, path));

  const mentioned = extractReferencePaths(body);
  const missing = mentioned.filter((path) => !referencePaths.includes(path));
  const unmentioned = referencePaths.filter((path) => !mentioned.includes(path)).toSorted();

  if (missing.length > 0) {
    throw new Error(
      `${SKILL_CATALOG_ERROR_MESSAGES.ReferenceMissing}: ${name} (${missing.join(', ')})`,
    );
  }

  if (unmentioned.length > 0) {
    throw new Error(
      `${SKILL_CATALOG_ERROR_MESSAGES.ReferenceUnmentioned}: ${name} (${unmentioned.join(', ')})`,
    );
  }
};

/**
 * Asserts that a reference file names no other reference file, so references stay one level deep
 * and the agent never has to follow a chain to find a rule.
 * @param skillName The skill that owns the reference.
 * @param path The reference's path inside the skill folder.
 * @param body The reference file's text.
 * @throws
 * - Skill reference file mentions another reference file
 */
export const assertReferenceIsLeaf = (skillName: string, path: string, body: string): void => {
  if (extractReferenceMentions(body).length > 0) {
    throw new Error(`${SKILL_CATALOG_ERROR_MESSAGES.NestedReference}: ${skillName} (${path})`);
  }
};

/**
 * Asserts that a skill file fits the size budget, so the whole file stays within what an agent
 * keeps of an invoked skill after compaction.
 * @param skillName The skill that owns the file.
 * @param path The file's path inside the skill folder, such as SKILL.md.
 * @param bytes The file's size in bytes.
 * @throws
 * - Skill file is larger than its size budget
 */
export const assertFileBudget = (skillName: string, path: string, bytes: number): void => {
  if (bytes > SKILL_FILE_BYTE_BUDGET) {
    throw new Error(
      `${SKILL_CATALOG_ERROR_MESSAGES.FileOverBudget}: ${skillName} (${path}, ${bytes} of ${SKILL_FILE_BYTE_BUDGET} bytes)`,
    );
  }
};

/**
 * Builds the public source URL of one skill's instructions.
 * @param name The skill name, which is also its directory name.
 * @returns The GitHub URL of the skill's SKILL.md on the main branch.
 */
export const buildSourceUrl = (name: string): string =>
  `${SITE_CONFIG.repositoryUrl}/blob/main/skills/${name}/SKILL.md`;
