---
name: jg-frontend
description: Frontend standards for accessible, responsive, light- and dark-themed UI that feels native on mobile, UI-package reuse, forms, dialogs and feedback, motion, single-page-app delivery, and Tailwind CSS. Use when writing, reviewing, or planning UI components, pages, links, layout, styling, CSS or Tailwind, forms, dialogs, toasts or error states, accessibility, responsive, mobile, or theme behavior, motion, single-page-app hosting headers or chunk loading, or frontend tests.
---

## Application

The agent loads this skill on its own when a task touches its area. This skill's area is frontend UI: components, pages, layout, styling, CSS and Tailwind, forms, dialogs and feedback, accessibility, responsive, mobile, and theme behavior, motion, single-page-app delivery, and frontend tests.

- It adds domain rules to the task. It never authorizes actions, widens scope, or replaces the workflow or approvals of a skill the developer invoked.
- It ranks with the repository's coding instructions. When they conflict, the coding instructions win, except for the exceptions this skill states for its own area.
- The repository's established conventions win over this skill's naming, layout, and style rules. Its correctness and safety rules, and the exceptions it states for its own area, still apply.
- Check the installed versions first. This skill was written for Tailwind CSS 4.3, and for browser behavior as of October 2026. An item marked with a minimum version, written like (18+), applies only when that version or a later one is installed. For an older installed version, follow that version's official documentation.
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

- Before writing or reviewing a dialog, drawer, popover, menu, or tooltip, or using a native feature such as `<dialog>`, `popover`, `inert`, or `:has()` where no UI-package component fits, read `references/dialogs-and-overlays.md`. Use only native features that are Baseline for the supported browsers, or ship a fallback.
- Before writing or reviewing toasts, inline errors, empty or loading states, pending actions, or status messages, read `references/feedback-and-errors.md`. Never show raw exception text.
- Before creating or changing a form or a form field, read `references/forms.md`. Client validation never replaces server validation.
- Before adding or changing a link to another site, or any link that opens a new tab, read `references/links.md`. Every link that opens a new tab says "opens in a new tab" in its accessible name, and ends with an external-link icon unless it is an icon-only link whose icon shows where it goes.
- Before adding or changing images, embeds, or other content that loads late, read `references/loading-performance.md`. Reserve space for late-loading content, so the page never shifts as it loads.
- Before adding or changing animation or transitions, read `references/motion.md`. Every new or modified animation must have an equivalent reduced-motion path.
- Before changing a single-page app's hosting headers, fallback rewrites, or chunk loading, read `references/single-page-app-delivery.md`.
- Before writing or reviewing Tailwind classes, CSS, or Tailwind configuration, read `references/tailwind-and-css.md`. Never invent class names, tokens, or variants the project doesn't define.

## Web and accessibility guidance

When a task touches frontend code, UI behavior, layout, styling, components, pages, design-system tokens, or frontend tests, always preserve and validate:

- responsive behavior
- accessibility behavior
- light and dark theme behavior

Apply this requirement to new UI, modified UI, frontend bug fixes, refactors, and styling changes. Do not deliver desktop-only, mouse-only, light-mode-only, or inaccessible UI.

### Responsive UI requirements

Frontend implementations must be responsive from `320px` wide through large desktop screens.

They must:

- work at `320px` viewport width without horizontal page overflow
- scale across mobile, tablet, laptop, and large desktop layouts
- use mobile-first layouts by default
- on mobile, prefer simple native-feeling hierarchy, not shrunken desktop cards/panels/containers
- on mobile, flatten/remove outer cards, nested panels, redundant borders, shadows, backgrounds, gutters, and vertical spacing without meaningful grouping, containment, elevation, scrolling, selection, or interaction-state purpose
- on mobile, use available width with compact touch-friendly insets; retain panels/generous spacing only for material clarity, usability, or established mobile design
- on mobile, recompose rather than merely stack desktop panels when needed; prefer established edge-to-edge sections, lists, tabs, accordions, drawers, or sheets when more natural
- progressively enhance at configured breakpoints; with unchanged Tailwind defaults, use `sm`, `md`, `lg`, `xl`, and `2xl`
- avoid fixed widths that break narrow screens
- prefer fluid sizing, wrapping, stacking, and flexible grids
- keep text, controls, dialogs, forms, tables, and navigation usable on small screens
- preserve accessibility, keyboard usability, and readable touch targets across supported viewport sizes

Do not assume a component is desktop-first unless explicitly requested.

### Light and dark theme requirements

Frontend implementations must support light and dark modes through the repository's existing theme strategy.

They must:

