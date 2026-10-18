import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { SITE_CONFIG } from '../src/site.config.ts';
import {
  decodeHtmlEntities,
  findUnsafeAttributes,
  findUnsafeMarkup,
} from '../src/utilities/rendered-html/index.ts';
import { SEARCH_TEXT_LIMITS } from '../src/utilities/seo/index.ts';

const websiteRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_BUILD_DIRECTORY = resolve(websiteRoot, 'dist');
const DEFAULT_SKILLS_DIRECTORY = resolve(websiteRoot, '..', 'skills');
// stable messages for intentional build-verification failures
const VERIFY_BUILD_ERROR_MESSAGES = {
  BreadcrumbHierarchyIncomplete: 'Breadcrumb hierarchy is incomplete',
  BrokenInternalLink: 'Broken internal link',
  BrokenInternalLlmsTextLink: 'Broken internal llms.txt link',
  CanonicalUrlMissingFromSitemap: 'Canonical URL is missing from the sitemap',
  DuplicateElementId: 'Page repeats an element ID',
  IncompleteSkillItemList: 'Home page item list does not list every skill',
  InvalidLlmsTextStructure: 'llms.txt does not follow the required project index structure',
  InvalidStructuredData: 'Invalid structured data',
  InvalidStructuredDataGraph: 'Structured data graph is invalid',
  MissingFragmentTarget: 'Fragment link has no matching element ID',
  MissingOrDuplicatePageDescription: 'Missing or duplicate page description',
  MissingOrDuplicatePageTitle: 'Missing or duplicate page title',
  MissingRequiredMetadata: 'Missing required metadata',
  MissingSkillPage: 'Missing skill page',
  MissingSkillReference: 'Skill page is missing a reference file',
  MissingSoftwareSourceCode: 'Skill page is missing its source code entity',
  MissingStructuredData: 'Missing structured data',
  NonObjectStructuredData: 'Structured data is not an object',
  PageDescriptionOutOfRange: 'Page description is not 70 to 160 characters long',
  PageTitleTooLong: 'Page title is longer than 60 characters',
  ProductionBuildContainsTestFile: 'Production build contains a test file',
  RobotsTextMissingSitemap: 'robots.txt does not name the sitemap index',
  SearchIndexableNotFoundPage: 'The custom 404 page must remain excluded from search indexes',
  CanonicalOnNotFoundPage: 'The custom 404 page must not name a canonical URL',
  StructuredDataDoesNotMatchPage: 'Structured data does not match the canonical page',
  UnmarkedSkillContent: 'Skill page does not mark each Markdown file it renders',
  UnsafePageMarkup: 'Page holds an event handler or a URL with a disallowed scheme',
  UnsafeSkillContent:
    'Skill page content holds markup that Markdown does not produce, an event handler, or a URL with a disallowed scheme',
} as const;
const REQUIRED_BUILD_PATHS = [
  'index.html',
  '404.html',
  'coding-agents/claude-code.svg',
  'favicon.svg',
  'llms.txt',
  'og/jg-skills.png',
  'robots.txt',
  'sitemap-index.xml',
] as const;

// the attribute a skill page puts on each box that holds one rendered Markdown file
const SKILL_MARKDOWN_ATTRIBUTE = 'data-skill-markdown';

/** Checks whether a decoded meta description fits search results. */
const isDescriptionInRange = (description: string): boolean => {
  const { length } = decodeHtmlEntities(description);

  return (
    length >= SEARCH_TEXT_LIMITS.descriptionMinLength &&
    length <= SEARCH_TEXT_LIMITS.descriptionMaxLength
  );
};

/** Escapes a literal value before interpolating it into a regular expression. */
const escapeRegularExpression = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

/** Checks whether an unknown JSON value is an object record. */
const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === 'object' && input !== null && !Array.isArray(input);

/** Checks whether an unknown JSON value is an array of object records. */
const isRecordArray = (input: unknown): input is Record<string, unknown>[] =>
  Array.isArray(input) && input.every(isRecord);

