# Skill guidelines

`/docs` is reserved for essential, durable project concepts and processes. This page explains how skills are created, written, checked, maintained, and retired, and lists every place to update when a skill changes. [`skill-icons.md`](skill-icons.md) covers icons.

## Kinds of skill

- **Explicit skills** are workflows the developer invokes by name, such as `jg-plan` or `jg-push`. They set `disable-model-invocation: true`, ship the explicit-only Codex policy, copy the shared `## Invocation` section word for word, and put the workflow under `## Workflow`. Each one states what it may change.
- **Implicit skills** hold the standards for one stack, library, or version, such as `jg-react` or `jg-zod`. Agents load them on their own when a task matches their triggers. They omit the flag, ship the implicit policy, copy the shared `## Application` section, and put their rules in topic sections.

## Where content belongs

- **The coding instructions** hold rules that apply to every task, or that decide whether work happens at all, such as testing expectations and security. Library-neutral policies stay there even when a skill holds the library's mechanics: validating untrusted input stays in the instructions, while the Zod details live in `jg-zod`.
- **An implicit skill** holds content tied to one stack, library, or version that only matters when a task touches it. Extend the skill for that stack before adding a new one.
- **An explicit skill** holds a repeatable workflow with its own inputs, outputs, and limits.
- **Each rule has one owner.** Point to it from elsewhere instead of repeating it.

## Writing a skill

- **Requirements and defaults.** Use "never", "always", or "must" only for requirements, and "prefer" for defaults that a stated reason can override. Keep techniques with a trade-off in a "when the numbers justify it" section. Don't add rules that get in a developer's way without a reason.
- **Changes that affect others.** Have the skill propose changes such as a bot, a CI job, or a dependency, instead of making them.
- **Opt-in machinery.** Never have a skill turn on a bot, a scheduled run, or a platform feature such as installability by default, or add CI jobs beyond what correctness in its own area requires, such as jg-npm-package testing on the `engines` floor. Give each project a minimal, robust foundation, and leave the rest to the developer as the project grows.
- **Versions.** An implicit skill states the versions it was written for in its version bullet, and marks items that need a minimum version, like (4.3+). Verify version-specific facts against primary sources, such as official documentation and release notes, and record the sources in the plan.
- **Future-proof wording.** Write each rule as the outcome it protects, in terms that outlast a release, then give the current API or syntax as the way to reach it, with its minimum-version marker. Use "never", "always", or "must" for outcomes and safety, and "prefer" for mechanics a later release may replace. A version bullet names the versions the skill was reviewed against and, for anything without an installed version, such as a hosted service or browser behavior, the review month.
- **Size and order.** Every `SKILL.md` and reference file stays within 20,480 bytes; the build fails above it. After compaction, Claude Code re-attaches only the first 5,000 tokens of each invoked skill, so put requirements before defaults and long examples.
- **Reference files.** An implicit skill may move a whole topic that only some tasks need into `references/<topic>.md`, such as migrations or forms. Name each file in `SKILL.md` as a code-formatted path, such as `references/migrations.md`, never as a Markdown link, together with the work it covers, so the agent reads it before that work. Keep references one level deep: a reference never names another reference. Prefer a short contents list at the top of a reference longer than 100 lines. Keep in `SKILL.md` every section whose outcome is required on every task in the skill's area, such as accessibility or responsive behavior. A reference may hold requirements that apply only to its topic, and its pointer line restates the one that matters most, as `jg-frontend` does for reduced motion.
- **Explicit skills at the budget.** Explicit skills keep their whole workflow in `SKILL.md`, because `jg-execute auto` reads `jg-review` and `jg-push` by path. An explicit skill that reaches the budget is trimmed before anything is added; `jg-review` has about 230 bytes to spare.
- **Self-contained.** Never link to sections of the coding instructions or another document, and never name project-specific symbols. A skill may name its own reference files. Refer to other skills by bare name, such as `jg-breakdown`, never with a `/` or `$` prefix. A mention is only a pointer: the one runtime dependency is `jg-execute auto`, which reads the `jg-review` and `jg-push` `SKILL.md` files from the neighboring folders.
- **Shared sections.** Copy `## Invocation` or `## Application` word for word. `jg-review` and `jg-push` also share `## Task scope` word for word, because `jg-push` reuses a review verdict only when both compute the scope and its fingerprint alike. An implicit skill may change only two lines of its Application section: its area sentence, and its version bullet, which may describe a target instead of an installed version, as `jg-bash` does. A change to a shared section changes every skill of that kind in the same commit. The shared `## Application` section also keeps the agent current: it checks the version-specific items a task relies on when the installed version is newer or a review month is more than six months old, follows official guidance where the skill says nothing, confirms a newer approach in official documentation before using it, and keeps the skill's approach when that documentation can't be reached.
- **Wording.** Keep it plain and specific. Examples are illustrative and never override the installed version's API.

