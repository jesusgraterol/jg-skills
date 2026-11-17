# Development

## Source map

```text
.
├── .github/workflows/       # skill verification and independent GitHub Pages deployment
├── docs/                    # concise, durable project concepts and processes
├── skills/
│   └── jg-<name>/
│       ├── SKILL.md         # frontmatter and the skill's instructions
│       ├── agents/
│       │   └── openai.yaml  # Codex invocation policy
│       └── references/      # implicit skills only: topic detail that SKILL.md says when to read
├── website/
│   ├── public/              # favicons, Claude Code mark, and the generated open-graph image
│   ├── scripts/             # open-graph generation and build-artifact verification
│   ├── src/
│   │   ├── components/      # focused Astro presentation modules
│   │   ├── content/         # SKILL.md and reference file frontmatter schemas
│   │   ├── layouts/         # the package's page head, header, and footer, with the site's structured data
│   │   ├── pages/           # home, one page per skill, 404, llms.txt, and robots.txt
│   │   ├── styles/          # Tailwind entry point, importing the package's contract, theme, and prose styles
│   │   ├── utilities/       # skill catalog loading, the rendered-Markdown allowlist, SEO, and llms.txt
│   │   └── site.config.ts   # site metadata, commands, and the skill catalog
│   └── vitest/              # test-category discovery configuration
├── LICENSE
└── README.md
```

- Every skill directory name matches the `name` in its `SKILL.md` frontmatter.
- An implicit skill may keep topics that only some tasks need in `references/<topic>.md`, one level deep. Its `SKILL.md` names each file as a code-formatted path, with when to read it, and the website renders the files below the skill's instructions. Explicit skills keep their whole workflow in `SKILL.md`. Every `SKILL.md` and reference file stays within 25,600 bytes. After compaction, Claude Code re-attaches only the first 5,000 tokens of each invoked skill, so requirements come before defaults and long examples.
- Explicit skills are explicit-only in both agents: their frontmatter sets `disable-model-invocation: true`, and their `agents/openai.yaml` sets `policy.allow_implicit_invocation: false`. Implicit skills omit the flag and set `policy.allow_implicit_invocation: true`. The site catalog's `kind` must match, or the build fails.
- Every skill is self-contained and never links to sections of a specific `AGENTS.md`. Explicit skills share the rules in their `## Invocation` section. Implicit skills share their `## Application` section, which sets how their rules rank against the repository's coding instructions and conventions. Skills refer to each other by bare name, such as `jg-breakdown`, never with a `/` or `$` prefix. A mention of another skill is only a pointer. `jg-execute auto` reads its neighboring review, push and delivery workflows. `jg-debug-session` may follow the installed public execution entry for a demonstrated contained repair explicitly authorized by the current developer; that handoff stays supervised and preserves project adapters and ownership checks.
- Creating, writing, checking, maintaining, renaming, and removing a skill follow [`docs/skill-guidelines.md`](../docs/skill-guidelines.md), which lists every place to update.
- Website links show where they lead: `ArrowDown` for a section on the same page, `ArrowRight` (or `ArrowLeft` going back) for another page on the site, and the package's new-tab marker, a screen-reader note plus an up-right arrow, for other sites, which open in a new tab without a referrer. A link card that covers a whole card shows the arrow in its corner. The package's external-link plugin gives skill Markdown's links to other sites the same marker.
- The website shares its design tokens, Ubuntu Sans typography, and components with Agentic Coding, jesusgraterol.dev, and jg-packages, through `jg-personal-astro-ui`. [`docs/asset-attribution.md`](../docs/asset-attribution.md) records where its brand marks come from.
- Local coding instructions (`AGENTS.md`, `CLAUDE.md`, `CANDIDATE.md`) and planning roots `coding-agent-planning/` and `/jg-plans/` are git-ignored and never published.
- `/docs` is reserved for concise, quickly scannable documentation of essential, durable project concepts and processes. API and HTTP endpoint documentation, if the project ever needs it, belongs outside `/docs`.

## Website

