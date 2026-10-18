import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

import { SKILL_CATALOG } from '../src/site.config.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(scriptDirectory, 'open-graph-template.html');
const outputPath = resolve(scriptDirectory, '../public/og/jg-skills.png');
const faviconPath = resolve(scriptDirectory, '../public/favicon.svg');
// the jg/ mark every jg site shares, and its slash alone for the favicon, from the UI package
const markSvg = await readFile(
  fileURLToPath(import.meta.resolve('jg-personal-astro-ui/jg-mark.svg')),
  'utf8',
);
const faviconSvg = await readFile(
  fileURLToPath(import.meta.resolve('jg-personal-astro-ui/jg-favicon.svg')),
  'utf8',
);
// the font families the template declares with @font-face from bundled files
const TEMPLATE_FONTS = ['Ubuntu Sans Variable', 'Ubuntu Sans Mono Variable'];
// the explicit skills in catalog order, which the image lists as the workflow's commands
const EXPLICIT_SKILL_NAMES = Object.entries(SKILL_CATALOG)
  .filter(([, entry]) => entry.kind === 'explicit')
  .toSorted(([, first], [, second]) => first.order - second.order)
  .map(([name]) => name);

/**
 * Writes the favicon from jg-personal-astro-ui's favicon, the jg/ mark's slash alone, and
 * generates the deterministic 1200 by 630 social image from the branded HTML template, with the
 * package's mark.
 */
const generateOpenGraphImage = async (): Promise<void> => {
  await writeFile(faviconPath, faviconSvg);
  await mkdir(dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

    await page.goto(pathToFileURL(templatePath).toString());
    await page.evaluate((markup) => {
      const mark = document.querySelector('[data-mark]');

      if (mark !== null) {
        mark.innerHTML = markup;
      }
    }, markSvg);
    await page.evaluate((names) => {
      document.querySelector('.session-list')?.replaceChildren(
        ...names.map((name) => {
          const item = document.createElement('li');
          const prefix = document.createElement('span');

          prefix.textContent = '/';
          item.append(prefix, name);

          return item;
        }),
      );
    }, EXPLICIT_SKILL_NAMES);
    // fail instead of rendering with a fallback when a bundled font doesn't load
    const missingFonts = await page.evaluate(async (families) => {
      const loaded = await Promise.all(
        families.map(async (family) => (await document.fonts.load(`16px "${family}"`)).length > 0),
      );
      await document.fonts.ready;

      return families.filter((_, index) => !loaded[index]);
    }, TEMPLATE_FONTS);

    if (missingFonts.length > 0) {
      throw new Error(`The open-graph template's fonts did not load: ${missingFonts.join(', ')}`);
    }

    await page.locator('.canvas').screenshot({ path: outputPath });
  } finally {
    await browser.close();
  }
};

await generateOpenGraphImage();