## Adding a skill

- **Folder.** Create `skills/jg-<name>/` with `SKILL.md`, whose `name` matches the directory, and `agents/openai.yaml`. An implicit skill may add `references/<topic>.md` files.
- **Description.** An explicit skill's description is its card text, below. An implicit skill's description is one summary sentence, then "Use when writing, reviewing, or planning …" with distinct triggers. Avoid triggers that match nearly every task, such as running tests.
- **Catalog entry.** Add one in `website/src/site.config.ts`.
  - An explicit skill needs `access`, `examples`, `stage`, and `whenToUse`. An implicit skill needs an example request with its outcome, a `summary`, and `whenToUse`.
  - Keep `order` contiguous: insert the skill where it belongs and renumber the entries after it.
  - Give it a search title of at most 60 characters that starts with the skill name, and a search description of 70 to 160 characters.
  - Give it an `icon` following [`skill-icons.md`](skill-icons.md), and add its row to that page's table.
- **Card text.** Each card shows one sentence: an explicit skill's `SKILL.md` description, or an implicit skill's `summary`, which also opens its page. Keep it to about 75 to 100 characters, and never repeat the card's badge, such as "Read-only". An explicit description starts with a verb and says what the skill does and produces. An implicit summary lists what the skill covers and ends with its technology. A new access label must fit on one line under the skill name, which the card tests check at 320 and 640 pixels wide.
- **README.** Add a row to the explicit or implicit skills table, and add the name to the update and remove commands in the catalog's key order.
- **Social image.** After adding or removing an explicit skill, run `npm run assets:generate` in `website/`, which lists every explicit skill in the image, and commit the regenerated `public/og/jg-skills.png`.
- **Implicit skills only.** Add a line to the `## Implicit skills` index in the local, git-ignored `CANDIDATE.md` under `coding-agent-planning/` when it exists, naming the same triggers as the skill's description. When a protected instructions file, such as `AGENTS.md` or `CLAUDE.md`, carries the same index, don't edit it; report the line it needs instead.

## Checking a change

- **Always.** Run `npm run check` in `website/`. The build fails when:
  - the catalog and the skill folders disagree, or a skill name differs from its directory
  - a skill's frontmatter flag or Codex policy doesn't match its kind in the catalog
  - a search title or description falls outside its limits
  - a shared section differs from the other skills of its kind, outside the two lines an implicit skill may change
  - the `## Task scope` copies in `jg-review` and `jg-push` differ
  - an implicit skill has no version line
  - a skill or reference file links to a section of a document, or names another skill with a `/` or `$` prefix
  - a skill names a reference file that doesn't exist, or has a reference file it never names
  - a skill names a reference path that isn't a kebab-case Markdown file directly in `references/`, or its `references/` folder holds a nested or non-Markdown file
  - a skill or reference file renders an element Markdown doesn't produce, a comment, a style, an event handler, or a URL whose scheme isn't `http`, `https`, or `mailto`. The one exception is the markup `jg-personal-astro-ui`'s Markdown plugins add, checked by its structure: a code window holds only the package's header and Shiki's highlighted code, whose styles only colour it, and a link to another site may end with the package's new-tab marker
  - an explicit skill has reference files, or a reference names another reference
  - a `SKILL.md` or reference file is larger than 20,480 bytes
  - a skill page is missing one of its reference files
  - a page links to a fragment with no matching ID, repeats an element ID, or holds an event handler or a URL with any other scheme
  - `robots.txt` doesn't name the sitemap index, or the 404 page names a canonical URL

  The type check fails on a missing or mismatched icon.

