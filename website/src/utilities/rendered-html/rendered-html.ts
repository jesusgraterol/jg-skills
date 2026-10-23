// named character references the site's renderers emit; any other one is left as written
const NAMED_HTML_ENTITIES = { amp: '&', apos: "'", gt: '>', lt: '<', quot: '"' } as const;

// the elements Markdown and its code highlighter produce; any other element is raw HTML
const MARKDOWN_ELEMENTS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'input',
  'li',
  'ol',
  'p',
  'pre',
  'section',
  'span',
  'strong',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);

// attributes a browser follows as a URL, where a script scheme would run code
const URL_ATTRIBUTES = new Set(['action', 'formaction', 'href', 'src', 'xlink:href']);

// the URL schemes a page may link to; relative URLs carry no scheme at all
const SAFE_URL_SCHEMES = new Set(['http', 'https', 'mailto']);

// the opening character of a tag, a closing tag, a comment or doctype, or a processing instruction
const MARKUP_OPENER_PATTERN = /<[!/?a-zA-Z]/gu;

// one start or end tag at the current position; a quoted value is read whole, so a < or > in it
// does not end the tag
const TAG_PATTERN = /<\/?([a-zA-Z][^\s/>]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/uy;

// one tag at the current position read to its first >, for markup the pattern above cannot read
const LOOSE_TAG_PATTERN = /<\/?([a-zA-Z][^\s/>]*)([^>]*)>/uy;

// the attribute text a Markdown renderer writes: names separated by whitespace, each with an
// optional value
const WELL_FORMED_ATTRIBUTES_PATTERN =
  /^(?:\s+[^\s"'=<>/`]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?$/u;

// one attribute and its value, also when a slash or nothing separates it from the one before, as
// browsers read them
const ATTRIBUTE_PATTERN = /([^\s"'=<>/`]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/gu;

// script and style bodies, whose text is code rather than markup
const SCRIPT_OR_STYLE_PATTERN = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/giu;

// the highest Unicode code point; browsers read a reference beyond it as the replacement character
const MAX_CODE_POINT = 0x10ffff;

/** Converts a numeric character reference to its character, as browsers do. */
const decodeCodePoint = (codePoint: number): string =>
  codePoint > MAX_CODE_POINT ? '\uFFFD' : String.fromCodePoint(codePoint);

/**
 * Decodes HTML character references, so text and URLs are judged as browsers read them.
 * @param input Text that may contain decimal, hexadecimal, or common named character references.
 * @returns The text with those references decoded; other named references are left as written.
 */
export const decodeHtmlEntities = (input: string): string =>
  input.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/giu, (_match, entity: string) => {
    if (/^#x/iu.test(entity)) return decodeCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return decodeCodePoint(Number.parseInt(entity.slice(1), 10));

    return NAMED_HTML_ENTITIES[entity.toLowerCase() as keyof typeof NAMED_HTML_ENTITIES];
  });

/**
 * Decides whether a URL attribute value could run script when followed.
 * @param value The attribute value as written in the HTML.
 * @returns True for any scheme other than http, https, and mailto, and for a value whose scheme
 * part still holds a character reference, which a browser could decode into a script scheme.
 */
export const isUnsafeUrl = (value: string): boolean => {
  // browsers drop tabs and line breaks anywhere in a URL, and controls and spaces at its ends,
  // before they read the scheme
  const url = decodeHtmlEntities(value)
    .replace(/[\t\n\r]/gu, '')
    .replace(/^[\p{Cc} ]+|[\p{Cc} ]+$/gu, '');
  const head = url.split(/[/?#]/u, 1)[0] ?? '';

  if (head.includes('&')) return true;

  const scheme = /^([a-z][a-z\d+.-]*):/iu.exec(head)?.[1]?.toLowerCase();

  return scheme !== undefined && !SAFE_URL_SCHEMES.has(scheme);
};

/** Removes the quotes around an attribute value, when it has them. */
const unquote = (value: string): string =>
  /^(["']).*\1$/su.test(value) ? value.slice(1, -1) : value;

/**
 * Finds the first event-handler attribute or unsafe URL in one tag's attribute text.
 * @param attributes The text between a tag's name and its closing bracket.
 * @returns A short description of the problem, or undefined when the attributes are safe.
 */
const findUnsafeAttribute = (attributes: string): string | undefined => {
  for (const [, name = '', value = ''] of attributes.matchAll(ATTRIBUTE_PATTERN)) {
    const attributeName = name.toLowerCase();

    if (attributeName.startsWith('on')) return `${attributeName} attribute`;
    if (URL_ATTRIBUTES.has(attributeName) && isUnsafeUrl(unquote(value))) {
      return `${attributeName}=${value}`;
    }
  }

  return undefined;
};

/**
 * Finds the first event handler or unsafe URL anywhere in a page's markup, ignoring the code
 * inside its script and style elements.
 * @param html A complete HTML page or fragment.
 * @returns A short description of the problem, or undefined when none is found.
 */
export const findUnsafeAttributes = (html: string): string | undefined => {
  const markup = html.replace(SCRIPT_OR_STYLE_PATTERN, '');

  for (let index = markup.indexOf('<'); index !== -1; index = markup.indexOf('<', index + 1)) {
    TAG_PATTERN.lastIndex = index;
    LOOSE_TAG_PATTERN.lastIndex = index;

    const tag = TAG_PATTERN.exec(markup) ?? LOOSE_TAG_PATTERN.exec(markup);

    if (!tag) continue;

    const problem = findUnsafeAttribute(tag[2] ?? '');

    if (problem !== undefined) return problem;

    // continue after the tag, so a < inside one of its attribute values is not read as a tag
    index += tag[0].length - 1;
  }

  return undefined;
};

// where jg-personal-astro-ui's markup sits in rendered Markdown: Markdown's own markup, a code
// window from codeWindowPlugin, or a new-tab marker from externalLinkPlugin
type IMarkupContext = 'code window' | 'markdown' | 'new-tab marker';

// one element the package may put in a code window or a new-tab marker: the elements it may sit
// in, the exact sets of attributes it may carry, and what its style may say, when it has one
type IPackageElement = {
  attributes: readonly (readonly string[])[];
  parents: readonly string[];
  style?: RegExp;
  values?: Readonly<Record<string, string>>;
};

// the attributes of a code window's figure, and of a new-tab marker's svg, exactly as the package
// renders them; finding one opens that markup's context
const CODE_WINDOW_ROOT: Readonly<Record<string, string>> = {
  class: 'jg-code-window',
  'data-code-window': '',
};
const NEW_TAB_MARKER_ROOT: Readonly<Record<string, string>> = {
  'aria-hidden': 'true',
  class: 'ml-[0.15em] inline-block size-[0.6em] shrink-0',
  'data-new-tab-marker': '',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'stroke-width': '1.75',
  viewbox: '6 6 12 12',
  xmlns: 'http://www.w3.org/2000/svg',
};

// a code window's header, from renderCodeWindowHeader, and its highlighted code, from Shiki with
// the package's syntax theme; a style may only colour the code
const CODE_WINDOW_ELEMENTS: Readonly<Record<string, IPackageElement>> = {
  figcaption: { attributes: [['class', 'data-pagefind-ignore']], parents: ['figure'] },
  span: {
    attributes: [
      [],
      ['class'],
      ['aria-hidden', 'class'],
      ['class', 'data-pagefind-ignore'],
      ['class', 'data-copy-label'],
      ['aria-atomic', 'aria-live', 'class', 'data-copy-status', 'role'],
      ['class', 'data-copy-hint', 'hidden'],
      ['style'],
    ],
    parents: ['button', 'code', 'figcaption', 'span'],
    values: { 'aria-atomic': 'true', 'aria-live': 'polite', role: 'status' },
    style:
      /^color:var\(--jg-syntax-[a-z\d-]+\)(?:;(?:font-style:italic|font-weight:bold|text-decoration:(?:underline|line-through)))*$/u,
  },
  button: {
    attributes: [['class', 'data-copy-button', 'data-copy-context', 'inert', 'type']],
    parents: ['span'],
    values: { 'data-copy-context': 'code', inert: '', type: 'button' },
  },
  svg: {
    attributes: [
      [
        'aria-hidden',
        'class',
        'fill',
        'stroke',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-width',
        'viewbox',
        'xmlns',
      ],
    ],
    parents: ['button'],
  },
  path: { attributes: [['d']], parents: ['svg'] },
  rect: { attributes: [['height', 'rx', 'ry', 'width', 'x', 'y']], parents: ['svg'] },
  pre: {
    attributes: [
      ['class', 'data-language', 'style', 'tabindex'],
      ['class', 'style', 'tabindex'],
    ],
    parents: ['figure'],
    style:
      /^background-color:var\(--jg-syntax-background\);color:var\(--jg-syntax-foreground\);(?: overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;)?$/u,
  },
  code: { attributes: [[]], parents: ['pre'] },
};

// a new-tab marker's arrow; its screen-reader notice is an ordinary span after it
const NEW_TAB_MARKER_ELEMENTS: Readonly<Record<string, IPackageElement>> = {
  path: { attributes: [['d']], parents: ['svg'] },
};

/**
 * Reads one tag's attributes, as browsers do, with lowercase names and decoded values.
 * @param attributes The text between a tag's name and its closing bracket.
 * @returns Each attribute's value by its name; an attribute without one has an empty value.
 */
const readAttributes = (attributes: string): Map<string, string> =>
  new Map(
    [...attributes.matchAll(ATTRIBUTE_PATTERN)].map(([, name = '', value = '']) => [
      name.toLowerCase(),
      decodeHtmlEntities(unquote(value)),
    ]),
  );

/**
 * Checks whether a tag carries exactly the given attributes, with exactly their values.
 * @param attributes The tag's attributes.
 * @param expected The attributes and values it must carry, and no others.
 * @returns Whether they match.
 */
const hasExactly = (
  attributes: ReadonlyMap<string, string>,
  expected: Readonly<Record<string, string>>,
): boolean =>
  attributes.size === Object.keys(expected).length &&
  Object.entries(expected).every(([name, value]) => attributes.get(name) === value);

/**
 * Finds what is wrong with one opening tag inside a code window or a new-tab marker: an element
 * the package never puts there, in a place it never puts it, with attributes it never gives it,
 * or with a style that does more than colour code.
 * @param element The tag's element.
 * @param attributes The tag's attributes.
 * @param parent The element it sits in.
 * @param context The package markup it is part of.
 * @returns A short description of the problem, or undefined when the package renders exactly this.
 */
const findUnexpectedPackageMarkup = (
  element: string,
  attributes: ReadonlyMap<string, string>,
  parent: string | undefined,
  context: Exclude<IMarkupContext, 'markdown'>,
): string | undefined => {
  const allowed = (context === 'code window' ? CODE_WINDOW_ELEMENTS : NEW_TAB_MARKER_ELEMENTS)[
    element
  ];

  if (allowed === undefined || parent === undefined || !allowed.parents.includes(parent)) {
    return `<${element}> element in a ${context}`;
  }

  const names = [...attributes.keys()].toSorted();

  if (!allowed.attributes.some((set) => set.join(' ') === names.join(' '))) {
    return `<${element}> attributes in a ${context}: ${names.join(', ')}`;
  }

  // fixed accessibility and enhancement metadata belongs to the renderer, not Markdown authors
  for (const [name, value] of Object.entries(allowed.values ?? {})) {
    if (attributes.has(name) && attributes.get(name) !== value) {
      return name + ' attribute in a ' + context;
    }
  }

  const style = attributes.get('style');

  return style !== undefined && !(allowed.style?.test(style) ?? false)
    ? `style attribute in a ${context}`
    : undefined;
};

/**
 * Finds the first markup in rendered Markdown that neither Markdown nor jg-personal-astro-ui's
 * Markdown plugins produce: elements other than Markdown's own, comments, malformed tags, event
 * handlers, unsafe URLs, and styles. The rendered output is checked, rather than the source,
 * because it is what browsers run, whatever the source's syntax or encoding. The plugins' markup
 * is accepted by its structure: a code window, opened by its exact figure, holds only the header
 * and highlighted code the package renders, each element in its place with its exact attributes
 * and only Shiki's colours as styles; a new-tab marker, opened by its exact svg inside a link,
 * holds only its arrow's paths.
 * @param html The rendered HTML of one Markdown file, where text is escaped and every remaining <
 * opens a tag or sits inside an attribute value.
 * @returns A short description of the problem, or undefined when the markup is safe.
 */
export const findUnsafeMarkup = (html: string): string | undefined => {
  MARKUP_OPENER_PATTERN.lastIndex = 0;
  let context: IMarkupContext = 'markdown';
  // the open elements of the code window or marker being read, outermost first
  const openElements: string[] = [];
  let linkDepth = 0;

  for (
    let opener = MARKUP_OPENER_PATTERN.exec(html);
    opener;
    opener = MARKUP_OPENER_PATTERN.exec(html)
  ) {
    TAG_PATTERN.lastIndex = opener.index;

    const tag = TAG_PATTERN.exec(html);
    const [source = '', name = '', attributeText = ''] = tag ?? [];

    if (!tag || !WELL_FORMED_ATTRIBUTES_PATTERN.test(attributeText)) {
      return `malformed markup ${html.slice(opener.index, opener.index + 16)}`;
    }

    // continue after the tag, so a < inside one of its attribute values is not read as a tag
    MARKUP_OPENER_PATTERN.lastIndex = TAG_PATTERN.lastIndex;

    const element = name.toLowerCase();
    const isClosing = source.startsWith('</');
    const problem = findUnsafeAttribute(attributeText);

    if (problem !== undefined) return problem;

    if (context !== 'markdown') {
      if (isClosing) {
        if (openElements.pop() !== element) return `misplaced </${element}> in a ${context}`;
        if (openElements.length === 0) context = 'markdown';
        continue;
      }

      const unexpected = findUnexpectedPackageMarkup(
        element,
        readAttributes(attributeText),
        openElements.at(-1),
        context,
      );

      if (unexpected !== undefined) return unexpected;
      if (!/\/\s*$/u.test(attributeText)) openElements.push(element);
      continue;
    }

    const attributes = readAttributes(attributeText);

    if (!isClosing && element === 'figure' && hasExactly(attributes, CODE_WINDOW_ROOT)) {
      context = 'code window';
      openElements.push(element);
    } else if (
      !isClosing &&
      element === 'svg' &&
      linkDepth > 0 &&
      hasExactly(attributes, NEW_TAB_MARKER_ROOT)
    ) {
      context = 'new-tab marker';
      openElements.push(element);
    } else if (!MARKDOWN_ELEMENTS.has(element)) {
      return `<${element}> element`;
    } else if (attributes.has('style')) {
      return 'style attribute';
    } else if (element === 'a') {
      linkDepth = Math.max(0, linkDepth + (isClosing ? -1 : 1));
    }
  }

  return context === 'markdown' ? undefined : `unclosed ${context}`;
};
