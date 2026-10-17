## Links

- Prefer opening links to other sites in a new tab, and links within the site in the same tab. A redirect that has to leave in the same tab, such as sign-in or checkout, stays there and shows no external-link icon.
- Every link that opens a new tab must end with an external-link icon after its text, marked `aria-hidden="true"`, and must say "(opens in a new tab)" in its accessible name or description, such as in visually hidden text. A leading icon never replaces it. This includes buttons and menu items that are links.
- Take the icon from the project's icon set, such as Lucide's `external-link` or Material Symbols' `open_in_new`, sized and colored with the link's text. Without an icon set, use a small inline SVG drawn in `currentColor`; never add a package for this icon.
- An icon-only link whose icon already identifies where it goes, such as a repository or social icon, shows no external-link icon. Its accessible name and tooltip still say it opens in a new tab.
- A link that covers a whole card shows an up-right arrow pinned to the card's corner instead of the inline icon.
- Prefer the UI package's external-link component or link variant when it has one. Otherwise, prefer one shared component that adds the target, the icon, and the hidden text over repeating that markup on each link.
- `target="_blank"` already implies `noopener`; leave out `noreferrer` on links to your own and partner sites, and use it on pages whose URLs carry secrets.

Without an icon set:

```html
<a href="https://example.com/docs" target="_blank">
  Documentation
  <svg
    class="ms-1 inline size-3.5 align-[-0.125em]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
  <span class="sr-only">(opens in a new tab)</span>
</a>
```