The site leads with an illustrative supervised session, a worked search empty-state workflow, and the flow of acceptance criteria from jg-plan through jg-breakdown to jg-execute's check, before the skill catalog. The example shows invocations, artifacts, authorization and the implicit standards that load for the touched files; its outputs are illustrations, not live sessions. It explains the separate project-local planning runtime and offers supervised/auto mode exploration through whole-plan review and verified delivery. The site in `website/` is a static Astro and Tailwind CSS project built on [`jg-personal-astro-ui`](https://www.npmjs.com/package/jg-personal-astro-ui), the UI package Jesus Graterol's sites share: its theme, page head, header, footer, cards, buttons, badges, icon tiles, segmented control, conversations, workflow steps, documentation shell, outline, and previous/next navigation, and the code windows and new-tab markers its Markdown plugins add to every skill. It reads every `skills/*/SKILL.md` and `skills/*/references/*.md` at build time, so the published names, descriptions, instructions, and reference files always match what gets installed.

The layout protects main content from Cloudflare email obfuscation so package pins and code examples remain literal, including without JavaScript.

Requirements: Node.js `24.15` or newer within Node 24, and npm `11.12` or newer within npm 11. Run these from `website/`:

```bash
npm ci
npx playwright install chromium
npm run dev
```

| Command                   | Purpose                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Start the Astro development server. If an edit under `skills/` does not appear, restart it.         |
| `npm run build`           | Generate the site in `dist/` and verify every skill page, metadata, link, and `llms.txt`.           |
| `npm run preview`         | Serve the current production build locally.                                                         |
| `npm run check`           | Run unit tests, typechecking, linting, formatting, the build, integration tests, and browser tests. |
| `npm run skills:check`    | Validate installable skill metadata, instructions and references without building the website.      |
| `npm test`                | Run the unit, integration, and end-to-end test categories.                                          |
| `npm run format`          | Format the website files.                                                                           |
| `npm run assets:generate` | Regenerate the committed open-graph image from its HTML template.                                   |

The build fails when the site catalog in `website/src/site.config.ts` and the skill folders disagree, when a skill name differs from its directory, when a skill's frontmatter flag or Codex policy doesn't match its kind in the catalog, when a skill's search title or description would be cut off in search results, when a skill's shared `## Invocation` or `## Application` section drifts from the other skills of its kind, when a `## Task scope` or `## Reading a session` copy differs from the other skills that carry it, when the eight planning protocol copies are missing, duplicated, extra, or different, when their supported runtime/setup/development pins disagree, when an implicit skill has no version line, when a skill or reference file links to a section of a document or names another skill with a `/` or `$` prefix, when a skill names a reference file that doesn't exist or has one it never names, when a reference path isn't a kebab-case Markdown file directly in `references/` or that folder holds a nested or non-Markdown file, when a skill or reference file renders an element Markdown doesn't produce, a comment, an event handler, or a URL whose scheme isn't `http`, `https`, or `mailto`, when an explicit skill has reference files, when a reference names another reference, when a `SKILL.md` or reference file is larger than 25,600 bytes, when a built page links to a missing fragment, repeats an element ID, or holds an event handler or a URL with any other scheme, when `robots.txt` doesn't name the sitemap index, or when the 404 page names a canonical URL. The type check fails when a skill's icon is missing or doesn't match its kind. When you add, change, rename, or remove a skill, follow [`docs/skill-guidelines.md`](../docs/skill-guidelines.md).

### Deployment

`.github/workflows/check-skills.yml` verifies actual skill sources and installation on pull requests and main pushes, without rendering the website or installing a browser. `.github/workflows/pages.yml` independently verifies and deploys the website on main pushes or explicit dispatches. Website failure does not block skill distribution. The site expects to be served at the root of `https://jg-skills.jesusgraterol.dev`, so before the first deployment:

1. Set the repository's GitHub Pages source to GitHub Actions.
2. Add the custom domain `jg-skills.jesusgraterol.dev`.
3. Create a DNS `CNAME` record pointing `jg-skills.jesusgraterol.dev` to `jesusgraterol.github.io`.

Until then, the deploy job fails, or the site is served under a path where its root-relative links and assets break.

## Reviewed package versions

[configs/reviewed-versions.json](../configs/reviewed-versions.json) owns the reviewed package pins. From `website/`, run `npm run reviewed-versions:generate` after changing those reviewed facts; `npm run reviewed-versions:check` verifies the committed skill fragment without writing. The generator and its tests live in `website/scripts/reviewed-versions/`. The installed jg-packages skill remains self-contained.
