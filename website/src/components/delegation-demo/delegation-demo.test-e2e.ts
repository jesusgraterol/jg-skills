import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, waitForPageAssets } from 'jg-playwright';

// the handoff in order: who speaks, the command or skill it uses, and what it says
const MESSAGES = [
  ['Codex', 'hq_message_publish', 'The CSV export is ready. Please review it.'],
  ['jg-agent-hq', null, 'Grants jg-review-session for this request only.'],
  ['Claude Code', '/jg-review-session', 'Quoted fields work; an empty export loses its headers.'],
  ['Codex', 'hq_report_read', 'Fixed, with a regression test that passes.'],
] as const;

for (const colorScheme of ['light', 'dark'] as const)
  for (const width of [320, 768, 1440]) {
    test(`${colorScheme} ${width}px: a review is handed to another agent through HQ`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/');
      await waitForPageAssets(page);
      const section = page.getByRole('region', { name: 'Let another agent check the work.' });
      await expect(section).toContainText('Illustrative handoff');
      const messages = section.getByRole('article');
      await expect(messages).toHaveCount(MESSAGES.length);
      for (const [index, [speaker, name, text]] of MESSAGES.entries()) {
        await expect(messages.nth(index)).toContainText(speaker);
        if (name) await expect(messages.nth(index)).toContainText(name);
        await expect(messages.nth(index)).toContainText(text);
      }
      await expect(section.getByRole('link', { name: 'Read jg-review-session' })).toHaveAttribute(
        'href',
        '/skills/jg-review-session/',
      );
      await expectNoHorizontalOverflow(page);
      expect(
        (
          await new AxeBuilder({ page })
            .include('#delegation')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toStrictEqual([]);
      if (testInfo.repeatEachIndex === 0)
        await section.screenshot({
          path: testInfo.outputPath(`delegation-demo-${colorScheme}-${width}.png`),
        });
    });
  }

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  test('the handoff stays readable without scripting', async ({ page }) => {
    await page.goto('/');
    const section = page.getByRole('region', { name: 'Let another agent check the work.' });
    for (const [, , text] of MESSAGES) await expect(section).toContainText(text);
    await expectNoHorizontalOverflow(page);
  });
});