/** Lists every file below a build directory using stable POSIX-style relative paths. */
const listBuildFiles = async (
  directoryPath: string,
  rootPath = directoryPath,
): Promise<string[]> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directoryPath, entry.name);

      return entry.isDirectory()
        ? listBuildFiles(entryPath, rootPath)
        : [relative(rootPath, entryPath).split('\\').join('/')];
    }),
  );

  return files.flat().toSorted();
};

/** Lists the skill directory names that must each have a generated page. */
const listSkillNames = async (skillsDirectory: string): Promise<string[]> =>
  (await readdir(skillsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();

/** Lists one skill's reference files as SKILL.md names them, or none when it has no references folder. */
const listSkillReferencePaths = async (
  skillsDirectory: string,
  skillName: string,
): Promise<string[]> => {
  try {
    return (
      await readdir(resolve(skillsDirectory, skillName, 'references'), { withFileTypes: true })
    )
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => `references/${entry.name}`)
      .toSorted();
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];

    throw error;
  }
};

/** Resolves one root-relative site URL to its expected static artifact path. */
const resolveInternalArtifact = (href: string): string => {
  const path = href.split(/[?#]/u, 1)[0] ?? '/';

  if (path === '/') return 'index.html';
  if (extname(path)) return path.slice(1);

  return `${path.replace(/^\//u, '').replace(/\/$/u, '')}/index.html`;
};

/** Lists the inner HTML of every div that carries a marker attribute, in document order. */
const listMarkedDivContents = (html: string, attribute: string): string[] => {
  const openerPattern = new RegExp(
    `<div\\b[^>]*\\s${escapeRegularExpression(attribute)}(?=[\\s=>])[^>]*>`,
    'gu',
  );

  return [...html.matchAll(openerPattern)].map((opener) => {
    const start = opener.index + opener[0].length;
    const divTagPattern = /<(\/?)div\b[^>]*>/gu;
    let depth = 1;

    divTagPattern.lastIndex = start;

    for (let tag = divTagPattern.exec(html); tag; tag = divTagPattern.exec(html)) {
      depth += tag[1] ? -1 : 1;

      if (depth === 0) return html.slice(start, tag.index);
    }

    return html.slice(start);
  });
};

/** Lists the element IDs a generated HTML page declares, in document order. */
const listElementIds = (html: string): string[] =>
  [...html.matchAll(/\sid="([^"]+)"/gu)].map((match) => match[1] ?? '');

/** Resolves a generated HTML artifact to its canonical public URL. */
const resolveCanonicalUrl = (htmlPath: string): string => {
  if (htmlPath === 'index.html') return new URL('/', SITE_CONFIG.url).toString();

  const routePath = htmlPath.endsWith('/index.html')
    ? `/${htmlPath.slice(0, -'index.html'.length)}`
    : `/${htmlPath}`;

  return new URL(routePath, SITE_CONFIG.url).toString();
};

/**
 * Parses the single page-level JSON-LD object from generated HTML.
 * @throws
 * - Missing structured data
 * - Invalid structured data
 * - Structured data is not an object
 */
const parseStructuredData = (html: string, htmlPath: string): Record<string, unknown> => {
  const serializedStructuredData = html.match(
    /<script type="application\/ld\+json">([^<]+)<\/script>/u,
  )?.[1];

  if (!serializedStructuredData) {
    throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.MissingStructuredData} in ${htmlPath}`);
  }

  let structuredData: unknown;

  try {
    structuredData = JSON.parse(serializedStructuredData);
  } catch (error) {
    throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.InvalidStructuredData} in ${htmlPath}`, {
      cause: error,
    });
  }

  if (!isRecord(structuredData)) {
    throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.NonObjectStructuredData} in ${htmlPath}`);
  }

  return structuredData;
};

/**
 * Extracts validated entities from a standalone or graph-based JSON-LD document.
 * @throws
 * - Structured data graph is invalid
 */
const extractStructuredDataEntities = (
  structuredData: Record<string, unknown>,
  htmlPath: string,
): Record<string, unknown>[] => {
  const graph = structuredData['@graph'];

  if (graph === undefined) return [structuredData];

  if (!isRecordArray(graph)) {
    throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.InvalidStructuredDataGraph} in ${htmlPath}`);
  }

  return graph;
};

