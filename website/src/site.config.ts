import type { ISkillCatalogEntry } from './utilities/skill-catalog/index.ts';
import { PLANNING_RUNTIME_VERSION } from './utilities/skill-catalog/constants.ts';

// a plan path in the layout jg-plan writes, shared by the examples that name a plan
const EXAMPLE_PLAN_PATH = 'jg-plans/1787592334_sign-in-flow/plan.md';

/*
 * Site-owned presentation data for every skill under ../skills. Names, descriptions,
 * argument hints, and instructions come from each SKILL.md; the build fails when this
 * catalog and the skill folders disagree.
 */
export const SKILL_CATALOG = {
  'jg-brainstorm': {
    access: 'read-only',
    examples: [
      {
        invocation: 'jg-brainstorm Should we rate-limit the public API per account?',
        outcome:
          'Weighs the options against your codebase, recommends a direction, and lists what is still open.',
      },
    ],
    icon: 'lightbulb',
    kind: 'explicit',
    order: 1,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that weighs options against your codebase and recommends a direction before you plan.',
    searchTitle: 'jg-brainstorm: Brainstorm ideas with Claude Code and Codex',
    stage: 'plan',
    whenToUse:
      'Use it when you have an idea or a question and want to settle the approach before planning or building it.',
  },
  'jg-plan': {
    access: 'planning-files',
    examples: [
      {
        invocation: 'jg-plan',
        outcome:
          'Asks about any decision that is yours to make, turns the change you discussed into an implementation-ready plan under jg-plans/, and stops for your approval.',
      },
    ],
    icon: 'map',
    kind: 'explicit',
    order: 2,
    searchDescription:
      'An explicit-only agent skill that turns the change you discussed with Claude Code or Codex into an implementation-ready plan you approve.',
    searchTitle: 'jg-plan: Implementation plans for Claude Code and Codex',
    stage: 'plan',
    whenToUse:
      'Use it once a change is agreed in conversation and you want a reviewable plan before any code changes.',
  },
  'jg-challenge-plan': {
    access: 'read-only',
    examples: [
      {
        invocation: 'jg-challenge-plan',
        label: 'Current plan',
        outcome:
          'Returns a verdict, the corrections the plan needs, and numbered decisions in under 1,000 words.',
      },
      {
        invocation: `jg-challenge-plan ${EXAMPLE_PLAN_PATH}`,
        label: 'Named plan',
        outcome:
          'Challenges the plan at that path instead of the one in this conversation, with the same verdict, corrections, and decisions.',
      },
    ],
    icon: 'shield-question-mark',
    kind: 'explicit',
    order: 3,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that challenges a plan before approval and surfaces material risks, gaps, and decisions.',
    searchTitle: 'jg-challenge-plan: Challenge a plan before approval',
    stage: 'plan',
    whenToUse:
      'Use it on a plan you are about to approve, especially one that touches data, public contracts, or publishing.',
  },
  'jg-challenge-session': {
    access: 'read-only',
    examples: [
      {
        invocation: 'jg-challenge-session org-api-keys',
        outcome:
          'Reads the session that planned organization API keys, challenges its plan and milestones, and answers No material concerns, Revision required before proceeding, or Developer decision required before proceeding.',
      },
    ],
    icon: 'message-circle-question-mark',
    kind: 'explicit',
    order: 4,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that reads another session and challenges its direction, plan, and milestones before you build.',
    searchTitle: "jg-challenge-session: Challenge another agent's plan",
    stage: 'plan',
    whenToUse:
      'Use it from a fresh session or a different agent when a plan, or the direction before it, should face an independent challenge.',
  },
  'jg-breakdown': {
    access: 'planning-files',
    examples: [
      {
        invocation: 'jg-breakdown',
        label: 'Current plan',
        outcome:
          'Writes milestones.md when the plan has real boundaries, or tells you to build it as one scope.',
      },
      {
        invocation: `jg-breakdown ${EXAMPLE_PLAN_PATH}`,
        label: 'Named plan',
        outcome:
          'Splits the plan at that path instead of the one in this conversation, writing milestones.md beside it.',
      },
    ],
    icon: 'list-ordered',
    kind: 'explicit',
    order: 5,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that splits a plan into ordered milestones you can build and review one at a time.',
    searchTitle: 'jg-breakdown: Split plans into reviewable milestones',
    stage: 'plan',
    whenToUse: 'Use it when a plan is too large to build and review as one change.',
  },
  'jg-execute': {
    access: 'changes-code-and-pushes',
    examples: [
      {
        invocation: 'jg-execute',
        label: 'Supervised',
        outcome:
          'Builds the next unfinished milestone of the current plan, runs its checks, and stops so you can review and push it.',
      },
      {
        invocation: 'jg-execute auto',
        label: 'Autonomous',
        outcome:
          'Builds each remaining milestone, reviews it until clean, and pushes it before starting the next, then reviews the whole plan once the last one is pushed.',
      },
      {
        invocation: 'jg-execute',
        label: 'Agreed task',
        outcome:
          'Builds a small change agreed in this conversation without a plan file, restating its scope first, then runs its checks and stops so you can review and push it.',
      },
      {
        invocation: `jg-execute ${EXAMPLE_PLAN_PATH}`,
        label: 'Named plan',
        outcome:
          'Builds the next unfinished milestone of the plan at that path instead of the one in this conversation.',
      },
      {
        invocation: 'jg-execute milestone 2',
        label: 'One milestone',
        outcome:
          'Builds only milestone 2, runs its checks, and stops so you can review and push it.',
      },
      {
        invocation: `jg-execute auto ${EXAMPLE_PLAN_PATH} milestone 3`,
        label: 'All options',
        outcome:
          'Builds milestone 3 of the plan at that path, reviews it until clean, pushes it, and stops.',
      },
    ],
    icon: 'hammer',
    kind: 'explicit',
    order: 6,
    searchDescription:
      "An explicit-only agent skill for Claude Code and Codex that builds an agreed task or a plan's milestones, supervised or autonomously with review and push.",
    searchTitle: 'jg-execute: Build tasks and plans supervised or autonomously',
    stage: 'build',
    whenToUse:
      'Use it once a plan is approved, or right after the discussion for a small, settled change. On its own it builds the next milestone or the change and stops; with auto it also reviews and pushes each one.',
  },
  'jg-debug': {
    access: 'changes-code',
    examples: [
      {
        invocation: 'jg-debug Checkout totals are off by one cent for some carts.',
        outcome:
          'Reproduces the bug, narrows it to one cause, and fixes it with a regression test that failed first.',
      },
    ],
    icon: 'bug',
    kind: 'explicit',
    order: 7,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that reproduces a bug, finds its cause, and fixes it with a test that fails first.',
    searchTitle: "jg-debug: Find a bug's cause before fixing it",
    stage: 'build',
    whenToUse: "Use it when something is broken and the cause isn't obvious yet.",
  },
  'jg-pause': {
    access: 'read-only',
    examples: [
      {
        invocation: 'jg-pause',
        outcome:
          'Stops at the next safe point, lists what is done and what is half-finished, and waits until you say continue.',
      },
    ],
    icon: 'circle-pause',
    kind: 'explicit',
    order: 8,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that stops the agent at the nearest safe point, reports where things stand, and waits.',
    searchTitle: 'jg-pause: Pause a coding agent at a safe point',
    stage: 'build',
    whenToUse:
      'Use it when you need to step away or check something mid-task without leaving half-changed files unexplained.',
  },
  'jg-command': {
    access: 'runs-picked-command',
    examples: [
      {
        invocation: 'jg-command find every file over 100 MB here, skipping .git',
        outcome:
          'Detects your system and shell, offers a few checked commands with what each does and how risky it is, and runs the one you pick.',
      },
    ],
    icon: 'terminal',
    kind: 'explicit',
    order: 9,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that turns a plain-language task into checked shell commands you pick from and run.',
    searchTitle: 'jg-command: Turn a task into shell commands you pick',
    stage: 'build',
    whenToUse: 'Use it when you know what you want done in the terminal but not the exact command.',
  },
  'jg-review': {
    access: 'read-only',
    examples: [
      {
        invocation: 'jg-review',
        label: 'Task changes',
        outcome:
          "Reviews the task's changes, and how they follow the plan when you are building one, then answers Ready to commit, Not ready, or Review incomplete.",
      },
      {
        invocation: 'jg-review',
        label: 'Finished plan',
        outcome:
          "After a plan's last milestone is pushed, reviews everything committed for the plan against the whole plan and answers Plan implemented as agreed, Not ready, or Review incomplete.",
      },
      {
        invocation: 'jg-review main',
        label: 'Branch',
        outcome:
          'Reviews everything the current branch would merge into main and answers Ready to merge into main, Not ready, or Review incomplete.',
      },
    ],
    icon: 'search-check',
    kind: 'explicit',
    order: 10,
    searchDescription:
      "An explicit-only agent skill for Claude Code and Codex that reviews a task's changes, a finished plan, or a branch, and issues a readiness verdict.",
    searchTitle: 'jg-review: Code review for Claude Code and Codex',
    stage: 'ship',
    whenToUse:
      "Use it before committing a task's changes, before merging a branch into its target, or after a plan's last milestone is pushed.",
  },
  'jg-push': {
    access: 'commits-and-pushes',
    examples: [
      {
        invocation: 'jg-push',
        outcome:
          "Commits this task's files, or every change when there is no task, signing the commit when signing is set up, and pushes the current branch.",
      },
    ],
    icon: 'upload',
    kind: 'explicit',
    order: 11,
    searchDescription:
      "An explicit-only agent skill for Claude Code and Codex that commits the current task's files, or every change without a task, and pushes the branch.",
    searchTitle: 'jg-push: Safe commits and pushes for coding agents',
    stage: 'ship',
    whenToUse:
      "Use it when a reviewed change is ready to publish. In a checkout shared with other agents, run it in the session that made the change, so it commits only that task's files.",
  },
  'jg-review-session': {
    access: 'read-only',
    examples: [
      {
        invocation: 'jg-review-session org-api-keys',
        outcome:
          "Checks the commits, pull requests, and claims of the session that built organization API keys against its plan and milestones, and answers Everything checks out, Issues found, or Couldn't confirm everything.",
      },
    ],
    icon: 'clipboard-check',
    kind: 'explicit',
    order: 12,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that checks what another session built against its plan, milestones, and your decisions.',
    searchTitle: "jg-review-session: Review another agent's delivered work",
    stage: 'ship',
    whenToUse:
      "Use it from a fresh session or a different agent once a plan's milestones are built, to confirm the work matches what you agreed.",
  },
  'jg-feedback': {
    access: 'read-only',
    examples: [
      {
        invocation: 'jg-feedback A reviewer says the retry loop can charge a customer twice.',
        outcome:
          'Checks each claim against the code and recommends what to adopt, reject, or adjust.',
      },
    ],
    icon: 'scale',
    kind: 'explicit',
    order: 13,
    searchDescription:
      'An explicit-only agent skill for Claude Code and Codex that checks feedback against the evidence and recommends what to adopt, reject, or adjust.',
    searchTitle: 'jg-feedback: Assess review feedback with evidence',
    stage: 'context',
    whenToUse:
      'Use it when a reviewer, another agent, or a teammate sends claims you want checked before acting on them.',
  },
  'jg-session': {
    access: 'read-only',
    examples: [
      {
        invocation: 'jg-session rate-limiting What did that session decide about the limit store?',
        outcome:
          'Finds the named Codex or Claude Code session and answers from its latest decisions.',
      },
    ],
    icon: 'messages-square',
    kind: 'explicit',
    order: 14,
    searchDescription:
      'An explicit-only agent skill that finds a named Claude Code or Codex session and answers questions from its latest decisions and state.',
    searchTitle: 'jg-session: Read past Claude Code and Codex sessions',
    stage: 'context',
    whenToUse: 'Use it when you need what another session decided without rereading it yourself.',
  },
  'jg-frontend': {
    examples: [
      {
        outcome:
          "Reuses the UI package's components, works from 320 pixels up in both themes, and keeps the form usable by keyboard and screen reader.",
        request: 'Build a settings page with a profile form and a theme switcher.',
      },
    ],
    icon: 'tailwindcss',
    kind: 'implicit',
    order: 15,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps UI work accessible, responsive, themed, and on your design system whenever a task touches it.',
    searchTitle: 'jg-frontend: Frontend standards for coding agents',
    stage: 'implicit',
    summary:
      'Accessibility, responsive layout, themes, forms, motion, and design-system reuse for Tailwind CSS.',
    whenToUse:
      'It loads on its own when a task touches UI, styling, forms, mobile behavior, dialogs or feedback, single-page-app delivery, or frontend tests. Call it by name to load it before such a task.',
  },
  'jg-react': {
    examples: [
      {
        outcome:
          'Loads the data through the route or query layer, keeps renders cheap, and tests the table the way a user would use it.',
        request: 'Add a filterable orders table to the dashboard.',
      },
    ],
    icon: 'react',
    kind: 'implicit',
    order: 16,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that applies React 19 APIs, render-performance rules, and testing standards whenever a task touches React.',
    searchTitle: 'jg-react: React standards for coding agents',
    stage: 'implicit',
    summary:
      'Components, render performance, React 19 APIs, routing, hydration, client data, and tests for React.',
    whenToUse:
      'It loads on its own when a task touches React components, hooks, state, routing, server rendering, client data caching, or tests. Call it by name to load it before such a task.',
  },
  'jg-pwa': {
    examples: [
      {
        outcome:
          'Adds a complete manifest with standard and maskable icons, theme color, and an iOS touch icon, and proposes a service worker only if offline use is in scope.',
        request: 'Make the new dashboard installable on phones and desktops.',
      },
    ],
    icon: 'monitor-smartphone',
    kind: 'implicit',
    order: 17,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex for web apps you choose to make installable, keeping their service workers, caching, and push safe.',
    searchTitle: 'jg-pwa: Progressive web app standards for coding agents',
    stage: 'implicit',
    summary:
      'Manifests, install prompts, service worker updates, caching, and push for progressive web apps.',
    whenToUse:
      'It loads on its own when a task touches a web app manifest, install prompts, a service worker, offline caching, or web push. Call it by name to load it before such a task.',
  },
  'jg-seo': {
    examples: [
      {
        outcome:
          'Gives every post one canonical URL, real lastmod dates, structured data, and a social preview, and checks the sitemap in the build.',
        request:
          'Add a blog section to the marketing site with sitemap entries and article previews.',
      },
    ],
    icon: 'globe',
    kind: 'implicit',
    order: 18,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps metadata, canonical URLs, sitemaps, robots rules, and structured data right on public sites.',
    searchTitle: 'jg-seo: SEO standards for public websites',
    stage: 'implicit',
    summary:
      'Metadata, canonicals, sitemaps, robots, structured data, and social previews for public sites.',
    whenToUse:
      "It loads on its own when a task touches a public site's metadata, sitemap, robots rules, or structured data. Call it by name to load it before such a task.",
  },
  'jg-svg': {
    examples: [
      {
        outcome:
          'Asks for the wordmark as outlines instead of shipping it as text, keeps the brand colors, and proposes an SVGO config that keeps the viewBox.',
        request: 'Clean up this Illustrator logo export and use it inline in the header.',
      },
    ],
    icon: 'vector-square',
    kind: 'implicit',
    order: 19,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps SVG icons, logos, and exported files consistent, correctly sized, and true to the brand.',
    searchTitle: 'jg-svg: SVG standards for coding agents',
    stage: 'implicit',
    summary:
      'Icon drawing, outlined logo text, file shape, brand colors, exports, and optimization for SVG.',
    whenToUse:
      'It loads on its own when a task writes or changes SVG files, inline SVG, or SVG exported from a design tool. Call it by name to load it before such a task.',
  },
  'jg-graphics': {
    examples: [
      {
        outcome:
          'Builds an HTML template with the logo inline and the font loaded from a file, renders it at the exact size with Playwright, and keeps the template and script next to the PNG.',
        request: 'Make a cover image for the launch post with its title and our logo.',
      },
    ],
    icon: 'image',
    kind: 'implicit',
    order: 20,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that renders social posts, blog covers, and video graphics with consistent fonts and exact sizes.',
    searchTitle: 'jg-graphics: Image generation standards for coding agents',
    stage: 'implicit',
    summary:
      'Templates, fonts, exact sizes, formats, and repeatable renders for images made with Playwright.',
    whenToUse:
      'It loads on its own when a task generates images such as social posts, blog covers, or video graphics. Call it by name to load it before such a task.',
  },
  'jg-nestjs': {
    examples: [
      {
        outcome:
          'Validates the ID with a schema, keeps the controller thin, logs through the Nest logger, and tests the module through dependency injection.',
        request: 'Add an endpoint that archives a project by its ID.',
      },
    ],
    icon: 'nestjs',
    kind: 'implicit',
    order: 21,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that applies NestJS module, validation, logging, lifecycle, and test standards whenever a task touches Nest.',
    searchTitle: 'jg-nestjs: NestJS standards for coding agents',
    stage: 'implicit',
    summary: 'Modules, schema validation, configuration, logging, lifecycle, and tests for NestJS.',
    whenToUse:
      'It loads on its own when a task touches NestJS modules, controllers, providers, or tests. Call it by name to load it before such a task.',
  },
  'jg-postgres': {
    examples: [
      {
        outcome:
          'Names the new index by the convention, creates it concurrently through the documented migration workflow, and reports the migration it added.',
        request: 'Add a migration that indexes orders by customer and creation date.',
      },
    ],
    icon: 'database',
    kind: 'implicit',
    order: 22,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that applies PostgreSQL naming, constraint, query, and migration standards whenever a task touches SQL.',
    searchTitle: 'jg-postgres: PostgreSQL standards for coding agents',
    stage: 'implicit',
    summary:
      'Naming, constraints, queries, transactions, pools, timeouts, and migrations for PostgreSQL.',
    whenToUse:
      'It loads on its own when a task touches PostgreSQL schemas, queries, connection pools, or migrations. Call it by name to load it before such a task.',
  },
  'jg-redis': {
    examples: [
      {
        outcome:
          'Names the key by the convention, sets its expiry in the same write, and keeps the database as the source of truth.',
        request: "Cache each user's dashboard summary in Redis for five minutes.",
      },
    ],
    icon: 'redis',
    kind: 'implicit',
    order: 23,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that applies Redis key, expiry, scanning, and locking standards whenever a task touches Redis.',
    searchTitle: 'jg-redis: Redis standards for coding agents',
    stage: 'implicit',
    summary: 'Key names, expiry, scanning, round trips, data structures, and locks for Redis.',
    whenToUse:
      'It loads on its own when a task touches code that uses Redis, such as its keys, caching, locks, or queues. Call it by name to load it before such a task.',
  },
  'jg-node': {
    examples: [
      {
        outcome:
          "Resolves every path from the script's own root, keeps each write inside the output folder, and runs the same way on Windows, macOS, and Linux.",
        request:
          'Write a script that copies the generated assets into dist and removes the old build.',
      },
    ],
    icon: 'nodedotjs',
    kind: 'implicit',
    order: 24,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps Node.js scripts, CLIs, and filesystem code portable and safe on Windows, macOS, and Linux.',
    searchTitle: 'jg-node: Portable Node.js scripts for coding agents',
    stage: 'implicit',
    summary:
      'Cross-platform paths, safe filesystem access, processes, and CLIs for Node.js scripts.',
    whenToUse:
      'It loads on its own when a task touches Node.js scripts, CLIs, build tooling, or filesystem code. Call it by name to load it before such a task.',
  },
  'jg-packages': {
    examples: [
      {
        outcome:
          'Checks the installed package and its local API documentation, reuses a suitable helper, and justifies any new dependency individually.',
        request: 'Add exact decimal calculations for order totals and fees.',
      },
    ],
    icon: 'puzzle',
    kind: 'implicit',
    order: 25,
    searchDescription:
      'An implicit skill for Claude Code and Codex that selects suitable JG Packages, verifies installed API documentation, and preserves project contracts.',
    searchTitle: 'jg-packages: Reuse JG Packages with coding agents',
    stage: 'implicit',
    summary:
      'Package selection, local API documentation, and consumer integration for JG Packages.',
    whenToUse:
      'It loads on its own for reusable helpers, deadlines and background tasks, hashing, one-time passwords, and secure random values, coded errors and user-facing error messages, API envelopes, HTTP wrappers, decimal math, environment variables, .env files, and secrets, PostgreSQL and Redis helpers, React query persistence, polling, boundaries, hooks, routing, and URL state, NestJS error handling, guards, uploads, and bootstrap, browser storage, clipboard, or download work, filesystem, private-file, lock, process, command-line, readiness, port, or shutdown-signal helpers, Git commands and reads, local Docker checks and containers, GitHub App tokens and webhooks, service workers, site metadata, llms.txt, and theme preferences, Playwright test helpers, or consumer use of JG Packages. Call it by name to load it before such a task.',
  },
  'jg-npm-package': {
    examples: [
      {
        outcome:
          'Adds an exports subpath with types first, tests the packed tarball in a temporary project, and releases a minor with trusted publishing.',
        request: 'Add a browser entry point to the date utilities package and release it.',
      },
    ],
    icon: 'package',
    kind: 'implicit',
    order: 26,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps package exports, dependency ranges, tarball tests, and npm releases correct and safe.',
    searchTitle: 'jg-npm-package: npm package standards for coding agents',
    stage: 'implicit',
    summary:
      'Exports, dependency ranges, tarball tests, versioning, and trusted publishing for npm packages.',
    whenToUse:
      "It loads on its own when a task touches a published package's manifest, build output, tests, or release. Call it by name to load it before such a task.",
  },
  'jg-monorepo': {
    examples: [
      {
        outcome:
          'Declares it as a workspace dependency and a task input, so changing it re-runs the right tests without stale cache hits.',
        request: 'Add a shared Vitest config package and use it in every app.',
      },
    ],
    icon: 'folder-tree',
    kind: 'implicit',
    order: 27,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps Turborepo task graphs, cache keys, and pnpm workspace dependencies correct.',
    searchTitle: 'jg-monorepo: Turborepo and pnpm workspace standards',
    stage: 'implicit',
    summary:
      'Task graphs, cache inputs, filters, and workspace dependencies for Turborepo and pnpm.',
    whenToUse:
      'It loads on its own when a task touches turbo.json, pnpm-workspace.yaml, or workspace packages. Call it by name to load it before such a task.',
  },
  'jg-bash': {
    examples: [
      {
        outcome:
          "Writes it in POSIX sh so it runs without bash, quotes every variable, fails with clear messages, and execs the app so it gets the container's stop signals.",
        request:
          'Write an entrypoint script for the Docker image that waits for Postgres, then starts the app.',
      },
    ],
    icon: 'file-terminal',
    kind: 'implicit',
    order: 28,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps bash and sh scripts on Linux safe, consistent, and checked whenever a task touches shell.',
    searchTitle: 'jg-bash: Bash script standards for coding agents',
    stage: 'implicit',
    summary:
      'Shell choice, script structure, quoting, safety, and verification for bash and sh on Linux.',
    whenToUse:
      'It loads on its own when a task touches shell scripts, Dockerfile RUN steps, or CI run steps. Call it by name to load it before such a task.',
  },
  'jg-docker': {
    examples: [
      {
        outcome:
          'Pins the image, binds the port to localhost, adds a healthcheck the API waits on, and rotates its logs.',
        request: 'Add a Redis service for the API to the Compose file.',
      },
    ],
    icon: 'ship',
    kind: 'implicit',
    order: 29,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps Compose services private, healthy, and reproducible, and Dockerfiles small and safe.',
    searchTitle: 'jg-docker: Docker Compose and Dockerfile standards',
    stage: 'implicit',
    summary:
      'Compose services, healthchecks, secrets, ports, image tags, and Dockerfile structure for Docker.',
    whenToUse:
      'It loads on its own when a task touches Compose files, Dockerfiles, or commands that recreate or remove containers. Call it by name to load it before such a task.',
  },
  'jg-ci': {
    examples: [
      {
        outcome:
          "Runs the project's check command with read-only permissions, a timeout, cancelled superseded runs, and lockfile-keyed caching, adding no bots or extra jobs.",
        request: 'Add a GitHub Actions workflow that runs the tests on every pull request.',
      },
    ],
    icon: 'workflow',
    kind: 'implicit',
    order: 30,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps GitHub Actions CI minimal and secure, adding more only when you ask for it.',
    searchTitle: 'jg-ci: GitHub Actions standards for coding agents',
    stage: 'implicit',
    summary:
      'A single check workflow, permissions, timeouts, caching, and action pinning for GitHub Actions.',
    whenToUse:
      'It loads on its own when a task touches GitHub Actions workflows, including CI and deployment pipelines. Call it by name to load it before such a task.',
  },
  'jg-zod': {
    examples: [
      {
        outcome:
          'Uses a strict object schema with Zod 4 formats, derives the type from it, and returns field errors with z.flattenError.',
        request: 'Validate the signup request body and return field errors the form can show.',
      },
    ],
    icon: 'zod',
    kind: 'implicit',
    order: 31,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that applies Zod 4 schema, strictness, and error standards whenever a task validates data.',
    searchTitle: 'jg-zod: Zod 4 validation standards for coding agents',
    stage: 'implicit',
    summary: 'Strictness, metadata, error handling, formats, and composition for Zod 4 schemas.',
    whenToUse:
      'It loads on its own when a task validates data with Zod schemas. Call it by name to load it before such a task.',
  },
  'jg-testing': {
    examples: [
      {
        outcome:
          'Finds elements by role, waits on assertions instead of sleeps, fixes the clock, and repeats new tests when your instructions require it.',
        request: 'Add an end-to-end test for the checkout flow.',
      },
    ],
    icon: 'flask-conical',
    kind: 'implicit',
    order: 32,
    searchDescription:
      'An implicit agent skill for Claude Code and Codex that keeps Vitest and Playwright tests deterministic and fast whenever a task touches tests.',
    searchTitle: 'jg-testing: Vitest and Playwright standards for agents',
    stage: 'implicit',
    summary: 'Deterministic waits, timeouts, retries, and repeat runs for Vitest and Playwright.',
    whenToUse:
      'It loads on its own when a task touches Vitest or Playwright tests. Call it by name to load it before such a task.',
  },
} as const satisfies Record<string, ISkillCatalogEntry>;

