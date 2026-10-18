---
name: jg-graphics
description: 'Standards for images generated from HTML templates and SVG with Playwright: text in templates, local fonts, one renderer, exact sizes, and reproducible output. Use when writing, reviewing, or planning generated images such as social media posts, blog post covers, Open Graph or other preview image files, or video graphics and overlays, HTML or SVG templates rendered to PNG or JPEG, or scripts that generate images.'
---

## Application

The agent loads this skill on its own when a task touches its area. This skill's area is generated images: social media posts, blog post covers, preview image files, and video graphics rendered from HTML templates and SVG, and the scripts that generate them.

- It adds domain rules to the task. It never authorizes actions, widens scope, or replaces the workflow or approvals of a skill the developer invoked.
- It ranks with the repository's coding instructions. When they conflict, the coding instructions win, except for the exceptions this skill states for its own area.
- The repository's established conventions win over this skill's naming, layout, and style rules. Its correctness and safety rules, and the exceptions it states for its own area, still apply.
- Check the installed versions first. This skill was written for Playwright 1.64, and for browser behavior as of October 2026. An item marked with a minimum version, written like (18+), applies only when that version or a later one is installed. For an older installed version, follow that version's official documentation.
- Before relying on one of this skill's version-specific items, check it against the current official guidance when the installed version of the technology is newer than the one this skill was written for, or when the version bullet gives a review month for something without an installed version, such as a hosted service or browser behavior, and that month is more than six months before the current date. Where an item differs from that guidance, follow the guidance. Version-specific items are API, syntax, and feature recommendations, and anything marked with a minimum version. This skill's conventions and requirements, such as its naming, layout, style, reuse, and safety rules, keep their usual precedence even where official guidance suggests otherwise. Report each item that looks outdated in the summary, with the installed version and what the current guidance says, and offer there to open an issue on the jg-skills repository, `https://github.com/jesusgraterol/jg-skills`:
  - Never pause or stop a run for the offer, including an autonomous run. When no one can answer, include the pre-filled link described below instead of asking.
  - First search the repository's open issues, and skip the offer when one already covers the item. When the search can't run, say so next to the link, so the developer checks the existing issues before submitting.
  - Open an issue only after the developer agrees, because it is public. Title it `<skill>: <item> looks outdated on <technology> <version>`, and include only the skill name, the outdated item, the installed version, and a link to the official documentation, never code, file paths, or project details. Add no label.
  - Use `gh issue create` when `gh` is installed and signed in. Otherwise give the developer a pre-filled link, `https://github.com/jesusgraterol/jg-skills/issues/new?title=…&body=…`, with both values URL-encoded.
- This skill isn't a complete list. Where it says nothing, follow the official guidance for the installed version, and in new code the task touches, prefer the features that guidance currently recommends over older ones that do the same job, unless the repository has an established pattern for that job. Before using a newer approach instead of one this skill gives, confirm it in that version's official documentation, never from memory alone, and report the item as outdated as described above. When that documentation can't be reached, keep this skill's approach and report that the newer approach couldn't be confirmed, without pausing the run.
- Rules that say "prefer" are defaults: departing from one with a stated reason is fine. Rules that say "never", "always", or "must" are requirements.
- Nothing in this skill requires adding a dependency, enabling a compiler or tool, upgrading, or migrating existing code.

## Scope

- This skill covers making image files. Showing images on web pages belongs to jg-frontend, preview-image metadata such as `og:image` tags to jg-seo, and the SVG files themselves, such as logos and icons, to jg-svg.

## Templates

- Build every image that contains text as an HTML page styled with CSS, with logos, icons, and shapes placed in it as inline SVG. Never set a headline or paragraph as SVG `<text>`: it doesn't wrap, so every line break and width is a guess that breaks when the text changes.
- Keep text inside the layout at any length: let it wrap, and shrink or clamp it to a set number of lines. Check the result with the longest real value, such as the longest title.
- Prefer passing the content in as data, such as a title and a date, over editing the markup for each image.

## Fonts

- Load every font from a local font file with `@font-face`, never from a system font, a generic family, or the network. Before rendering, wait for `document.fonts.ready`, and fail when a declared font didn't load instead of rendering with a fallback.

## Rendering

- Use one renderer per project: Playwright's Chromium, at the version the project pins. Never fall back to another renderer, such as a system browser, ImageMagick, or librsvg, because each draws text, gradients, and filters differently.
- When the project doesn't have Playwright, propose adding it as a dev dependency together with its Chromium install (`npx playwright install chromium`). Never add either without the developer. Until then, write the template and say that the image isn't rendered yet.
- Set the viewport to the output's exact pixel size and render at one image pixel per CSS pixel, with a device scale factor of 1. Produce larger versions only when asked.

## Sizes and formats

- Take the pixel size from the request or a project preset. When neither gives one, use the platform's current official guidance, and say which size you used and why. Never guess.
- Export overlays as PNG with a transparent background, using `omitBackground: true` on the screenshot, because JPEG can't carry transparency.

## Sources and outputs

- Keep each image's source, the template with its SVG and fonts, in the repository next to the script that renders it, and regenerate the image by running the script, never by editing the output.
- Prefer one package script that renders the project's images, so anyone who runs it gets the same output.
