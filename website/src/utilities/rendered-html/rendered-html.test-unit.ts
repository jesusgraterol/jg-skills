// @vitest-environment node
import { describe, expect, test } from 'vitest';

import {
  decodeHtmlEntities,
  findUnsafeAttributes,
  findUnsafeMarkup,
  isUnsafeUrl,
} from './rendered-html.ts';

// what the site's Markdown renderer emitted for safe content: an autolink, escaped text, inline
// code, a link title and image alt text holding a raw <, a heading, a table, and a code block
const SAFE_RENDERED_MARKDOWN = [
  '<h2 id="rules">Rules</h2>',
  '<p><a href="https://example.com">https://example.com</a> and a &lt; b and <code>&lt;dialog&gt;</code> and <a href="https://x.dev" title="a<b>c">t</a> and <img src="https://x.dev/i.png" alt="alt <b>"></p>',
  '<p>Mail <a href="mailto:dev@example.com">dev</a>, read <a href="references/forms.md">forms</a>, or see <a href="https://x.dev/?a=1&#x26;b=2">x</a>.<br></p>',
  '<table>\n<thead>\n<tr>\n<th>Object</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td><strong>Table</strong></td>\n</tr>\n</tbody>\n</table>',
  '<ul>\n<li><input type="checkbox" checked disabled> done</li>\n</ul>',
  '<pre class="astro-code astro-code-themes github-light-default github-dark-default" style="background-color:#ffffff;--shiki-dark-bg:#0d1117;color:#1f2328;--shiki-dark:#e6edf3; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;" tabindex="0" data-language="bash"><code><span class="line"><span style="color:#6E7781;--shiki-dark:#8B949E"># Usage: archive-uploads.sh [-h] &lt;archive-path&gt;</span></span></code></pre>',
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

  test('accepts the shared link icon only in decorated page output, never source Markdown', () => {
    const icon =
      '<svg class="lucide lucide-external-link" aria-hidden="true" data-external-icon="true"><path d="M1 1"></path></svg>';

    expect(findUnsafeMarkup(icon)).toBe('<svg> element');
    expect(findUnsafeMarkup(icon, true)).toBeUndefined();
  });

  test.each([
    ['an unmarked SVG', '<svg><path d="M1 1"></path></svg>', '<svg> element'],
    ['a standalone path', '<path d="M1 1"></path>', '<path> element'],
    [
      'a non-decorative icon',
      '<svg class="lucide-external-link" aria-hidden="false" data-external-icon="true"></svg>',
      '<svg> element',
    ],
    [
      'an active child inside an icon',
      '<svg class="lucide-external-link" aria-hidden="true" data-external-icon="true"><foreignObject></foreignObject></svg>',
      '<foreignobject> element',
    ],
    [
      'a handler on an icon path',
      '<svg class="lucide-external-link" aria-hidden="true" data-external-icon="true"><path onload="alert(1)"></path></svg>',
      'onload attribute',
    ],
    [
      'an unsafe URL on an icon',
      '<svg class="lucide-external-link" aria-hidden="true" data-external-icon="true" href="javascript:alert(1)"></svg>',
      'href="javascript:alert(1)"',
    ],
    [
      'an unclosed icon',
      '<svg class="lucide-external-link" aria-hidden="true" data-external-icon="true"><path></path>',
      'unclosed external-link icon',
    ],
  ])('rejects %s even in decorated page output', (_name, html, problem) => {
    expect(findUnsafeMarkup(html, true)).toBe(problem);
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
