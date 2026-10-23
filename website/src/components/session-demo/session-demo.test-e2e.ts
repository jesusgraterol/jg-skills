import { expect, test } from '@playwright/test';

test.describe('session demo', () => {
  test('shows a supervised conversation that plans, builds and reviews a change', async ({
    page,
  }) => {
    await page.goto('/');

    const demo = page.locator('[data-session-demo]');

    await expect(demo.locator('[data-terminal]')).toHaveCount(0);
    await expect(demo.getByRole('article')).toHaveCount(6);
    await expect(
      demo.getByRole('article', { name: 'You', exact: true }).getByRole('code'),
    ).toHaveText(['/jg-plan', '/jg-execute', '/jg-review']);
    await expect(demo.getByRole('article', { name: 'Claude Code', exact: true })).toHaveCount(3);
  });

  test('shows the Claude Code mark as a decorative avatar that loads', async ({ page }) => {
    await page.goto('/');

    const avatars = page.getByRole('article', { name: 'Claude Code', exact: true }).locator('img');

    await expect(avatars).toHaveCount(3);

    for (const avatar of await avatars.all()) {
      await expect(avatar).toHaveAttribute('alt', '');
      expect(
        await avatar.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      ).toBe(true);
    }
  });

  test('reads the complete conversation in order with named speakers', async ({ page }) => {
    await page.goto('/');

    const messages = page
      .getByRole('list', { name: 'Example conversation with Claude Code' })
      .getByRole('article');
    await expect(messages).toHaveText(
      [
        'You /jg-plan Add an empty state to the search page.',
        'Claude Code plan.md saved. Review the scope before building.',
        'You /jg-execute',
        'Claude Code Implementation and checks complete. Ready for review.',
        'You /jg-review',
        'Claude Code No blocking findings. Ready for jg-push.',
      ],
      { useInnerText: true },
    );
    for (const [index, speaker] of [
      'You',
      'Claude Code',
      'You',
      'Claude Code',
      'You',
      'Claude Code',
    ].entries()) {
      await expect(messages.nth(index)).toHaveAccessibleName(speaker);
    }
  });

  test('keeps the conversation readable without horizontal overflow at 320 pixels', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    const overflow = await page
      .locator('[data-session-demo]')
      .evaluate((element) => element.scrollWidth - element.clientWidth);

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
