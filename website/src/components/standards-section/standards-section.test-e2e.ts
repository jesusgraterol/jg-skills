import { expect, test, type Locator } from '@playwright/test';

// both starting points on Agentic Coding, in display order
const CARDS = [
  {
    destination: 'agenticcoding.jesusgraterol.dev/start',
    href: 'https://agenticcoding.jesusgraterol.dev/start/',
    label: 'No AGENTS.md yet',
    title: 'Start from the foundation',
  },
  {
    destination: 'agenticcoding.jesusgraterol.dev/refine',
    href: 'https://agenticcoding.jesusgraterol.dev/refine/',
    label: 'Already have one',
    title: 'Refine what you have',
  },
] as const;

/**
 * Reads the top edge of an element in page coordinates.
 * @param locator The element to measure.
 * @returns Its distance from the top of the page, in pixels.
 */
const topOf = async (locator: Locator): Promise<number> =>
  locator.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);

test.describe('standards section', () => {
  test('sits between Install and Credits', async ({ page }) => {
    await page.goto('/');

    const section = page.locator('#standards');

    await expect(
      section.getByRole('heading', { level: 2, name: 'Give your agent standards to follow.' }),
    ).toBeVisible();
    expect(await topOf(page.locator('#install'))).toBeLessThan(await topOf(section));
    expect(await topOf(section)).toBeLessThan(await topOf(page.locator('#credits')));
  });

  test('connects AGENTS.md and jg-skills in its strip', async ({ page }) => {
    await page.goto('/');

    const items = page.locator('[data-standards-strip]').getByRole('listitem');

    // the decorative connector between the two items stays out of the accessibility tree
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).locator('code')).toHaveText('AGENTS.md');
    await expect(items.nth(0)).toContainText('Sets the standards');
    await expect(items.nth(1).locator('code')).toHaveText('jg-skills');
    await expect(items.nth(1)).toContainText('Runs the workflow');
  });

  test('links each case to its page on Agentic Coding', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('[data-standards-card]');

    await expect(cards).toHaveCount(CARDS.length);

    for (const [index, { destination, href, label, title }] of CARDS.entries()) {
      const card = cards.nth(index);

      await expect(card.locator('[data-standards-case]')).toHaveText(label);
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(
        `${title} (opens in a new tab)`,
      );
      await expect(card.getByRole('link')).toHaveAttribute('href', href);
      await expect(card.locator('[data-standards-destination]')).toHaveText(destination);
      // the link card's up-right arrow in the corner
      await expect(card.locator('.lucide-arrow-up-right')).toHaveCount(1);
    }
  });

  test('never mentions CLAUDE.md', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#standards')).not.toContainText('CLAUDE.md');
  });

  test('places the cards side by side on wide screens and stacks them on narrow ones', async ({
    page,
  }) => {
    const cards = page.locator('[data-standards-card]');

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    expect(await topOf(cards.nth(1))).toBe(await topOf(cards.nth(0)));

    await page.setViewportSize({ width: 320, height: 720 });

    const firstBottom = await cards
      .nth(0)
      .evaluate((element) => element.getBoundingClientRect().bottom + window.scrollY);

    expect(await topOf(cards.nth(1))).toBeGreaterThan(firstBottom);
  });

  test('draws a focus ring around a card when its link has keyboard focus', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[data-standards-card]').first();

    await card.getByRole('link').focus();

    expect(await card.evaluate((element) => element.matches(':has(:focus-visible)'))).toBe(true);
    expect(await card.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  });
});
