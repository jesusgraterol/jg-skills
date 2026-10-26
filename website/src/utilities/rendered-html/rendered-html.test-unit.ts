// @vitest-environment node
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { renderCodeWindowHeader } from 'jg-personal-astro-ui/code-window';
import { createCodeWindowPlugin } from 'jg-personal-astro-ui/code-window-plugin';
import { externalLinkPlugin } from 'jg-personal-astro-ui/external-link-plugin';
import { renderNewTabMarker } from 'jg-personal-astro-ui/new-tab-marker-markup';
import { SYNTAX_THEME } from 'jg-personal-astro-ui/syntax-theme';
import { beforeAll, describe, expect, test } from 'vitest';

import {
  decodeHtmlEntities,
  findUnsafeAttributes,
  findUnsafeMarkup,
  isUnsafeUrl,
} from './rendered-html.ts';

// what the site's Markdown renderer emits for safe content without code: an autolink, escaped text,
// inline code, a link title and image alt text holding a raw <, a heading, and a table
const SAFE_RENDERED_MARKDOWN = [
  '<h2 id="rules">Rules</h2>',
  '<p><a href="https://example.com">https://example.com</a> and a &lt; b and <code>&lt;dialog&gt;</code> and <a href="https://x.dev" title="a<b>c">t</a> and <img src="https://x.dev/i.png" alt="alt <b>"></p>',
  '<p>Mail <a href="mailto:dev@example.com">dev</a>, read <a href="references/forms.md">forms</a>, or see <a href="https://x.dev/?a=1&#x26;b=2">x</a>.<br></p>',
  '<table>\n<thead>\n<tr>\n<th>Object</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td><strong>Table</strong></td>\n</tr>\n</tbody>\n</table>',
  '<ul>\n<li><input type="checkbox" checked disabled> done</li>\n</ul>',
].join('\n');

describe('decodeHtmlEntities', () => {
  test('decodes decimal, hexadecimal, and common named references', () => {
    expect(decodeHtmlEntities('&#106;&#x61;&amp;&LT;&quot;&apos;&gt;')).toBe('ja&<"\'>');
  });

  test('decodes each reference once and leaves unknown named references as written', () => {
    expect(decodeHtmlEntities('&#x26;#106; &colon; &copy;')).toBe('&#106; &colon; &copy;');
  });

  test('reads a reference beyond the last code point as the replacement character', () => {
    expect(decodeHtmlEntities('&#x110000;&#99999999999;')).toBe('\uFFFD\uFFFD');
  });
});

describe('isUnsafeUrl', () => {
  test.each([
    'https://example.com/path?q=1#top',
    'http://example.com',
    'MAILTO:dev@example.com',
    '/skills/jg-plan/',
    'references/forms.md',
    '#install',
    'java%09script:alert(1)',
    'https://x.dev/?a=1&amp;b=2',
  ])('accepts %s', (url) => {
    expect(isUnsafeUrl(url)).toBe(false);
  });

  test.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    '&#106;avascript:alert(1)',
    '&#x6A;avascript:alert(1)',
    'java&#x09;script:alert(1)',
    'java\nscript:alert(1)',
    ' \u0001javascript:alert(1)',
    'javascript&colon;alert(1)',
    'jav&Tab;ascript:alert(1)',
    '&#106avascript:alert(1)',
    'ftp://example.com/file',
  ])('rejects %s', (url) => {
    expect(isUnsafeUrl(url)).toBe(true);
  });
});