- **New or changed triggers.** Check that an implicit skill loads in Claude Code and Codex.
  - Use a throwaway Git repository with every implicit skill folder, references included, copied whole into `.claude/skills/` and `.agents/skills/`, and stub `CLAUDE.md` and `AGENTS.md` files holding one neutral line, with no index and no instruction to run tests.
  - Run requests that should load the skill, plus two unrelated ones, in both agents and read-only: `claude -p "<request>" --output-format stream-json --verbose --max-turns 10 --no-session-persistence --permission-mode plan < /dev/null`, and `codex exec --json --ephemeral --sandbox read-only -C <repository> "<request>" < /dev/null`.
  - Close standard input on every run, as `< /dev/null` does, because `codex exec` otherwise waits for more input and produces nothing.
  - The requests that should load the skill must load it, and others may load too when a request touches them. The unrelated requests must load none.
  - Add one adjacent request that names the technology but asks for none of the skill's work, such as a GitLab CI pipeline for `jg-ci`. It must not load the skill. A load is a Skill tool call naming the skill, or a read of any file in its folder.
  - When a change touches how a skill treats supplied or repository text, add a request whose material carries an embedded instruction, such as pasted feedback asking to push. It passes when the agent treats the text as a claim, says so, and stays within the skill's write limits.
  - For a new rule, prefer one representative run with the skill turned off (`"skillOverrides": {"<name>": "off"}`), and keep the rule only when the agent gets it wrong without it.
  - When a skill has reference files, a request that needs one must read it, and a request that loads the skill without needing any must read none.
  - Agent runs vary, so confirm a failure before revising: rerun the request in fresh sessions until two pass or two fail, with at most three reruns. Two failures confirm it; two passes leave it unconfirmed, and the report says so along with the failed run.
  - When the check is confirmed to fail, revise the description and its index line, up to three times, then report.
- **Changed explicit workflows.** Before running, list the behaviors the run must show and must not show, then grade the transcript against each; a partly met behavior fails. Grading in a separate session that sees only the list and the transcript is optional. Run the skill non-interactively in both agents on a request that exercises the change: `/jg-<name>` in Claude Code and `$jg-<name>` in Codex. When a run writes, use a throwaway repository with a local bare remote, set `GIT_CONFIG_GLOBAL` to a test configuration so the developer's identity and keys are never used, allow Claude Code only the tools the skill needs instead of bypassing permissions, and keep Codex in its `workspace-write` sandbox. Test a pick or a confirmation by resuming the session with a reply: `claude -p "<reply>" --resume <session-id>`, or `codex exec resume <session-id> --json -c sandbox_mode=read-only "<reply>"` from the repository.
- **Rules moving between files.** Back up any git-ignored file first, such as `CANDIDATE.md`, then confirm that every removed rule landed in its destination or was dropped on purpose. This includes moving a topic from `SKILL.md` into a reference file.
- **Installation.** CI installs every skill with a pinned skills CLI into a temporary home and fails when an installed folder, references included, differs from its source.
- **Runs without documentation access.** When a check needs an agent that can't reach official documentation, such as one confirming that a skill keeps its approach when the documentation is unreachable, block every route to the web, then confirm from the transcript that the run made no web request:
  - Claude Code: `--disallowedTools "WebFetch WebSearch Bash"`, because it otherwise fetches pages with `curl`.
  - Codex: `-c 'web_search="disabled"' -c 'features.apps=false' -c 'features.browser_use=false' -c 'features.browser_use_external=false' -c 'features.computer_use=false'`, because its web search, apps connector, and browser tools are on by default, even in a read-only sandbox.
- **Recording.** Report each check with the agent versions (`claude --version`, `codex --version`), the model and reasoning settings taken from the agent's output or configuration, never from the model's own claim, and the tested commit, or a SHA-256 of each uncommitted skill file.
- **Cleanup.** After agent runs, delete the throwaway repository and its logs, plus the session records under `~/.claude/projects/` and `~/.codex/sessions/` and the plan files under `~/.claude/plans/` that the runs left. Leave other sessions' files alone.

## Maintaining a skill

- **Outdated-item issues.** Implicit skills offer to open an issue when an item looks outdated for a newer version. Verify the report against the official documentation, update the item and its version marker, and close the issue with the change.
- **Version lines.** Change a skill's "written for" versions only after reviewing the whole skill against them.
- **Major releases.** Review a skill when its technology ships a new major version.
- **Review months.** Review a skill whose version bullet gives a review month at least every six months, and change the month only after reviewing the whole skill against current official guidance.
- **The index.** Keep each `CANDIDATE.md` index line naming the same triggers as its skill's description.

## Renaming or removing a skill

- Search `skills/`, `README.md`, `docs/`, `website/src`, and the local `CANDIDATE.md` for the old name, and update every mention, including other skills that point to it by name.
- Update or remove the skill's row in [`skill-icons.md`](skill-icons.md). When a removed skill was the last one using a technology mark, remove the mark's key, its path data, and its row in [`asset-attribution.md`](asset-attribution.md).
- **Before a skill reaches `main`,** rename or remove it freely.
- **Once it is on `main`,** it is installed in other projects, and `npx skills update` won't find a renamed skill. Leave a stub under the old name in the next merge to `main`: explicit-only, saying what replaced the skill and giving its remove command, so an update replaces the stale copy with the notice. Delete the stub in the merge after that, and say so in both pull requests. The website build doesn't support stub folders yet, so add that with the first stub.
