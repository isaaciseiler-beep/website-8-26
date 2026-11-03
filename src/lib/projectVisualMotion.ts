import { createContext, useContext } from 'react';

export const ProjectVisualMotionContext = createContext(false);

export function useProjectVisualId(projectId: string) {
  return useContext(ProjectVisualMotionContext) ? `project-image:${projectId}` : undefined;
}
