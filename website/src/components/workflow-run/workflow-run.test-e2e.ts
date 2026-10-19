import { expect, test } from '@playwright/test';

test.describe('workflow section', () => {
  test('starts supervised and switches to autonomous from the keyboard', async ({ page }) => {
    await page.goto('/');

    const workflow = page.locator('[data-workflow-run]');
    const supervised = workflow.getByRole('radio', { name: 'Supervised' });
    const autonomous = workflow.getByRole('radio', { name: 'Autonomous' });
    const cycle = workflow.getByRole('list', { name: 'For each milestone' });

    await expect(supervised).toBeChecked();
    await expect(workflow.getByText('/jg-execute', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-execute auto', { exact: true })).toBeHidden();
    await expect(cycle).toBeHidden();
    await expect(workflow.getByText('You run these when you are ready.')).toBeVisible();
    await expect(workflow.getByText('/jg-debug', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-pause', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-command', { exact: true })).toBeVisible();
    await expect(workflow.getByText('/jg-challenge-session', { exact: true })).toBeVisible();
    await expect(workflow.getByText('Challenge it again from a fresh session.')).toBeVisible();

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
    await expect(workflow.getByText('jg-execute runs these after each milestone.')).toBeVisible();
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
});
