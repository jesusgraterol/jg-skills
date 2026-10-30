import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    tags: [
      {
        name: 'full',
        description: 'Additional website content, formatting, and presentation coverage.',
      },
    ],
    exclude: [...configDefaults.exclude, '**/{_archive,_archives,_backup,_backups}/**'],
    include: ['scripts/**/*.test-integration.ts'],
  },
});
