import { lazy, Suspense } from "react";
const PhotoGlobeFooter = lazy(() => import("./PhotoGlobeFooter"));

export default function Footer() {
  return <Suspense fallback={null}><PhotoGlobeFooter /></Suspense>;
}
