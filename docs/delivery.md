# Task delivery

Default stop: `development`.

| Stop | Operator |
| --- | --- |
| `development` | agent |
| `main` | agent |

Stops run in order. Implementation completion and delivery are distinct.

## development

Follow [skill guidelines](skill-guidelines.md), including the required website and affected native behavior checks, and regenerate the social image when explicit skills change. Review, commit and push the task into `development`. Verify the remote branch contains its HEAD.

## main

Promote checked development work to `main` through a pull request, then verify the [Pages deployment](../README.md#deployment) and actual live artifact. `main` is the live stop for linked installations: when agent skill folders are symlinks into this checkout, its skill bytes become active immediately. A breaking planning-contract change requires every affected local consumer and selected plan conversion to be qualified before activation; prepare them in isolation and activate together.

Verify the pushed merge, successful workflow, served source revision/content and linked installation bytes. Do not infer deployment from a push alone.

## Cleanup and evidence

Report fresh branch/HEAD, committed/pushed source, required merges, website revision, installation activation and task-resource cleanup. Remove only task-owned temporary folders, clean inactive worktrees, integrated local/remote task branches and claims. Preserve unique, dirty or active work and identify retained qualification evidence. Only a fully verified report is safe to close.
