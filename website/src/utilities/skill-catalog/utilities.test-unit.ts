// @vitest-environment node
import { describe, expect, test } from 'vitest';

import {
  assertBareSkillReferences,
  assertCatalogCoverage,
  assertCopiedSections,
  assertFileBudget,
  assertInvocationSettings,
  assertNoOrphanedReferences,
  assertNoSectionLinks,
  assertPlanningProtocol,
  assertReferenceFiles,
  assertReferencePathForm,
  assertReferenceIsLeaf,
  assertReferences,
  assertSafeMarkup,
  assertSearchMetadata,
  assertSharedSections,
  assertSkillName,
  assertVersionLine,
  buildSourceUrl,
  extractReferencePaths,
  extractReferenceMentions,
  extractSection,
  groupReferencesBySkill,
} from './utilities.ts';
import { PLANNING_PROTOCOL_SKILLS } from './constants.ts';

describe('planning protocol contract', () => {
  const command = 'npm install --save-dev --save-exact jg-plans@0.4.0';
  const profiles =
    '| Package version | CLI schemaVersion |\n| --- | --- |\n| 0.4.x | 1 |\n| >=0.5.0 | 2 |';
  const body = `## jg-plans protocol 0.2\n\nA version at or above 0.4.0; install jg-plans@0.4.0.\n\n${profiles}\n\n## Workflow\n\nUse it.`;
  const documents = () =>
    PLANNING_PROTOCOL_SKILLS.map((name) => ({ name, kind: 'explicit' as const, body }));
  test.each(['0.4.0', '0.4.1', '0.10.0', '1.0.0'])(
    'accepts exactly the seven identical sections stating the minimum, with dependency %s',
    (dependency) => {
      expect(() =>
        assertPlanningProtocol(
          [...documents(), { name: 'jg-push', kind: 'explicit', body: '## Workflow\nPush.' }],
          command,
          dependency,
        ),
      ).not.toThrow();
    },
  );
  test.each([
    'missing-skill',
    'missing-section',
    'duplicate-section',
    'extra-skill',
    'duplicate-skill',
    'drift',
  ])('rejects %s', (defect) => {
    const skills: { name: string; kind: 'explicit'; body: string }[] = documents();
    if (defect === 'missing-skill') skills.pop();
    if (defect === 'missing-section') skills[0]!.body = '## Workflow\nMissing.';
    if (defect === 'duplicate-section') skills[0]!.body += '\n## jg-plans protocol 0.2\nAgain.';
    if (defect === 'extra-skill') skills.push({ name: 'jg-push', kind: 'explicit', body });
    if (defect === 'duplicate-skill') skills.push({ ...skills[0]! });
    if (defect === 'drift') skills[0]!.body = body.replace('A version', 'Another version');
    expect(() => assertPlanningProtocol(skills, command, '0.4.0')).toThrow(
      'Planning skills have missing, duplicate, extra, or differing protocol sections',
    );
  });
  test.each([
    ['npm install --save-dev --save-exact jg-plans@0.4.1', '0.4.1'],
    ['npx jg-plans@0.4.0', '0.4.0'],
    [command, '0.3.9'],
    [command, '^0.4.0'],
    [command, ''],
  ])('rejects inconsistent setup/dependency %s / %s', (setup, dependency) => {
    expect(() => assertPlanningProtocol(documents(), setup, dependency)).toThrow(
      'Planning runtime pins and setup do not agree',
    );
  });
  test.each([
    ['another pin', (text: string) => text.replaceAll('@0.4.0', '@0.1.2')],
    ['no stated minimum', (text: string) => text.replaceAll('at or above 0.4.0', 'exactly 0.4.0')],
    ['no profiles', (text: string) => text.replace(profiles, '')],
    ['schema 2 for 0.4.x', (text: string) => text.replace('| 0.4.x | 1 |', '| 0.4.x | 2 |')],
    ['schema 1 for 0.5.0', (text: string) => text.replace('| >=0.5.0 | 2 |', '| >=0.5.0 | 1 |')],
    ['an extra profile', (text: string) => text.replace(profiles, `${profiles}\n| 0.3.x | 1 |`)],
  ])('rejects identical sections with %s', (_defect, change) => {
    expect(() =>
      assertPlanningProtocol(
        documents().map((skill) => ({ ...skill, body: change(skill.body) })),
        command,
        '0.4.0',
      ),
    ).toThrow('Planning runtime pins and setup do not agree');
  });
});

