// @vitest-environment node
import { strict as assert } from 'node:assert';
import { appendFile, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { verifyBuild } from './verify-build.ts';

const websiteRoot = resolve(import.meta.dirname, '..');
const BUILD_DIRECTORY = resolve(websiteRoot, 'dist');
const TEMPORARY_ROOT_PREFIX = 'jg-skills-verify-build-';
const STRUCTURED_DATA_PATTERN = /<script type="application\/ld\+json">[^<]+<\/script>/u;
const SKILL_PAGE = 'skills/jg-plan/index.html';
// a skill page whose last rendered Markdown box holds a reference file
const REFERENCE_PAGE = 'skills/jg-frontend/index.html';
// the marked wrapper's opening tag, independent of Astro's serialized attribute order
const SKILL_MARKDOWN_OPENER = /<div\b[^>]*\sdata-skill-markdown(?=[\s=>])[^>]*>/u;
const LAST_SKILL_MARKDOWN_OPENER =
  /<div\b[^>]*\sdata-skill-markdown(?=[\s=>])[^>]*>(?![\s\S]*data-skill-markdown)/u;
const UNSAFE_SKILL_CONTENT =
  'Skill page content holds markup that Markdown does not produce, an event handler, or a URL with a disallowed scheme';

// contracts for minimally corrupted build fixtures
type IBuildMutation = (buildDirectory: string) => Promise<void>;
type IBuildFailureCase = [caseName: string, expectedMessage: string, mutation: IBuildMutation];

let temporaryRoot: string | undefined;
let fixtureIndex = 0;

/** Resolves one fixture artifact while enforcing the disposable build boundary. */
const resolveBuildFile = (buildDirectory: string, relativePath: string): string => {
  const filePath = resolve(buildDirectory, relativePath);
  const pathFromBuildDirectory = relative(buildDirectory, filePath);

  assert.ok(
    pathFromBuildDirectory !== '..' &&
      !pathFromBuildDirectory.startsWith(`..${sep}`) &&
      !isAbsolute(pathFromBuildDirectory),
  );

  return filePath;
};

/** Replaces one required fragment in a disposable build artifact. */
const replaceBuildFileText = async (
  buildDirectory: string,
  relativePath: string,
  searchValue: string | RegExp,
  replacement: string,
): Promise<void> => {
  const filePath = resolveBuildFile(buildDirectory, relativePath);
  const sourceText = await readFile(filePath, 'utf8');
  const mutatedText = sourceText.replace(searchValue, replacement);

  assert.notEqual(mutatedText, sourceText);
  await writeFile(filePath, mutatedText, 'utf8');
};

/** Checks that a temporary root is the exact disposable directory shape this suite creates. */
const isDisposableTemporaryRoot = (directoryPath: string): boolean =>
  dirname(resolve(directoryPath)) === resolve(tmpdir()) &&
  basename(directoryPath).startsWith(TEMPORARY_ROOT_PREFIX);

/** Copies the successful production artifact into one isolated corruption fixture. */
const createBuildFixture = async (): Promise<string> => {
  assert.ok(temporaryRoot);

  const fixtureDirectory = resolve(temporaryRoot, `case-${String(fixtureIndex).padStart(2, '0')}`);
  fixtureIndex += 1;

  await cp(BUILD_DIRECTORY, fixtureDirectory, {
    errorOnExist: true,
    force: false,
    recursive: true,
  });

  return fixtureDirectory;
};

/** Verifies one rejection against a separately corrupted production artifact. */
const expectBuildFailure = async (
  _caseName: string,
  expectedMessage: string,
  mutation: IBuildMutation,
): Promise<void> => {
  const buildDirectory = await createBuildFixture();

  await mutation(buildDirectory);
  await expect(verifyBuild(buildDirectory)).rejects.toThrow(expectedMessage);
};

describe('static build artifact', () => {
  beforeAll(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), TEMPORARY_ROOT_PREFIX));
    assert.ok(isDisposableTemporaryRoot(temporaryRoot));
  });

  afterAll(async () => {
    if (!temporaryRoot) return;

    assert.ok(isDisposableTemporaryRoot(temporaryRoot));
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  test(
    'contains every skill page, required metadata, valid links, and no test files',
    { tags: ['full'] },
    async () => {
      await expect(verifyBuild()).resolves.toBeUndefined();
    },
  );

  test(
    'protects installation commands and rendered skill examples from CDN email rewriting',
    { tags: ['full'] },
    async () => {
      for (const page of ['index.html', SKILL_PAGE, REFERENCE_PAGE]) {
        const html = await readFile(resolve(BUILD_DIRECTORY, page), 'utf8');
        const opening = html.indexOf('<!--email_off-->');
        const closing = html.indexOf('<!--/email_off-->');

        expect(opening, page).toBeGreaterThanOrEqual(0);
        expect(opening, page).toBeLessThan(html.indexOf('<main id="main-content">'));
        expect(closing, page).toBeGreaterThan(html.lastIndexOf('</main>'));
        expect(html.indexOf('<!--email_off-->', opening + 1), page).toBe(-1);
        expect(html.indexOf('<!--/email_off-->', closing + 1), page).toBe(-1);
        expect(html.slice(opening, closing), page).toContain('@');
      }
    },
  );

  test.each<IBuildFailureCase>([
    [
      'emitted test file',
      'Production build contains a test file: emitted.test-unit.ts',
      async (buildDirectory) =>
        writeFile(
          resolveBuildFile(buildDirectory, 'emitted.test-unit.ts'),
          '// disposable emitted test fixture\n',
          'utf8',
        ),
    ],
    [
      'missing skill page',
      'Missing skill page: skills/jg-push/index.html',
      async (buildDirectory) => rm(resolveBuildFile(buildDirectory, 'skills/jg-push/index.html')),
    ],
    [
      'a skill page missing one of its reference files',
      'Skill page is missing a reference file: skills/jg-postgres/index.html (references/migrations.md)',
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          'skills/jg-postgres/index.html',
          'data-skill-reference="references/migrations.md"',
          'data-skill-reference="references/removed.md"',
        ),
    ],
    [
      'a skill page without its Markdown markers',
      `Skill page does not mark each Markdown file it renders: ${SKILL_PAGE}`,
      async (buildDirectory) =>
        replaceBuildFileText(buildDirectory, SKILL_PAGE, /\sdata-skill-markdown/gu, ''),
    ],
    [
      'a script element in skill instructions',
      `${UNSAFE_SKILL_CONTENT} in ${SKILL_PAGE}: <script> element`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          SKILL_MARKDOWN_OPENER,
          '$&<p>Use `this</p>\n<script>window.__probe=1</script>\n<p>and` that.</p>',
        ),
    ],
    [
      'an event handler in skill instructions',
      `${UNSAFE_SKILL_CONTENT} in ${SKILL_PAGE}: onerror attribute`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          SKILL_MARKDOWN_OPENER,
          '$&<p><img src=x onerror=alert(1)></p>',
        ),
    ],
    [
      'an entity-encoded script link in skill instructions',
      `${UNSAFE_SKILL_CONTENT} in ${SKILL_PAGE}: href="&#106;avascript:alert(1)"`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          SKILL_MARKDOWN_OPENER,
          '$&<p><a href="&#106;avascript:alert(1)">encoded</a></p>',
        ),
    ],
    [
      'a script link in a reference file',
      `${UNSAFE_SKILL_CONTENT} in ${REFERENCE_PAGE}: href="javascript:alert(3)"`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          REFERENCE_PAGE,
          LAST_SKILL_MARKDOWN_OPENER,
          '$&<p><a href="javascript:alert(3)">reference</a></p>',
        ),
    ],
    [
      'an event handler outside skill content',
      'Page holds an event handler or a URL with a disallowed scheme in index.html: onload attribute',
      async (buildDirectory) =>
        replaceBuildFileText(buildDirectory, 'index.html', '<body', '<body onload="alert(1)"'),
    ],
  ])('rejects a build with %s', expectBuildFailure);

  test.each<IBuildFailureCase>([
    [
      'missing structured data',
      'Missing structured data in index.html',
      async (buildDirectory) =>
        replaceBuildFileText(buildDirectory, 'index.html', STRUCTURED_DATA_PATTERN, ''),
    ],
    [
      'invalid structured data',
      'Invalid structured data in index.html',
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          'index.html',
          STRUCTURED_DATA_PATTERN,
          '<script type="application/ld+json">{invalid</script>',
        ),
    ],
    [
      'invalid structured data graph',
      `Structured data graph is invalid in ${SKILL_PAGE}`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          STRUCTURED_DATA_PATTERN,
          '<script type="application/ld+json">{"@graph":[null]}</script>',
        ),
    ],
    [
      'canonical URL on the 404 page',
      'The custom 404 page must not name a canonical URL',
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          '404.html',
          '</head>',
          '<link rel="canonical" href="https://jg-skills.jesusgraterol.dev/404.html"></head>',
        ),
    ],
    [
      'robots.txt without the sitemap',
      'robots.txt does not name the sitemap index',
      async (buildDirectory) =>
        replaceBuildFileText(buildDirectory, 'robots.txt', /^Sitemap: .*$/mu, ''),
    ],
    [
      'missing fragment target',
      `Fragment link has no matching element ID in ${SKILL_PAGE}: #main-content -> ${SKILL_PAGE}`,
      async (buildDirectory) =>
        replaceBuildFileText(buildDirectory, SKILL_PAGE, ' id="main-content"', ''),
    ],
    [
      'duplicate element ID',
      `Page repeats an element ID in ${SKILL_PAGE}: main-content`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          '</body>',
          '<span id="main-content"></span></body>',
        ),
    ],
    [
      'missing required metadata',
      'Missing required metadata in index.html: <meta name="description" content="[^"]+"',
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          'index.html',
          /<meta name="description" content="[^"]+">/u,
          '',
        ),
    ],
    [
      'duplicate page title',
      'Missing or duplicate page title in skills/jg-review/index.html',
      async (buildDirectory) => {
        const planHtml = await readFile(resolveBuildFile(buildDirectory, SKILL_PAGE), 'utf8');
        const planTitle = planHtml.match(/<title>[^<]+<\/title>/u)?.[0];

        assert.ok(planTitle);
        await replaceBuildFileText(
          buildDirectory,
          'skills/jg-review/index.html',
          /<title>[^<]+<\/title>/u,
          planTitle,
        );
      },
    ],
    [
      'canonical URL missing from the sitemap',
      'Canonical URL is missing from the sitemap: https://jg-skills.jesusgraterol.dev/skills/jg-plan/',
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          'sitemap-0.xml',
          '<loc>https://jg-skills.jesusgraterol.dev/skills/jg-plan/</loc>',
          '',
        ),
    ],
    [
      'structured data for another page',
      `Structured data does not match the canonical page in ${SKILL_PAGE}`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          '"url":"https://jg-skills.jesusgraterol.dev/skills/jg-plan/"',
          '"url":"https://jg-skills.jesusgraterol.dev/skills/jg-push/"',
        ),
    ],
    [
      'missing visible breadcrumb',
      `Breadcrumb hierarchy is incomplete in ${SKILL_PAGE}`,
      async (buildDirectory) =>
        replaceBuildFileText(buildDirectory, SKILL_PAGE, 'aria-label="Breadcrumb"', ''),
    ],
    [
      'broken internal link',
      'Broken internal link in index.html: /skills/jg-missing/ -> skills/jg-missing/index.html',
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          'index.html',
          '</main>',
          '<a href="/skills/jg-missing/">missing</a></main>',
        ),
    ],
    [
      'indexable 404 page',
      'The custom 404 page must remain excluded from search indexes',
      async (buildDirectory) =>
        replaceBuildFileText(buildDirectory, '404.html', 'noindex, follow', 'index, follow'),
    ],
    [
      'llms.txt without the install command',
      'llms.txt does not follow the required project index structure',
      async (buildDirectory) => replaceBuildFileText(buildDirectory, 'llms.txt', '## Install', ''),
    ],
    [
      'llms.txt missing a skill',
      'llms.txt does not follow the required project index structure',
      async (buildDirectory) =>
        replaceBuildFileText(buildDirectory, 'llms.txt', /- \[jg-session\][^\n]+\n/u, ''),
    ],
    [
      'broken llms.txt link',
      'Broken internal llms.txt link: https://jg-skills.jesusgraterol.dev/skills/jg-missing/ -> skills/jg-missing/index.html',
      async (buildDirectory) =>
        appendFile(
          resolveBuildFile(buildDirectory, 'llms.txt'),
          '- [jg-missing](https://jg-skills.jesusgraterol.dev/skills/jg-missing/): Missing.\n',
          'utf8',
        ),
    ],
    [
      'page title over the search limit',
      `Page title is longer than 60 characters in ${SKILL_PAGE}`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          /<title>[^<]+<\/title>/u,
          '<title>jg-plan: An implementation plan title too long to fit in search results</title>',
        ),
    ],
    [
      'page description under the search limit',
      `Page description is not 70 to 160 characters long in ${SKILL_PAGE}`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          /<meta name="description" content="[^"]+">/u,
          '<meta name="description" content="A plan skill.">',
        ),
    ],
    [
      'missing twitter creator',
      'Missing required metadata in index.html: <meta name="twitter:creator" content="@jesus__graterol"',
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          'index.html',
          '<meta name="twitter:creator" content="@jesus__graterol">',
          '',
        ),
    ],
    [
      'home item list missing a skill',
      'Home page item list does not list every skill',
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          'index.html',
          '"url":"https://jg-skills.jesusgraterol.dev/skills/jg-session/"',
          '"url":"https://jg-skills.jesusgraterol.dev/skills/jg-unknown/"',
        ),
    ],
    [
      'missing skill source code entity',
      `Skill page is missing its source code entity in ${SKILL_PAGE}`,
      async (buildDirectory) =>
        replaceBuildFileText(
          buildDirectory,
          SKILL_PAGE,
          '"@type":"SoftwareSourceCode"',
          '"@type":"CreativeWork"',
        ),
    ],
  ])('rejects a build with %s', { tags: ['full'] }, expectBuildFailure);

  test('rejects a build missing the page of a newly added skill folder', async () => {
    assert.ok(temporaryRoot);

    const buildDirectory = await createBuildFixture();
    const skillsDirectory = resolve(temporaryRoot, 'skills-with-extra');

    await cp(resolve(websiteRoot, '..', 'skills'), skillsDirectory, { recursive: true });
    await cp(resolve(skillsDirectory, 'jg-plan'), resolve(skillsDirectory, 'jg-extra'), {
      recursive: true,
    });

    await expect(verifyBuild(buildDirectory, skillsDirectory)).rejects.toThrow(
      'Missing skill page: skills/jg-extra/index.html',
    );
  });
});
