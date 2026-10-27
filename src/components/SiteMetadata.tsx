import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metadataForPath } from "@/lib/seo";

// Keep client-side navigation consistent with the prebuilt entry documents.
export default function SiteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const metadata = metadataForPath(pathname);
    document.title = metadata.title;
    const meta = (attribute: "name" | "property" | "itemprop", key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = content;
    };
    const link = (selector: string, rel: string, href: string, type?: string) => {
      let element = document.head.querySelector<HTMLLinkElement>(selector);
      if (!element) {
        element = document.createElement("link");
        element.rel = rel;
        document.head.append(element);
      }
      if (type) element.type = type;
      element.href = href;
    };
    meta("name", "description", metadata.description);
    for (const bot of ["robots", "googlebot", "bingbot"]) meta("name", bot, metadata.robots);
    for (const [key, value] of Object.entries({ "og:title": metadata.title, "og:description": metadata.description, "og:url": metadata.canonical, "og:type": "website", "og:image": metadata.image, "og:image:url": metadata.image, "og:image:secure_url": metadata.image, "og:image:alt": metadata.title })) meta("property", key, value);
    for (const [key, value] of Object.entries({ "twitter:title": metadata.title, "twitter:description": metadata.description, "twitter:image": metadata.image, "twitter:image:alt": metadata.title })) meta("name", key, value);
    for (const [key, value] of Object.entries({ name: metadata.title, description: metadata.description, image: metadata.image })) meta("itemprop", key, value);
    // Image dimensions vary by project; don't carry a previous route's dimensions.
    for (const key of ["og:image:width", "og:image:height", "og:image:type"]) document.head.querySelector(`meta[property="${key}"]`)?.remove();
    link('link[rel="canonical"]', "canonical", metadata.canonical);
    link('link[rel="image_src"]', "image_src", metadata.image);
    link('link[rel="alternate"][type="text/markdown"]', "alternate", `${metadata.canonical.endsWith("/") ? `${metadata.canonical}index` : metadata.canonical}.md`, "text/markdown");
    for (const script of document.head.querySelectorAll('script[type="application/ld+json"]')) script.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.siteStructuredData = "";
    script.textContent = JSON.stringify(metadata.structuredData).replaceAll("<", "\\u003c");
    document.head.append(script);
  }, [pathname]);
  return null;
}