// a shared explicit section, followed by the workflow each skill writes for itself
const buildExplicitBody = (invocation: string, workflow: string): string =>
  `## Invocation\n\n${invocation}\n\n## Workflow\n\n${workflow}\n`;

// a shared implicit section with its two changeable lines, followed by one topic section
const buildImplicitBody = ({
  area = "This skill's area is React components.",
  sharedBullet = '- It never authorizes actions.',
  versionBullet = '- Check the installed versions first. This skill was written for React 19.2.',
}: {
  area?: string;
  sharedBullet?: string;
  versionBullet?: string;
} = {}): string =>
  [
    '## Application',
    '',
    `The agent loads this skill on its own when a task touches its area. ${area}`,
    '',
    sharedBullet,
    versionBullet,
    '',
    '## Topic',
    '',
    '- A rule only this skill has.',
    '',
  ].join('\n');

describe('assertSkillName', () => {
  test('accepts a frontmatter name equal to its directory', () => {
    expect(() => assertSkillName('jg-plan', 'jg-plan')).not.toThrow();
  });

  test.each([
    ['jg-plan', 'jg-planner'],
    ['jg-plan', 'JG-PLAN'],
    ['jg-plan', ''],
  ])('assertSkillName(%s, %s) -> throws', (directoryName, frontmatterName) => {
    expect(() => assertSkillName(directoryName, frontmatterName)).toThrow(
      `Skill name does not match its directory: ${directoryName}`,
    );
  });
});

describe('assertInvocationSettings', () => {
  const explicitPolicy = 'policy:\n  allow_implicit_invocation: false\n';
  const implicitPolicy = 'policy:\n  allow_implicit_invocation: true\n';

  test.each([
    ['an explicit skill with LF line endings', 'explicit', true, explicitPolicy],
    [
      'an explicit skill with CRLF line endings from a Windows checkout',
      'explicit',
      true,
      explicitPolicy.replaceAll('\n', '\r\n'),
    ],
    ['an implicit skill with LF line endings', 'implicit', undefined, implicitPolicy],
    [
      'an implicit skill with CRLF line endings from a Windows checkout',
      'implicit',
      undefined,
      implicitPolicy.replaceAll('\n', '\r\n'),
    ],
  ] as const)('accepts %s', (_caseName, kind, disableModelInvocation, policyText) => {
    expect(() =>
      assertInvocationSettings('jg-push', kind, disableModelInvocation, policyText),
    ).not.toThrow();
  });

  test.each([
    ['an explicit skill that allows implicit invocation', 'explicit', true, implicitPolicy],
    ['an explicit skill without the frontmatter flag', 'explicit', undefined, explicitPolicy],
    ['an implicit skill that disables implicit invocation', 'implicit', undefined, explicitPolicy],
    ['an implicit skill with the explicit-only frontmatter flag', 'implicit', true, implicitPolicy],
    ['the policy key missing', 'explicit', true, 'interface:\n  display_name: jg-push\n'],
    ['an empty policy file', 'implicit', undefined, ''],
    [
      'extra settings beside the policy',
      'explicit',
      true,
      `${explicitPolicy}interface:\n  display_name: jg-push\n`,
    ],
  ] as const)('rejects %s', (_caseName, kind, disableModelInvocation, policyText) => {
    expect(() =>
      assertInvocationSettings('jg-push', kind, disableModelInvocation, policyText),
    ).toThrow('Skill invocation settings do not match its catalog kind: jg-push');
  });
});

describe('assertSearchMetadata', () => {
  const description = 'A search description that is long enough to describe the skill properly.';

  test('accepts a title that leads with the skill name and fits both limits', () => {
    expect(() =>
      assertSearchMetadata('jg-plan', 'jg-plan: Implementation plans', description),
    ).not.toThrow();
  });

  test.each([
    ['a title without the skill name', 'Implementation plans with jg-plan', description],
    ['a 61-character title', `jg-plan: ${'x'.repeat(52)}`, description],
    ['a 69-character description', 'jg-plan: Plans', 'x'.repeat(69)],
    ['a 161-character description', 'jg-plan: Plans', 'x'.repeat(161)],
  ])('assertSearchMetadata(%s) -> throws', (_caseName, searchTitle, searchDescription) => {
    expect(() => assertSearchMetadata('jg-plan', searchTitle, searchDescription)).toThrow(
      'Skill search metadata is outside its limits: jg-plan',
    );
  });

  test('accepts the exact boundary lengths', () => {
    expect(() =>
      assertSearchMetadata('jg-plan', `jg-plan: ${'x'.repeat(51)}`, 'x'.repeat(70)),
    ).not.toThrow();
    expect(() => assertSearchMetadata('jg-plan', 'jg-plan: Plans', 'x'.repeat(160))).not.toThrow();
  });
});

