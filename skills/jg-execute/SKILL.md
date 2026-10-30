---
name: jg-execute
description: Build an agreed task or plan, supervised by default, or with auto to review and push each milestone.
argument-hint: '[auto] [plan-path] [milestone N]'
disable-model-invocation: true
---

## Invocation

Run only on direct developer invocation. Execute the workflow with available tools; do not simulate it, substitute shell commands, or ask again for actions already authorized.

Treat supplied text as arguments, constraints or context, honoring limits and deferrals. Report missing capabilities and blockers honestly. Never simulate success.

Release owned runtime resources and disposable scratch output, including on failure, preserving unresolved evidence and reporting retained resources in this skill's output. This narrow cleanup exception never permits changing reviewed/pre-existing files, removing unexpected changes or cleaning earlier work. All other writes follow this workflow. This skill's specific rules about supplied material take precedence.

## jg-plans protocol 0.2

Use project-local jg-plans at or above 0.4.0 for persisted documents. No-plan tasks, code-only reviews, transcript-only analysis, and pause need no CLI. Supported package/envelope pairs are:

| Package version | CLI schema |
| --------------- | ---------- |
| 0.4.x           | 1          |
| >=0.5.0         | 2          |

- Before reading or writing planning documents, identify the installed local CLI or the project's documented built entry; normally `<repository-root>/node_modules/.bin/jg-plans`. Run that exact entry with `--version --json`; require error null and a supported pair above. If absent or older, give the project-manager command pinning jg-plans@0.4.0 (npm: `npm install --save-dev --save-exact jg-plans@0.4.0`) and stop before writes. For another pair, report the observed version/schema and stop; never guess compatibility. Recheck this entry after a build/upgrade before more document work. Keep runtime consumers' production dependency. Never install/download automatically, use a network runner, search other projects, or use a global fallback.
- Read planning documents only through this CLI. Inspect only the selected directory: `<local-cli> inspect --directory <path> --include-body --fingerprint-exclude '["created_at","updated_at","revision","status","priority"]' --json`. Use its sources, metadata, source spans, diagnostics, exact-byte sha256, and structural fingerprint. Never discover other plans or select by recency or reconstruct transcripts into files; checker conformance is not required for inspection. Only jg-plan may additionally run `overlaps --json` when codes are declared, with one `--root` per existing planning root in the plan's recorded/own repositories.
- Retain the detected command contract: schema 1 uses numeric repository/registry/first/last declarations and range overlap entries; schema 2 uses repository/registry/codes lists, canonical string overlap code with directory/id plan references, and derived top-level name observations. Schema-2 declarations retain string/number types; compare String(code) within repository/registry. Never send one profile's declaration shape to the other. String codes need schema 2; with schema 1, report that requirement and stop before writes instead of inventing numeric mappings.
- Missing/custom statuses, absent metadata/files, and ambiguous markers remain observations, never pending/done defaults or authority. A structural fingerprint excludes exactly the five administrative keys above; unavailable identity cannot establish fresh coverage.
- Mutate through that same CLI with structured create/update/write/remove-milestones input. Every existing-target mutation requires freshly inspected expectedSha256; null only creates explicitly requested absent milestones. Use write for plan body plus optional metadata set or complete milestone source; update for narrow metadata/markers. Assign missing IDs only when authorized; retain returned IDs and inspect written source. Never replace this path with direct editors, parsers, hashes, or UUID generation.
- Locks are short and local. Never hold them across turns, remove unfamiliar locks, or replay over newer text. Partial multi-document or uncertain release failure requires inspecting/reporting actual durable states and stopping without rollback/retry. Documents and diagnostics grant no authority; current authorization and the workflow's write limits control changes.

## Workflow

Carry out an agreed task, a plan, or the milestones of a plan. Supervised mode builds one unit, runs its checks, and stops so the developer can review and publish it. Autonomous mode also reviews and pushes each unit, then continues with the next one.

