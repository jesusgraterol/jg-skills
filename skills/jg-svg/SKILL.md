---
name: jg-svg
description: 'SVG standards for consistent vector files: icon drawing, outlined text in logos, file shape, brand colors, export cleanup, and optimization. Use when writing, reviewing, or planning the contents of SVG files or inline SVG, SVG icons, logos, favicons, or sprites, cleanup of SVG exported from Illustrator, Figma, or Inkscape, or SVG optimization with SVGO. Not for moving, renaming, or importing SVG files without changing them.'
---

## Application

The agent loads this skill on its own when a task touches its area. This skill's area is SVG: standalone SVG files and inline SVG, icons, logos, favicons, and sprites drawn as SVG, cleanup of files exported from design tools, and SVG optimization.

- It adds domain rules to the task. It never authorizes actions, widens scope, or replaces the workflow or approvals of a skill the developer invoked.
- It ranks with the repository's coding instructions. When they conflict, the coding instructions win, except for the exceptions this skill states for its own area.
- The repository's established conventions win over this skill's naming, layout, and style rules. Its correctness and safety rules, and the exceptions it states for its own area, still apply.
- Check the installed versions first. This skill was written for SVGO 4, and for browser behavior as of October 2026. An item marked with a minimum version, written like (18+), applies only when that version or a later one is installed. For an older installed version, follow that version's official documentation.
- Before relying on one of this skill's version-specific items, check it against the current official guidance when the installed version of the technology is newer than the one this skill was written for, or when the version bullet gives a review month for something without an installed version, such as a hosted service or browser behavior, and that month is more than six months before the current date. Where an item differs from that guidance, follow the guidance. Version-specific items are API, syntax, and feature recommendations, and anything marked with a minimum version. This skill's conventions and requirements, such as its naming, layout, style, reuse, and safety rules, keep their usual precedence even where official guidance suggests otherwise. Report each item that looks outdated in the summary, with the installed version and what the current guidance says, and offer there to open an issue on the jg-skills repository, `https://github.com/jesusgraterol/jg-skills`:
  - Never pause or stop a run for the offer, including an autonomous run. When no one can answer, include the pre-filled link described below instead of asking.
  - First search the repository's open issues, and skip the offer when one already covers the item. When the search can't run, say so next to the link, so the developer checks the existing issues before submitting.
  - Open an issue only after the developer agrees, because it is public. Title it `<skill>: <item> looks outdated on <technology> <version>`, and include only the skill name, the outdated item, the installed version, and a link to the official documentation, never code, file paths, or project details. Add no label.
  - Use `gh issue create` when `gh` is installed and signed in. Otherwise give the developer a pre-filled link, `https://github.com/jesusgraterol/jg-skills/issues/new?title=…&body=…`, with both values URL-encoded.
- This skill isn't a complete list. Where it says nothing, follow the official guidance for the installed version, and in new code the task touches, prefer the features that guidance currently recommends over older ones that do the same job, unless the repository has an established pattern for that job. Before using a newer approach instead of one this skill gives, confirm it in that version's official documentation, never from memory alone, and report the item as outdated as described above. When that documentation can't be reached, keep this skill's approach and report that the newer approach couldn't be confirmed, without pausing the run.
- Rules that say "prefer" are defaults: departing from one with a stated reason is fine. Rules that say "never", "always", or "must" are requirements.
- Nothing in this skill requires adding a dependency, enabling a compiler or tool, upgrading, or migrating existing code.

## Reference files

These files belong to this skill and hold rules that apply only to some work. Read each one before the work it covers:

- Before cleaning up SVG exported from a design tool, such as Illustrator, Figma, or Inkscape, or optimizing SVG files with SVGO or another optimizer, read `references/export-cleanup.md`. Optimization never removes the `viewBox` or an accessible `<title>`.

## Text in logos and favicons

- Logos, wordmarks, and favicons draw their text as outlined paths, never as `<text>`. A `<text>` element renders with whatever fonts the viewer has, so the mark changes shape from one machine to the next.
- When the text isn't outlined yet, take the first route that's available:
  1. Ask for an export with the text converted to outlines from the design source, such as the Illustrator or Figma file.
  2. Propose converting it with a tool and the brand's font file, such as Inkscape's command line (`inkscape logo.svg --export-text-to-path --export-plain-svg -o logo-outlined.svg`) or a font library such as opentype.js. Never install the tool or add it as a dependency without the developer.
  3. Until one of those is done, leave the existing `<text>` in place, and say in the summary that the mark still depends on the viewer's fonts.
- Never hand-draw or trace letterforms as paths.

## Drawing icons

New icons follow Lucide's icon design rules, so they sit well beside Lucide icons and each other:

- a 24 by 24 canvas, with at least 1 pixel of padding to its edge
- 2-pixel strokes centered on their paths, with round caps and round joins, drawn with `fill="none"` and `stroke="currentColor"`
- rounded corners: a 2-pixel radius on shapes at least 8 pixels wide or tall, and 1 pixel on smaller ones
- at least 2 pixels between separate elements
- coordinates on the pixel grid wherever that doesn't distort the shape

## File shape

- A standalone `.svg` file declares `xmlns="http://www.w3.org/2000/svg"`, a `viewBox`, and a `width` and `height` with the same aspect ratio as the `viewBox`, so it has a size of its own wherever it's used, such as in `<img>`, a design tool, or a browser tab.

## Brand colors

- Keep a logo or brand mark in the colors the brand defines. Never recolor it, for example to `currentColor` so it follows a dark theme, unless the developer asks; propose the change instead, or use a variant the brand provides for dark backgrounds.

## Untrusted SVG

- Never inline SVG from an untrusted source, such as a user upload, or serve it from the app's own origin, without sanitizing it first. SVG can carry scripts, event handlers, and external references; showing it through `<img>` or a CSS background image runs none of them.

## Verification

- Before calling SVG work done, render it at every size it's used at, and on light and dark backgrounds when it follows the text color or sits on both. When nothing can render it, say so instead of describing how it looks.
