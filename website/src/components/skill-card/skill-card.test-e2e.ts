import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow } from 'jg-playwright';

import { SKILL_CATALOG } from '../../site.config.ts';

test.describe('skill card', () => {
  test("shows each skill's icon before its name, hidden from assistive technology", async ({
    page,
  }) => {
    await page.goto('/');

    for (const [name, { icon }] of Object.entries(SKILL_CATALOG)) {
      const card = page
        .locator('[data-skill-card]')
        .filter({ has: page.getByRole('link', { name, exact: true }) });
      const tile = card.locator('[data-skill-icon]');

      await expect(tile).toHaveAttribute('data-skill-icon', icon);
      await expect(tile).toHaveAttribute('aria-hidden', 'true');
      // a Lucide icon carries its name as a class; a technology mark carries its slug
      await expect(
        tile.locator(`svg.lucide-${icon}, svg[data-skill-brand-mark="${icon}"]`),
      ).toHaveCount(1);
    }
  });

  for (const theme of ['light', 'dark'] as const) {
    // one column on a small phone, two just past sm, and three on desktop
    for (const width of [320, 640, 1280]) {
      test(`keeps badges compact below the skill names at ${width} pixels in the ${theme} theme`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width, height: 720 });
        await page.goto('/');
        // measure with the self-hosted font, not a fallback
        await page.evaluate(async () => {
          await document.fonts.ready;
        });

        const badges = page.locator('[data-skill-badge]');

        await expect(badges).toHaveCount(Object.keys(SKILL_CATALOG).length);

        const misplaced = await badges.evaluateAll((elements) =>
          elements.flatMap((element) => {
            const title = element.closest('[data-skill-card]')?.querySelector('h4');
            const badgeBounds = element.getBoundingClientRect();
            const titleBounds = title?.getBoundingClientRect();

            return !titleBounds ||
              badgeBounds.top < titleBounds.bottom ||
              badgeBounds.top - titleBounds.bottom > 4 ||
              Math.abs(badgeBounds.left - titleBounds.left) > 1 ||
              badgeBounds.height > 20
              ? [title?.textContent?.trim() ?? 'Missing title']
              : [];
          }),
        );

        expect(misplaced).toStrictEqual([]);
        await expectNoHorizontalOverflow(page);
      });
    }
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`shows a visible focus ring when reached by keyboard in the ${theme} theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');

      const link = page.getByRole('link', { name: 'jg-plan', exact: true });
      const card = page.locator('[data-skill-card]').filter({ has: link });

      await link.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();

      const outline = await card.evaluate((element) => {
        const style = getComputedStyle(element);

        return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
      });

      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThanOrEqual(2);
    });
  }

  test('leaves the card without an outline when it is not focused', async ({ page }) => {
    await page.goto('/');

    const card = page
      .locator('[data-skill-card]')
      .filter({ has: page.getByRole('link', { name: 'jg-plan', exact: true }) });

    expect(await card.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none');
  });
});
