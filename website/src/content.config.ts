import { posix } from 'node:path';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { SkillFrontmatterSchema, SkillReferenceFrontmatterSchema } from './content/index.ts';

// every installable skill lives in the repository's skills directory, outside the website root
const skills = defineCollection({
  loader: glob({
    base: '../skills',
    generateId: ({ entry }) => posix.dirname(entry),
    pattern: 'jg-*/SKILL.md',
  }),
  schema: SkillFrontmatterSchema,
});

// topic files an implicit skill tells the agent to read only when its task needs them
const skillReferences = defineCollection({
  loader: glob({
    base: '../skills',
    // the skill directory and the file's path inside it, such as jg-postgres/references/migrations
    generateId: ({ entry }) => entry.replace(/\.md$/u, ''),
    pattern: 'jg-*/references/*.md',
  }),
  schema: SkillReferenceFrontmatterSchema,
});

export const collections = { skillReferences, skills };