describe('findUnsafeMarkup', () => {
  test('accepts the markup Markdown and its code highlighter produce', () => {
    expect(findUnsafeMarkup(SAFE_RENDERED_MARKDOWN)).toBeUndefined();
  });

  describe("jg-personal-astro-ui's Markdown markup", () => {
    // a skill page's Markdown, rendered as the site renders it: Sätteri with Astro's Shiki and the
    // package's syntax theme, code windows, and new-tab markers
    let rendered = '';
    // one code window, built from the package's header and Shiki's highlighted code
    let codeWindow = '';
    // an external link ending with the package's new-tab marker
    const externalLink = `<a href="https://example.com/" target="_blank" rel="noreferrer">Example${renderNewTabMarker()}</a>`;

    beforeAll(async () => {
      const processor = await createSatteriMarkdownProcessor({
        hastPlugins: [
          createCodeWindowPlugin({ copyDisplay: 'icon' }),
          externalLinkPlugin({ siteUrl: 'https://jg-skills.dev' }),
        ],
        shikiConfig: { theme: SYNTAX_THEME, wrap: true },
      });
      const { code } = await processor.render(
        [
          'See [the docs](https://example.com/docs), [a skill](/skills/jg-plan/), and [mail](mailto:a@b.dev).',
          '',
          '```ts',
          "// a comment\nconst greeting: string = '<b>hi</b>';",
          '```',
          '',
          '```',
          'plain text',
          '```',
        ].join('\n'),
      );
      rendered = code;
      const pre = /<pre[\s\S]*?<\/pre>/u.exec(code)?.[0] ?? '';
      codeWindow = `<figure class="jg-code-window" data-code-window="">${renderCodeWindowHeader({ caption: 'ts', copyDisplay: 'icon' })}${pre}</figure>`;
    });

    test('accepts code windows and new-tab markers as the site renders them', () => {
      expect(rendered.match(/data-code-window/gu)).toHaveLength(2);
      expect(rendered).toContain('data-new-tab-marker');
      expect(findUnsafeMarkup(rendered)).toBeUndefined();
    });

    test("accepts the package's own header, marker, and Shiki's code", () => {
      expect(findUnsafeMarkup(`${codeWindow}<p>${externalLink}</p>`)).toBeUndefined();
    });

    test.each([
      [
        'an image in the header',
        (html: string) => html.replace('</figcaption>', '<img src="x.png"></figcaption>'),
        '<img> element in a code window',
      ],
      [
        'a script in the code',
        (html: string) => html.replace('</code>', '<script>alert(1)</script></code>'),
        '<script> element in a code window',
      ],
      [
        'a handler on the copy button',
        (html: string) =>
          html.replace('<button type="button"', '<button onclick="alert(1)" type="button"'),
        'onclick attribute',
      ],
      [
        'another attribute on the copy button',
        (html: string) =>
          html.replace(
            '<button type="button"',
            '<button data-copy-url="https://evil.dev/" type="button"',
          ),
        '<button> attributes in a code window',
      ],
      [
        'a link in the header',
        (html: string) =>
          html.replace('</figcaption>', '<a href="https://x.dev">x</a></figcaption>'),
        '<a> element in a code window',
      ],
      [
        'a style that does more than colour a token',
        (html: string) =>
          html.replace(
            /<span style="color:var\(--jg-syntax-[a-z\d-]+\)[^"]*"/u,
            '<span style="background:url(https://x.dev/)"',
          ),
        'style attribute in a code window',
      ],
      [
        'copy controls without enhancement protection',
        (html: string) => html.replace(' inert ', ' '),
        '<button> attributes in a code window',
      ],
      [
        'a nonempty inert attribute',
        (html: string) => html.replace(' inert ', ' inert="false" '),
        'inert attribute in a code window',
      ],
      [
        'a different live-status role',
        (html: string) => html.replace('role="status"', 'role="button"'),
        'role attribute in a code window',
      ],
      [
        'different live-status atomicity',
        (html: string) => html.replace('aria-atomic="true"', 'aria-atomic="false"'),
        'aria-atomic attribute in a code window',
      ],
      [
        'a different live-status announcement',
        (html: string) => html.replace('aria-live="polite"', 'aria-live="assertive"'),
        'aria-live attribute in a code window',
      ],
      [
        'a copy button outside its wrapper',
        (html: string) =>
          html.replace(
            'data-code-window="">',
            'data-code-window=""><button type="button" class="x" data-copy-button data-copy-context="code"></button>',
          ),
        '<button> element in a code window',
      ],
      [
        'an unclosed window',
        (html: string) => html.replace('</figure>', ''),
        'unclosed code window',
      ],
      [
        "a window that is not exactly the package's",
        (html: string) => html.replace('class="jg-code-window"', 'class="jg-code-window x"'),
        '<figure> element',
      ],
    ])('rejects a code window with %s', (_name, tamper, problem) => {
      expect(findUnsafeMarkup(tamper(codeWindow))).toContain(problem);
    });

    test.each([
      ['outside a link', renderNewTabMarker(), '<svg> element'],
      [
        'with another attribute',
        externalLink.replace('data-new-tab-marker', 'data-new-tab-marker onload="x"'),
        'onload attribute',
      ],
      [
        "that is not exactly the package's",
        externalLink.replace('viewBox="6 6 12 12"', 'viewBox="0 0 24 24"'),
        '<svg> element',
      ],
      [
        'holding more than its arrow',
        externalLink.replace('</svg>', '<foreignObject></foreignObject></svg>'),
        '<foreignobject> element in a new-tab marker',
      ],
      [
        'holding a path with a handler',
        externalLink.replace('<path d="M7 7h10v10"/>', '<path d="M7 7h10v10" onclick="x"/>'),
        'onclick attribute',
      ],
    ])('rejects a new-tab marker %s', (_name, html, problem) => {
      expect(findUnsafeMarkup(`<p>${html}</p>`)).toContain(problem);
    });

    test('rejects a style anywhere outside a code window', () => {
      expect(findUnsafeMarkup('<p><span style="color:red">red</span></p>')).toBe('style attribute');
    });
  });

  test.each([
    [
      // backticks around blank lines: the old source check read the script as inline code
      'a script between stray backticks',
      '<p>PROBE-1 Use `this</p>\n<script>window.__probe=1</script>\n<p>and` that.</p>',
      '<script> element',
    ],
    [
      'a link with an encoded script scheme',
      '<p>PROBE-2 <a href="javascript:alert(1)">encoded</a></p>',
      'href="javascript:alert(1)"',
    ],
    [
      'a reference-style script link',
      '<p>PROBE-3 <a href="javascript:alert(3)">reference</a></p>',
      'href="javascript:alert(3)"',
    ],
    [
      'an event handler on an image',
      '<p>PROBE-4 <img src=x onerror=alert(4)></p>',
      'onerror attribute',
    ],
    [
      'a script autolink',
      '<p><a href="vbscript:msgbox(6)">vbscript:msgbox(6)</a></p>',
      'href="vbscript:msgbox(6)"',
    ],
    [
      'a data link',
      '<p><a href="data:text/html;base64,PHNjcmlwdD4=">data</a></p>',
      'href="data:text/html;base64,PHNjcmlwdD4="',
    ],
    [
      'a raw link whose scheme is a named reference',
      '<p><a href="javascript&colon;alert(1)">x</a></p>',
      'href="javascript&colon;alert(1)"',
    ],
    ['an uppercase script element', '<p><SCRIPT>x</SCRIPT></p>', '<script> element'],
    ['a placeholder that would vanish', '<p>Run jg-<skill> with arguments.</p>', '<skill> element'],
    ['a closing tag', '<p>Text</div> more.</p>', '<div> element'],
    ['a comment', '<p>Hidden <!-- note --> text.</p>', 'malformed markup <!-- note -->'],
    ['a slash between attributes', '<p><img/src=x/onerror=alert(1)></p>', 'malformed markup'],
    [
      'an attribute glued to the one before it',
      '<p><a href="x"onclick="alert(1)">x</a></p>',
      'malformed markup',
    ],
  ])('rejects %s', (_caseName, html, problem) => {
    expect(findUnsafeMarkup(html)).toContain(problem);
  });
});

