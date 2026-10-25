import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, waitForPageAssets } from 'jg-playwright';

for (const colorScheme of ['light', 'dark'] as const)
  for (const width of [320, 768, 1440]) {
    test(`${colorScheme} ${width}px: criteria flow from the plan through milestones to the check`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/');
      await waitForPageAssets(page);
      const section = page.getByRole('region', {
        name: 'Every requirement has an ID and an owner.',
      });
      const flow = section.getByRole('list', {
        name: 'How acceptance criteria flow through the skills',
      });
      const steps = flow.getByRole('listitem').filter({ has: page.getByRole('link') });
      await expect(steps).toHaveCount(3);
      for (const [index, skill] of ['jg-plan', 'jg-breakdown', 'jg-execute'].entries())
        await expect(
          steps.nth(index).getByRole('link', { name: `/${skill}`, exact: true }),
        ).toHaveAttribute('href', `/skills/${skill}/`);
      await expect(steps.nth(0)).toContainText(
        '- AC-02: The empty state offers to clear the filters.',
      );
      await expect(steps.nth(1)).toContainText('**Acceptance criteria:** AC-02, AC-03');
      const runs = flow.getByRole('list', { name: 'Check results' }).getByRole('listitem');
      await expect(runs.nth(0)).toContainText('"conforms": true');
      await expect(runs.nth(1)).toContainText('error UNKNOWN_CRITERION');
      await expect(runs.nth(1)).toContainText('Stopped before building; run jg-breakdown.');
      await expectNoHorizontalOverflow(page);
      expect(
        (
          await new AxeBuilder({ page })
            .include('[data-criteria-flow]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toStrictEqual([]);
      if (testInfo.repeatEachIndex === 0)
        await section.screenshot({
          path: testInfo.outputPath(`criteria-flow-${colorScheme}-${width}.png`),
        });
    });
  }

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  test('the criteria flow stays readable without scripting', async ({ page }) => {
    await page.goto('/');
    const flow = page.locator('[data-criteria-flow]');
    await expect(flow).toContainText('- AC-01: A search with no results explains why.');
    await expect(flow).toContainText('error UNKNOWN_CRITERION');
    await expectNoHorizontalOverflow(page);
  });
});
