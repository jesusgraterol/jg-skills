// @vitest-environment node
import { describe, expect, test } from 'vitest';

import { buildStructuredData } from './structured-data.ts';

// website reference every page entity points back to
const WEBSITE_REFERENCE = {
  '@id': 'https://jg-skills.jesusgraterol.dev/#website',
  '@type': 'WebSite',
  name: 'jg-skills',
  url: 'https://jg-skills.jesusgraterol.dev/',
};

// author identity, linked to the author's public profiles
const AUTHOR = {
  '@type': 'Person',
  name: 'Jesus Graterol',
  sameAs: [
    'https://github.com/jesusgraterol',
    'https://www.linkedin.com/in/jesus-graterol',
    'https://x.com/jesus__graterol',
    'https://www.kaggle.com/jesusgraterol',
  ],
  url: 'https://jesusgraterol.dev/',
};

describe('buildStructuredData', { tags: ['full'] }, () => {
  test('describes the canonical website without fabricated page fields', () => {
    expect(
      buildStructuredData({
        canonicalUrl: 'https://jg-skills.jesusgraterol.dev/',
        description: 'Explicit-only skills for Claude Code and Codex.',
        title: 'jg-skills',
        type: 'website',
      }),
    ).toStrictEqual({
      '@context': 'https://schema.org',
      '@id': 'https://jg-skills.jesusgraterol.dev/#website',
      '@type': 'WebSite',
      author: AUTHOR,
      description: 'Explicit-only skills for Claude Code and Codex.',
      inLanguage: 'en',
      name: 'jg-skills',
      url: 'https://jg-skills.jesusgraterol.dev/',
    });
  });

  test('describes a skill page with a separate breadcrumb entity', () => {
    expect(
      buildStructuredData({
        breadcrumbs: [
          { name: 'Skills', path: '/' },
          { name: 'jg-plan', path: '/skills/jg-plan/' },
        ],
        canonicalUrl: 'https://jg-skills.jesusgraterol.dev/skills/jg-plan/',
        description: 'Create or revise an implementation-ready plan.',
        title: 'jg-plan',
        type: 'webpage',
      }),
    ).toStrictEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@id': 'https://jg-skills.jesusgraterol.dev/skills/jg-plan/#webpage',
          '@type': 'WebPage',
          breadcrumb: { '@id': 'https://jg-skills.jesusgraterol.dev/skills/jg-plan/#breadcrumb' },
          description: 'Create or revise an implementation-ready plan.',
          inLanguage: 'en',
          isPartOf: WEBSITE_REFERENCE,
          name: 'jg-plan',
          url: 'https://jg-skills.jesusgraterol.dev/skills/jg-plan/',
        },
        {
          '@id': 'https://jg-skills.jesusgraterol.dev/skills/jg-plan/#breadcrumb',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              item: 'https://jg-skills.jesusgraterol.dev/',
              name: 'Skills',
              position: 1,
            },
            {
              '@type': 'ListItem',
              item: 'https://jg-skills.jesusgraterol.dev/skills/jg-plan/',
              name: 'jg-plan',
              position: 2,
            },
          ],
        },
      ],
    });
  });

  test.each([
    ['no breadcrumbs', undefined],
    ['a single breadcrumb', [{ name: 'Skills', path: '/' }]],
  ])('omits the breadcrumb graph for a web page with %s', (_caseName, breadcrumbs) => {
    expect(
      buildStructuredData({
        breadcrumbs,
        canonicalUrl: 'https://jg-skills.jesusgraterol.dev/missing/',
        description: 'Page not found.',
        title: 'Not found',
        type: 'webpage',
      }),
    ).toStrictEqual({
      '@context': 'https://schema.org',
      '@id': 'https://jg-skills.jesusgraterol.dev/missing/#webpage',
      '@type': 'WebPage',
      description: 'Page not found.',
      inLanguage: 'en',
      isPartOf: WEBSITE_REFERENCE,
      name: 'Not found',
      url: 'https://jg-skills.jesusgraterol.dev/missing/',
    });
  });
  test('lists the pages a website presents in display order', () => {
    expect(
      buildStructuredData({
        canonicalUrl: 'https://jg-skills.jesusgraterol.dev/',
        description: 'Agent skills for Claude Code and Codex.',
        listedPages: [
          { name: 'jg-brainstorm', path: '/skills/jg-brainstorm/' },
          { name: 'jg-plan', path: '/skills/jg-plan/' },
        ],
        title: 'jg-skills',
        type: 'website',
      }),
    ).toStrictEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@id': 'https://jg-skills.jesusgraterol.dev/#website',
          '@type': 'WebSite',
          author: AUTHOR,
          description: 'Agent skills for Claude Code and Codex.',
          inLanguage: 'en',
          name: 'jg-skills',
          url: 'https://jg-skills.jesusgraterol.dev/',
        },
        {
          '@id': 'https://jg-skills.jesusgraterol.dev/#skills',
          '@type': 'ItemList',
          itemListElement: [
            {
              '@type': 'ListItem',
              name: 'jg-brainstorm',
              position: 1,
              url: 'https://jg-skills.jesusgraterol.dev/skills/jg-brainstorm/',
            },
            {
              '@type': 'ListItem',
              name: 'jg-plan',
              position: 2,
              url: 'https://jg-skills.jesusgraterol.dev/skills/jg-plan/',
            },
          ],
        },
      ],
    });
  });

  test('describes the documented skill as source code between the page and its breadcrumb', () => {
    expect(
      buildStructuredData({
        breadcrumbs: [
          { name: 'jg-skills', path: '/' },
          { name: 'jg-pause', path: '/skills/jg-pause/' },
        ],
        canonicalUrl: 'https://jg-skills.jesusgraterol.dev/skills/jg-pause/',
        description: 'Stops the agent at the nearest safe point and waits.',
        skill: { name: 'jg-pause', stage: 'Build' },
        title: 'jg-pause',
        type: 'webpage',
      }),
    ).toStrictEqual({
      '@context': 'https://schema.org',
      '@graph': [
        expect.objectContaining({ '@type': 'WebPage' }),
        {
          '@id': 'https://jg-skills.jesusgraterol.dev/skills/jg-pause/#source',
          '@type': 'SoftwareSourceCode',
          author: AUTHOR,
          codeRepository: 'https://github.com/jesusgraterol/jg-skills',
          description: 'Stops the agent at the nearest safe point and waits.',
          keywords: ['Agent Skills', 'Claude Code', 'Codex', 'coding agents', 'Build'],
          license: 'https://github.com/jesusgraterol/jg-skills/blob/main/LICENSE',
          name: 'jg-pause',
          programmingLanguage: 'Markdown',
          url: 'https://jg-skills.jesusgraterol.dev/skills/jg-pause/',
        },
        expect.objectContaining({ '@type': 'BreadcrumbList' }),
      ],
    });
  });
});
