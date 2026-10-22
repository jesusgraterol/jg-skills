import { expect, test } from '@playwright/test';

test.describe('session demo', () => {
  test('shows a supervised conversation that plans, builds and reviews a change', async ({
    page,
  }) => {
    await page.goto('/');

    const demo = page.locator('[data-session-demo]');

    await expect(demo.locator('[data-terminal]')).toHaveCount(0);
    await expect(demo.locator('[data-conversation-message]')).toHaveCount(6);
    await expect(demo.locator('[data-conversation-message="you"] code')).toHaveText([
      '/jg-plan',
      '/jg-execute',
      '/jg-review',
    ]);
    await expect(demo.locator('[data-conversation-message="agent"]')).toHaveCount(3);
  });

  test('shows the Claude Code mark as a decorative avatar that loads', async ({ page }) => {
    await page.goto('/');

    const avatars = page.locator('[data-conversation-message="agent"] img');

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

  test('reads in order to assistive technology, naming each speaker once', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('list', { name: 'Example conversation with Claude Code' }))
      .toMatchAriaSnapshot(`
      - list "Example conversation with Claude Code":
        - listitem:
          - text: "You:"
          - code: /jg-plan
          - text: Add an empty state to the search page.
        - listitem: "Claude Code: plan.md saved. Review the scope before building."
        - listitem:
          - text: "You:"
          - code: /jg-execute
        - listitem: "Claude Code: Implementation and checks complete. Ready for review."
        - listitem:
          - text: "You:"
          - code: /jg-review
        - listitem: "Claude Code: No blocking findings. Ready for jg-push."
    `);
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
