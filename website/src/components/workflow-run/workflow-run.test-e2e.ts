import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow } from 'jg-playwright';

test.describe('workflow section', () => {
  test('starts supervised and switches to autonomous from the keyboard', async ({ page }) => {
    await page.goto('/');

    const workflow = page.locator('[data-workflow-run]');
    const supervised = workflow.getByRole('radio', { name: 'Supervised' });
    const autonomous = workflow.getByRole('radio', { name: 'Autonomous' });
    const cycle = workflow.getByRole('list', { name: 'For each milestone' });

    await expect(
      workflow.getByRole('list', { name: 'Workflow phases', exact: true }),
    ).toBeVisible();
    for (const phase of ['Plan', 'Build', 'Ship']) {
      await expect(
        workflow.getByRole('heading', { level: 3, name: phase, exact: true }),
      ).toBeVisible();
    }

    await expect(supervised).toBeChecked();
    await expect(workflow.getByText('/jg-execute', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-execute auto', { exact: true })).toBeHidden();
    await expect(cycle).toBeHidden();
    await expect(workflow.getByText('Whole-plan review', { exact: true })).toBeHidden();
    await expect(workflow.getByText('You run these when you are ready.')).toBeVisible();
    await expect(workflow.getByText('/jg-debug', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-pause', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-command', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-challenge-session', { exact: true })).toBeVisible();
    await expect(workflow.getByText('Challenge it again from a fresh session.')).toBeVisible();
    await expect(workflow.getByText('/jg-review-session', { exact: true })).toBeVisible();
    await expect(
      workflow.getByText('Check the delivered work from a fresh session.'),
    ).toBeVisible();

    await supervised.focus();
    await page.keyboard.press('ArrowRight');

    await expect(autonomous).toBeChecked();
    await expect(workflow.getByText('/jg-execute auto', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-execute', { exact: true })).toBeHidden();
    await expect(cycle.getByRole('listitem')).toHaveText([
      'Implement',
      'Checks',
      'Review',
      'Fix',
      'Push',
      'Next milestone',
    ]);
    // jg-execute auto reviews the whole plan once, after its last milestone
    await expect(workflow.getByText('After the last milestone', { exact: true })).toBeVisible();
    await expect(workflow.getByText('Whole-plan review', { exact: true })).toBeVisible();
    await expect(
      workflow.getByText('jg-execute runs jg-review and jg-push after each milestone.'),
    ).toBeVisible();
    await expect(workflow.getByText('/jg-debug', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-pause', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-command', { exact: true })).toBeVisible();
    await expect(workflow.getByText('You run these when you are ready.')).toBeHidden();
  });

  test('keeps the hidden mode out of the accessibility tree', async ({ page }) => {
    await page.goto('/');

    const supervisedSnapshot = await page.locator('[data-workflow-run]').ariaSnapshot();

    expect(supervisedSnapshot).toContain('/jg-execute');
    expect(supervisedSnapshot).not.toContain('/jg-execute auto');
    expect(supervisedSnapshot).not.toContain('For each milestone');

    await page.locator('[data-workflow-run]').getByText('Autonomous', { exact: true }).click();

    const autonomousSnapshot = await page.locator('[data-workflow-run]').ariaSnapshot();

    expect(autonomousSnapshot).toContain('/jg-execute auto');
    expect(autonomousSnapshot).not.toContain('You run these when you are ready.');
  });

  test('stays within the viewport at 320 pixels in both modes', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    const workflow = page.locator('[data-workflow-run]');
    const overflow = async (): Promise<number> =>
      workflow.evaluate((element) => element.scrollWidth - element.clientWidth);

    expect(await overflow()).toBeLessThanOrEqual(0);

    await workflow.getByText('Autonomous', { exact: true }).click();

    expect(await overflow()).toBeLessThanOrEqual(0);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`stays readable and accessible at 768 pixels in ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 768, height: 1000 });
      await page.goto('/');
      const workflow = page.locator('[data-workflow-run]');
      for (const mode of ['Supervised', 'Autonomous']) {
        await workflow.getByText(mode, { exact: true }).click();
        await expect(
          workflow.getByText(mode === 'Supervised' ? '/jg-execute' : '/jg-execute auto', {
            exact: true,
          }),
        ).toBeVisible();
        await expectNoHorizontalOverflow(page);
        expect(
          (
            await new AxeBuilder({ page })
              .include('[data-workflow-run]')
              .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
              .analyze()
          ).violations,
        ).toStrictEqual([]);
      }
      await expect(workflow.getByText('Whole-plan review', { exact: true })).toBeVisible();
    });
  }
});

test.describe('workflow without JavaScript', () => {
  test.use({ javaScriptEnabled: false, contextOptions: { reducedMotion: 'reduce' } });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`keeps both native modes readable at 320 pixels in ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 320, height: 720 });
      await page.goto('/');
      const workflow = page.locator('[data-workflow-run]');
      const supervised = workflow.getByRole('radio', { name: 'Supervised' });
      const autonomous = workflow.getByRole('radio', { name: 'Autonomous' });
      await supervised.focus();
      await page.keyboard.press('ArrowRight');
      await expect(autonomous).toBeChecked();
      await expect(workflow.getByText('/jg-execute auto', { exact: true })).toBeVisible();
      await expect(
        workflow.getByRole('list', { name: 'For each milestone' }).getByRole('listitem'),
      ).toHaveCount(6);
      await page.keyboard.press('ArrowLeft');
      await expect(supervised).toBeChecked();
      await expect(workflow.getByText('/jg-execute', { exact: true })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0);
    });
  }
});
