import { resolve } from 'node:path';

import { verifySkillSources } from './verification.ts';

await verifySkillSources(resolve(import.meta.dirname, '../../../..'));
process.stdout.write('Skill sources are valid.\n');
