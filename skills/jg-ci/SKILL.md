---
name: jg-ci
description: GitHub Actions standards for a minimal, secure CI and deployment foundation that each project extends when it chooses to. Use when writing, reviewing, or planning GitHub Actions workflows under .github/workflows, reusable workflows, composite actions, Dependabot configuration, or CI and deployment changes made in GitHub Actions. Not for other CI systems, such as GitLab CI or Jenkins.
---

## Application

The agent loads this skill on its own when a task touches its area. This skill's area is GitHub Actions workflows, reusable workflows, composite actions, Dependabot configuration, and CI and deployment pipelines built on GitHub Actions.

- It adds domain rules to the task. It never authorizes actions, widens scope, or replaces the workflow or approvals of a skill the developer invoked.
- It ranks with the repository's coding instructions. When they conflict, the coding instructions win, except for the exceptions this skill states for its own area.
- The repository's established conventions win over this skill's naming, layout, and style rules. Its correctness and safety rules, and the exceptions it states for its own area, still apply.
- Check the installed versions first. This skill was written for GitHub Actions as of October 2026, with `actions/checkout` v7, `actions/setup-node` v7, `actions/cache` v6, `actions/upload-artifact` v7, and `actions/download-artifact` v8, plus npm 11 and 12 and pnpm 10 and 11 for its install rules. An item marked with a minimum version, written like (18+), applies only when that version or a later one is installed. For an older installed version, follow that version's official documentation.
- Before relying on one of this skill's version-specific items, check it against the current official guidance when the installed version of the technology is newer than the one this skill was written for, or when the version bullet gives a review month for something without an installed version, such as a hosted service or browser behavior, and that month is more than six months before the current date. Where an item differs from that guidance, follow the guidance. Version-specific items are API, syntax, and feature recommendations, and anything marked with a minimum version. This skill's conventions and requirements, such as its naming, layout, style, reuse, and safety rules, keep their usual precedence even where official guidance suggests otherwise. Report each item that looks outdated in the summary, with the installed version and what the current guidance says, and offer there to open an issue on the jg-skills repository, `https://github.com/jesusgraterol/jg-skills`:
  - Never pause or stop a run for the offer, including an autonomous run. When no one can answer, include the pre-filled link described below instead of asking.
  - First search the repository's open issues, and skip the offer when one already covers the item. When the search can't run, say so next to the link, so the developer checks the existing issues before submitting.
  - Open an issue only after the developer agrees, because it is public. Title it `<skill>: <item> looks outdated on <technology> <version>`, and include only the skill name, the outdated item, the installed version, and a link to the official documentation, never code, file paths, or project details. Add no label.
  - Use `gh issue create` when `gh` is installed and signed in. Otherwise give the developer a pre-filled link, `https://github.com/jesusgraterol/jg-skills/issues/new?title=…&body=…`, with both values URL-encoded.
- This skill isn't a complete list. Where it says nothing, follow the official guidance for the installed version, and in new code the task touches, prefer the features that guidance currently recommends over older ones that do the same job, unless the repository has an established pattern for that job. Before using a newer approach instead of one this skill gives, confirm it in that version's official documentation, never from memory alone, and report the item as outdated as described above. When that documentation can't be reached, keep this skill's approach and report that the newer approach couldn't be confirmed, without pausing the run.
- Rules that say "prefer" are defaults: departing from one with a stated reason is fine. Rules that say "never", "always", or "must" are requirements.
- Nothing in this skill requires adding a dependency, enabling a compiler or tool, upgrading, or migrating existing code.

## Changing CI

- CI changes affect every contributor and every deployment, so change workflows only when the task is about them. When other work can't pass CI without a workflow change, propose that change instead of making it, and never propose CI improvements the task doesn't need.
- Never weaken, skip, or disable a check, a required status check, or branch protection to make a run pass.

## Requirements

- Always set the workflow's top-level `permissions` to the minimum, usually `contents: read`, and raise them per job only where that job needs more.
- Always set `timeout-minutes` on every job that runs steps, because the default is 360 minutes. A job that calls a reusable workflow can't take one, so the called workflow's own jobs set it.
- Always pass untrusted event data, such as pull request titles and bodies, branch names, or commit messages, to `run:` scripts through `env:`. Never interpolate it into a script with `${{ }}`, because the value becomes part of the script:

  ```yaml
  - name: Check the pull request title
    env:
      TITLE: ${{ github.event.pull_request.title }}
    run: |
      if [[ ${#TITLE} -gt 72 ]]; then
        echo "::error::The title is longer than 72 characters."
        exit 1
      fi
  ```

