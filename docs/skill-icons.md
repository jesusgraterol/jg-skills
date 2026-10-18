# Skill icons

`/docs` is reserved for essential, durable project concepts and processes. This page explains how each skill's icon is chosen, so a new skill or a changed icon doesn't start from scratch.

## Rules

- Every skill has exactly one icon, set as `icon` in its entry in `website/src/site.config.ts`. It leads the skill's card and opens its page.
- An explicit skill uses a [Lucide](https://lucide.dev/icons/) icon. The type check rejects a technology mark on an explicit skill.
- An implicit skill uses the [Simple Icons](https://simpleicons.org/) mark of the technology it is written for. It uses a Lucide icon for its domain instead when it covers several technologies, like `jg-testing`, or when the mark blurs at 20 pixels, like `jg-postgres`, `jg-bash`, and `jg-ci`, or when its license adds terms the site doesn't carry, like the SVG mark's CC-BY-SA-4.0 for `jg-svg`.
- Icons are drawn in one theme color on the dark tile, never in brand colors.

## Choosing an icon

- Pick one idea, named for what the skill does or covers, not for how it works.
- It must read at 20 pixels. Avoid detailed illustrations, small lettering, and clusters of small shapes.
- It must differ from every other skill's icon, including near-duplicates such as `Terminal` and `SquareTerminal`. It must also differ from the badge icons on the cards: `ACCESS_ICONS` in `website/src/components/skill-card/skill-card.astro`, and `BookOpen` on implicit skills.
- Compare it with the cards next to it in the same group, so the tiles read as one set.

## Current icons

| Skill               | Icon                 | Why                                                                                                                            |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `jg-brainstorm`     | `Lightbulb`          | Ideas before a plan.                                                                                                           |
| `jg-plan`           | `Map`                | The route from an idea to a change.                                                                                            |
| `jg-challenge-plan` | `ShieldQuestionMark` | Questions a plan before approval.                                                                                              |
| `jg-breakdown`      | `ListOrdered`        | A plan split into numbered milestones.                                                                                         |
| `jg-execute`        | `Hammer`             | Builds the work.                                                                                                               |
| `jg-debug`          | `Bug`                | Finds and fixes a bug.                                                                                                         |
| `jg-pause`          | `CirclePause`        | Stops at a safe point.                                                                                                         |
| `jg-command`        | `Terminal`           | Shell commands.                                                                                                                |
| `jg-review`         | `SearchCheck`        | Inspects a change and gives a verdict.                                                                                         |
| `jg-push`           | `Upload`             | Publishes commits, and differs from its `GitCommitHorizontal` badge.                                                           |
| `jg-feedback`       | `Scale`              | Weighs feedback.                                                                                                               |
| `jg-session`        | `MessagesSquare`     | Reads past sessions.                                                                                                           |
| `jg-frontend`       | Tailwind CSS mark    | Written for Tailwind CSS.                                                                                                      |
| `jg-react`          | React mark           | Written for React.                                                                                                             |
| `jg-pwa`            | `MonitorSmartphone`  | Web apps installed on desktops and phones, across several browsers.                                                            |
| `jg-seo`            | `Globe`              | Public websites as search engines and social networks see them.                                                                |
| `jg-svg`            | `VectorSquare`       | Vector graphics, drawn as a shape with its anchor points. The SVG mark is CC-BY-SA-4.0.                                        |
| `jg-nestjs`         | NestJS mark          | Written for NestJS.                                                                                                            |
| `jg-postgres`       | `Database`           | PostgreSQL's elephant blurs at 20 pixels.                                                                                      |
| `jg-redis`          | Redis mark           | Written for Redis.                                                                                                             |
| `jg-node`           | Node.js mark         | Written for Node.js.                                                                                                           |
| `jg-packages` | `Puzzle` | Reusable capabilities that fit into a project; distinct from package authoring. |
| `jg-npm-package`    | `Package`            | Published packages. The npm mark is lettering that blurs at 20 pixels.                                                         |
| `jg-monorepo`       | `FolderTree`         | Workspace packages under one repository, across Turborepo and pnpm.                                                            |
| `jg-bash`           | `FileTerminal`       | Shell scripts. The GNU Bash mark blurs at 20 pixels, and `Terminal` is `jg-command`'s.                                         |
| `jg-docker`         | `Ship`               | Ships containers. The Docker mark is too detailed for 20 pixels, and `Container` is too close to `jg-npm-package`'s `Package`. |
| `jg-ci`             | `Workflow`           | Pipelines. The GitHub Actions mark blurs at 20 pixels.                                                                         |
| `jg-zod`            | Zod mark             | Written for Zod.                                                                                                               |
| `jg-testing`        | `FlaskConical`       | Covers Vitest and Playwright, so no single mark fits.                                                                          |

## Finding icons

- **Lucide.** Search [lucide.dev](https://lucide.dev/icons/) by idea, then confirm the icon exists in the installed version as `website/node_modules/@lucide/astro/src/icons/<name>.ts`. The icon's key is that file name, which also names its `lucide-<name>` class.
- **Simple Icons.** Find the mark's slug on [simpleicons.org](https://simpleicons.org/). Take its path data from `https://cdn.jsdelivr.net/npm/simple-icons@<version>/icons/<slug>.svg`, and its source, guidelines, and license from that version's `data/simple-icons.json`. The key is the slug.

## Adding or changing an icon

1. Add a new key to `ISkillLucideIcon` or `ISkillBrandMark` in `website/src/utilities/skill-catalog/types.ts`.
2. Map a Lucide key to its component in `LUCIDE_ICONS` in `website/src/components/skill-icon/skill-icon.astro`, or add a mark's unchanged path data to `SKILL_BRAND_MARK_PATHS` in `website/src/components/skill-icon/constants.ts`.
3. Set the skill's `icon` in `website/src/site.config.ts`.
4. For a mark, add a row to [`asset-attribution.md`](asset-attribution.md), and carry its copyright and license notice when its license requires one.
5. Update the skill's row in the table above.
6. Remove a key, its component or path data, and its attribution row once no skill uses it. `npm run typecheck` fails while the catalog's keys and the maps disagree.

## Checking the result

Run `npm run dev` in `website/` and look at the skill's card on the home page and its own page, at 320 and 1280 pixels wide, in light and dark themes, zoomed in, next to the other cards in its group. Then run `npm run check`.
