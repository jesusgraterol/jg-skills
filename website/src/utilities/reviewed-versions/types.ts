import { z } from 'astro/zod';

// maintained review facts; the skill capability table must cover this same package set
export const ReviewedVersionsSchema = z.strictObject({
  schemaVersion: z.literal(1),
  groups: z
    .array(
      z.strictObject({
        packages: z
          .array(z.string().regex(/^jg-[a-z0-9]+(?:-[a-z0-9]+)*$/u))
          .min(1)
          .max(64),
        version: z.string().regex(/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u),
      }),
    )
    .min(1)
    .max(64),
});
export type IReviewedVersions = z.infer<typeof ReviewedVersionsSchema>;
