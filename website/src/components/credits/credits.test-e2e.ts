import { expect, test } from '@playwright/test';

// the credited collections, in display order
const CREDITS = [
  ['superpowers', 'Jesse Vincent', 'https://github.com/obra/superpowers'],
  ['agent-skills', 'Addy Osmani', 'https://github.com/addyosmani/agent-skills'],
  ['pstack', 'Lauren Tan', 'https://github.com/poteto/plugins/tree/main/pstack'],
  ['skills', 'Matt Pocock', 'https://github.com/mattpocock/skills'],
] as const;

test.describe('credits section', () => {
  test('credits each collection with its author, license, and repository', async ({ page }) => {
    await page.goto('/');

    const section = page.locator('#credits');

    await expect(
      section.getByRole('heading', { level: 2, name: 'Ideas we built on.' }),
    ).toBeVisible();

    const cards = section.locator('[data-credit]');

    await expect(cards).toHaveCount(CREDITS.length);

    for (const [index, [name, author, url]] of CREDITS.entries()) {
      const card = cards.nth(index);

      await expect(card.getByRole('heading', { level: 3 })).toContainText(name);
      await expect(card.getByRole('link')).toHaveAttribute('href', url);
      await expect(card.locator('[data-credit-author]')).toHaveText(`by ${author}`);
      await expect(card.locator('[data-credit-license]')).toHaveText('MIT');
      await expect(card.locator('svg[data-github-mark]')).toHaveCount(1);
      // the link card's up-right arrow in the corner, and the new-tab notice on its link
      await expect(card.locator('.lucide-arrow-up-right')).toHaveCount(1);
      await expect(card.getByRole('link')).toHaveAccessibleName(`${name} (opens in a new tab)`);
    }
  });

  test('is linked from the footer', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('navigation', { name: 'Project' }).getByRole('link', { name: 'Credits' }),
    ).toHaveAttribute('href', '/#credits');
  });

  test('stays within the viewport at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    const overflow = await page
      .locator('#credits')
      .evaluate((element) => element.scrollWidth - element.clientWidth);

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
