import { describe, expect, test } from 'vitest';

import { splitMarkdownLinks } from './markdown-links.ts';

const SITE_URL = 'https://jg-skills.jesusgraterol.dev/';

describe('splitMarkdownLinks', () => {
  test('preserves surrounding markup and formatted link text, and decodes attributes once', () => {
    const html =
      '<p>Read <a href="https://example.com/?x=1&amp;y=2" title="A &gt; B &amp; C"><strong>the</strong> <code>API</code></a> first.</p>';

    expect(splitMarkdownLinks(html, SITE_URL)).toEqual([
      { kind: 'html', html: '<p>Read ' },
      {
        kind: 'external-link',
        href: 'https://example.com/?x=1&y=2',
        html: '<strong>the</strong> <code>API</code>',
        attributes: { href: 'https://example.com/?x=1&y=2', title: 'A > B & C' },
      },
      { kind: 'html', html: ' first.</p>' },
    ]);
  });

  test('keeps local paths, fragments, same-site URLs, email, and escaped code unchanged', () => {
    const html =
      '<p><a href="/skills/">Local</a><a href="#api">Section</a><a href="https://jg-skills.jesusgraterol.dev/">Home</a><a href="mailto:a@example.com">Email</a><code>&lt;a href="https://example.com"&gt;</code></p>';

    expect(splitMarkdownLinks(html, SITE_URL)).toEqual([{ kind: 'html', html }]);
  });

  test('handles several links without dropping intervening internal links or surrounding tags', () => {
    const parts = splitMarkdownLinks(
      '<ul><li><a href="//example.com/a">One</a></li><li><a href="/">Home</a> and <a href="https://other.example/b">Two</a></li></ul>',
      SITE_URL,
    );

    expect(parts.map((part) => part.html).join('')).toBe(
      '<ul><li>One</li><li><a href="/">Home</a> and Two</li></ul>',
    );
    expect(parts.filter((part) => part.kind === 'external-link').map((part) => part.href)).toEqual([
      'https://example.com/a',
      'https://other.example/b',
    ]);
  });

  test('preserves ids, classes, accessible labels, and quoted angle brackets', () => {
    expect(
      splitMarkdownLinks(
        '<a id="docs" class="guide" href=\'https://example.com/docs\' aria-label="API docs" title="A > B">Read</a>',
        SITE_URL,
      ),
    ).toEqual([
      {
        kind: 'external-link',
        href: 'https://example.com/docs',
        html: 'Read',
        attributes: {
          id: 'docs',
          class: 'guide',
          href: 'https://example.com/docs',
          'aria-label': 'API docs',
          title: 'A > B',
        },
      },
    ]);
  });

  test('leaves a missing or malformed destination alone and handles empty content', () => {
    const html = '<a id="api">API</a><a href="https://">Broken</a>';

    expect(splitMarkdownLinks(html, SITE_URL)).toEqual([{ kind: 'html', html }]);
    expect(splitMarkdownLinks('', SITE_URL)).toEqual([]);
  });

  test('does not promote link-like text inside an attribute into page markup', () => {
    const html = '<img alt="<a href=\'https://example.com\'>not a link</a>" src="/image.png">';

    expect(splitMarkdownLinks(html, SITE_URL)).toEqual([{ kind: 'html', html }]);
  });

  test('leaves malformed nested or unclosed anchors intact', () => {
    for (const html of [
      '<a href="https://example.com"><a href="https://other.example">Nested</a></a>',
      '<a href="https://example.com">Unclosed',
    ]) {
      expect(splitMarkdownLinks(html, SITE_URL)).toEqual([{ kind: 'html', html }]);
    }
  });
});
