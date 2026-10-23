import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { SKILL_CATALOG } from '../../site.config.ts';

const SKILLS_DIRECTORY = resolve(import.meta.dirname, '..', '..', '..', '..', 'skills');

/** Lists one skill's reference files as SKILL.md names them, or none without a references folder. */
const listReferencePaths = async (name: string): Promise<string[]> => {
  try {
    return (await readdir(resolve(SKILLS_DIRECTORY, name, 'references')))
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => `references/${fileName}`)
      .toSorted();
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];

    throw error;
  }
};

// skill names in the catalog order the previous and next links follow
const ORDERED_NAMES = Object.entries(SKILL_CATALOG)
  .toSorted(([, first], [, second]) => first.order - second.order)
  .map(([name]) => name);

test.describe('skill pages', () => {
  for (const [name, catalogEntry] of Object.entries(SKILL_CATALOG)) {
    test(`/skills/${name}/ renders its instructions, its examples, and its source`, async ({
      page,
    }) => {
      await page.goto(`/skills/${name}/`);

      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();

      // the header's icon is the only one on the page and stays out of the accessibility tree
      const icon = page.locator('[data-skill-icon]');

      await expect(icon).toHaveCount(1);
      await expect(icon).toHaveAttribute('data-skill-icon', catalogEntry.icon);
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(
        icon.locator(
          `svg.lucide-${catalogEntry.icon}, svg[data-skill-brand-mark="${catalogEntry.icon}"]`,
        ),
      ).toHaveCount(1);

      const instructions = page.locator('[data-skill-instructions]');

      if (catalogEntry.kind === 'explicit') {
        await expect(
          instructions.getByRole('heading', { level: 2, name: 'Invocation' }),
        ).toBeVisible();
        await expect(
          instructions.getByRole('heading', { level: 2, name: 'Workflow' }),
        ).toBeVisible();
        await expect(instructions).toContainText(
          'This skill runs only when the developer invokes it.',
        );

        await expect(page.locator('[data-skill-usage]')).toHaveText(
          new RegExp(`^/${name}( (\\[|<).+)?$`, 'u'),
        );
        // exact text, because the copy buttons copy it verbatim
        expect(
          await page
            .locator('[data-skill-invocation]')
            .evaluateAll((elements) => elements.map((element) => element.textContent)),
        ).toEqual(catalogEntry.examples.map(({ invocation }) => `/${invocation}`));
        await expect(page.locator('[data-skill-outcome]')).toHaveText(
          catalogEntry.examples.map(({ outcome }) => outcome),
        );
      } else {
        await expect(
          instructions.getByRole('heading', { level: 2, name: 'Application' }),
        ).toBeVisible();
        await expect(instructions).toContainText(
          'The agent loads this skill on its own when a task touches its area.',
        );

        await expect(page.locator('[data-skill-usage]')).toHaveText('Loads automatically');
        // the page opens with the card's summary, not the agent-facing trigger list
        await expect(page.locator('[data-skill-lede]')).toHaveText(catalogEntry.summary);
        await expect(page.getByText('May change', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { level: 2, name: 'When it loads' })).toBeVisible();
        // exact text, because the copy buttons copy it verbatim
        expect(
          await page
            .locator('[data-skill-request]')
            .evaluateAll((elements) => elements.map((element) => element.textContent)),
        ).toEqual(catalogEntry.examples.map(({ request }) => request));
        await expect(page.locator('[data-skill-outcome]')).toHaveText(
          catalogEntry.examples.map(({ outcome }) => outcome),
        );
      }
      await expect(page.getByRole('heading', { level: 2, name: 'When to use it' })).toBeVisible();
      await expect(page.locator('[data-skill-when-to-use]')).toHaveText(catalogEntry.whenToUse);

      const position = ORDERED_NAMES.indexOf(name);
      const pager = page.getByRole('navigation', { name: 'Previous and next skills' });

      for (const [rel, neighbor] of [
        ['prev', ORDERED_NAMES[position - 1]],
        ['next', ORDERED_NAMES[position + 1]],
      ] as const) {
        const link = pager.locator(`a[rel="${rel}"]`);

        if (neighbor) {
          await expect(link).toHaveAttribute('href', `/skills/${neighbor}/`);
          await expect(link).toContainText(neighbor);
        } else {
          await expect(link).toHaveCount(0);
        }
      }

      await expect(page.getByRole('link', { name: 'View SKILL.md on GitHub' })).toHaveAttribute(
        'href',
        `https://github.com/jesusgraterol/jg-skills/blob/main/skills/${name}/SKILL.md`,
      );
      await expect(page.getByRole('link', { name: 'All skills' })).toHaveAttribute(
        'href',
        '/#skills',
      );
    });
  }

  test('renders each reference file below the instructions, under the path SKILL.md names', async ({
    page,
  }) => {
    for (const name of ORDERED_NAMES) {
      const referencePaths = await listReferencePaths(name);

      await page.goto(`/skills/${name}/`);

      if (referencePaths.length === 0) {
        await expect(page.locator('[data-skill-references]')).toHaveCount(0);
        continue;
      }

      await expect(page.locator('[data-skill-reference]')).toHaveCount(referencePaths.length);

      for (const referencePath of referencePaths) {
        const reference = page.locator(`[data-skill-reference="${referencePath}"]`);

        await expect(reference.getByText(referencePath, { exact: true })).toBeVisible();
        await expect(reference.getByRole('heading', { level: 2 }).first()).toBeVisible();
      }
    }
  });

  test('shows code blocks in code windows that stay dark in both themes', async ({ page }) => {
    await page.goto('/skills/jg-ci/');
    const codeWindow = page.locator('[data-skill-instructions] [data-code-window]').first();
    const codeBlock = codeWindow.locator('pre');

    await expect(codeWindow.getByRole('button', { name: 'Copy code' })).toBeVisible();

    /**
     * Reads the code block's background and the relative luminance of its red channel, enough to
     * tell a dark surface from a light one.
     * @returns The computed background, and whether it is dark.
     */
    const readSurface = async (): Promise<{ background: string; isDark: boolean }> =>
      codeBlock.evaluate((element) => {
        const background = getComputedStyle(element).backgroundColor;
        const probe = document.createElement('canvas').getContext('2d');

        if (probe === null) throw new Error('A canvas is unavailable to read the color.');
        probe.fillStyle = background;
        probe.fillRect(0, 0, 1, 1);
        const [red = 0, green = 0, blue = 0] = probe.getImageData(0, 0, 1, 1).data;

        return { background, isDark: (red + green + blue) / 3 < 96 };
      });

    const light = await readSurface();

    await page.getByRole('button', { name: 'Use dark theme' }).first().click();
    await expect(page.locator('html')).toHaveClass(/dark/u);

    expect(light.isDark).toBe(true);
    expect(await readSurface()).toStrictEqual(light);
  });

  test('labels one example per supported case, each with its own copy button', async ({ page }) => {
    await page.goto('/skills/jg-execute/');
    await expect(page.getByRole('heading', { level: 2, name: 'Examples' })).toBeVisible();
    await expect(
      page.getByText('it should consider. Each example shows one supported case.'),
    ).toBeVisible();

    for (const [index, { label }] of SKILL_CATALOG['jg-execute'].examples.entries()) {
      const sourceId = `jg-execute-invocation-${index + 1}`;
      const terminal = page
        .locator('[data-code-window]')
        .filter({ has: page.locator(`#${sourceId}`) });

      await expect(terminal.locator('figcaption')).toContainText(label);
      await expect(page.locator(`button[data-copy-source="${sourceId}"]`)).toHaveAccessibleName(
        `Copy ${label.toLowerCase()} invocation`,
      );
    }

    await page.goto('/skills/jg-pause/');
    await expect(
      page.getByRole('heading', { exact: true, level: 2, name: 'Example' }),
    ).toBeVisible();
    await expect(page.locator('[data-code-window] figcaption')).toContainText('Example');
    await expect(page.getByText('Each example shows one supported case.')).toHaveCount(0);
  });

  test('shows the usage line with and without an argument hint', async ({ page }) => {
    await page.goto('/skills/jg-pause/');
    await expect(page.locator('[data-skill-usage]')).toHaveText('/jg-pause');

    await page.goto('/skills/jg-execute/');
    await expect(page.locator('[data-skill-usage]')).toHaveText(
      '/jg-execute [auto] [plan-path] [milestone N]',
    );
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`the Markdown policy link uses the shared external-link behavior in the ${theme} theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/skills/jg-packages/');

      const link = page.getByRole('link', {
        name: 'reusable jg-packages policy (opens in a new tab)',
        exact: true,
      });

      await expect(link).toHaveAttribute(
        'href',
        'https://github.com/jesusgraterol/jg-skills/blob/main/skills/jg-packages/assets/agents-section.md',
      );
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noreferrer');
      await expect(link.locator('svg[data-new-tab-marker]')).toHaveAttribute('aria-hidden', 'true');
      await expect(link.locator('[data-new-tab-marker] + .sr-only')).toHaveText(
        '(opens in a new tab)',
      );
      await expect(link.locator('..')).toContainText(
        'When asked to adopt or review coding instructions',
      );

      // The example's copy button is the preceding control in the document's tab order.
      await page.getByRole('button', { name: 'Copy request', exact: true }).focus();
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      await expect(link).not.toHaveCSS('outline-style', 'none');
    });
  }
});

test.describe('skill document outline without JavaScript', () => {
  test.use({ javaScriptEnabled: false, contextOptions: { reducedMotion: 'reduce' } });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`offers keyboard navigation and preserved source actions at 320 pixels in ${colorScheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 320, height: 720 });
      await page.goto('/skills/jg-ci/');
      const outline = page.getByRole('navigation', { name: 'On this page', exact: true });
      const disclosure = outline.locator('summary');
      await disclosure.focus();
      await page.keyboard.press('Enter');
      const firstLink = outline.getByRole('link', { name: 'When to use it', exact: true });
      await page.keyboard.press('Tab');
      await expect(firstLink).toBeFocused();
      await expect(firstLink).not.toHaveCSS('outline-style', 'none');
      for (const link of await outline.getByRole('link').all()) {
        const href = await link.getAttribute('href');
        expect(href).toMatch(/^#[a-z\d-]+$/u);
        await expect(page.locator(href!)).toHaveCount(1);
      }
      await firstLink.press('Enter');
      await expect(page).toHaveURL(/#when-to-use-heading$/u);
      await expect(
        page.getByRole('heading', { level: 2, name: 'When to use it', exact: true }),
      ).toBeInViewport();
      await expect(
        page.getByRole('navigation', { name: 'Previous and next skills' }),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: 'All skills', exact: true })).toHaveAttribute(
        'href',
        '/#skills',
      );
      await expect(page.getByRole('link', { name: 'View SKILL.md on GitHub' })).toHaveAttribute(
        'href',
        'https://github.com/jesusgraterol/jg-skills/blob/main/skills/jg-ci/SKILL.md',
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0);
    });
  }
});