// skill names in catalog order, used to build the remove command
const SKILL_NAMES = Object.keys(SKILL_CATALOG);

// canonical metadata, navigation, and commands for every generated page
export const SITE_CONFIG = {
  agentHqUrl: 'https://jg-agent-hq.jesusgraterol.dev',
  plansUrl: 'https://jg-plans.jesusgraterol.dev',
  // Agentic Coding's prompt for refining an existing AGENTS.md
  agenticCodingRefineUrl: 'https://agenticcoding.jesusgraterol.dev/refine/',
  // Agentic Coding's neutral AGENTS.md foundation for repositories that have none
  agenticCodingStartUrl: 'https://agenticcoding.jesusgraterol.dev/start/',
  agenticCodingUrl: 'https://agenticcoding.jesusgraterol.dev/',
  author: {
    name: 'Jesus Graterol',
    // public profiles that identify the author to search engines
    sameAs: [
      'https://github.com/jesusgraterol',
      'https://www.linkedin.com/in/jesus-graterol',
      'https://x.com/jesus__graterol',
      'https://www.kaggle.com/jesusgraterol',
    ],
    twitterHandle: '@jesus__graterol',
    url: 'https://jesusgraterol.dev/',
  },
  // project-scoped commands, run from the repository root
  commands: {
    install: 'npx skills add jesusgraterol/jg-skills --skill "*" -y',
    runtimeInstall: `npm install --save-dev --save-exact jg-plans@${PLANNING_RUNTIME_VERSION}`,
    remove: `npx skills remove ${SKILL_NAMES.join(' ')}`,
    update: `npx skills update -p ${SKILL_NAMES.join(' ')}`,
  },
  defaultDescription:
    'Explicit planning, execution, review and publishing workflows for Claude Code and Codex, with relevant stack standards and project-local planning tools.',
  language: 'en',
  license: 'MIT',
  name: 'jg-skills',
  navigation: [
    { href: '/#skills', label: 'Skills' },
    { href: '/#workflow', label: 'How it works' },
    { href: '/#install', label: 'Install' },
  ],
  openGraph: {
    height: 630,
    image: '/og/jg-skills.png',
    imageAlt: 'jg-skills: explicit workflows and stack standards for coding agents',
    imageType: 'image/png',
    locale: 'en_US',
    width: 1200,
  },
  packagesSkillPath: '/skills/jg-packages/',
  packagesUrl: 'https://jg-packages.jesusgraterol.dev/',
  repositoryUrl: 'https://github.com/jesusgraterol/jg-skills',
  // the key used for the visitor's theme preference
  storageKeys: {
    theme: 'jg-skills-theme',
  },
  themeColors: {
    dark: '#1e2939',
    light: '#fefdfb',
  },
  url: 'https://jg-skills.jesusgraterol.dev',
} as const;