describe('assertCatalogCoverage', () => {
  test('accepts the same names in any order', () => {
    expect(() =>
      assertCatalogCoverage(
        ['jg-plan', 'jg-push', 'jg-review'],
        ['jg-review', 'jg-plan', 'jg-push'],
      ),
    ).not.toThrow();
  });

  test.each([
    [
      'a skill folder without a catalog entry',
      ['jg-plan', 'jg-push'],
      ['jg-plan'],
      'Skill catalog does not match the skill folders: missing from catalog [jg-push], missing from skills []',
    ],
    [
      'a catalog entry without a skill folder',
      ['jg-plan'],
      ['jg-plan', 'jg-push'],
      'Skill catalog does not match the skill folders: missing from catalog [], missing from skills [jg-push]',
    ],
    [
      'drift in both directions',
      ['jg-plan', 'jg-session', 'jg-feedback'],
      ['jg-plan', 'jg-review', 'jg-push'],
      'Skill catalog does not match the skill folders: missing from catalog [jg-feedback, jg-session], missing from skills [jg-push, jg-review]',
    ],
    [
      'an empty skills directory',
      [],
      ['jg-plan'],
      'Skill catalog does not match the skill folders: missing from catalog [], missing from skills [jg-plan]',
    ],
  ])('assertCatalogCoverage(%s) -> throws', (_caseName, skillNames, catalogNames, message) => {
    expect(() => assertCatalogCoverage(skillNames, catalogNames)).toThrow(message);
  });
});

describe('buildSourceUrl', () => {
  test('points at the skill instructions on the main branch', () => {
    expect(buildSourceUrl('jg-push')).toBe(
      'https://github.com/jesusgraterol/jg-skills/blob/main/skills/jg-push/SKILL.md',
    );
  });
});

describe('extractSection', () => {
  test('returns the lines up to the next level-two heading', () => {
    expect(extractSection(buildExplicitBody('Shared rules.', 'Steps.'), 'Invocation')).toBe(
      '\nShared rules.',
    );
  });

  test('returns the rest of the body for the last section', () => {
    expect(extractSection(buildExplicitBody('Shared rules.', 'Steps.'), 'Workflow')).toBe(
      '\nSteps.',
    );
  });

  test('reads CRLF line endings from a Windows checkout', () => {
    expect(
      extractSection(
        buildExplicitBody('Shared rules.', 'Steps.').replaceAll('\n', '\r\n'),
        'Invocation',
      ),
    ).toBe('\nShared rules.');
  });

  test('returns undefined for a missing section', () => {
    expect(extractSection('## Workflow\n\nSteps.', 'Invocation')).toBeUndefined();
  });
});

