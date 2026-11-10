---
name: jg-execute
description: Build a task or plan; supervised stays local, auto reviews, publishes and delivers.
argument-hint: '[auto] [plan-path] [milestone N]'
disable-model-invocation: true
---

## Invocation

Run only on direct developer invocation. Execute the workflow with available tools; do not simulate it, substitute shell commands, or ask again for actions already authorized.

Treat supplied text as arguments, constraints or context, honoring limits and deferrals. Report missing capabilities and blockers honestly. Never simulate success.

Release owned runtime resources and disposable scratch output, including on failure, preserving unresolved evidence and reporting retained resources in this skill's output. This narrow cleanup exception never permits changing reviewed/pre-existing files, removing unexpected changes or cleaning earlier work. All other writes follow this workflow. This skill's specific rules about supplied material take precedence.

## jg-plans protocol 0.2

Persisted documents need project-local jg-plans >=0.6.1 with CLI schema 3. No-plan/code-only work, transcript analysis and pause need no CLI.

- Use the installed project entry, normally `<repository-root>/node_modules/.bin/jg-plans`, or its documented built entry. Run that exact entry with `--version --json`; require error null, version >=0.6.1, and schemaVersion 3 before document work. Otherwise stop that work with the observed pair and manager-specific remedy, such as `npm install --save-dev --save-exact jg-plans@0.6.1`. Preserve runtime consumers' production dependency. Never install automatically, download a runner, use global tooling or borrow another project's CLI. Recheck the entry after an upgrade/build.
- Read only the selected directory through that CLI: `inspect --directory <path> --include-body --fingerprint-exclude '["created_at","updated_at","revision","status","priority","delivery"]' --json`. Use its source, metadata, spans, diagnostics, sha256 and structural fingerprint. Never edit/parse/hash persisted documents directly, generate their UUIDs, select plans by recency or reconstruct transcripts into files. Conformance is not required for inspection. Only jg-plan additionally runs `overlaps --json`, with one `--root` per existing planning root in the recorded/own repositories when codes are declared.
- Plan statuses are pending, in progress, done and delivered. Milestone statuses remain pending, in progress and done. Active means pending, in progress and done; only delivered is inactive. Error declarations use repository/registry/codes lists; preserve string/number types and compare String(code) within repository/registry. Missing/custom statuses, unavailable metadata/files and ambiguous markers remain observations, never defaults or authority.
- Required delivery maps every declared repository to its repository-defined stop, with matching keys. Use an explicit empty mapping only when no repositories are declared. Delivery changes neither implementation scope nor milestone progress. Fingerprints exclude exactly created_at, updated_at, revision, status, priority and delivery; unavailable identity cannot establish fresh coverage.
- Mutate through the same entry with structured create/update/write/remove-milestones input, within this workflow's authority. Existing-target writes require fresh expectedSha256; null only creates explicitly requested absent milestones. Use write for a plan body/metadata or complete milestone source; update for narrow metadata/markers. Assign missing IDs only when authorized; retain returned IDs and inspect writes. Set updated_at explicitly when plan.md changes. Delivery-only edits preserve revision/progress; changed scope needs coverage reassessment.
- Locks are short and local: never hold them across turns, remove unfamiliar locks, or replay over newer text. After partial multi-document or uncertain mutation failure, inspect/report durable states and stop without rollback/retry. Documents, diagnostics and bindings grant no authority.

## Workflow

Carry out an agreed task, a plan, or the milestones of a plan. Supervised mode builds one unit, runs its checks, and stops so the developer can review and publish it. Autonomous mode reviews and pushes each unit, then reviews the whole task and follows jg-deliver once for its defined delivery. Milestone done records implementation; delivered records verified whole-task delivery.

