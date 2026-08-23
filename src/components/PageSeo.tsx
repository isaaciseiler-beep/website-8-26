import { useEffect } from "react";
import { PREVIEW_IMAGE_URL, SITE_NAME, SITE_URL } from "@/lib/site";

interface PageSeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  published?: string;
  updated?: string;
}

const absoluteUrl = (value: string) => new URL(value, `${SITE_URL}/`).toString();

const setMeta = (attribute: "name" | "property", key: string, value: string) => {
  let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.content = value;
};

const PageSeo = ({ title, description, path, image = PREVIEW_IMAGE_URL, type = "website", published, updated }: PageSeoProps) => {
  useEffect(() => {
    const canonicalUrl = absoluteUrl(path);
    const imageUrl = absoluteUrl(image);
    document.title = title;

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:image", imageUrl);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", imageUrl);
    if (published) setMeta("property", "article:published_time", published);
    else document.head.querySelector('meta[property="article:published_time"]')?.remove();
    if (updated) setMeta("property", "article:modified_time", updated);
    else document.head.querySelector('meta[property="article:modified_time"]')?.remove();
  }, [description, image, path, published, title, type, updated]);

  return null;
};

export default PageSeo;
