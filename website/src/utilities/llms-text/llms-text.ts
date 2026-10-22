import { buildLlmsText as buildLlmsTextFile } from 'jg-site';

import { SITE_CONFIG } from '../../site.config.ts';

import type { ILlmsSkill } from './types.ts';

/**
 * Builds the canonical LLM-readable index from the current skills.
 * @param skills The published skills in catalog order.
 * @returns The llms.txt document.
 */
export const buildLlmsText = (skills: readonly ILlmsSkill[]): string =>
  buildLlmsTextFile({
    name: SITE_CONFIG.name,
    summary: SITE_CONFIG.defaultDescription,
    details: [
      'Explicit skills run only when the developer invokes them by name, for example `/jg-plan`, and defer general engineering standards to the coding instructions of the repository they run in. Implicit skills load on their own when a task touches their stack, such as PostgreSQL or React, and add the standards for it. Install the skills per project from the repository root.',
    ],
    sections: [
      { heading: 'Install', body: ['```bash', SITE_CONFIG.commands.install, '```'].join('\n') },
      {
        heading: 'Planning runtime',
        body: [
          'Install the exact runtime dependency in each project (Node.js 24.15+). Skills never install it automatically; no-plan tasks and code-only reviews need no CLI.',
          '',
          '```bash',
          SITE_CONFIG.commands.runtimeInstall,
          '```',
        ].join('\n'),
      },
      {
        heading: 'Skills',
        links: skills.map(({ description, name }) => ({
          title: name,
          url: `${SITE_CONFIG.url}/skills/${name}/`,
          description,
        })),
      },
      {
        heading: 'Optional',
        links: [
          {
            title: 'Source repository',
            url: SITE_CONFIG.repositoryUrl,
            description: 'The skill folders, this website, and the issue tracker.',
          },
          {
            title: 'Agentic Coding',
            url: SITE_CONFIG.agenticCodingUrl,
            description: 'The engineering approach these skills put into practice.',
          },
          {
            title: 'Start an AGENTS.md',
            url: SITE_CONFIG.agenticCodingStartUrl,
            description:
              'A neutral AGENTS.md foundation for repositories without coding instructions.',
          },
          {
            title: 'Refine an AGENTS.md',
            url: SITE_CONFIG.agenticCodingRefineUrl,
            description:
              'A prompt that refines existing coding instructions without losing project knowledge.',
          },
          {
            title: 'Author',
            url: SITE_CONFIG.author.url,
            description: `More work by ${SITE_CONFIG.author.name}.`,
          },
        ],
      },
    ],
  });
