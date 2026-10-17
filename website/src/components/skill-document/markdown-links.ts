import { decodeHtmlEntities } from '../../utilities/rendered-html/index.ts';

// ordinary Markdown between links, or a link rendered by the site's shared component
export type IMarkdownPart =
  | { kind: 'html'; html: string }
  | { kind: 'external-link'; href: string; html: string; attributes: Record<string, string> };

// Reading each complete tag keeps link-like text in quoted attributes out of the link scan.
const TAG_PATTERN = /<\/?([a-z][^\s/>]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/giu;
const ATTRIBUTE_PATTERN = /([^\s"'=<>/`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gu;

/**
 * Splits validated, rendered Markdown around external web links, preserving the surrounding
 * markup and inline formatting so Astro can render each link through ExternalLink.
 * @param html The Markdown HTML already checked by the skill catalog's markup validator.
 * @param siteUrl The site's canonical URL, used to distinguish same-site links.
 * @returns Ordered HTML fragments and external links, with HTML entities decoded in attributes.
 */
export const splitMarkdownLinks = (html: string, siteUrl: string): IMarkdownPart[] => {
  const parts: IMarkdownPart[] = [];
  const siteOrigin = new URL(siteUrl).origin;
  let cursor = 0;
  let anchorDepth = 0;
  let anchor:
    | {
        start: number;
        contentStart: number;
        attributes: Record<string, string>;
        href: string | undefined;
        nested: boolean;
      }
    | undefined;

  for (const tag of html.matchAll(TAG_PATTERN)) {
    if (tag[1]?.toLowerCase() !== 'a') continue;

    if (!tag[0].startsWith('</')) {
      anchorDepth += 1;

      if (anchorDepth > 1) {
        if (anchor) anchor.nested = true;
        continue;
      }

      const attributes = Object.fromEntries(
        [...(tag[2] ?? '').matchAll(ATTRIBUTE_PATTERN)].map((attribute) => [
          (attribute[1] ?? '').toLowerCase(),
          decodeHtmlEntities(attribute[2] ?? attribute[3] ?? attribute[4] ?? ''),
        ]),
      );
      let href: string | undefined;

      if (attributes['href'] !== undefined) {
        try {
          const destination = new URL(attributes['href'], siteUrl);

          if (
            ['http:', 'https:'].includes(destination.protocol) &&
            destination.origin !== siteOrigin
          ) {
            href = destination.href;
          }
        } catch {
          // Leave a malformed destination as written; it is not an external-link candidate.
        }
      }

      anchor = {
        start: tag.index,
        contentStart: tag.index + tag[0].length,
        attributes,
        href,
        nested: false,
      };
      continue;
    }

    if (anchorDepth === 0) continue;
    anchorDepth -= 1;
    if (anchorDepth !== 0) continue;

    if (anchor && !anchor.nested && anchor.href !== undefined) {
      if (anchor.start > cursor)
        parts.push({ kind: 'html', html: html.slice(cursor, anchor.start) });
      parts.push({
        kind: 'external-link',
        href: anchor.href,
        html: html.slice(anchor.contentStart, tag.index),
        attributes: anchor.attributes,
      });
      cursor = tag.index + tag[0].length;
    }
    anchor = undefined;
  }

  if (cursor < html.length) parts.push({ kind: 'html', html: html.slice(cursor) });

  return parts;
};