- Never check out or run a pull request's code in a `pull_request_target` or `workflow_run` workflow, even with read-only permissions, because both run in the base repository's context with its secrets and caches. Use `pull_request` for anything that runs the pull request's code.
- Never print secrets. Mask values derived from them with `::add-mask::` before anything can log them, and keep production secrets in environments with protection rules.
- Never cancel a deployment in progress. In a workflow that both verifies pull requests and deploys, cancel only pull request runs:

  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: ${{ github.event_name == 'pull_request' }}
  ```

- Never restore caches in workflows triggered by releases or tags, or that publish packages: no `actions/cache`, no setup-action caching, and `package-manager-cache: false` on `actions/setup-node`, which otherwise caches on its own when `package.json` names npm as its `packageManager`. A poisoned cache would end up in what gets published. CI and site deploys keep caching.

## Foundation

- Prefer one workflow per repository. Its check job runs the project's check command on `pull_request` and on pushes to the default branch, even when the task mentions only pull requests, so the merged tree is checked too. When the project deploys, a deploy job `needs` the check job and runs only for pushes to the default branch.
- Prefer the project's designated required verification command, such as `npm run check`, so CI and developers use the same authoritative checks. When there is none, run the applicable existing required test, lint, typecheck, and build commands as steps of the one job. Respect the repository's essential/full policy: select essential when defined, and do not append full merely because it exists. Additional full runs require an explicit request or the repository's documented policy.
- A new required check reaches CI by joining that command; additional full-only coverage does not automatically join routine required CI. Never add a job, a matrix, a workflow, a scheduled run, or a bot unless the developer asks for it or another loaded skill requires it for its own area, such as jg-npm-package's runtime and release jobs.
- When creating a repository's first workflow, offer once, in the summary, to turn on Dependabot alerts and security updates in the repository's settings. They need no configuration file, and they open pull requests only for alerts that have a fix available. Turn them on only with the developer's agreement.

## Defaults

- Prefer cancelling superseded runs with a concurrency group per workflow and ref, such as `${{ github.workflow }}-${{ github.ref }}`.
- Prefer the setup actions' built-in caching, such as `cache: npm` on `actions/setup-node`, which keys the cache by the lockfile. Publishing workflows are the exception the requirements state.
- Prefer installs that keep the lockfile frozen: `npm ci`, or `pnpm install --frozen-lockfile`.
- Prefer installs that run no dependency lifecycle scripts. npm 12 skips scripts its `allowScripts` policy doesn't approve, pnpm 10 skips unapproved builds with a warning, and pnpm 11 fails on them; with npm 11 and older or pnpm 9 and older, pass `--ignore-scripts`. Approve the packages that need their scripts in npm's `allowScripts` or pnpm's `allowBuilds` (10.26+), never with an allow-all flag such as `--dangerously-allow-all-scripts` or `dangerouslyAllowAllBuilds`.
- Prefer setting `timeout-minutes` near a job's normal duration, about twice its typical run time, so a slowdown fails visibly instead of running unnoticed for most of an hour.
- Prefer OIDC (`id-token: write`) for deployments over long-lived cloud or registry secrets.

## Pinning

- When the repository already pins actions another way, such as with an `actions.lock` file, follow that setup.
- Otherwise, pin third-party actions to a full commit SHA with the version in a same-line comment, such as `# v6.0.0`, and keep GitHub's own `actions/*` on major tags, such as `@v7`. Prefer a `run:` step or one of GitHub's own actions over a third-party action.
- Resolve a SHA from the action's repository, for example with `git ls-remote --tags https://github.com/<owner>/<action>`, and for an annotated tag take the peeled line ending in `^{}`, which holds the commit rather than the tag object. Never write a SHA from memory. When it can't be resolved, use the release tag and list the action in the summary as unpinned.
- A new `uses:` line takes the action's latest release, checked rather than recalled, for example with `gh release view --repo <owner>/<action>`. When the release can't be checked, say so in the summary.
- Don't migrate existing workflows or their `uses:` versions only to follow this skill. Only newly added `uses:` lines follow these rules.

## Verification

- Run `actionlint`, and `zizmor` for security, when they are installed. Never install them.
- Without linting, state that the workflow is unverified until it runs.
- When a run exists, read its result with `gh run view` instead of assuming it passed.