describe('assertSharedSections', () => {
  test('accepts explicit skills whose workflows differ but whose Invocation sections match', () => {
    expect(() =>
      assertSharedSections([
        { body: buildExplicitBody('Shared rules.', 'Plan.'), kind: 'explicit', name: 'jg-plan' },
        { body: buildExplicitBody('Shared rules.', 'Push.'), kind: 'explicit', name: 'jg-push' },
      ]),
    ).not.toThrow();
  });

  test('accepts implicit skills that change only their area sentence and version bullet', () => {
    expect(() =>
      assertSharedSections([
        { body: buildImplicitBody(), kind: 'implicit', name: 'jg-react' },
        {
          body: buildImplicitBody({
            area: "This skill's area is bash scripts.",
            versionBullet:
              "- Check the target's versions first. This skill was written for Bash 5.3 and POSIX sh.",
          }),
          kind: 'implicit',
          name: 'jg-bash',
        },
      ]),
    ).not.toThrow();
  });

  test.each([
    [
      'an explicit Invocation section that differs',
      [
        { body: buildExplicitBody('Shared rules.', 'Plan.'), kind: 'explicit', name: 'jg-plan' },
        { body: buildExplicitBody('Shared rules.', 'Debug.'), kind: 'explicit', name: 'jg-debug' },
        { body: buildExplicitBody('Changed rules.', 'Push.'), kind: 'explicit', name: 'jg-push' },
      ],
      'jg-push',
    ],
    [
      'an implicit section that changes a shared bullet',
      [
        { body: buildImplicitBody(), kind: 'implicit', name: 'jg-react' },
        { body: buildImplicitBody(), kind: 'implicit', name: 'jg-redis' },
        {
          body: buildImplicitBody({ sharedBullet: '- It authorizes actions.' }),
          kind: 'implicit',
          name: 'jg-zod',
        },
      ],
      'jg-zod',
    ],
    [
      'an implicit section that changes its fixed first sentence',
      [
        { body: buildImplicitBody(), kind: 'implicit', name: 'jg-react' },
        { body: buildImplicitBody(), kind: 'implicit', name: 'jg-redis' },
        {
          body: buildImplicitBody().replace('The agent loads', 'An agent loads'),
          kind: 'implicit',
          name: 'jg-zod',
        },
      ],
      'jg-zod',
    ],
    [
      'a skill without its shared section',
      [
        { body: buildExplicitBody('Shared rules.', 'Plan.'), kind: 'explicit', name: 'jg-plan' },
        { body: '## Workflow\n\nPush.\n', kind: 'explicit', name: 'jg-push' },
      ],
      'jg-push',
    ],
  ] as const)('assertSharedSections(%s) -> throws', (_caseName, skills, differing) => {
    expect(() => assertSharedSections(skills)).toThrow(
      `Skill shared section differs from the other skills of its kind: ${differing}`,
    );
  });
});

describe('assertCopiedSections', () => {
  const buildScopedBody = (scope: string, workflow: string): string =>
    `## Invocation\n\nShared rules.\n\n## Task scope\n\n${scope}\n\n## Workflow\n\n${workflow}\n`;
  const buildReadingBody = (reading: string, workflow: string): string =>
    `## Invocation\n\nShared rules.\n\n## Reading a session\n\n${reading}\n\n## Workflow\n\n${workflow}\n`;

  test('accepts skills whose Task scope sections match, and skills without one', () => {
    expect(() =>
      assertCopiedSections([
        {
          body: buildScopedBody('- The same scope.', 'Review.'),
          kind: 'explicit',
          name: 'jg-review',
        },
        { body: buildScopedBody('- The same scope.', 'Push.'), kind: 'explicit', name: 'jg-push' },
        { body: buildExplicitBody('Shared rules.', 'Plan.'), kind: 'explicit', name: 'jg-plan' },
      ]),
    ).not.toThrow();
  });

  test('names the section and every skill that carries it when Task scope copies drift apart', () => {
    expect(() =>
      assertCopiedSections([
        {
          body: buildScopedBody('- The same scope.', 'Review.'),
          kind: 'explicit',
          name: 'jg-review',
        },
        { body: buildScopedBody('- A changed scope.', 'Push.'), kind: 'explicit', name: 'jg-push' },
        { body: buildExplicitBody('Shared rules.', 'Plan.'), kind: 'explicit', name: 'jg-plan' },
      ]),
    ).toThrow(
      'Skill section differs from the other skills that carry it: Task scope (jg-push, jg-review)',
    );
  });

  test('accepts skills whose Reading a session sections match, and skills without one', () => {
    expect(() =>
      assertCopiedSections([
        {
          body: buildReadingBody('Find the session.', 'Answer.'),
          kind: 'explicit',
          name: 'jg-session',
        },
        {
          body: buildReadingBody('Find the session.', 'Challenge.'),
          kind: 'explicit',
          name: 'jg-challenge-session',
        },
        { body: buildExplicitBody('Shared rules.', 'Plan.'), kind: 'explicit', name: 'jg-plan' },
      ]),
    ).not.toThrow();
  });

  test('names the section and every skill that carries it when Reading a session copies drift apart', () => {
    expect(() =>
      assertCopiedSections([
        {
          body: buildReadingBody('Find the session.', 'Answer.'),
          kind: 'explicit',
          name: 'jg-session',
        },
        {
          body: buildReadingBody('Find another session.', 'Challenge.'),
          kind: 'explicit',
          name: 'jg-challenge-session',
        },
        { body: buildExplicitBody('Shared rules.', 'Plan.'), kind: 'explicit', name: 'jg-plan' },
      ]),
    ).toThrow(
      'Skill section differs from the other skills that carry it: Reading a session (jg-challenge-session, jg-session)',
    );
  });
});