/**
 * Verifies required routes, one page per skill with every reference file it ships, safe skill
 * content and page markup, metadata, internal links, and production-build exclusions.
 * @param buildDirectory The static artifact directory to inspect.
 * @param skillsDirectory The repository directory whose skill folders each need a page.
 * @returns A promise that resolves when the artifact satisfies the project contract.
 * @throws
 * - Missing structured data
 * - Invalid structured data
 * - Structured data is not an object
 * - Structured data graph is invalid
 * - Production build contains a test file
 * - Missing skill page
 * - Skill page is missing a reference file
 * - Skill page does not mark each Markdown file it renders
 * - Skill page content holds markup that Markdown does not produce, an event handler, or a URL
 *   with a disallowed scheme
 * - Page holds an event handler or a URL with a disallowed scheme
 * - Missing required metadata
 * - Missing or duplicate page description
 * - Missing or duplicate page title
 * - Page title is longer than 60 characters
 * - Page description is not 70 to 160 characters long
 * - Canonical URL is missing from the sitemap
 * - Structured data does not match the canonical page
 * - Home page item list does not list every skill
 * - Breadcrumb hierarchy is incomplete
 * - Skill page is missing its source code entity
 * - Page repeats an element ID
 * - Broken internal link
 * - Fragment link has no matching element ID
 * - The custom 404 page must remain excluded from search indexes
 * - The custom 404 page must not name a canonical URL
 * - robots.txt does not name the sitemap index
 * - llms.txt does not follow the required project index structure
 * - Broken internal llms.txt link
 */
