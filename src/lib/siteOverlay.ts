export type SiteOverlay = "sidebar" | "search";

const overlayAttribute: Record<SiteOverlay, string> = {
  sidebar: "data-site-sidebar-open",
  search: "data-site-search-open",
};

export const isSiteOverlayOpen = () => {
  if (typeof document === "undefined") return false;
  return Object.values(overlayAttribute).some((attribute) => document.body.hasAttribute(attribute));
};

export const setSiteOverlayOpen = (overlay: SiteOverlay, open: boolean) => {
  if (typeof document === "undefined") return;

  document.body.toggleAttribute(overlayAttribute[overlay], open);
  window.dispatchEvent(new CustomEvent("site-overlay-state", {
    detail: { overlay, open, anyOpen: isSiteOverlayOpen() },
  }));
};
