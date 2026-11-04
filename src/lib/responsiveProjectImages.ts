/** Dimensions of the original assets; prepared sizes retain their aspect ratio. */
const dimensions: Record<string, readonly [number, number]> = {
  '/project-images/aiindex.jpg': [1600, 900],
  '/project-images/ainews.jpg': [1600, 900],
  '/project-images/chatlab.jpg': [1600, 1200],
  '/project-images/bicares.jpg': [1600, 900],
  '/project-images/ai-classroom.jpg': [1600, 1066],
  '/project-images/caphill.jpg': [1600, 900],
};

export function responsiveProjectImageProps(src: string, sizes: string) {
  const size = dimensions[src];
  if (!size) return {};
  const name = src.slice(src.lastIndexOf('/') + 1, -4);
  return {
    width: size[0], height: size[1], sizes,
    srcSet: `/project-images/responsive/${name}-480.jpg 480w, /project-images/responsive/${name}-960.jpg 960w, ${src} ${size[0]}w`,
  };
}