describe('assertVersionLine', () => {
  test('accepts an implicit skill with a version bullet', () => {
    expect(() =>
      assertVersionLine({ body: buildImplicitBody(), kind: 'implicit', name: 'jg-react' }),
    ).not.toThrow();
  });

  test('skips explicit skills, which have no version line', () => {
    expect(() =>
      assertVersionLine({
        body: buildExplicitBody('Rules.', 'Steps.'),
        kind: 'explicit',
        name: 'jg-plan',
      }),
    ).not.toThrow();
  });

  test.each([
    [
      'a version bullet without the marker',
      buildImplicitBody({ versionBullet: '- Check the installed versions first.' }),
    ],
    ['no Application section', '## Topic\n\n- This skill was written for React 19.2.\n'],
  ])('assertVersionLine(%s) -> throws', (_caseName, body) => {
    expect(() => assertVersionLine({ body, kind: 'implicit', name: 'jg-react' })).toThrow(
      'Implicit skill has no version line: jg-react',
    );
  });
});

describe('assertNoSectionLinks', () => {
  test.each([
    [
      'links to other pages and plain text',
      'See [the docs](https://react.dev/reference) and the Decision precedence rules.',
    ],
    ['a hash sign outside a link', 'Track it in issue #42, and keep `color: #fff` as is.'],
    ['a reference link without a fragment', 'See [the docs].\n\n[the docs]: https://react.dev/'],
  ])('accepts %s', (_caseName, body) => {
    expect(() => assertNoSectionLinks({ body, name: 'jg-react' })).not.toThrow();
  });

  test.each([
    ['a heading anchor', 'Follow [Decision precedence](#decision-precedence).'],
    ['a relative document anchor', 'Follow [Security](../../AGENTS.md#security).'],
    ['an absolute document anchor', 'Follow [Security](https://example.com/AGENTS.md#security).'],
    ['a reference definition anchor', 'Follow [Security].\n\n[Security]: ../../AGENTS.md#security'],
    ['an autolink anchor', 'Follow <https://example.com/AGENTS.md#security>.'],
  ])('rejects %s', (_caseName, body) => {
    expect(() => assertNoSectionLinks({ body, name: 'jg-react' })).toThrow(
      'Skill links to a section of another document: jg-react',
    );
  });

  test('names the offending link in the error', () => {
    expect(() =>
      assertNoSectionLinks({
        body: 'Follow [Decision precedence](#decision-precedence).',
        name: 'jg-react',
      }),
    ).toThrow('Skill links to a section of another document: jg-react (](#decision-precedence))');
  });
});

describe('assertBareSkillReferences', () => {
  test.each([
    ['a bare name', 'Run jg-plan first.'],
    ['a bare name in code', 'Invoke `jg-execute auto`.'],
    ['a path to a skill folder', 'Read `skills/jg-review/SKILL.md` from the neighboring folder.'],
    ['a dot-folder path', 'Copy it into `.agents/skills/jg-command`.'],
  ])('accepts %s', (_caseName, body) => {
    expect(() => assertBareSkillReferences({ body, name: 'jg-execute' })).not.toThrow();
  });

  test.each([
    ['a slash command in code', 'Then run `/jg-plan`.', '/jg-plan'],
    ['a slash command in prose', 'Then run /jg-plan.', '/jg-plan'],
    ['a Codex mention', 'Then run $jg-plan.', '$jg-plan'],
    ['a prefix at the start of a line', '/jg-review checks it.', '/jg-review'],
  ])('assertBareSkillReferences(%s) -> throws', (_caseName, body, reference) => {
    expect(() => assertBareSkillReferences({ body, name: 'jg-execute' })).toThrow(
      `Skill refers to another skill with a / or $ prefix: jg-execute (${reference})`,
    );
  });
});

describe('extractReferencePaths', () => {
  test('lists each reference a skill names once, in sorted order', () => {
    expect(
      extractReferencePaths(
        [
          '- Before a migration, read `references/migrations.md`.',
          '- Before naming objects, read `references/naming.md`, and `references/migrations.md` again.',
        ].join('\n'),
      ),
    ).toStrictEqual(['references/migrations.md', 'references/naming.md']);
  });

  test.each([
    ['no reference', 'Read the repository README first.'],
    ['a path into another folder', 'Read `skills/jg-review/references/checks.md`.'],
    ['a file that is not Markdown', 'Run `references/check.ts`.'],
    ['a name that is not kebab case', 'Read `references/Migrations.md`.'],
  ])('ignores %s', (_caseName, body) => {
    expect(extractReferencePaths(body)).toStrictEqual([]);
  });
});

