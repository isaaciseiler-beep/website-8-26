import { useId, type ReactNode } from 'react';
import { LayoutGroup } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { ProjectVisualMotionContext } from '@/lib/projectVisualMotion';

/** A single exploration can carry its image from a tile into the reader.
 * Multi-subject answers may repeat a project, so they never share visual IDs. */
export function ProjectVisualMotion({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const id = useId();
  const reduced = useMotionPreference();
  return <LayoutGroup id={id}><ProjectVisualMotionContext.Provider value={enabled && !reduced}>{children}</ProjectVisualMotionContext.Provider></LayoutGroup>;
}