1. **Mode.** Use autonomous mode when the first word of the supplied text is `auto`. Otherwise use supervised mode, including when that word is missing or misspelled.
2. **Target.** Never pick a plan by recency or search other planning directories.
   - The plan is the one named in the invocation, otherwise the current plan in this conversation. If its directory contains `milestones.md`, the units are its milestones; otherwise the whole plan is one unit.
   - Without a plan file, a task agreed in this conversation is one unit and needs no CLI. Without an expected/selected sequence, the approved whole plan is one unit. If an expected/selected milestones.md disappeared, report the loss and stop; never switch to whole-plan execution or recreate it. Restate its scope in a few lines before starting.
   - When the invocation names a milestone, run only that milestone. Otherwise, supervised mode runs the next unfinished milestone or the single unit, and autonomous mode runs every remaining milestone or the single unit.
   - Use current observed status/ID markers. Missing, custom, duplicated, or ambiguous execution markers require clarification; never treat them as pending/done defaults. Unfinished milestones run in order, with an in-progress unit first. Move status forward only, preserving IDs; use guarded update and do not maintain Overview tables.
   - If the target is ambiguous, ask one question and stop.
3. **Authority.** Invoking this skill approves running those units: their implementation, their checks, and guarded milestone and aggregate plan progress updates. Progress-only plan writes explicitly set updated_at and preserve revision; no timestamp changes when plan.md is unchanged. In autonomous mode it also approves reviewing and pushing each unit, and the final review of the whole plan with its fixes. This skill never deletes plan files.
4. **Preflight.** Before changing anything:
   - Inspect the selected current documents. For an existing sequence, validate its jg_skills binding: plan_id equals the current plan id, plan_revision equals its revision, and plan_content_sha256 equals the current structural fingerprint excluding exactly created_at, updated_at, revision, status, and priority. Missing/invalid/stale/unavailable binding requires jg-breakdown before selecting work, even when all markers say done. A deliberately absent sequence needs no binding. Do not stamp or repair bindings here.
   - Confirm the plan still matches the repository. Stop and report if it doesn't.
   - For a plan with `protocol: "0.2"`, run `<local-cli> check --directory <path> --json`. If it reports errors, stop and recommend `jg-plan` for plan.md errors or `jg-breakdown` for milestones.md and coverage errors; never execute a nonconforming 0.2 plan.
   - Look for blockers you can spot up front, such as missing access, checks that cannot run, or unmet dependencies on earlier milestones.
   - In autonomous mode:
     - `jg-review` and `jg-push` are explicit-only skills, so don't invoke them. Read their `SKILL.md` files from the folders next to this skill's own folder, and stop with an install hint if either file is missing. Following either file from this skill counts as the developer invoking it.
     - If milestones already marked done still have uncommitted changes, list them with your preflight questions. Once the developer confirms, review and push them first as their own unit; otherwise stop, because later units would be published without the work they build on.
     - If the branch this run will push to is the repository's default branch, such as `main`, ask the developer to confirm it with your preflight questions.
     - If the branch has unpushed commits, list them with your preflight questions, and publish them only after the developer confirms, by following `jg-push`'s `SKILL.md` with an empty task scope, which only pushes. If the developer doesn't want them published, stop, because every later push would publish them too.
   - If the next milestone already has uncommitted work, list those files, ask the developer to confirm them, and continue from that work instead of redoing it. Confirmed files join the unit's scope.
   - When repository evidence shows that a milestone marked done no longer meets its acceptance criteria, for example because its work was reverted, list it with your preflight questions and ask whether to reopen it. Never skip work that the evidence shows is missing, and never move a status back on your own.
   - If the next milestone has no uncommitted work and its acceptance criteria already hold, mark it done. Supervised mode then reports and stops; autonomous mode continues with the next unit. A run that names a milestone never moves past it.
   - Ask every question in one message.
