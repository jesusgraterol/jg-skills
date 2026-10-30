# Testing

Run `npm test` or `npm run check` from `website/` for essential coverage. CI runs `npm run check` and the separate, required `verify-skills` job. Full runs locally only when explicitly requested, with no full CI input, schedule, or recurring manual routine.

## Membership

Essential protects consequential distribution and instruction guarantees:

- Skill identity and catalog completeness, explicit versus implicit invocation permissions, shared authorization/scope rules, and the planning protocol/runtime contract.
- Reference availability, ownership, supported loading boundaries, and the file budget that limits instruction truncation.
- Rejection of unsafe rendered markup, event handlers, encoded or disallowed URLs, and tampered Markdown plugin structures. These are security checks on real rendered content, not presentation smokes.
- Artifact rejection for missing skills/references, missing validation markers, unsafe content, or emitted test source.
- The existing `verify-skills` job installs every skill with `skills@1.7.2` in an isolated temporary home and compares every installed file with its source. It stays independent of site dependencies and remains a deployment prerequisite.

Full adds ordinary frontmatter/schema permutations, search/SEO/index formatting, source links, section parsing and reference sorting/formatting, style conventions, CDN example-copy protection, validator metadata/link corruption, and all eleven browser E2E files. The browser suite retains accessibility, keyboard/focus, 320px layouts, light/dark themes, no-JavaScript, copy interactions, and reduced-motion coverage. Add no replacement essential browser smoke. Both aggregates retain all existing production build validation.

Classify each new or materially changed family by the concrete consequence of failure. Authority, privacy/isolation, core persistence, primary workflows, and required recovery belong in essential when applicable. Test speed, level, size, and frontend/backend location do not establish importance. Every current family has been assessed; unassessed existing coverage stays essential until assessed.

Useful secondary cases and suites carry the declared Vitest `full` tag. Mixed selections stay co-located. Essential excludes wholly full-only unit files before imports and omits the wholly full-only browser category and its preparation. Keep required empty selections failing. If a new consequential browser family needs essential coverage, add that selection and its preparation to both essential aggregates instead of silently excluding it with today's category.

## Commands

All commands below run from `website/`. Install Chromium for browser checks with `npx playwright install chromium`; essential needs no browser.

| Command                             | Selection and preparation                                                   |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `npm test`                          | Essential unit tests, one validated build, then essential integration tests |
| `npm run check`                     | Essential tests plus typecheck, lint, formatting, and one validated build   |
| `npm run test:full`                 | Complete unit, integration, and browser coverage with one build             |
| `npm run check:full`                | Complete coverage plus typecheck, lint, formatting, and one build           |
| `npm run test:unit`                 | Complete unit category                                                      |
| `npm run test:integration`          | Build, then complete integration category                                   |
| `npm run test:e2e`                  | Build, then complete Chromium category                                      |
| `npm run test:integration:artifact` | Complete integration category against an existing build                     |
| `npm run test:e2e:artifact`         | Complete Chromium category against an existing build                        |

Native aggregate filters apply only to that invocation. Granular and focused commands include full-only cases by default. Aggregate commands build once, and artifact commands can reuse a build while its source, dependencies, and configuration are unchanged.

During development, prefer complete focused checks. Completion requires essential regression plus complete focused coverage for affected behavior and consumers, including full-only cases. Reuse successful checks while their relevant source, dependency, configuration, selection, and environment inputs are unchanged.

```bash
npm run test:unit -- src/utilities/skill-catalog/utilities.test-unit.ts
npm run build
npm run test:integration:artifact -- scripts/verify-build.test-integration.ts --retry=0
npm run test:e2e:artifact -- src/components/skill-document/skill-document.test-e2e.ts --repeat-each=3 --retries=0
```

Run changed integration files three times with retries off. Vitest 4.1.12 requires three separate invocations; Playwright uses `--repeat-each=3 --retries=0`. Tests remain co-located with their owning source and category discovery stays separate. Archive/backup directories are excluded from discovery. Tests must never enter production artifacts; the build validator and its essential emitted-source rejection case enforce that boundary.