- use existing tokens, CSS variables, Tailwind theme utilities, or component variants, not hard-coded one-off colors
- preserve sufficient contrast in both themes for text, icons, controls, borders, focus indicators, validation, and disabled states
- keep hover, active, focus-visible, selected, loading, empty, error, success, and disabled states clear in both themes
- avoid color choices that only work in light mode or only work in dark mode
- keep theme behavior consistent across responsive breakpoints and interactive states
- avoid introducing a new theme mechanism unless the requested change explicitly requires it
- set the CSS `color-scheme` property for each theme, so native controls, scrollbars, and form fields follow it

For surfaces and states:

- A surface that keeps one scheme regardless of theme, such as an always-dark panel or an inverted `bg-primary` block, sets its own `color-scheme` and restyles what the app themes with tokens, such as `::selection`, placeholders, focus rings, and hover states, checking contrast on that surface.
- Prefer `color-mix(in oklab, …)` when mixing a hue with a near-neutral color, such as the foreground or background; `oklch` interpolates the neutral's tiny hue and can shift the result.
- Style interaction states, such as copied, open, or selected, with `data-*` or `aria-*` variants on the element, not custom CSS in `@layer base` or `components`, which utilities in a later layer override.

Without an existing theme mechanism, a limitation/follow-up note does not satisfy mandatory dual-theme support. Check whether existing design-system primitives can support both locally. Otherwise explain that a theme mechanism is required and materially expands scope, then ask one focused question before implementation. Do not silently add a broad system or finish single-theme UI.

### UI package and component reuse

For choosing which component to use in frontend code the task adds or materially changes, this subsection is an exception to the codebase-pattern precedence in the repository's coding instructions: local duplication, inconsistent usage, or a nearby one-off is not by itself a reason to bypass an official UI or design-system package. Preserve existing public contracts, and don't migrate unrelated legacy UI only for consistency.

Before planning or building a new, replaced, or materially changed UI element, identify the official UI or design-system package for the affected application and inspect its smallest relevant public surface: entry points and exports, APIs, variants, docs and examples, and existing usage, including established application-owned compositions.

- Use official components, primitives, supported compositions, or established application abstractions built on them whenever they satisfy the task. Import through the package's public boundary, and preserve its variants, tokens, interactions, accessibility, responsiveness, and themes.
- Do not recreate, copy, fork, or independently style an equivalent general-purpose component for speed, simplicity, or familiarity, and never deep-import private files or bypass public APIs.
- Feature components may compose official exports for domain structure, behavior, state, data orchestration, or stable application contracts. Don't add pass-through or styling-only wrappers that only rename or repackage exports, bypass variants, or replace tokens.
- Before rejecting the closest official option, inspect its props, variants, slots, compositions, and package-owned extension points. Create a local general-purpose component only when no export, composition, or established abstraction fits, or when using one would break an explicit requirement or a higher-precedence correctness, accessibility, compatibility, or performance constraint, and align it with the package's tokens and conventions.
- Extend the UI package only for genuinely reusable behavior within the authorized scope; otherwise use the smallest justified feature-specific composition or local exception.
- In required plans, name the official component, primitive, composition, or abstraction to reuse, or explain its absence. In completion summaries, name the UI exports inspected and justify each new local general-purpose component.
- When a repository has an official UI package, propose, don't add, lint rules such as `no-restricted-imports` that block direct imports of the libraries the package wraps.

New or substantially redesigned UI must be polished, contemporary, product-specific, and consistent with established branding/design systems. Before new primitives or one-off styles, inspect/reuse brand guidance, tokens, typography, colors, spacing, icons, variants, the internal UI library, reusable components, and screen patterns. Use intentional hierarchy, typography, spacing, density, composition, and relevant interaction states. Avoid generic library layouts or decoration that harms clarity, accessibility, responsiveness, or performance.

For product explanations/demonstrations, prefer realistic content and actual reusable components or faithful simulations over decorative empty mockups.

When building UI:

- Prefer semantic HTML over generic `div`s.
- Use landmarks when appropriate: `main`, `nav`, `section`, `article`, `header`, `footer`, `aside`.
- Preserve valid heading hierarchy.
- Ensure keyboard accessibility.
- Use correct native elements before falling back to `role`.
- Use ARIA only when needed and ensure it is correct.
- Specify image dimensions explicitly when appropriate.
- Meet WCAG 2.2 AA, including targets of at least 24 by 24 CSS pixels, or spaced as its target-size exceptions allow, and a focused component that sticky headers, footers, or overlays never hide entirely.
- Prefer one `h1` per page that names its content.
- Keep element IDs unique, and give every same-page `#fragment` link a target.
- Remote images that can fail, such as avatars, render a same-size fallback, such as initials. An avatar next to the person's visible name gets `alt=""`.
- Copy buttons call `navigator.clipboard.writeText` in the click handler, before any `await`, report success only after it resolves, and on failure show manual-copy guidance with the text left selectable.
- Prefer a button component's size variants over height or size utilities on one instance; add a touch size to the UI package rather than to one button.
- Prefer removing decoration before adding it: no divider between blocks that spacing already separates, a leading icon only when it identifies the subject or its state, and no breadcrumb trail on a top-level page.