describe('extractReferenceMentions', () => {
  test('lists every references/ path a document writes, valid or not', () => {
    expect(
      extractReferenceMentions(
        [
          'Read `references/naming.md`, then references/Errors.md.',
          'Also see `./references/api/errors.md` and `references/error_codes.md`.',
          'Ignore `skills/jg-review/references/checks.md`.',
        ].join('\n'),
      ),
    ).toStrictEqual([
      './references/api/errors.md',
      'references/Errors.md',
      'references/error_codes.md',
      'references/naming.md',
    ]);
  });
});

describe('assertReferencePathForm', () => {
  test('accepts a kebab-case Markdown file directly inside references/', () => {
    expect(() => assertReferencePathForm('jg-postgres', 'references/naming.md')).not.toThrow();
  });

  test.each([
    'references/Naming.md',
    'references/error_codes.md',
    'references/api/errors.md',
    './references/naming.md',
    'references/check.ts',
  ])('assertReferencePathForm(%s) -> throws', (path) => {
    expect(() => assertReferencePathForm('jg-postgres', path)).toThrow(
      `Skill names a reference path that is not a kebab-case Markdown file in references/: jg-postgres (${path})`,
    );
  });
});

describe('assertReferenceFiles', () => {
  test('accepts kebab-case Markdown files at the top of references/', () => {
    expect(() => assertReferenceFiles('jg-postgres', ['migrations.md', 'naming.md'])).not.toThrow();
    expect(() => assertReferenceFiles('jg-react', [])).not.toThrow();
  });

  test('names every nested, uppercase, or non-Markdown entry', () => {
    expect(() =>
      assertReferenceFiles('jg-postgres', [
        'naming.md',
        'sub',
        'sub/extra.md',
        'Notes.md',
        'diagram.png',
      ]),
    ).toThrow(
      'Skill references folder holds a nested or non-Markdown file: jg-postgres (references/Notes.md, references/diagram.png, references/sub, references/sub/extra.md)',
    );
  });
});

describe('groupReferencesBySkill', () => {
  test('groups reference entries by skill folder, in code-point path order', () => {
    const groups = groupReferencesBySkill([
      { id: 'jg-postgres/references/naming' },
      { id: 'jg-react/references/client-data' },
      { id: 'jg-postgres/references/migrations' },
    ]);

    expect([...groups.keys()]).toStrictEqual(['jg-postgres', 'jg-react']);
    expect(groups.get('jg-postgres')?.map(({ path }) => path)).toStrictEqual([
      'references/migrations.md',
      'references/naming.md',
    ]);
  });
});

describe('assertNoOrphanedReferences', () => {
  const groups = new Map([['jg-gone', [{ path: 'references/naming.md' }]]]);

  test('accepts references whose folder has a SKILL.md', () => {
    expect(() => assertNoOrphanedReferences(['jg-gone'], groups)).not.toThrow();
  });

  test('names the folder and files of references without a SKILL.md', () => {
    expect(() => assertNoOrphanedReferences(['jg-react'], groups)).toThrow(
      'Skill reference file is not mentioned in its SKILL.md: jg-gone (references/naming.md)',
    );
  });
});

describe('assertSafeMarkup', () => {
  test('accepts the markup Markdown produces', () => {
    expect(() =>
      assertSafeMarkup('jg-frontend', '<p>Use a native <code>&lt;dialog&gt;</code>.</p>'),
    ).not.toThrow();
  });

  test.each([
    ['raw HTML', '<p>Use a native <dialog> here.</p>', '<dialog> element'],
    [
      'a script link',
      '<p><a href="javascript:alert(1)">here</a></p>',
      'href="javascript:alert(1)"',
    ],
    ['a file the content layer did not render', undefined, 'not rendered'],
  ])('rejects %s', (_caseName, html, problem) => {
    expect(() => assertSafeMarkup('jg-frontend/references/forms.md', html)).toThrow(
      `Skill file renders markup that Markdown does not produce, an event handler, or a URL with a disallowed scheme: jg-frontend/references/forms.md (${problem})`,
    );
  });
});