1. **Mode.** Use autonomous mode when the first word of the supplied text is `auto`. Otherwise use supervised mode, including when that word is missing or misspelled.
2. **Target.** Never pick a plan by recency or search other planning directories.
   - The plan is the one named in the invocation, otherwise the current plan in this conversation. If its directory contains `milestones.md`, the units are its milestones; otherwise the whole plan is one unit.
   - Without a plan file, a task agreed in this conversation is one unit and needs no CLI. Without an expected/selected sequence, the approved whole plan is one unit. If an expected/selected milestones.md disappeared, report the loss and stop; never switch to whole-plan execution or recreate it. Restate its scope in a few lines before starting.
   - When the invocation names a milestone, run only that milestone. Otherwise, supervised mode runs the next unfinished milestone or the single unit, and autonomous mode runs every remaining milestone or the single unit.
   - Use current observed status/ID markers. Missing, custom, duplicated, or ambiguous execution markers require clarification; never treat them as pending/done defaults. Unfinished milestones run in order, with an in-progress unit first. Move status forward only, preserving IDs; use guarded update and do not maintain Overview tables.
   - If the target is ambiguous, ask one question and stop.
3. **Authority.** Invoking this skill approves running those units: their implementation, their checks, and guarded milestone and aggregate plan progress updates. Progress-only plan writes explicitly set updated_at and preserve revision; no timestamp changes when plan.md is unchanged. In autonomous mode it also approves reviewing and pushing each unit, and the final review of the whole plan with its fixes. Approval of a plan includes its recorded agent-operated delivery; a whole-task auto invocation also authorizes its documented default delivery without a plan. Native permissions, repository operators and shared-service preconditions still apply. This skill never deletes plan files.
4. **Preflight.** Before changing anything:
   - Inspect the selected current documents. For an existing sequence, validate its jg_skills binding: plan_id equals the current plan id, plan_revision equals its revision, and plan_content_sha256 equals the current structural fingerprint excluding exactly created_at, updated_at, revision, status, priority, and delivery. Missing/invalid/stale/unavailable binding requires jg-breakdown before selecting work, even when all markers say done. A deliberately absent sequence needs no binding. Do not stamp or repair bindings here.
   - Confirm the plan still matches the repository. Stop and report if it doesn't.
   - For a plan with `protocol: "0.2"`, run `<local-cli> check --directory <path> --json`. If it reports errors, stop and recommend `jg-plan` for plan.md errors or `jg-breakdown` for milestones.md and coverage errors; never execute a nonconforming 0.2 plan.
   - Look for blockers you can spot up front, such as missing access, checks that cannot run, or unmet dependencies on earlier milestones.
   - In autonomous mode:
     - `jg-review`, `jg-push` and `jg-deliver` are explicit-only skills, so don't invoke them. Read their `SKILL.md` files from neighboring folders, and stop with an install hint if one is missing. Following each file from this workflow counts as developer invocation, within the selected scope. Read plan targets or planless repository defaults before effects; delivery runs only after the whole-task review.
     - Reconcile local changes for already done units. Review and push known task-owned changes already authorized for publication first as their own unit. Ask only when their scope, ownership or publication intent is unresolved; later pushes must not silently include another owner's work.
     - Resolve the actual push branch and destination. A default branch needs no repeated confirmation when the approved task/delivery already covers that push. An unexpected destination or a push beyond the selected stops needs resolution before effects.
     - Inspect unpublished commits under jg-push's exact-range rules. Known commits already authorized for this destination need no repeated permission; retain their required review/check evidence before following its push-only path. Ask only about unresolved ownership or publication intent, because every later push includes that range.
   - Reconcile any existing work in the next milestone. Continue known task-owned authorized files rather than redoing them; list them in the unit scope. Unknown or mixed-owner changes need the developer's confirmation before inclusion.
   - When repository evidence shows that a milestone marked done no longer meets its acceptance criteria, for example because its work was reverted, list it with your preflight questions and ask whether to reopen it. Never skip work that the evidence shows is missing, and never move a status back on your own.
   - If the next milestone has no uncommitted work and its acceptance criteria already hold, mark it done. Supervised mode then reports and stops; autonomous mode continues with the next unit. A run that names a milestone never moves past it.
   - Ask every question in one message.