```html
<button type="button">
  <span class="some-icon" aria-hidden="true">add</span>
  Add Book
</button>
```

```html
<button type="button" aria-label="Add book">
  <span class="some-icon" aria-hidden="true">add</span>
</button>
```

```html
<img src="/logo.png" width="180" height="25" alt="Company logo" />
```

## Layout and long content

Layouts hold up with long, real content at every width:

- Let flex and grid children shrink below their content: give a flex child that holds text `min-w-0`, and size grid columns with `grid-cols-<n>` or `minmax(0,1fr)`, never a bare `1fr` or a `grid` without columns, because both default to the content's minimum width.
- Prefer breaking long paths and identifiers after separators (`/ _ . -`) with `<wbr>`, which copying ignores, and use (4.1+) `wrap-break-word` or `wrap-anywhere` as the last resort. Don't put `break-all` on text with ordinary words; tokens without separators, such as hashes and addresses, may break anywhere.
- Prefer letting an overflowing tab list scroll horizontally with complete labels over truncating them, and scroll a tab that receives keyboard focus fully into view.
- Prefer a line-height of at least 1 on headings that can wrap, and check tighter display leading at 320px so lines never collide. Never give a heading a fixed height.
- Keep fields that share a row aligned when one shows an error or a longer label; prefer `grid-rows-subgrid`, with each field spanning its label, control, and message rows.
- Truncated text, such as `truncate` or `line-clamp-*`, stays available in full to keyboard and assistive-technology users, through the accessible name, a tooltip that also opens on focus, or a detail view.
- Test layouts with the longest realistic content, such as long names, paths, and translated labels, at 320px.

## Native feel on mobile

Application UIs, meaning signed-in or task-focused apps rather than content or marketing sites, must look and feel like native apps on phones and tablets:

- Never block zoom (WCAG 1.4.4). The viewport is `width=device-width, initial-scale=1, viewport-fit=cover`, without `maximum-scale`, `user-scalable=no`, or a pinch-blocking `touch-action` on `html` or `body`.
- Focusing a field never zooms the page. iOS Safari zooms into focused fields whose text is smaller than 16px, an undocumented but long-standing threshold, so on touch devices keep inputs, selects, and editors at 16px or larger, for example with `text-base pointer-fine:text-sm` (4.1+), and check by focusing them in iOS Safari or its simulator.
- Content never sits under notches, status bars, or the home indicator: pad fixed bars, sheets, and edge-to-edge sections with `max(<spacing>, env(safe-area-inset-*))` arbitrary values, since Tailwind has no safe-area utilities.
- Full-height layouts fit the visible viewport: `h-dvh` for fixed app shells and `min-h-svh` for growing pages, never `h-screen` or `100vh`.
- The on-screen keyboard never hides the focused field or its submit action, and bottom bars never ride above it. Prefer `interactive-widget=resizes-content` in the viewport for composer screens (Chromium Android 108+; Safari ignores it), and use `visualViewport` where Safari needs it.
- On touch devices at any width, targets are at least 44 by 44 CSS pixels with space between neighbors. Set them with `pointer-coarse:` (4.1+), not a width breakpoint, so tablets get them too.
- Nothing requires hover: controls revealed on hover stay visible without a hover-capable pointer and on `focus-within`. Tailwind's `hover:` already applies only under `(hover: hover)`; custom CSS must do the same.
- Tappable elements show an `active:` pressed state, because preflight removes the tap highlight. App chrome, such as tab bars and buttons, uses `select-none` and `[-webkit-touch-callout:none]`; content people may copy never does.
- Scrolling inside sheets, drawers, menus, and shell panels never chains to the page behind: put `overscroll-contain` on the overflowing container. Keep native pull-to-refresh unless the app provides its own.
- On phones, 3 to 5 top-level destinations sit in a bottom tab bar within thumb reach and the rest in a drawer; dialogs and contextual actions open as bottom sheets or full-screen pages.
- Never depend on browser chrome: Home Screen sites open standalone by default (Safari 26+), and `display-mode` reporting isn't Baseline. Screens below the top level have an in-app back control, errors offer a retry, the system back gesture closes the topmost sheet first (native `<dialog>` and popover close requests, `CloseWatcher` where supported, or a history entry), and Back restores the previous screen's scroll and state.
- Prefer same-document View Transitions (`document.startViewTransition`, Baseline 2025) for screen changes, feature-detected and skipped under reduced motion.
- Installability, manifests, and service workers belong to jg-pwa.

## Focus management

- When an action removes, hides, or replaces the focused element, move focus to a logical target, such as the next item, the control that opened it, or the new view's heading. Never leave focus on `body`.
- A scroll container with no focusable content gets `tabindex="0"` and a visible focus style and, when its content is meaningful, `role="region"` and an accessible name, so keyboard users can scroll it.
