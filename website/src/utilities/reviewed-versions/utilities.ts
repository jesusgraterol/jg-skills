import { randomUUID } from 'node:crypto';
import { lstat, open, realpath, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { ReviewedVersionsSchema, type IReviewedVersions } from './types.ts';

// fixed prose boundaries frame generated text; their previous values are never parsed as data
const FRAGMENT_START = 'This skill was written for ';
const FRAGMENT_END = '. An item marked with a minimum version';
const SOURCE_BYTE_LIMIT = 65_536;

/**
 * Validates maintained version facts and rejects duplicate package ownership.
 * @returns The validated configuration.
 * @throws
 * - Reviewed-version data is invalid.
 */
export const parseReviewedVersions = (input: unknown): IReviewedVersions => {
  const parsed = ReviewedVersionsSchema.safeParse(input);
  if (!parsed.success) throw new Error('Reviewed-version data is invalid.');
  const names = parsed.data.groups.flatMap((group) => group.packages);
  if (new Set(names).size !== names.length) throw new Error('Reviewed-version data is invalid.');
  return parsed.data;
};

/**
 * Replaces only the version fragment after checking its boundaries and guidance coverage.
 * @returns The complete source with every surrounding byte preserved.
 * @throws
 * - Reviewed-version fragment boundaries are invalid.
 * - Reviewed-version packages do not match skill guidance.
 */
export const prepareReviewedVersionSource = (
  source: string,
  configuration: IReviewedVersions,
): string => {
  const start = source.indexOf(FRAGMENT_START);
  const end = source.indexOf(FRAGMENT_END);
  if (
    start < 0 ||
    end <= start ||
    start !== source.lastIndexOf(FRAGMENT_START) ||
    end !== source.lastIndexOf(FRAGMENT_END)
  )
    throw new Error('Reviewed-version fragment boundaries are invalid.');
  const configured = configuration.groups.flatMap((group) => group.packages).toSorted();
  // validates Markdown catalogue coverage, without reading version values from prose
  const documented = [...source.matchAll(/^\|\s*`(jg-[a-z0-9-]+)`\s*\|/gmu)]
    .map((match) => match[1]!)
    .toSorted();
  if (
    configured.length !== documented.length ||
    configured.some((name, index) => name !== documented[index])
  )
    throw new Error('Reviewed-version packages do not match skill guidance.');
  const groups = configuration.groups.map(
    ({ packages, version }) => `${packages.join(' and ')} ${version}`,
  );
  const fragment =
    groups.length === 1 ? groups[0]! : `${groups.slice(0, -1).join('; ')}; and ${groups.at(-1)!}`;
  return source.slice(0, start + FRAGMENT_START.length) + fragment + source.slice(end);
};

/**
 * Refuses linked source paths so a checkout cannot redirect generation into another checkout.
 * @returns The regular file inside the fixed source layout.
 * @throws Invalid source paths or native filesystem errors.
 */
const resolveSourceFile = async (root: string, parts: string[]): Promise<string> => {
  let target = root;
  for (const [index, part] of parts.entries()) {
    target = join(target, part);
    const entry = await lstat(target);
    if (
      entry.isSymbolicLink() ||
      (index === parts.length - 1 ? !entry.isFile() : !entry.isDirectory())
    )
      throw new Error('Reviewed-version paths must be regular files and directories.');
  }
  return target;
};

/**
 * Reads bounded UTF-8 input without normalizing BOMs or line endings in the skill source.
 * @returns The complete source within its byte bound.
 * @throws Oversized input, invalid UTF-8 or native filesystem errors.
 */
const readSource = async (path: string): Promise<string> => {
  const file = await open(path, 'r');
  try {
    const bytes = Buffer.alloc(SOURCE_BYTE_LIMIT + 1);
    let length = 0;
    while (length < bytes.length) {
      const result = await file.read(bytes, length, bytes.length - length, null);
      if (result.bytesRead === 0) break;
      length += result.bytesRead;
    }
    if (length > SOURCE_BYTE_LIMIT)
      throw new Error('Reviewed-version source exceeds its byte limit.');
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      bytes.subarray(0, length),
    );
  } finally {
    await file.close();
  }
};

/**
 * Reads configuration from its fixed owner inside one checkout.
 * @returns The validated maintained facts.
 * @throws Invalid source, configuration or native filesystem errors.
 */
export const readReviewedVersions = async (repositoryRoot: string): Promise<IReviewedVersions> => {
  const root = await realpath(repositoryRoot);
  const file = await resolveSourceFile(root, ['configs', 'reviewed-versions.json']);
  const source = await readSource(file);
  let input: unknown;
  try {
    input = JSON.parse(source.replace(/^\uFEFF/u, ''));
  } catch {
    throw new Error('Reviewed-version data is invalid.');
  }
  return parseReviewedVersions(input);
};

/**
 * Checks freshness without writes, or atomically regenerates the one owned skill fragment.
 * @returns Whether generation changed the source.
 * @throws Invalid source, stale check, concurrent source change or native filesystem errors.
 */
export const syncReviewedVersions = async (
  repositoryRoot: string,
  mode: 'check' | 'write',
): Promise<boolean> => {
  const root = await realpath(repositoryRoot);
  const configuration = await readReviewedVersions(root);
  const file = await resolveSourceFile(root, ['skills', 'jg-packages', 'SKILL.md']);
  const source = await readSource(file);
  const generated = prepareReviewedVersionSource(source, configuration);
  if (generated === source) return false;
  if (mode === 'check')
    throw new Error('Reviewed-version fragment is stale. Run npm run reviewed-versions:generate.');
  const temporary = join(dirname(file), `.reviewed-versions-${randomUUID()}.tmp`);
  const metadata = await lstat(file);
  const output = await open(temporary, 'wx', metadata.mode & 0o777);
  try {
    try {
      await output.writeFile(generated);
    } finally {
      await output.close();
    }
    await resolveSourceFile(root, ['skills', 'jg-packages', 'SKILL.md']);
    if ((await readSource(file)) !== source)
      throw new Error('Reviewed-version source changed during generation.');
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
  return true;
};
