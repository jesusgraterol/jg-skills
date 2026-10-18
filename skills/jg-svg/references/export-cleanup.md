## Export cleanup and optimization

### Export settings

Design tools can write SVG that needs little cleanup. Ask the designer for these settings, or use them when exporting yourself:

- **Illustrator** (SVG export options): styling as presentation attributes rather than internal CSS, so the file has no `<style>` block of `.st0` classes; fonts converted to outlines; no embedded raster images; minimal object IDs; 2 decimal places; and the responsive option off, so the file keeps its `width` and `height`.
- **Figma:** "Outline text" on, and "Include 'id' attribute" off unless code targets elements by ID.
- **Inkscape:** convert text with Path > Object to Path, then save as plain SVG, which drops the `inkscape:` and `sodipodi:` namespaces. From the command line, `inkscape in.svg --export-text-to-path --export-plain-svg -o out.svg` does both.

### SVGO

- When a project has no SVG optimizer, propose adding SVGO as a dev dependency, with one package script that optimizes the project's SVG sources, such as `svgo -rf src/icons`. Never add it without the developer.
- Configure it in `svgo.config.mjs`, starting from `preset-default`, with `multipass: true` and a stated `floatPrecision`, such as 2 for icons and 3 for detailed artwork.
- Never enable `removeViewBox` or `removeTitle`: without its `viewBox` the SVG stops scaling, and without its `<title>` it loses its accessible name. SVGO 4 leaves both out of `preset-default`. On SVGO 3 or older, whose preset includes `removeViewBox`, turn it off with `overrides: { removeViewBox: false }` in the preset's `params`.
- `preset-default` shortens IDs with `cleanupIds`, so two optimized files inlined on the same page can both define `id="a"`. Prefer adding `prefixIds` for files that are inlined together.
- Compare a render of each file before and after optimizing, because a lower precision can visibly shift curves.