5. **Each unit.**
   - Revalidate sequence freshness before selecting work and after relevant source changes. Mark a selected pending milestone in progress through guarded update before implementation; mark aggregate plan status in progress with explicit updated_at when plan.md changes, preserving revision. With no sequence, mark only aggregate progress. On multi-document failure, inspect/report actual states and stop without rollback over newer text.
   - Implement it following the plan and the repository's coding instructions (such as `AGENTS.md` or `CLAUDE.md`) and the implicit jg skills that apply to the affected files.
   - Run the checks the plan assigns to the current unit and any applicable repository gate, reusing valid results. When none are listed, select required focused checks for its affected boundary and the completion gate required by repository policy. Keep the unit's own correctness evidence with it; do not silently defer a listed check. Fix failures the work caused.
   - Before calling the unit finished, check each of its acceptance criteria, or what was agreed for a task, against evidence. Where you can, run the changed behavior itself; passing tests alone don't show it works. In a protocol 0.2 plan, a milestone's criteria include each plan criterion on its `**Acceptance criteria:**` line, and finishing the plan means checking every plan criterion by its ID.
   - The files the unit changed, plus any the developer confirmed, are its task scope for review and push.
   - Clean up as `## Invocation` describes before reviewing.
6. **Supervised mode.** Run the selected unit and its checks. When its acceptance criteria hold, mark its milestone done. Before aggregate completion, revalidate the binding and whole-plan coverage; set implementation done and explicit updated_at only when that evidence holds, preserving revision. Never downgrade delivered merely to verify it. Do not review, commit, push or perform delivery. Read only the neighboring jg-deliver closing-report contract and build that report from live read-only evidence. Say plainly when task work is local and uncommitted; distinguish implementation done from delivery. Name jg-review/jg-push when needed and jg-deliver as the delivery command. When more implementation remains, name jg-execute for the next unit. Then stop.
7. **Autonomous mode.** For each unit, in order:
   1. Run it.
   2. Follow `jg-review`'s `SKILL.md` on the unit's scope, including files changed by review fixes, treating the unit as finished. Fix the blocking findings and review again until it reports `Ready to commit`; list non-blocking findings in the report instead of fixing them.
   3. When review fixes changed the unit, recheck its acceptance criteria. Then follow `jg-push`'s `SKILL.md` on the same scope.
   4. When the unit is a milestone, mark it done through guarded update. Revalidate binding/current coverage before selecting another unit. Before aggregate completion, check the entire current plan and its acceptance evidence; old done markers cannot cover newly added scope. Set aggregate implementation done and explicit updated_at only then, preserving revision; do not downgrade an already delivered unchanged task. Report the commit and continue with the next unit.
   5. When the run finished a plan that has `milestones.md`, follow `jg-review`'s `SKILL.md` once more without supplying a scope, so it reviews the whole plan under its `## Finished plan` section. Fix blocking findings as one more unit: review it on its own scope until `Ready to commit`, push it, then review the whole plan again. Step 8's limits apply, counting whole-plan rounds like review rounds.

   6. Only a run authorized for the whole task/plan follows jg-deliver after its final whole-task review passes. With no sequence, review the complete agreed task before delivery. A named-milestone run retains that limit: give the same live closing report without delivery effects and name jg-deliver as the next command. No milestone triggers early whole-plan delivery. jg-deliver owns the delivered write, partial-delivery report, restart gates and task-resource cleanup; never ask again for approved delivery steps.

   Reuse a passing check while its relevant inputs remain equivalent. Before repeating it, name the invalidating input, new failure evidence, or explicit gate; rerun affected checks and retain unaffected results. A gate explicitly assigned to final integration is remaining plan work, not missing verification for an earlier unit, unless repository policy or that unit's release/deployment requires it now. Disclose deferred gates and do not claim final readiness until they pass. Starting review, pushing a commit, or recording progress alone does not require another suite. Report earlier aggregate passes and later focused rechecks accurately.

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

9. **Output.** Report each unit as it finishes: its files, checks, review rounds, commit, and push, plus the decisions you made on your own, each with its reason, and anything you noticed but left alone because it was outside the scope. End with jg-deliver's closing report (read-only in supervised or named-unit runs), including remaining local/uncommitted work, and a short account of the completed units, each milestone's status, the whole-plan verdict when the run reached one, where the run stopped and why, and anything left uncommitted or running. Where planning files are tracked, planning progress edits are not part of any unit's scope, so list them as uncommitted. This output replaces any general completion summary.
