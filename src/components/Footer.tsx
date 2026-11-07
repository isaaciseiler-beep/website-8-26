import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
const PhotoGlobeFooter = lazy(() => import("./PhotoGlobeFooter"));

export default function Footer() {
  const location = useLocation();
  if (location.pathname !== "/" || new URLSearchParams(location.search).has("album")) return null;
  return <Suspense fallback={null}><PhotoGlobeFooter /></Suspense>;
}