export const verifyBuild = async (
  buildDirectory = DEFAULT_BUILD_DIRECTORY,
  skillsDirectory = DEFAULT_SKILLS_DIRECTORY,
): Promise<void> => {
  const buildFiles = await listBuildFiles(buildDirectory);

  await Promise.all(
    REQUIRED_BUILD_PATHS.map(async (requiredPath) => access(resolve(buildDirectory, requiredPath))),
  );

  const emittedTestFile = buildFiles.find((filePath) =>
    /\.test-(?:unit|integration|e2e|bench)\./u.test(filePath),
  );

  if (emittedTestFile) {
    throw new Error(
      `${VERIFY_BUILD_ERROR_MESSAGES.ProductionBuildContainsTestFile}: ${emittedTestFile}`,
    );
  }

  const skillNames = await listSkillNames(skillsDirectory);
  const missingSkillPage = skillNames
    .map((name) => `skills/${name}/index.html`)
    .find((pagePath) => !buildFiles.includes(pagePath));

  if (missingSkillPage) {
    throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.MissingSkillPage}: ${missingSkillPage}`);
  }

  for (const name of skillNames) {
    const referencePaths = await listSkillReferencePaths(skillsDirectory, name);
    const pagePath = `skills/${name}/index.html`;
    const pageHtml = await readFile(resolve(buildDirectory, pagePath), 'utf8');
    const missingReference = referencePaths.find(
      (referencePath) => !pageHtml.includes(`data-skill-reference="${referencePath}"`),
    );

    if (missingReference) {
      throw new Error(
        `${VERIFY_BUILD_ERROR_MESSAGES.MissingSkillReference}: ${pagePath} (${missingReference})`,
      );
    }

    // the page's SKILL.md and each of its reference files, as rendered
    const markdownContents = listMarkedDivContents(pageHtml, SKILL_MARKDOWN_ATTRIBUTE);

    if (markdownContents.length !== referencePaths.length + 1) {
      throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.UnmarkedSkillContent}: ${pagePath}`);
    }

    // the same check as the catalog's on the source's rendered HTML, now on the page as built
    const unsafeContent = markdownContents
      .map((content) => findUnsafeMarkup(content))
      .find((problem) => problem !== undefined);

    if (unsafeContent !== undefined) {
      throw new Error(
        `${VERIFY_BUILD_ERROR_MESSAGES.UnsafeSkillContent} in ${pagePath}: ${unsafeContent}`,
      );
    }
  }

  const htmlFiles = buildFiles.filter((filePath) => filePath.endsWith('.html'));
  // every page's element IDs, so fragment links can be checked against the page they point to
  const idsByPage = new Map<string, string[]>();

  for (const htmlPath of htmlFiles) {
    const html = await readFile(resolve(buildDirectory, htmlPath), 'utf8');
    const unsafeMarkup = findUnsafeAttributes(html);

    if (unsafeMarkup !== undefined) {
      throw new Error(
        `${VERIFY_BUILD_ERROR_MESSAGES.UnsafePageMarkup} in ${htmlPath}: ${unsafeMarkup}`,
      );
    }

    const ids = listElementIds(html);
    const duplicateId = ids.find((id, index) => ids.indexOf(id) !== index);

    if (duplicateId !== undefined) {
      throw new Error(
        `${VERIFY_BUILD_ERROR_MESSAGES.DuplicateElementId} in ${htmlPath}: ${duplicateId}`,
      );
    }

    idsByPage.set(htmlPath, ids);
  }

  const publicHtmlFiles = htmlFiles.filter((filePath) => filePath !== '404.html');
  const descriptions = new Set<string>();
  const titles = new Set<string>();
  const sitemapFiles = buildFiles.filter((filePath) => /^sitemap-\d+\.xml$/u.test(filePath));
  const llmsTextUrl = new URL('/llms.txt', SITE_CONFIG.url).toString();
  const openGraphImageUrl = new URL(SITE_CONFIG.openGraph.image, SITE_CONFIG.url).toString();
  const sitemap = (
    await Promise.all(
      sitemapFiles.map(async (sitemapPath) =>
        readFile(resolve(buildDirectory, sitemapPath), 'utf8'),
      ),
    )
  ).join('\n');

  for (const htmlPath of publicHtmlFiles) {
    const html = await readFile(resolve(buildDirectory, htmlPath), 'utf8');
    const canonicalUrl = resolveCanonicalUrl(htmlPath);
    const expectedStructuredDataType = htmlPath === 'index.html' ? 'WebSite' : 'WebPage';
    const requiredPatterns = [
      new RegExp(`<html lang="${escapeRegularExpression(SITE_CONFIG.language)}">`, 'u'),
      /<title>[^<]+<\/title>/u,
      /<meta name="description" content="[^"]+"/u,
      new RegExp(
        `<meta name="author" content="${escapeRegularExpression(SITE_CONFIG.author.name)}"`,
        'u',
      ),
      /<meta name="robots" content="index, follow, max-image-preview:large"/u,
      new RegExp(`<link rel="canonical" href="${escapeRegularExpression(canonicalUrl)}"`, 'u'),
      new RegExp(`<link rel="describedby" href="${escapeRegularExpression(llmsTextUrl)}"`, 'u'),
      new RegExp(
        `<meta property="og:locale" content="${escapeRegularExpression(SITE_CONFIG.openGraph.locale)}"`,
        'u',
      ),
      /<meta property="og:type" content="website"/u,
      /<meta property="og:title" content="[^"]+"/u,
      /<meta property="og:description" content="[^"]+"/u,
      new RegExp(`<meta property="og:url" content="${escapeRegularExpression(canonicalUrl)}"`, 'u'),
      new RegExp(
        `<meta property="og:image" content="${escapeRegularExpression(openGraphImageUrl)}"`,
        'u',
      ),
      new RegExp(
        `<meta property="og:image:type" content="${escapeRegularExpression(SITE_CONFIG.openGraph.imageType)}"`,
        'u',
      ),
      /<meta property="og:image:alt" content="[^"]+"/u,
      /<meta name="twitter:card" content="summary_large_image"/u,
      new RegExp(
        `<meta name="twitter:creator" content="${escapeRegularExpression(SITE_CONFIG.author.twitterHandle)}"`,
        'u',
      ),
      new RegExp(
        `<meta name="twitter:image" content="${escapeRegularExpression(openGraphImageUrl)}"`,
        'u',
      ),
    ];

    for (const pattern of requiredPatterns) {
      if (!pattern.test(html)) {
        throw new Error(
          `${VERIFY_BUILD_ERROR_MESSAGES.MissingRequiredMetadata} in ${htmlPath}: ${pattern.source}`,
        );
      }
    }

    const description = html.match(/<meta name="description" content="([^"]+)"/u)?.[1];
    const title = html.match(/<title>([^<]+)<\/title>/u)?.[1];

    if (!description || descriptions.has(description)) {
      throw new Error(
        `${VERIFY_BUILD_ERROR_MESSAGES.MissingOrDuplicatePageDescription} in ${htmlPath}`,
      );
    }

    if (!title || titles.has(title)) {
      throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.MissingOrDuplicatePageTitle} in ${htmlPath}`);
    }

    descriptions.add(description);
    titles.add(title);

    if (decodeHtmlEntities(title).length > SEARCH_TEXT_LIMITS.titleMaxLength) {
      throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.PageTitleTooLong} in ${htmlPath}`);
    }

    if (!isDescriptionInRange(description)) {
      throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.PageDescriptionOutOfRange} in ${htmlPath}`);
    }

    if (!sitemap.includes(`<loc>${canonicalUrl}</loc>`)) {
      throw new Error(
        `${VERIFY_BUILD_ERROR_MESSAGES.CanonicalUrlMissingFromSitemap}: ${canonicalUrl}`,
      );
    }

    const structuredDataEntities = extractStructuredDataEntities(
      parseStructuredData(html, htmlPath),
      htmlPath,
    );
    const pageEntity = structuredDataEntities.find(
      (entity) => entity['@type'] === expectedStructuredDataType,
    );

    if (
      !pageEntity ||
      pageEntity['url'] !== canonicalUrl ||
      typeof pageEntity['description'] !== 'string'
    ) {
      throw new Error(
        `${VERIFY_BUILD_ERROR_MESSAGES.StructuredDataDoesNotMatchPage} in ${htmlPath}`,
      );
    }

    if (htmlPath === 'index.html') {
      const listItems = structuredDataEntities.find((entity) => entity['@type'] === 'ItemList')?.[
        'itemListElement'
      ];
      const listedUrls = isRecordArray(listItems)
        ? listItems
            .filter(
              (listItem, index) =>
                listItem['@type'] === 'ListItem' &&
                listItem['position'] === index + 1 &&
                typeof listItem['name'] === 'string',
            )
            .map((listItem) => listItem['url'])
        : [];
      const skillUrls = skillNames.map((name) => resolveCanonicalUrl(`skills/${name}/index.html`));

      if (
        listedUrls.length !== skillUrls.length ||
        new Set(listedUrls).size !== listedUrls.length ||
        !skillUrls.every((skillUrl) => listedUrls.includes(skillUrl))
      ) {
        throw new Error(VERIFY_BUILD_ERROR_MESSAGES.IncompleteSkillItemList);
      }
    }

    if (htmlPath !== 'index.html') {
      const breadcrumbList = structuredDataEntities.find(
        (entity) => entity['@type'] === 'BreadcrumbList',
      );
      const breadcrumbItems = breadcrumbList?.['itemListElement'];

      if (
        !isRecordArray(breadcrumbItems) ||
        breadcrumbItems.length < 2 ||
        !breadcrumbItems.every(
          (breadcrumbItem, index) =>
            breadcrumbItem['@type'] === 'ListItem' &&
            typeof breadcrumbItem['item'] === 'string' &&
            typeof breadcrumbItem['name'] === 'string' &&
            breadcrumbItem['position'] === index + 1,
        ) ||
        breadcrumbItems.at(-1)?.['item'] !== canonicalUrl ||
        !html.includes('<nav aria-label="Breadcrumb"')
      ) {
        throw new Error(
          `${VERIFY_BUILD_ERROR_MESSAGES.BreadcrumbHierarchyIncomplete} in ${htmlPath}`,
        );
      }
    }

    if (
      htmlPath.startsWith('skills/') &&
      !structuredDataEntities.some(
        (entity) => entity['@type'] === 'SoftwareSourceCode' && entity['url'] === canonicalUrl,
      )
    ) {
      throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.MissingSoftwareSourceCode} in ${htmlPath}`);
    }

    const internalLinks = [...html.matchAll(/href="(\/(?!\/)[^"]*)"/gu)].map(
      (match) => match[1] ?? '/',
    );

    for (const href of internalLinks) {
      const artifactPath = resolveInternalArtifact(href);

      if (!buildFiles.includes(artifactPath)) {
        throw new Error(
          `${VERIFY_BUILD_ERROR_MESSAGES.BrokenInternalLink} in ${htmlPath}: ${href} -> ${artifactPath}`,
        );
      }
    }

    // same-page links like #install, and links into another page like /#install or /skills/x/#y
    const fragmentLinks = [
      ...[...html.matchAll(/href="#([^"]+)"/gu)].map((match) => ({
        fragment: match[1] ?? '',
        href: `#${match[1] ?? ''}`,
        targetPath: htmlPath,
      })),
      ...internalLinks
        .filter((href) => href.includes('#'))
        .map((href) => ({
          fragment: href.slice(href.indexOf('#') + 1),
          href,
          targetPath: resolveInternalArtifact(href),
        })),
    ];

    for (const { fragment, href, targetPath } of fragmentLinks) {
      if (!idsByPage.get(targetPath)?.includes(decodeURIComponent(fragment))) {
        throw new Error(
          `${VERIFY_BUILD_ERROR_MESSAGES.MissingFragmentTarget} in ${htmlPath}: ${href} -> ${targetPath}`,
        );
      }
    }
  }

  const notFoundHtml = await readFile(resolve(buildDirectory, '404.html'), 'utf8');

  if (!notFoundHtml.includes('<meta name="robots" content="noindex, follow">')) {
    throw new Error(VERIFY_BUILD_ERROR_MESSAGES.SearchIndexableNotFoundPage);
  }

  // a canonical URL on a noindex page sends search engines contradicting signals
  if (/<link rel="canonical"/u.test(notFoundHtml) || /property="og:url"/u.test(notFoundHtml)) {
    throw new Error(VERIFY_BUILD_ERROR_MESSAGES.CanonicalOnNotFoundPage);
  }

  const robotsText = await readFile(resolve(buildDirectory, 'robots.txt'), 'utf8');
  const sitemapIndexUrl = new URL('/sitemap-index.xml', SITE_CONFIG.url).toString();

  if (!robotsText.split('\n').includes(`Sitemap: ${sitemapIndexUrl}`)) {
    throw new Error(VERIFY_BUILD_ERROR_MESSAGES.RobotsTextMissingSitemap);
  }

  const notFoundDescription = notFoundHtml.match(
    /<meta name="description" content="([^"]+)"/u,
  )?.[1];

  if (!notFoundDescription || !isDescriptionInRange(notFoundDescription)) {
    throw new Error(`${VERIFY_BUILD_ERROR_MESSAGES.PageDescriptionOutOfRange} in 404.html`);
  }

  const llmsText = await readFile(resolve(buildDirectory, 'llms.txt'), 'utf8');

  if (
    !llmsText.startsWith(`# ${SITE_CONFIG.name}\n\n> `) ||
    !llmsText.includes(`\n## Install\n\n\`\`\`bash\n${SITE_CONFIG.commands.install}\n\`\`\`\n`) ||
    !llmsText.includes('\n## Skills\n') ||
    !skillNames.every((name) => llmsText.includes(`${SITE_CONFIG.url}/skills/${name}/`))
  ) {
    throw new Error(VERIFY_BUILD_ERROR_MESSAGES.InvalidLlmsTextStructure);
  }

  const llmsLinks = [...llmsText.matchAll(/\[[^\]]+\]\((https:\/\/[^)]+)\)/gu)].map(
    (match) => match[1],
  );

  for (const link of llmsLinks) {
    if (!link) continue;

    const url = new URL(link);

    if (url.origin !== new URL(SITE_CONFIG.url).origin) continue;

    const artifactPath = resolveInternalArtifact(url.pathname);

    if (!buildFiles.includes(artifactPath)) {
      throw new Error(
        `${VERIFY_BUILD_ERROR_MESSAGES.BrokenInternalLlmsTextLink}: ${link} -> ${artifactPath}`,
      );
    }
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyBuild();
}
