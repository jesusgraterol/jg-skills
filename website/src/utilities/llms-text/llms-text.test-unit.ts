// @vitest-environment node
import { describe, expect, test } from 'vitest';

import { buildLlmsText } from './llms-text.ts';

describe('buildLlmsText', () => {
  test('builds the required llms.txt structure with the install command and ordered skills', () => {
    const text = buildLlmsText([
      {
        description: 'Create or revise a plan.\nSave it for approval.',
        name: 'jg-plan',
      },
      {
        description: 'Review the uncommitted change.',
        name: 'jg-[review]',
      },
    ]);

    expect(text).toMatch(/^# jg-skills\n\n> .+\n/u);
    expect(text).toContain(
      '## Install\n\n```bash\nnpx skills add jesusgraterol/jg-skills --skill "*" -y\n```\n',
    );
    expect(text).toContain('## Planning runtime');
    expect(text).toContain('npm install --save-dev --save-exact jg-plans@0.2.0');
    expect(text).toContain('Skills never install it automatically');
    expect(text).toContain(
      '- [jg-plan](https://jg-skills.jesusgraterol.dev/skills/jg-plan/): Create or revise a plan. Save it for approval.',
    );
    expect(text).toContain(
      '- [jg-\\[review\\]](https://jg-skills.jesusgraterol.dev/skills/jg-[review]/): Review the uncommitted change.',
    );
    expect(text.indexOf('/skills/jg-plan/')).toBeLessThan(text.indexOf('/skills/jg-[review]/'));
    expect(text).toMatch(/\n## Optional\n/u);
    expect(text).toContain(
      '- [Start an AGENTS.md](https://agenticcoding.jesusgraterol.dev/start/): A neutral AGENTS.md foundation for repositories without coding instructions.\n- [Refine an AGENTS.md](https://agenticcoding.jesusgraterol.dev/refine/): A prompt that refines existing coding instructions without losing project knowledge.\n',
    );
    expect(text.endsWith('\n')).toBe(true);
  });

  test('keeps the required sections when no skills are published', () => {
    const text = buildLlmsText([]);

    // the Skills heading stays, with no links under it before the Optional section
    expect(text).toMatch(/\n## Skills\n\s*\n## Optional\n/u);
  });
});