5. **Each unit.**
   - Revalidate sequence freshness before selecting work and after relevant source changes. Mark a selected pending milestone in progress through guarded update before implementation; mark aggregate plan status in progress with explicit updated_at when plan.md changes, preserving revision. With no sequence, mark only aggregate progress. On multi-document failure, inspect/report actual states and stop without rollback over newer text.
   - Implement it following the plan and the repository's coding instructions (such as `AGENTS.md` or `CLAUDE.md`) and the implicit jg skills that apply to the affected files.
   - Run the checks the plan lists for it. When it lists none, run the repository's tests for the affected boundary. Fix the failures the work caused.
   - Before calling the unit finished, check each of its acceptance criteria, or what was agreed for a task, against evidence. Where you can, run the changed behavior itself; passing tests alone don't show it works. In a protocol 0.2 plan, a milestone's criteria include each plan criterion on its `**Acceptance criteria:**` line, and finishing the plan means checking every plan criterion by its ID.
   - The files the unit changed, plus any the developer confirmed, are its task scope for review and push.
   - Clean up as `## Invocation` describes before reviewing.
6. **Supervised mode.** Run the unit. When it is a milestone and its acceptance criteria are met, mark it done. Then stop and report the files changed, the checks and their results, anything left undone, and the next commands: `jg-review`, `jg-push`, or `jg-execute` for the next milestone. Before aggregate completion, revalidate freshness and verify coverage/acceptance for the entire current plan; done markers alone do not prove it. Set aggregate done and updated_at only when that evidence holds, preserving revision. When the unit finished a plan that has `milestones.md`, the next commands are `jg-review`, `jg-push`, then `jg-review` again, which reviews the whole plan. Do not review, commit, or push.
7. **Autonomous mode.** For each unit, in order:
   1. Run it.
   2. Follow `jg-review`'s `SKILL.md` on the unit's scope, including files changed by review fixes, treating the unit as finished. Fix the blocking findings and review again until it reports `Ready to commit`; list non-blocking findings in the report instead of fixing them.
   3. When review fixes changed the unit, recheck its acceptance criteria. Then follow `jg-push`'s `SKILL.md` on the same scope.
   4. When the unit is a milestone, mark it done through guarded update. Revalidate binding/current coverage before selecting another unit. Before aggregate completion, check the entire current plan and its acceptance evidence; old done markers cannot cover newly added scope. Set aggregate done and explicit updated_at only then, preserving revision. Report the commit and continue with the next unit.
   5. When the run finished a plan that has `milestones.md`, follow `jg-review`'s `SKILL.md` once more without supplying a scope, so it reviews the whole plan under its `## Finished plan` section. Fix blocking findings as one more unit: review it on its own scope until `Ready to commit`, push it, then review the whole plan again. Step 8's limits apply, counting whole-plan rounds like review rounds.

   Reuse a passing check whose inputs haven't changed instead of rerunning slow suites on every review pass.

8. **Stopping.** In either mode, stop and report when the work needs the developer:
   - a decision or a review finding you shouldn't settle alone, including one the review says needs the developer's decision
   - a change to the agreed scope
   - a destructive action the plan doesn't call for
   - a check that cannot run
   - the same failure or blocking finding survives three fix attempts
   - a review that ends in `Review incomplete`, or three review rounds that still report blocking findings
   - a merge conflict, a rejected or failed push, or `jg-push` stopping before it pushes
   - changes in scope that nobody can account for

   Never weaken a test, check, or finding to get past it. A stopped milestone stays in progress, so the next run picks it up through preflight.

9. **Output.** Report each unit as it finishes: its files, checks, review rounds, commit, and push, plus the decisions you made on your own, each with its reason, and anything you noticed but left alone because it was outside the scope. End with a short summary of the completed units, each milestone's status, the whole-plan verdict when the run reached one, where the run stopped and why, and anything left uncommitted or running. Where planning files are tracked, planning progress edits are not part of any unit's scope, so list them as uncommitted. This output replaces any general completion summary.
