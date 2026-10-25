import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, waitForPageAssets } from 'jg-playwright';

for (const colorScheme of ['light', 'dark'] as const)
  for (const width of [320, 768, 1440]) {
    test(`${colorScheme} ${width}px: follow the worked example before the catalog with visible, copyable workflow steps`, async ({
      page,
      context,
    }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/');
      await waitForPageAssets(page);
      await page.screenshot({
        path: testInfo.outputPath(`home-first-fold-${colorScheme}-${width}.png`),
      });
      await page.screenshot({
        path: testInfo.outputPath(`home-full-${colorScheme}-${width}.png`),
        fullPage: true,
      });
      await page.getByRole('link', { name: 'See the workflow' }).click();
      const example = page.getByRole('region', { name: 'Worked search empty-state example' });
      const order = await page.evaluate(() => {
        const workflow = document.querySelector('#workflow')!;
        const skills = document.querySelector('#skills')!;
        return Boolean(workflow.compareDocumentPosition(skills) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(order).toBe(true);
      const tabs = example.getByRole('tablist', { name: 'Example workflow steps' });
      for (const tab of await tabs.getByRole('tab').all()) {
        const box = await tab.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      for (const step of [
        {
          label: 'Plan',
          command: '/jg-plan Add an empty state for searches with no results.',
          skill: 'jg-plan',
        },
        { label: 'Build', command: '/jg-execute', skill: 'jg-execute' },
        { label: 'Review', command: '/jg-review', skill: 'jg-review' },
        { label: 'Publish', command: '/jg-push', skill: 'jg-push' },
      ]) {
        const tab = tabs.getByRole('tab', { name: step.label, exact: true });
        await tab.focus();
        await page.keyboard.press('Enter');
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        const panel = example.getByRole('tabpanel', { name: step.label, exact: true });
        const invocation = panel.getByRole('figure').filter({ hasText: 'Claude Code invocation' });
        await invocation.getByRole('button', { name: 'Copy code', exact: true }).click();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(step.command);
        await expect(panel.getByRole('link', { name: `Read ${step.skill}` })).toHaveAttribute(
          'href',
          `/skills/${step.skill}/`,
        );
        await expectNoHorizontalOverflow(page);
        expect(
          (
            await new AxeBuilder({ page })
              .include('[data-worked-example]')
              .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
              .analyze()
          ).violations,
        ).toStrictEqual([]);
      }
      await tabs.getByRole('tab', { name: 'Plan', exact: true }).click();
      await expect(example).toContainText('Illustrative workflow');
      const plan = example
        .getByRole('tabpanel', { name: 'Plan', exact: true })
        .getByRole('figure')
        .filter({ hasText: 'plan.md' });
      await expect(plan).toContainText('protocol: "0.2"');
      await expect(plan).toContainText('- AC-01: A search with no results explains why.');
      await expect(
        example.getByRole('list', { name: 'Files the task touches' }).getByRole('listitem'),
      ).toHaveText(['SearchResults.tsx', 'SearchResults.test-e2e.ts']);
      const standards = example.getByRole('list', { name: 'Standards that load for those files' });
      for (const name of ['jg-frontend', 'jg-react', 'jg-testing'])
        await expect(standards.getByRole('link', { name, exact: true })).toHaveAttribute(
          'href',
          `/skills/${name}/`,
        );
      await example.screenshot({
        path: testInfo.outputPath(`worked-example-${colorScheme}-${width}.png`),
      });
      expect(errors).toStrictEqual([]);
    });
  }

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  test('all four example steps remain readable without scripting', async ({ page }) => {
    await page.goto('/');
    const example = page.getByRole('region', { name: 'Worked search empty-state example' });
    for (const label of ['Plan', 'Build', 'Review', 'Publish'])
      await expect(example.getByRole('region', { name: label, exact: true })).toBeVisible();
    await expect(example.getByRole('tablist')).toHaveCount(0);
    await expect(example.getByRole('button', { name: 'Copy code', exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
});
