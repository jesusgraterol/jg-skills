# Asset attribution

`/docs` is reserved for essential, durable project concepts and processes. This page records the provenance and usage boundaries of the brand marks the website uses.

## jg/ mark

The lowercase `jg/` mark comes from [`jg-personal-astro-ui`](https://jg-packages.jesusgraterol.dev/packages/jg-personal-astro-ui/), which documents its source and license. The header logo and the standards section draw it with the package's `JgMark` component. `npm run assets:generate` writes `website/public/favicon.svg` from the package's `jg-favicon.svg`, the mark's slash alone, because the three letters can't be read at 16 pixels, and draws the package's `jg-mark.svg` into the open-graph image. Never keep a copy of the mark here: change it in the package, then regenerate.

## Agentic Coding mark

`website/src/components/agentic-coding-mark/agentic-coding-mark.astro` is an unchanged copy of the code mark that the sibling Agentic Coding website draws in its `src/components/brand-mark/brand-mark.astro`, using the same theme tokens. The Agentic Coding section shows it only beside the `AGENTS.md` label. Keep its geometry unchanged.

## Claude Code mark

`website/public/coding-agents/claude-code.svg` is an unchanged copy of the Claude Code mark ([Claude](https://claude.ai/)) from the sibling Agentic Coding website. The hero's example conversation shows it only as the decorative avatar beside the "Claude Code" label. Its presence does not imply endorsement, partnership, or sponsorship. Keep its geometry unchanged and preserve its intrinsic dimensions.

## GitHub mark

The credits section draws GitHub's mark inline, as `mark-github-16` from [Primer Octicons](https://github.com/primer/octicons). Octicons' MIT license covers its code, not GitHub's logos, so the mark is used under the [GitHub logo guidelines](https://github.com/logos). It appears only on the tile beside each link to a GitHub repository. Keep its geometry unchanged.

## Technology marks

The skill cards and skill pages show the mark of the technology some implicit skills are written for. The path data in `website/src/components/skill-icon/constants.ts` is copied unchanged from [Simple Icons](https://simpleicons.org/) 16.35.0, released under CC0-1.0, and drawn in one theme color on the site's icon tile. The marks remain trademarks of their owners and identify only the technology a skill covers. Their presence does not imply endorsement, partnership, or sponsorship. Keep their geometry unchanged. [`skill-icons.md`](skill-icons.md) explains which skills use a mark.

| Skill         | Mark         | Simple Icons slug | Owner terms                                                                          |
| ------------- | ------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `jg-frontend` | Tailwind CSS | `tailwindcss`     | [Brand guidelines](https://tailwindcss.com/brand)                                    |
| `jg-react`    | React        | `react`           | None listed                                                                          |
| `jg-nestjs`   | NestJS       | `nestjs`          | None listed                                                                          |
| `jg-redis`    | Redis        | `redis`           | [Brand guidelines](https://redis.io/brand-guidelines)                                |
| `jg-node`     | Node.js      | `nodedotjs`       | [Branding](https://nodejs.org/en/about/branding)                                     |
| `jg-zod`      | Zod          | `zod`             | [MIT License](https://github.com/colinhacks/zod), Copyright (c) 2025 Colin McDonnell |

The Zod mark is used under the MIT License, whose copyright notice is in its row above and whose permission notice follows:

```text
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
