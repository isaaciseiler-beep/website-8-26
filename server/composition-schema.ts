import { z } from 'zod';
import { publicProjects } from '../src/lib/canvas.js';
import { liveCompositionSchema } from '../src/lib/genui.js';
import { experienceEntries } from '../src/lib/experience.js';
import { aiIndexStates } from '../src/lib/aiStateGovIndex.js';

const knownValues = (values: string[]) => z.enum(values as [string, ...string[]]);
const block = liveCompositionSchema.shape.blocks.element.extend({
  projectIds: z.array(knownValues(publicProjects.map(project => project.id))).max(3)
    .describe('Exact public project IDs from catalog. One for story, two distinct IDs for comparison, empty when unused.'),
  states: z.array(knownValues(aiIndexStates.map(state => state.state))).max(2)
    .describe('Requested government names only. Empty for rankings and non-benchmark modules.'),
  roleId: knownValues(['', ...experienceEntries.map(entry => entry.id)]).optional()
    .describe('Known career entry ID; empty when unused. Current role is summation-ai.'),
  section: liveCompositionSchema.shape.blocks.element.shape.section
    .describe('Exact section index from the selected project catalog, not a default of zero. Unused modules use zero.'),
  paragraphIndices: liveCompositionSchema.shape.blocks.element.shape.paragraphIndices
    .describe('Up to three distinct zero-based Paragraph N indices carrying the answer in the selected story section. Omit or use empty for non-paragraph material; never reference a different section.'),
});

/** Provider constraints narrow the existing shared renderer contract. Runtime
 * reconciliation still verifies kind-specific references and user selections. */
export const generationSchema = liveCompositionSchema.extend({
  supported: z.boolean().describe('False only when public portfolio evidence cannot answer the request; then blocks must be empty.'),
  blocks: z.array(block).max(3),
});
