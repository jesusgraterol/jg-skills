import { expect, test } from '@playwright/test';

import { SITE_CONFIG } from '../../site.config.ts';

test.describe('install command', () => {
  test('renders each command exactly, with no extra whitespace', async ({ page }) => {
    await page.goto('/');

    for (const [id, command] of [
      ['hero-install-command', SITE_CONFIG.commands.install],
      ['install-command', SITE_CONFIG.commands.install],
      ['update-command', SITE_CONFIG.commands.update],
      ['remove-command', SITE_CONFIG.commands.remove],
    ] as const) {
      expect(await page.locator(`#${id}`).evaluate((element) => element.textContent)).toBe(command);
    }
  });

  test('names each copy button after the command it copies', async ({ page }) => {
    await page.goto('/');

    for (const [sourceId, name] of [
      ['hero-install-command', 'Copy install command'],
      ['install-command', 'Copy install command'],
      ['update-command', 'Copy update command'],
      ['remove-command', 'Copy remove command'],
    ] as const) {
      await expect(page.locator(`button[data-copy-source="${sourceId}"]`)).toHaveAccessibleName(
        name,
      );
    }

    await page.goto('/skills/jg-plan/');

    await expect(
      page.locator('button[data-copy-source="jg-plan-invocation-1"]'),
    ).toHaveAccessibleName('Copy invocation');
  });

  test('shows a shell prompt that is never part of the copied command', async ({ page }) => {
    await page.goto('/');

    const terminal = page
      .locator('[data-code-window]')
      .filter({ has: page.locator('#install-command') });

    await expect(terminal).toContainText(`$${SITE_CONFIG.commands.install}`);
    expect(await page.locator('#install-command').evaluate((element) => element.textContent)).toBe(
      SITE_CONFIG.commands.install,
    );
  });

  test('copy writes the exact command and announces success', async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    const copyControl = page.locator('button[data-copy-source="hero-install-command"]');

    await copyControl.click();

    await expect(copyControl).toHaveAttribute('data-copy-state', 'success');
    await expect(copyControl).toContainText('Copied');
    await expect(copyControl.locator('xpath=..').locator('[data-copy-status]')).toHaveText(
      'Copied to the clipboard.',
    );
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      SITE_CONFIG.commands.install,
    );
  });

  test('copy shows lasting manual-copy guidance when the clipboard is unavailable', async ({
    page,
  }) => {
    await page.clock.install();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    });
    await page.goto('/');

    const copyControl = page.locator('button[data-copy-source="remove-command"]');
    // the package's guidance for a browser without a clipboard
    const guidance =
      "This browser can't copy from this page. Select the remove command and copy it manually.";
    const wrapper = copyControl.locator('xpath=..');
    const hint = wrapper.locator('[data-copy-hint]');

    await copyControl.click();

    await expect(copyControl).toHaveAttribute('data-copy-state', 'error');
    await expect(copyControl).toContainText('Copy failed');
    await expect(wrapper.locator('[data-copy-status]')).toHaveText(guidance);
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(guidance);

    // the guidance outlasts the success message's two-second reset
    await page.clock.runFor(2_500);

    await expect(hint).toBeVisible();
    await expect(copyControl).toHaveAttribute('data-copy-state', 'error');
  });
});
