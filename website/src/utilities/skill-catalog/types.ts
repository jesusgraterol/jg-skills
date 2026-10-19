import type { CollectionEntry } from 'astro:content';

// how a skill starts: only when the developer invokes it, or on its own when a task needs it
export type ISkillKind = 'explicit' | 'implicit';

// workflow stages used to group skills on the landing page; implicit skills share one group
export type ISkillStage = 'plan' | 'build' | 'ship' | 'context' | 'implicit';

// what a skill may change when it runs
export type ISkillAccess =
  | 'read-only'
  | 'planning-files'
  | 'changes-code'
  | 'changes-code-and-pushes'
  | 'commits-and-pushes'
  | 'runs-picked-command';

// a Lucide icon that stands for what a skill does, named as Lucide names its `lucide-<name>` class
export type ISkillLucideIcon =
  | 'bug'
  | 'circle-pause'
  | 'database'
  | 'file-terminal'
  | 'flask-conical'
  | 'folder-tree'
  | 'globe'
  | 'hammer'
  | 'image'
  | 'lightbulb'
  | 'list-ordered'
  | 'map'
  | 'message-circle-question-mark'
  | 'messages-square'
  | 'monitor-smartphone'
  | 'package'
  | 'puzzle'
  | 'scale'
  | 'search-check'
  | 'shield-question-mark'
  | 'ship'
  | 'terminal'
  | 'upload'
  | 'vector-square'
  | 'workflow';

// the Simple Icons slug of a technology mark an implicit skill shows for the stack it covers
export type ISkillBrandMark = 'nestjs' | 'nodedotjs' | 'react' | 'redis' | 'tailwindcss' | 'zod';

// the icon shown beside a skill's name on its card and page
export type ISkillIcon = ISkillLucideIcon | ISkillBrandMark;

// a realistic invocation, written without a host prefix, and what it produces
export interface ISkillExample {
  invocation: string;
  outcome: string;
}

// one of several supported invocation cases, labeled by what sets it apart, e.g. "Autonomous"
export interface ISkillCaseExample extends ISkillExample {
  label: string;
}

// a single example, or one labeled example per supported case when a skill takes flags or named arguments
export type ISkillExamples =
  | readonly [ISkillExample]
  | readonly [ISkillCaseExample, ISkillCaseExample, ...ISkillCaseExample[]];

// a realistic developer request that loads an implicit skill, and what the skill adds to the work
export interface ISkillTriggerExample {
  outcome: string;
  request: string;
}

// one or more requests that load an implicit skill
export type ISkillTriggerExamples = readonly [ISkillTriggerExample, ...ISkillTriggerExample[]];

// presentation data every skill has, whatever its kind
interface ISkillCatalogEntryBase {
  order: number;
  // search result description, 70 to 160 characters
  searchDescription: string;
  // search result title, at most 60 characters and starting with the skill name
  searchTitle: string;
  // one or two vendor-neutral sentences on when to reach for the skill
  whenToUse: string;
}

// a skill that runs only when the developer invokes it by name
export interface IExplicitSkillCatalogEntry extends ISkillCatalogEntryBase {
  access: ISkillAccess;
  examples: ISkillExamples;
  // explicit skills don't cover a technology, so they never show a technology mark
  icon: ISkillLucideIcon;
  kind: 'explicit';
  stage: Exclude<ISkillStage, 'implicit'>;
}

// a skill the agent loads on its own when a task touches its area
export interface IImplicitSkillCatalogEntry extends ISkillCatalogEntryBase {
  examples: ISkillTriggerExamples;
  /*
   * the mark of the technology it is written for, or a Lucide icon when it covers several
   * technologies or its mark blurs at card size
   */
  icon: ISkillIcon;
  kind: 'implicit';
  stage: 'implicit';
  // one short sentence for the skill's card; the SKILL.md description is a trigger list for agents
  summary: string;
}

// site-owned presentation data for one skill; the skill folder owns everything else
export type ISkillCatalogEntry = IExplicitSkillCatalogEntry | IImplicitSkillCatalogEntry;

// one topic file an implicit skill tells the agent to read only when its task needs it
export interface ISkillReference {
  entry: CollectionEntry<'skillReferences'>;
  // the file's path inside the skill folder, as SKILL.md names it, e.g. references/migrations.md
  path: string;
}

// what the skill folder contributes to a skill
interface ISkillSource {
  argumentHint: string | undefined;
  description: string;
  entry: CollectionEntry<'skills'>;
  name: string;
  // reference files in path order; explicit skills have none
  references: readonly ISkillReference[];
  sourceUrl: string;
}

// one skill merged from its SKILL.md entry and its catalog entry
export type ISkill = ISkillCatalogEntry & ISkillSource;

// the parts of a skill its content checks read: its name, its kind, and its SKILL.md body
export interface ISkillDocument {
  body: string;
  kind: ISkillKind;
  name: string;
}
