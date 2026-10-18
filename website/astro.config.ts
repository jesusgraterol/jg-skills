import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { codeWindowPlugin } from 'jg-personal-astro-ui/code-window-plugin';
import { externalLinkPlugin } from 'jg-personal-astro-ui/external-link-plugin';
import { SYNTAX_THEME } from 'jg-personal-astro-ui/syntax-theme';

import { SITE_CONFIG } from './src/site.config.ts';

export default defineConfig({
  site: SITE_CONFIG.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    // skill code blocks use the package's --jg-syntax-* colours, in its code windows, and links to
    // other sites open in a new tab with the package's marker
    shikiConfig: { theme: SYNTAX_THEME, wrap: true },
    processor: satteri({
      hastPlugins: [codeWindowPlugin, externalLinkPlugin({ siteUrl: SITE_CONFIG.url })],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
