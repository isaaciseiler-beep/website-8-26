import { projectSeo, topLevelPages, SAME_AS } from "../../scripts/seo-data.mjs";
import { projectItems, hiddenProjectIds } from "./siteContent";
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, PROFILE_SUMMARY, PROFILE_EXPERTISE, PREVIEW_IMAGE_URL } from "./site";

export function metadataForPath(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const page = topLevelPages.find((entry) => entry.path === path);
  const project = projectItems.find((entry) => path === `/projects/${entry.id}` && !hiddenProjectIds.has(entry.id));
  const override = project ? projectSeo[project.id] : undefined;
  const isAgentGuide = path === "/agents";
  const title = page?.title ?? (project ? override?.title ?? `${project.title} | ${SITE_NAME}` : isAgentGuide ? `Public Content and Sources | ${SITE_NAME}` : SITE_TITLE);
  const description = page?.description ?? (project ? override?.description ?? project.summary : SITE_DESCRIPTION);
  const image = new URL(override?.image?.url ?? project?.image ?? page?.image?.url ?? PREVIEW_IMAGE_URL, SITE_URL).href;
  const canonical = new URL(path, SITE_URL).href;
  const indexable = Boolean(page || project || isAgentGuide);
  const personId = `${SITE_URL}/#person`;
  const workId = `${canonical}#creativework`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, description: SITE_DESCRIPTION, inLanguage: "en-US", publisher: { "@id": personId } },
      { "@type": "Person", "@id": personId, name: SITE_NAME, url: SITE_URL, description: PROFILE_SUMMARY, knowsAbout: PROFILE_EXPERTISE, sameAs: SAME_AS, jobTitle: "Marketing and Communications", worksFor: { "@type": "Organization", name: "Summation", url: "https://www.summation.com/" }, mainEntityOfPage: { "@id": `${SITE_URL}/about#webpage` } },
      ...(project ? [{ "@type": "CreativeWork", "@id": workId, name: project.title, description, url: canonical, image, dateCreated: project.year, author: { "@id": personId }, citation: project.sections.flatMap(section => (section.links ?? []).map(link => ({ "@type": "CreativeWork", name: link.label, url: link.href }))) }] : []),
      { "@type": path === "/about" ? "ProfilePage" : path === "/work" ? "CollectionPage" : "WebPage", "@id": `${canonical}#webpage`, url: canonical, name: title, description, isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": project ? workId : personId }, ...(path === "/about" || project ? { mainEntity: { "@id": project ? workId : personId } } : {}) },
    ],
  };
  return { title, description, image, canonical, structuredData, robots: indexable ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,follow" };
}
