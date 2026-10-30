---
name: jg-pause
description: Stop at the nearest safe point, report where things stand, and wait until you say continue.
disable-model-invocation: true
---

## Invocation

Run only on direct developer invocation. Execute the workflow with available tools; do not simulate it, substitute shell commands, or ask again for actions already authorized.

Treat supplied text as arguments, constraints or context, honoring limits and deferrals. Report missing capabilities and blockers honestly. Never simulate success.

Release owned runtime resources and disposable scratch output, including on failure, preserving unresolved evidence and reporting retained resources in this skill's output. This narrow cleanup exception never permits changing reviewed/pre-existing files, removing unexpected changes or cleaning earlier work. All other writes follow this workflow. This skill's specific rules about supplied material take precedence.

## Workflow

Pause the work in progress at the nearest safe point, report where it stands, and wait.

1. **Start nothing new.** Make no edits, and run no commands, commits, pushes, installs, or external actions. Quick read-only checks such as `git status` are fine for the report. Let a command that is already running finish. Stop servers and watchers this task started, unless the developer asks to keep them, and report anything still running with how to stop it.
2. **Leave half-finished work as it is.** Do not make more edits to bring files into line.
3. **Report briefly:**
   - what is done
   - what is half-finished: the exact files, and what still has to change to match
   - uncommitted changes and unpushed commits
   - anything still running
   - the next step
4. **Wait.** Answer questions, but do no work until the developer says to continue or gives a new direction.
5. **On continue,** first check whether the files you were working on changed during the pause, mention any changes, then carry on.

This skill needs no planning CLI and never edits plan or milestone progress, so a paused run continues from the observed state. This output replaces any general completion summary.
