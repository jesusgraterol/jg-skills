import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, waitForPageAssets, inspectMotion } from 'jg-playwright';

import { SITE_CONFIG, SKILL_CATALOG } from '../site.config.ts';

const SKILL_ROUTES = Object.keys(SKILL_CATALOG).map((name) => `/skills/${name}/`);
const PUBLIC_ROUTES = ['/', ...SKILL_ROUTES] as const;
const ACCESSIBILITY_ROUTES = [
  '/',
  '/skills/jg-plan/',
  '/skills/jg-push/',
  '/skills/jg-postgres/',
  '/404.html',
] as const;

test.describe('production website', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} returns a complete HTML document`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://jg-skills.jesusgraterol.dev${route}`,
      );
      await expect(page.locator('link[rel="describedby"]')).toHaveAttribute(
        'href',
        'https://jg-skills.jesusgraterol.dev/llms.txt',
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        'https://jg-skills.jesusgraterol.dev/og/jg-skills.png',
      );
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

      const description =
        (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';

      expect((await page.title()).length).toBeLessThanOrEqual(60);
      expect(description.length).toBeGreaterThanOrEqual(70);
      expect(description.length).toBeLessThanOrEqual(160);
      await expect(page.locator('meta[name="twitter:creator"]')).toHaveAttribute(
        'content',
        '@jesus__graterol',
      );

      if (route !== '/') {
        const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });

        await expect(breadcrumb).toBeVisible();
        await expect(breadcrumb.locator('[aria-current="page"]')).toHaveCount(1);
      }
    });
  }

  for (const route of [...PUBLIC_ROUTES, '/404.html']) {
    test(`${route} marks every link to another site as opening a new tab`, async ({ page }) => {
      await page.goto(route);

      const pageOrigin = new URL(page.url()).origin;

      for (const link of await page.locator('a[href]').all()) {
        const href = (await link.getAttribute('href')) ?? '';
        const marker = link.locator('[data-new-tab-marker]');

        if (new URL(href, page.url()).origin === pageOrigin) {
          await expect(marker).toHaveCount(0);
          continue;
        }

        // every link to another site opens a new tab without a referrer, and says so
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /\bnoreferrer\b/u);

        const spokenName = await link.evaluate(
          (element) => element.getAttribute('aria-label') ?? element.textContent ?? '',
        );

        expect(spokenName).toMatch(/\(opens in a new tab\)$/u);
      }
    });
  }

  test('the hero links down to the skills with a down arrow', async ({ page }) => {
    await page.goto('/');

    const browseLink = page.getByRole('link', { name: 'Browse the skills' });

    await expect(browseLink).toHaveAttribute('href', '#skills');
    await expect(browseLink.locator('svg.lucide-arrow-down')).toHaveCount(1);
  });

  test('the footer links to the package site alongside its existing project destinations', async ({
    page,
  }) => {
    await page.goto('/');

    const links = page.getByRole('navigation', { name: 'Project' });
    const packages = links.getByRole('link', {
      name: 'jg-packages (opens in a new tab)',
      exact: true,
    });

    await expect(packages).toHaveAttribute('href', 'https://jg-packages.jesusgraterol.dev/');
    await expect(packages).toHaveAttribute('target', '_blank');
    await expect(packages).toHaveAttribute('rel', 'noreferrer');
    await expect(packages.locator('[data-new-tab-marker]')).toHaveCount(1);
    await expect(links.getByRole('link', { name: /^Source repository/u })).toHaveAttribute(
      'href',
      SITE_CONFIG.repositoryUrl,
    );
    await expect(links.getByRole('link', { name: 'llms.txt' })).toHaveAttribute(
      'href',
      '/llms.txt',
    );
    await expect(links.getByRole('link', { name: 'Credits' })).toHaveAttribute('href', '/#credits');
  });

  for (const route of ACCESSIBILITY_ROUTES) {
    test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
      await page.goto(route);

      const results = await new AxeBuilder({ page }).analyze();

      expect(results.violations).toStrictEqual([]);
    });

    test(`${route} has no automatically detectable dark-theme accessibility violations`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.getByRole('button', { name: 'Use dark theme' }).first().click();
      await expect(page.locator('html')).toHaveClass(/dark/u);

      const results = await new AxeBuilder({ page }).analyze();

      expect(results.violations).toStrictEqual([]);
    });
  }

  test('home page lists every skill grouped by stage and links to its page', async ({ page }) => {
    await page.goto('/');

    for (const stage of ['Plan', 'Build', 'Ship', 'Context', 'Implicit']) {
      await expect(
        page.locator('#skills').getByRole('heading', { level: 3, name: stage }),
      ).toBeVisible();
    }

    for (const name of Object.keys(SKILL_CATALOG)) {
      await expect(
        page.locator('#skills').getByRole('link', { name, exact: true }),
      ).toHaveAttribute('href', `/skills/${name}/`);
    }

    // implicit skills show how they load where explicit skills show what they may change, and a
    // short summary instead of their agent-facing description
    for (const [name, catalogEntry] of Object.entries(SKILL_CATALOG)) {
      if (catalogEntry.kind === 'implicit') {
        const card = page
          .locator('[data-skill-card]')
          .filter({ has: page.getByRole('link', { name, exact: true }) });

        await expect(card).toContainText('Loads on its own');
        await expect(card.locator('[data-skill-summary]')).toHaveText(catalogEntry.summary);
      }
    }
  });

  test('theme preference persists across reloads', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Use dark theme' }).first().click();
    await expect(page.locator('html')).toHaveClass(/dark/u);
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'dark');

    await page.reload();

    await expect(page.locator('html')).toHaveClass(/dark/u);
    await expect(page.getByRole('button', { name: 'Use light theme' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Use light theme' }).first().click();
    await expect(page.locator('html')).not.toHaveClass(/dark/u);
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'light');
  });

  test('skip link moves keyboard focus to the main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });

    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/u);
  });

  for (const route of PUBLIC_ROUTES) {
    test(`${route} does not overflow horizontally at 320 pixels`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await page.goto(route);

      await waitForPageAssets(page);
      await expectNoHorizontalOverflow(page);
    });
  }

  test('mobile navigation is keyboard accessible at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/skills/jg-review/');

    await expect(page.getByRole('link', { name: 'jg-skills home' })).toContainText('jg-skills');

    const menu = page.getByLabel('Navigation menu', { exact: true });
    const mobileNavigation = page.getByRole('navigation', { name: 'Mobile navigation' });

    await expect(menu.locator('.lucide-menu')).toBeVisible();
    await expect(menu.locator('.lucide-x')).toBeHidden();

    await menu.focus();
    await page.keyboard.press('Enter');

    await expect(mobileNavigation).toBeVisible();
    await expect(menu.locator('.lucide-x')).toBeVisible();
    await expect(menu.locator('.lucide-menu')).toBeHidden();
    await expect(
      mobileNavigation.getByRole('link', { name: 'Install', exact: true }),
    ).toHaveAttribute('href', '/#install');

    await page.keyboard.press('Enter');

    await expect(mobileNavigation).toBeHidden();
    await expect(menu.locator('.lucide-menu')).toBeVisible();

    const outline = page.getByRole('navigation', { name: 'On this page', exact: true });
    await outline.locator('summary').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    const firstSection = outline.getByRole('link', { name: 'When to use it', exact: true });
    await expect(firstSection).toBeFocused();
    await expect(firstSection).not.toHaveCSS('outline-style', 'none');
    await firstSection.press('Enter');
    await expect(page).toHaveURL(/#when-to-use-heading$/u);
    await expect(
      page.getByRole('heading', { level: 2, name: 'When to use it', exact: true }),
    ).toBeInViewport();
  });

  test('mobile navigation closes after a same-page link and on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    const menu = page.getByLabel('Navigation menu', { exact: true });
    const mobileNavigation = page.getByRole('navigation', { name: 'Mobile navigation' });

    await menu.click();
    await mobileNavigation.getByRole('link', { name: 'Install', exact: true }).click();

    await expect(page).toHaveURL(/#install$/u);
    await expect(mobileNavigation).toBeHidden();

    await menu.click();
    await expect(mobileNavigation).toBeVisible();
    await mobileNavigation.getByRole('link', { name: 'Skills', exact: true }).focus();
    await page.keyboard.press('Escape');

    await expect(mobileNavigation).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test('the 404 page names no canonical URL', async ({ page }) => {
    await page.goto('/404.html');

    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  });

  test('a missing URL answers with the 404 page and a 404 status', async ({ page }) => {
    const response = await page.goto('/no-such-page/');

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'No skill lives at this path.' }),
    ).toBeVisible();
  });

  test('reduced-motion users do not receive animated scrolling or transitions', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const behavior = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const link = getComputedStyle(document.querySelector('a[href="/#skills"]') as HTMLElement);

      return {
        scrollBehavior: root.scrollBehavior,
        transitionDuration: link.transitionDuration,
      };
    });

    const motion = await inspectMotion(page);
    expect(motion.prefersReducedMotion).toBe(true);
    expect(motion.movingAnimations).toEqual([]);
    expect(behavior.scrollBehavior).toBe('auto');
    expect(Number.parseFloat(behavior.transitionDuration)).toBeLessThanOrEqual(0.001);
  });

  test('publishes the LLM index with every skill page', async ({ request }) => {
    const response = await request.get('/llms.txt');
    const text = await response.text();

    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('text/plain');

    for (const route of SKILL_ROUTES) {
      expect(text).toContain(`https://jg-skills.jesusgraterol.dev${route}`);
    }
  });
});