describe('findUnsafeAttributes', () => {
  test('accepts a page whose scripts and styles hold markup-like code', () => {
    const page = [
      '<!DOCTYPE html><html lang="en"><head>',
      '<link rel="icon" href="/favicon.svg"><script type="module" src="/_astro/page.js"></script>',
      '<script type="module">if (a <b && c) el.innerHTML = "<img onerror=x>";</script>',
      '<style>a[href^="javascript:"] { color: red; }</style>',
      '</head><body><a href="https://x.dev" title="a > b">x</a></body></html>',
    ].join('');

    expect(findUnsafeAttributes(page)).toBeUndefined();
  });

  test.each([
    ['an event handler', '<body onload="alert(1)">', 'onload attribute'],
    ['a handler after a slash', '<img/src="x"/onerror=alert(1)>', 'onerror attribute'],
    ['a handler after a quoted >', '<a title="a > b" onclick="x">', 'onclick attribute'],
    ['a script URL', '<a href="&#106;avascript:alert(1)">x</a>', 'href="&#106;avascript:alert(1)"'],
    ['a form action', '<button formaction="javascript:alert(1)">x</button>', 'formaction='],
  ])('rejects %s', (_caseName, html, problem) => {
    expect(findUnsafeAttributes(html)).toContain(problem);
  });
});
