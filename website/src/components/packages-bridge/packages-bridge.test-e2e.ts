import { expect, test } from '@playwright/test';

test.describe('packages section', () => {
  test('sits after the standards section and before Credits, explaining all three roles', async ({
    page,
  }) => {
    await page.goto('/');

    const section = page.locator('#packages');

    await expect(section.getByRole('heading', { level: 2 })).toHaveText(
      'Give your agent reusable building blocks.',
    );
    expect(await section.evaluate((element) => element.previousElementSibling?.id)).toBe(
      'standards',
    );
    expect(await section.evaluate((element) => element.nextElementSibling?.id)).toBe('credits');

    const roles = section
      .getByRole('list', { name: 'How coding instructions, skills, and packages fit together' })
      .getByRole('listitem');

    await expect(roles).toHaveCount(3);
    await expect(roles.nth(0)).toContainText("Coding instructionsSet your project's standards.");
    await expect(roles.nth(1)).toContainText('jg-skillsGuide the work.');
    await expect(roles.nth(2)).toContainText('jg-packagesProvide reusable code.');
    await expect(
      page.locator('#standards').getByRole('link', { name: 'Start from the foundation' }),
    ).toHaveAttribute('href', 'https://agenticcoding.jesusgraterol.dev/start/');
    await expect(
      page.locator('#standards').getByRole('link', { name: 'Refine what you have' }),
    ).toHaveAttribute('href', 'https://agenticcoding.jesusgraterol.dev/refine/');
  });

  for (const width of [320, 1280]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`offers accessible external and internal actions at ${width} pixels in the ${theme} theme`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: theme });
        await page.goto('/');

        const section = page.locator('#packages');
        const browse = section.getByRole('link', {
          name: 'Browse jg-packages (opens in a new tab)',
          exact: true,
        });
        const guidance = section.getByRole('link', {
          name: 'Use the jg-packages skill',
          exact: true,
        });

        await expect(browse).toHaveAttribute('href', 'https://jg-packages.jesusgraterol.dev/');
        await expect(browse).toHaveAttribute('target', '_blank');
        await expect(browse).not.toHaveAttribute('rel', /noreferrer/u);
        await expect(browse.locator('svg.lucide-external-link')).toHaveAttribute(
          'aria-hidden',
          'true',
        );
        await expect(guidance).toHaveAttribute('href', '/skills/jg-packages/');
        await expect(guidance).not.toHaveAttribute('target', '_blank');
        await expect(guidance.locator('[data-external-icon]')).toHaveCount(0);
        await expect(page.locator('html')).toHaveAttribute('data-resolved-theme', theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );

        await browse.focus();
        await expect(browse).not.toHaveCSS('outline-style', 'none');
        await page.keyboard.press('Tab');
        await expect(guidance).toBeFocused();
        await expect(guidance).not.toHaveCSS('outline-style', 'none');
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/skills\/jg-packages\/$/u);
        await expect(page.getByRole('heading', { level: 1, name: 'jg-packages' })).toBeVisible();
      });
    }
  }
});
