import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { syncReviewedVersions } from '../../src/utilities/reviewed-versions/index.ts';

const { values } = parseArgs({
  options: { check: { type: 'boolean' }, write: { type: 'boolean' } },
});
if (Boolean(values.check) === Boolean(values.write))
  throw new Error('Choose exactly one of --check or --write.');

const changed = await syncReviewedVersions(
  resolve(import.meta.dirname, '../../..'),
  values.check ? 'check' : 'write',
);
process.stdout.write(
  changed ? 'Reviewed-version fragment generated.\n' : 'Reviewed-version fragment is current.\n',
);
