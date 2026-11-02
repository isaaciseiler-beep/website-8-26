import { describe, expect, it } from 'vitest';
import { blankBlock } from '@/lib/genui';
import { publicProjects } from '@/lib/canvas';
import { generationSchema } from '../../server/composition-schema';

describe('closed-set provider composition schema', () => {
  it.each(publicProjects)('allows the provider to select every public project: $id', project => {
    expect(generationSchema.safeParse({ supported: true, blocks: [{ ...blankBlock('story'), projectIds: [project.id] }] }).success).toBe(true);
  });
  it('supports an explicit unsupported answer without a placeholder module', () => {
    expect(generationSchema.safeParse({ supported: false, blocks: [] }).success).toBe(true);
  });
  it.each([
    { projectIds: ['invented-project'] },
    { states: ['Invented State'] },
    { roleId: 'private-role' },
    { kind: 'photos', albumIds: ['Japan'] },
  ])('rejects unknown or excluded provider references before runtime rendering: %j', values => {
    expect(generationSchema.safeParse({ supported: true, blocks: [{ ...blankBlock('story'), ...values }] }).success).toBe(false);
  });
});
