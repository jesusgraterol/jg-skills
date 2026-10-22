import type { ISkillAccess, ISkillKind, ISkillStage } from './types.ts';

// exact Codex policy an explicit skill ships so it is never invoked implicitly
export const EXPLICIT_ONLY_OPENAI_POLICY = 'policy:\n  allow_implicit_invocation: false\n';

// exact Codex policy an implicit skill ships so the agent may load it on its own
export const IMPLICIT_OPENAI_POLICY = 'policy:\n  allow_implicit_invocation: true\n';

// stable messages for skill contract violations that must fail the build
export const SKILL_CATALOG_ERROR_MESSAGES = {
  CatalogMismatch: 'Skill catalog does not match the skill folders',
  CopiedSectionMismatch: 'Skill section differs from the other skills that carry it',
  ExplicitSkillReferences: 'Explicit skill has reference files',
  FileOverBudget: 'Skill file is larger than its size budget',
  InvalidSearchMetadata: 'Skill search metadata is outside its limits',
  InvocationMismatch: 'Skill invocation settings do not match its catalog kind',
  MissingVersionLine: 'Implicit skill has no version line',
  NameMismatch: 'Skill name does not match its directory',
  PlanningProtocolMismatch:
    'Planning skills have missing, duplicate, extra, or differing protocol sections',
  PlanningRuntimeMismatch: 'Planning runtime pins and setup do not agree',
  NestedReference: 'Skill reference file mentions another reference file',
  PrefixedSkillReference: 'Skill refers to another skill with a / or $ prefix',
  ReferenceFileInvalid: 'Skill references folder holds a nested or non-Markdown file',
  ReferenceMissing: 'Skill mentions a reference file that does not exist',
  ReferencePathInvalid:
    'Skill names a reference path that is not a kebab-case Markdown file in references/',
  ReferenceUnmentioned: 'Skill reference file is not mentioned in its SKILL.md',
  SectionLink: 'Skill links to a section of another document',
  SharedSectionMismatch: 'Skill shared section differs from the other skills of its kind',
  UnsafeMarkup:
    'Skill file renders markup that Markdown does not produce, an event handler, or a URL with a disallowed scheme',
} as const;

/*
 * the largest SKILL.md or reference file, in bytes; it leaves room for long workflows, but after
 * compaction Claude Code re-attaches only the first 5,000 tokens of each invoked skill, so
 * requirements come before defaults and long examples
 */
export const SKILL_FILE_BYTE_BUDGET = 25_600;

// the section each kind of skill copies word for word from the other skills of its kind
export const SHARED_SECTION_HEADINGS = {
  explicit: 'Invocation',
  implicit: 'Application',
} as const satisfies Record<ISkillKind, string>;

/*
 * sections every skill that carries them copies word for word: Task scope, so a jg-review verdict
 * and a jg-push agree on scope, and Reading a session, so the skills that read another session
 * find it and weigh its messages alike
 */
export const COPIED_SECTION_HEADINGS = ['Task scope', 'Reading a session'] as const;

export const PLANNING_PROTOCOL_HEADING = 'jg-plans protocol 0.1';
export const PLANNING_RUNTIME_VERSION = '0.2.0';
export const PLANNING_PROTOCOL_SKILLS = [
  'jg-plan',
  'jg-breakdown',
  'jg-execute',
  'jg-challenge-plan',
  'jg-challenge-session',
  'jg-review',
  'jg-review-session',
] as const;

/*
 * the two lines an implicit skill may change in its shared Application section: the area sentence,
 * which opens with this text, and the version bullet, which contains the version marker
 */
export const APPLICATION_AREA_PREFIX =
  'The agent loads this skill on its own when a task touches its area.';
export const APPLICATION_VERSION_MARKER = 'This skill was written for';

// display copy for each workflow stage, in landing-page order
export const SKILL_STAGES = {
  plan: { label: 'Plan', summary: 'Agree on what to build before any code changes.' },
  build: { label: 'Build', summary: 'Turn the approved plan into verified code.' },
  ship: { label: 'Ship', summary: 'Check the finished change, then publish it.' },
  context: { label: 'Context', summary: 'Weigh outside input and earlier sessions.' },
  implicit: { label: 'Implicit', summary: 'Loaded by your agent when a task touches their stack.' },
} as const satisfies Record<ISkillStage, { label: string; summary: string }>;

// display labels for what a skill may change, short enough to fit one line of the narrowest card
export const SKILL_ACCESS_LABELS = {
  'changes-code': 'Changes code',
  'changes-code-and-pushes': 'Changes code, can push',
  'commits-and-pushes': 'Commits and pushes',
  'planning-files': 'Writes planning files',
  'read-only': 'Read-only',
  'runs-picked-command': 'Runs a picked command',
} as const satisfies Record<ISkillAccess, string>;