describe('assertReferences', () => {
  const body = buildImplicitBody().concat(
    '- Before a migration, read `references/migrations.md`.\n',
    '- Before naming objects, read `references/naming.md`.\n',
  );

  test('accepts an implicit skill that names exactly the reference files it has', () => {
    expect(() =>
      assertReferences({ body, kind: 'implicit', name: 'jg-postgres' }, [
        'references/naming.md',
        'references/migrations.md',
      ]),
    ).not.toThrow();
  });

  test('accepts a skill without reference files that names none', () => {
    expect(() =>
      assertReferences(
        { body: buildExplicitBody('Rules.', 'Steps.'), kind: 'explicit', name: 'jg-plan' },
        [],
      ),
    ).not.toThrow();
  });

  test.each([
    [
      'an explicit skill with a reference file',
      { body: buildExplicitBody('Rules.', 'Steps.'), kind: 'explicit', name: 'jg-plan' },
      ['references/steps.md'],
      'Explicit skill has reference files: jg-plan',
    ],
    [
      'a named reference that does not exist',
      { body, kind: 'implicit', name: 'jg-postgres' },
      ['references/naming.md'],
      'Skill mentions a reference file that does not exist: jg-postgres (references/migrations.md)',
    ],
    [
      'a reference file the skill never names',
      { body, kind: 'implicit', name: 'jg-postgres' },
      ['references/migrations.md', 'references/naming.md', 'references/roles.md'],
      'Skill reference file is not mentioned in its SKILL.md: jg-postgres (references/roles.md)',
    ],
  ] as const)('assertReferences(%s) -> throws', (_caseName, skill, referencePaths, message) => {
    expect(() => assertReferences(skill, referencePaths)).toThrow(message);
  });
});

describe('assertReferenceIsLeaf', () => {
  test('accepts a reference that names no other reference', () => {
    expect(() =>
      assertReferenceIsLeaf('jg-postgres', 'references/migrations.md', '## Migrations\n\n- Rule.'),
    ).not.toThrow();
  });

  test('rejects a reference that names another reference', () => {
    expect(() =>
      assertReferenceIsLeaf(
        'jg-postgres',
        'references/migrations.md',
        'Name objects as `references/naming.md` describes.',
      ),
    ).toThrow(
      'Skill reference file mentions another reference file: jg-postgres (references/migrations.md)',
    );
  });

  test('rejects a reference that names a malformed reference path', () => {
    expect(() =>
      assertReferenceIsLeaf(
        'jg-postgres',
        'references/migrations.md',
        'See `references/api/naming.md` for names.',
      ),
    ).toThrow(
      'Skill reference file mentions another reference file: jg-postgres (references/migrations.md)',
    );
  });
});

describe('assertReferences with a malformed mention', () => {
  test('rejects a SKILL.md that names a reference outside the supported form', () => {
    expect(() =>
      assertReferences(
        {
          body: buildImplicitBody().concat('- Before naming, read `references/Naming.md`.\n'),
          kind: 'implicit',
          name: 'jg-postgres',
        },
        [],
      ),
    ).toThrow(
      'Skill names a reference path that is not a kebab-case Markdown file in references/: jg-postgres (references/Naming.md)',
    );
  });
});

describe('assertFileBudget', () => {
  test('accepts a file at exactly the budget', () => {
    expect(() => assertFileBudget('jg-postgres', 'SKILL.md', 25_600)).not.toThrow();
  });

  test('rejects a file one byte over the budget, naming the file and its size', () => {
    expect(() => assertFileBudget('jg-postgres', 'references/naming.md', 25_601)).toThrow(
      'Skill file is larger than its size budget: jg-postgres (references/naming.md, 25601 of 25600 bytes)',
    );
  });
});

describe('content checks on reference files', () => {
  test('name the reference file when it links to a section of a document', () => {
    expect(() =>
      assertNoSectionLinks({
        body: 'Follow [Security](../../AGENTS.md#security).',
        name: 'jg-postgres/references/migrations.md',
      }),
    ).toThrow('Skill links to a section of another document: jg-postgres/references/migrations.md');
  });

  test('name the reference file when it names a skill with a prefix', () => {
    expect(() =>
      assertBareSkillReferences({
        body: 'Then run /jg-review.',
        name: 'jg-postgres/references/migrations.md',
      }),
    ).toThrow(
      'Skill refers to another skill with a / or $ prefix: jg-postgres/references/migrations.md',
    );
  });
});
