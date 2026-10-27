import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { PROFILE_BIO, PROFILE_EXPERTISE, PROFILE_SUMMARY } from "../src/lib/siteIdentity.mjs";
import {
  CONTACT_EMAIL,
  PREVIEW_IMAGE,
  SAME_AS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  aiCrawlerAgents,
  priorityImages,
  projectPriorityOrder,
  projectSeo,
  redirectTargets,
  rssProjectIds,
  topLevelPages,
} from "./seo-data.mjs";

const root = process.cwd();
const siteContentPath = path.join(root, "src/lib/siteContent.ts");
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");
const distIndexPath = path.join(distDir, "index.html");
const buildHasDist = fs.existsSync(distIndexPath);
const baseDistHtml = buildHasDist ? fs.readFileSync(distIndexPath, "utf8") : "";
const buildTimestamp = new Date().toUTCString();

const sourceText = fs.readFileSync(siteContentPath, "utf8");
const sourceFile = ts.createSourceFile(
  siteContentPath,
  sourceText,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

const stringConstants = new Map();
const objectConstants = new Map();
let projects = [];

const textOf = (node) => node.getText(sourceFile);

const readPropertyName = (name) => {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  return null;
};

const readStringLike = (node) => {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;

  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      const expressionValue = evaluateExpression(span.expression);
      if (typeof expressionValue !== "string") return null;
      value += expressionValue + span.literal.text;
    }
    return value;
  }

  if (ts.isIdentifier(node)) {
    return stringConstants.get(node.text) ?? null;
  }

  return null;
};

const evaluateObjectLiteral = (node) => {
  const object = {};

  for (const entry of node.properties) {
    if (!ts.isPropertyAssignment(entry)) continue;
    const key = readPropertyName(entry.name);
    if (!key) continue;
    object[key] = evaluateExpression(entry.initializer);
  }

  return object;
};

function evaluateExpression(node) {
  const stringValue = readStringLike(node);
  if (stringValue !== null) return stringValue;

  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => evaluateExpression(element));
  }

  if (ts.isObjectLiteralExpression(node)) {
    return evaluateObjectLiteral(node);
  }

  if (ts.isPropertyAccessExpression(node)) {
    const container = objectConstants.get(textOf(node.expression));
    if (container && Object.prototype.hasOwnProperty.call(container, node.name.text)) {
      return container[node.name.text];
    }
  }

  return null;
}

const visitForConstants = (node) => {
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.initializer
  ) {
    const stringValue = readStringLike(node.initializer);
    if (stringValue !== null) {
      stringConstants.set(node.name.text, stringValue);
    }

    if (ts.isObjectLiteralExpression(node.initializer)) {
      objectConstants.set(node.name.text, evaluateObjectLiteral(node.initializer));
    }
  }

  ts.forEachChild(node, visitForConstants);
};

const visitForProjects = (node) => {
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === "projectItems" &&
    node.initializer &&
    ts.isArrayLiteralExpression(node.initializer)
  ) {
    projects = node.initializer.elements
      .filter(ts.isObjectLiteralExpression)
      .map((projectNode) => evaluateObjectLiteral(projectNode))
      .filter((project) => project.id && project.title && project.summary && project.image);
  }

  ts.forEachChild(node, visitForProjects);
};

visitForConstants(sourceFile);
visitForProjects(sourceFile);

if (projects.length === 0) {
  throw new Error("No SEO project pages were generated because no projects were found.");
}

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const escapeXml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const absoluteUrl = (url) => new URL(url, SITE_URL).toString();

const localPublicPathFor = (url) => {
  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url);
    if (parsed.origin !== SITE_URL) return null;
    url = parsed.pathname;
  }

  if (!url.startsWith("/")) return null;
  const normalized = path.normalize(decodeURIComponent(url).replace(/^\/+/, ""));
  if (normalized.startsWith("..")) return null;
  return path.join(publicDir, normalized);
};

const imageTypeFor = (url) => {
  const extension = new URL(url, SITE_URL).pathname.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "gif") return "image/gif";
  if (extension === "webp") return "image/webp";
  if (extension === "svg") return "image/svg+xml";
  return "image/png";
};

const jpegDimensions = (buffer) => {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
};

const imageDimensionsFor = (url) => {
  const filePath = localPublicPathFor(url);
  if (!filePath || !fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return jpegDimensions(buffer);
  }

  return null;
};

const normalizeImage = (image, fallbackAlt) => {
  const source = typeof image === "string" ? { url: image } : image;
  const dimensions = imageDimensionsFor(source.url);
  const absolute = absoluteUrl(source.url);

  return {
    url: absolute,
    width: source.width ?? dimensions?.width ?? 1200,
    height: source.height ?? dimensions?.height ?? 630,
    type: source.type ?? imageTypeFor(absolute),
    alt: source.alt ?? fallbackAlt,
  };
};

const projectLinkPath = (project) => `/projects/${project.id}`;
const projectUrl = (project) => absoluteUrl(projectLinkPath(project));

const projectPrimaryImage = (project) => {
  const override = projectSeo[project.id]?.image;
  const image = override ?? project.image;
  return normalizeImage(image, `${project.title} preview image`);
};

const textList = (values) =>
  values
    .flat()
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());

const sectionLinks = (project) =>
  (project.sections ?? [])
    .flatMap((section) => section.links ?? [])
    .filter((link) => link.href && link.label);

const sectionHeadings = (project) =>
  textList((project.sections ?? []).map((section) => section.heading));

const projectKeywords = (project) =>
  textList([
    project.title,
    project.source,
    project.year,
    project.summary,
    ...(projectSeo[project.id]?.keywords ?? []),
    ...(projectSeo[project.id]?.about ?? []),
  ]);

const enrichedProject = (project) => {
  const override = projectSeo[project.id] ?? {};
  return {
    ...project,
    seoTitle: override.title ?? `${project.title} | Isaac Seiler`,
    seoDescription: override.description ?? project.summary,
    searchIntent: override.searchIntent ?? override.description ?? project.summary,
    proofPoints: textList(override.proofPoints ?? []),
    seoImage: projectPrimaryImage(project),
    keywords: projectKeywords(project),
    about: override.about ?? [project.source, "Isaac Seiler project"],
    sameAs: textList(override.sameAs ?? []),
  };
};

const unique = (values) => [...new Set(values)];
const originalProjectOrder = new Map(projects.map((project, index) => [project.id, index]));

const projectRank = (project) => {
  const index = projectPriorityOrder.indexOf(project.id);
  return index === -1 ? projectPriorityOrder.length + (originalProjectOrder.get(project.id) ?? 0) : index;
};

const enrichedProjects = projects
  .filter((project) => projectPriorityOrder.includes(project.id))
  .map(enrichedProject)
  .sort((a, b) => projectRank(a) - projectRank(b));
const projectById = new Map(enrichedProjects.map((project) => [project.id, project]));

const priorityImageObjects = priorityImages.map((image, index) => {
  const normalized = normalizeImage(image, image.alt);
  return {
    ...image,
    position: index + 1,
    ...normalized,
    pageUrl: absoluteUrl(image.page),
  };
});

const topPageByPath = new Map(topLevelPages.map((page) => [page.path, page]));

const breadcrumbFor = (items) => ({
  "@type": "BreadcrumbList",
  "@id": `${absoluteUrl(items.at(-1)?.path ?? "/")}#breadcrumb`,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

const siteNavigationItems = () =>
  topLevelPages.filter((page) => page.path !== "/").map((page, index) => ({
    "@type": "SiteNavigationElement",
    "@id": `${absoluteUrl(page.path)}#navigation-link`,
    position: index + 1,
    name: page.navTitle,
    description: page.sitelinkDescription ?? page.description,
    url: absoluteUrl(page.path),
  }));

const globalGraph = () => [
  {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: ["Isaac Seiler portfolio", "Isaac Seiler work"],
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#person` },
    hasPart: topLevelPages.map((page) => ({ "@id": `${absoluteUrl(page.path)}#webpage` })),
  },
  {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: SITE_NAME,
    url: SITE_URL,
    description: PROFILE_SUMMARY,
    email: `mailto:${CONTACT_EMAIL}`,
    image: absoluteUrl(PREVIEW_IMAGE.url),
    sameAs: SAME_AS,
    knowsAbout: PROFILE_EXPERTISE,
    jobTitle: "Marketing and Communications",
    worksFor: { "@type": "Organization", name: "Summation", url: "https://www.summation.com/" },
    mainEntityOfPage: { "@id": `${SITE_URL}/about#webpage` },
  },
  {
    "@type": "ItemList",
    "@id": `${SITE_URL}/#site-navigation`,
    name: "Primary site sections",
    itemListElement: topLevelPages.filter((page) => page.path !== "/").map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: page.navTitle,
      url: absoluteUrl(page.path),
    })),
  },
  ...siteNavigationItems(),
];

const imageObjectFor = (image) => ({
  "@type": "ImageObject",
  "@id": `${image.url}#image`,
  url: image.url,
  contentUrl: image.url,
  thumbnailUrl: image.url,
  width: image.width,
  height: image.height,
  encodingFormat: image.type,
  name: image.title ?? image.alt,
  caption: image.caption ?? image.alt,
  representativeOfPage: image.position <= 6,
  acquireLicensePage: SITE_URL,
  creator: { "@id": `${SITE_URL}/#person` },
});

const projectStructuredData = (project) => ({
  "@context": "https://schema.org",
  "@graph": [
    ...globalGraph(),
    breadcrumbFor([
      { name: "Home", path: "/" },
      { name: "Work", path: "/work" },
      { name: project.title, path: projectLinkPath(project) },
    ]),
    imageObjectFor({
      ...project.seoImage,
      title: project.title,
      caption: project.seoDescription,
      position: 1,
    }),
    {
      "@type": "CreativeWork",
      "@id": `${projectUrl(project)}#creativework`,
      url: projectUrl(project),
      name: project.title,
      headline: project.title,
      description: project.seoDescription,
      abstract: project.searchIntent,
      image: {
        "@id": `${project.seoImage.url}#image`,
      },
      thumbnailUrl: project.seoImage.url,
      dateCreated: project.year,
      author: { "@id": `${SITE_URL}/#person` },
      creator: { "@id": `${SITE_URL}/#person` },
      keywords: project.keywords.join(", "),
      about: project.about.map((name) => ({ "@type": "Thing", name })),
      mentions: project.keywords.slice(0, 12).map((name) => ({ "@type": "Thing", name })),
      hasPart: sectionHeadings(project).map((heading, index) => ({
        "@type": "CreativeWork",
        position: index + 1,
        name: heading,
        isPartOf: { "@id": `${projectUrl(project)}#creativework` },
      })),
      mainEntityOfPage: `${projectUrl(project)}#webpage`,
      sameAs: unique(project.sameAs),
      citation: sectionLinks(project).map((link) => ({ "@type": "CreativeWork", name: link.label, url: link.href })),
      isAccessibleForFree: true,
    },
    {
      "@type": "WebPage",
      "@id": `${projectUrl(project)}#webpage`,
      url: projectUrl(project),
      name: project.seoTitle,
      description: project.seoDescription,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${projectUrl(project)}#creativework` },
      mainEntity: { "@id": `${projectUrl(project)}#creativework` },
      primaryImageOfPage: { "@id": `${project.seoImage.url}#image` },
      thumbnailUrl: project.seoImage.url,
      significantLink: unique([
        absoluteUrl("/work"),
        ...sectionLinks(project).map((link) => link.href),
      ]),
      breadcrumb: { "@id": `${projectUrl(project)}#breadcrumb` },
    },
  ],
});

const projectsPageStructuredData = () => ({
  "@context": "https://schema.org",
  "@graph": [
    ...globalGraph(),
    breadcrumbFor([
      { name: "Home", path: "/" },
      { name: "Work", path: "/work" },
    ]),
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl("/work")}#webpage`,
      url: absoluteUrl("/work"),
      name: "Work by Isaac Seiler",
      description: topPageByPath.get("/work").description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#person` },
      hasPart: enrichedProjects.map((project) => ({ "@id": `${projectUrl(project)}#webpage` })),
      mainEntity: {
        "@type": "ItemList",
        name: "Isaac Seiler work archive",
        itemListElement: enrichedProjects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@id": `${projectUrl(project)}#creativework`,
            "@type": "CreativeWork",
            name: project.title,
            url: projectUrl(project),
            image: project.seoImage.url,
            description: project.seoDescription,
          },
        })),
      },
    },
  ],
});

const pageStructuredData = (page) => {
  const image = normalizeImage(page.image ?? PREVIEW_IMAGE, `${page.navTitle} preview image`);
  const graph = [
    ...globalGraph(),
    breadcrumbFor(
      page.path === "/"
        ? [{ name: "Home", path: "/" }]
        : [
            { name: "Home", path: "/" },
            { name: page.navTitle, path: page.path },
          ],
    ),
    {
      "@type": page.path === "/about" ? "ProfilePage" : "WebPage",
      "@id": `${absoluteUrl(page.path)}#webpage`,
      url: absoluteUrl(page.path),
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#person` },
      ...(page.path === "/about" ? { mainEntity: { "@id": `${SITE_URL}/#person` } } : {}),
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: image.url,
        width: image.width,
        height: image.height,
      },
      significantLink: topLevelPages
        .filter((candidate) => candidate.path !== page.path)
        .map((candidate) => absoluteUrl(candidate.path)),
    },
  ];

  if (page.path === "/") {
    graph.push({
      "@type": "ImageGallery",
      "@id": `${SITE_URL}/#priority-images`,
      name: "Priority images for Isaac Seiler",
      associatedMedia: priorityImageObjects.map(imageObjectFor),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
};

const setTitle = (html, title) =>
  html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);

const setMeta = (html, selector, value) => {
  const escapedValue = escapeHtml(value);
  const expression = new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*(" ?/?>)`);
  if (expression.test(html)) return html.replace(expression, (_, before, after) => `${before}${escapedValue}${after}`);
  return html.replace("</head>", `    <meta ${selector} content="${escapedValue}" />\n  </head>`);
};

const setMetaByName = (html, name, value) => setMeta(html, `name="${name}"`, value);
const setMetaByProperty = (html, property, value) => setMeta(html, `property="${property}"`, value);
const setMetaByItemprop = (html, itemprop, value) => setMeta(html, `itemprop="${itemprop}"`, value);

const setLink = (html, rel, value, attrs = "") => {
  const escapedValue = escapeHtml(value);
  const expression = new RegExp(`(<link\\s+rel="${rel}"[^>]*href=")[^"]*("[^>]*>)`);
  if (expression.test(html)) return html.replace(expression, (_, before, after) => `${before}${escapedValue}${after}`);
  return html.replace("</head>", `    <link rel="${rel}" href="${escapedValue}"${attrs} />\n  </head>`);
};

const removeJsonLd = (html) =>
  html.replace(/\s*<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "");

const insertJsonLd = (html, data) =>
  html.replace(
    "</head>",
    `    <script type="application/ld+json" data-site-structured-data>${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>\n  </head>`,
  );

const removeSeoPrimaryImagePreload = (html) =>
  html.replace(/\s*<link rel="preload" as="image" href="[^"]+"[^>]*data-seo-primary-image="true" ?\/?>/g, "");

const primaryImagePreload = (image) => {
  const parsed = new URL(image.url, SITE_URL);
  const href = parsed.origin === SITE_URL ? parsed.pathname : parsed.toString();
  return `    <link rel="preload" as="image" href="${escapeHtml(href)}" fetchpriority="high" data-seo-primary-image="true" />\n`;
};

const insertPrimaryImagePreload = (html, image) =>
  removeSeoPrimaryImagePreload(html).replace("</head>", `${primaryImagePreload(image)}  </head>`);

const applyHead = (html, route) => {
  const image = normalizeImage(route.image, `${route.navTitle ?? route.title} preview image`);
  let nextHtml = removeJsonLd(html);
  nextHtml = setTitle(nextHtml, route.title);
  nextHtml = setLink(nextHtml, "canonical", absoluteUrl(route.path));
  nextHtml = setLink(nextHtml, "image_src", image.url);
  const markdownUrl = absoluteUrl(`${route.path === "/" ? "/index" : route.path}.md`);
  nextHtml = nextHtml.replace(/\s*<link rel="alternate" type="text\/markdown"[^>]*>/g, "")
    .replace("</head>", `    <link rel="alternate" type="text/markdown" href="${escapeHtml(markdownUrl)}" />\n  </head>`);
  nextHtml = setMetaByName(nextHtml, "description", route.description);
  nextHtml = setMetaByName(nextHtml, "keywords", route.keywords.join(", "));
  nextHtml = setMetaByName(nextHtml, "robots", route.robots ?? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
  nextHtml = setMetaByProperty(nextHtml, "og:title", route.title);
  nextHtml = setMetaByProperty(nextHtml, "og:description", route.description);
  nextHtml = setMetaByProperty(nextHtml, "og:type", route.ogType ?? "website");
  nextHtml = setMetaByProperty(nextHtml, "og:url", absoluteUrl(route.path));
  nextHtml = setMetaByProperty(nextHtml, "og:site_name", SITE_NAME);
  nextHtml = setMetaByProperty(nextHtml, "og:image", image.url);
  nextHtml = setMetaByProperty(nextHtml, "og:image:url", image.url);
  nextHtml = setMetaByProperty(nextHtml, "og:image:secure_url", image.url);
  nextHtml = setMetaByProperty(nextHtml, "og:image:type", image.type);
  nextHtml = setMetaByProperty(nextHtml, "og:image:width", String(image.width));
  nextHtml = setMetaByProperty(nextHtml, "og:image:height", String(image.height));
  nextHtml = setMetaByProperty(nextHtml, "og:image:alt", image.alt);
  nextHtml = setMetaByName(nextHtml, "twitter:card", "summary_large_image");
  nextHtml = setMetaByName(nextHtml, "twitter:title", route.title);
  nextHtml = setMetaByName(nextHtml, "twitter:description", route.description);
  nextHtml = setMetaByName(nextHtml, "twitter:image", image.url);
  nextHtml = setMetaByName(nextHtml, "twitter:image:alt", image.alt);
  nextHtml = setMetaByItemprop(nextHtml, "name", route.title);
  nextHtml = setMetaByItemprop(nextHtml, "description", route.description);
  nextHtml = setMetaByItemprop(nextHtml, "image", image.url);
  if (route.ogType === "article") {
    nextHtml = setMetaByProperty(nextHtml, "article:author", SITE_NAME);
    nextHtml = setMetaByProperty(nextHtml, "article:section", route.section ?? "Work");
    nextHtml = setMetaByProperty(nextHtml, "article:published_time", route.year ? `${route.year}-01-01` : "");
  }
  nextHtml = insertPrimaryImagePreload(nextHtml, image);
  return insertJsonLd(nextHtml, route.structuredData);
};

const renderNav = () => `
      <nav aria-label="Primary">
        ${topLevelPages
          .map(
            (page) =>
              `<a href="${escapeHtml(page.path)}" title="${escapeHtml(page.sitelinkDescription ?? page.description)}">${escapeHtml(page.navTitle)}</a>`,
          )
          .join("\n        ")}
      </nav>`;

const renderSitelinkCandidates = () => `
      <section aria-label="Important site sections">
        <h2>Important Sections</h2>
        <ul>
          ${topLevelPages
            .filter((page) => page.path !== "/")
            .map(
              (page) =>
                `<li><a href="${escapeHtml(page.path)}">${escapeHtml(page.navTitle)}</a>: ${escapeHtml(page.sitelinkDescription ?? page.description)}</li>`,
            )
            .join("")}
        </ul>
      </section>`;

const renderPriorityImages = () => `
      <section>
        <h2>Priority Images</h2>
        ${priorityImageObjects
          .map(
            (image) => `
        <figure>
          <a href="${escapeHtml(image.page)}"><img src="${escapeHtml(htmlImageSrc(image.url))}" alt="${escapeHtml(image.alt)}" width="${image.width}" height="${image.height}" loading="${image.position === 1 ? "eager" : "lazy"}" decoding="async" fetchpriority="${image.position === 1 ? "high" : "auto"}" /></a>
          <figcaption>${escapeHtml(image.caption)}</figcaption>
        </figure>`,
          )
          .join("")}
      </section>`;

const renderProjectSummary = (project) => `
        <article>
          <h3><a href="${escapeHtml(projectLinkPath(project))}">${escapeHtml(project.title)}</a></h3>
          <img src="${escapeHtml(htmlImageSrc(project.seoImage.url))}" alt="${escapeHtml(project.seoImage.alt)}" width="${project.seoImage.width}" height="${project.seoImage.height}" loading="lazy" decoding="async" />
          <p>${escapeHtml(project.seoDescription)}</p>
        </article>`;

const renderHomepageFallback = () => `
    <main>
      ${renderNav()}
      <h1>Isaac Seiler</h1>
      <p>${escapeHtml(SITE_DESCRIPTION)}</p>
      ${renderSitelinkCandidates()}
      ${renderPriorityImages()}
      <section>
        <h2>Featured Work</h2>
        ${priorityImageObjects
          .map((image) => projectById.get(image.page.replace("/projects/", "")))
          .filter(Boolean)
          .map(renderProjectSummary)
          .join("")}
      </section>
    </main>`;

const renderProjectsFallback = () => `
    <main>
      ${renderNav()}
      <h1>Work by Isaac Seiler</h1>
      <p>${escapeHtml(topPageByPath.get("/work").description)}</p>
      ${enrichedProjects.map(renderProjectSummary).join("")}
    </main>`;

const renderProjectFallback = (project) => `
    <main>
      ${renderNav()}
      <p><a href="/work">All Work</a></p>
      <article>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.seoDescription)}</p>
        <section>
          <h2>Project Snapshot</h2>
          <ul>
            <li>Project type: ${escapeHtml(project.source)}</li>
            <li>Year: ${escapeHtml(project.year)}</li>
            <li>Primary topics: ${escapeHtml(project.about.join(", "))}</li>
          </ul>
        </section>
        <img src="${escapeHtml(htmlImageSrc(project.seoImage.url))}" alt="${escapeHtml(project.seoImage.alt)}" width="${project.seoImage.width}" height="${project.seoImage.height}" loading="eager" decoding="async" fetchpriority="high" />
        ${
          project.proofPoints.length
            ? `<section>
          <h2>Key Proof Points</h2>
          <ul>${project.proofPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
        </section>`
            : ""
        }
        ${(project.sections ?? [])
          .map(
            (section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          ${(section.paragraphs ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          ${
            section.bullets?.length
              ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
              : ""
          }
          ${
            section.links?.length
              ? `<ul>${section.links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join("")}</ul>`
              : ""
          }
        </section>`,
          )
          .join("")}
        <section>
          <h2>Related Isaac Seiler Sections</h2>
          <ul>
            <li><a href="/about">About</a></li>
            <li><a href="/work">Work</a></li>
            <li><a href="/photos/map">Photo Map</a></li>
          </ul>
        </section>
      </article>
    </main>`;

const renderPageFallback = (page) => {
  if (page.path === "/") return renderHomepageFallback();
  if (page.path === "/work") return renderProjectsFallback();
  if (page.path === "/about") return `
    <main>${renderNav()}<h1>About Isaac Seiler</h1>
      ${PROFILE_BIO.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      <p><a href="mailto:${CONTACT_EMAIL}">Email Isaac</a> · <a href="${SAME_AS[0]}">LinkedIn</a> · <a href="${SAME_AS[2]}">GitHub</a></p>
      <h2>Selected work across fields</h2>${enrichedProjects.map(renderProjectSummary).join("")}
    </main>`;

  return `
    <main>
      ${renderNav()}
      <h1>${escapeHtml(page.navTitle)}</h1>
      <p>${escapeHtml(page.description)}</p>
      <section>
        <h2>Related Links</h2>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/work">Work</a></li>
          <li><a href="/photos/map">Photo Map</a></li>
        </ul>
      </section>
    </main>`;
};

const replaceRoot = (html, fallback) =>
  html.replace(
    '<div id="root"></div>',
    // Keep the crawlable, no-JavaScript document without painting it before
    // React mounts. Rendering this markup directly in #root caused the old
    // fallback layout to flash on every cold load and refresh.
    `<div id="root"><noscript data-seo-fallback>${fallback}</noscript></div>`,
  );

const htmlImageSrc = (url) => {
  const parsed = new URL(url, SITE_URL);
  return parsed.origin === SITE_URL ? parsed.pathname : parsed.toString();
};

const routeForPage = (page) => ({
  ...page,
  image: normalizeImage(page.image ?? PREVIEW_IMAGE, `${page.navTitle} preview image`),
  keywords: page.keywords ?? [],
  structuredData: page.path === "/work" ? projectsPageStructuredData() : pageStructuredData(page),
});

const routeForProject = (project) => ({
  path: projectLinkPath(project),
  navTitle: project.title,
  title: project.seoTitle,
  description: project.seoDescription,
  keywords: project.keywords,
  image: project.seoImage,
  ogType: "website",
  section: project.source,
  year: project.year,
  structuredData: projectStructuredData(project),
});

const writeDistRoute = (route, fallback) => {
  if (!buildHasDist) return;

  const html = replaceRoot(applyHead(baseDistHtml, route), fallback);
  const routePath = route.path === "/" ? distIndexPath : path.join(distDir, route.path, "index.html");
  fs.mkdirSync(path.dirname(routePath), { recursive: true });
  fs.writeFileSync(routePath, html);
};

const sitemapImage = (image) => `
    <image:image>
      <image:loc>${escapeXml(image.url)}</image:loc>
      <image:title>${escapeXml(image.title ?? image.alt)}</image:title>
      <image:caption>${escapeXml(image.caption ?? image.alt)}</image:caption>
    </image:image>`;

const urlEntry = ({ loc, changefreq, priority, images = [] }) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${images.map(sitemapImage).join("")}
  </url>`;

const sitemapXml = () => {
  const pageEntries = topLevelPages.map((page) => {
    const image = normalizeImage(page.image ?? PREVIEW_IMAGE, `${page.navTitle} preview image`);
    const images = page.path === "/" ? priorityImageObjects : [{ ...image, title: page.navTitle, caption: page.description }];
    return urlEntry({
      loc: absoluteUrl(page.path),
      changefreq: page.changefreq,
      priority: page.priority,
      images,
    });
  });

  const projectEntries = enrichedProjects.map((project) =>
    urlEntry({
      loc: projectUrl(project),
      changefreq: "monthly",
      priority: project.id === "fulbright-focus-group-sponsored-by-openai" ? "0.92" : "0.78",
      images: [
        {
          ...project.seoImage,
          title: project.title,
          caption: project.seoDescription,
        },
      ],
    }),
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${[...pageEntries, ...projectEntries].join("")}
</urlset>
`;
};

const imageSitemapXml = () => {
  const entries = new Map();
  const addEntry = (entry) => {
    if (!entries.has(entry.loc)) entries.set(entry.loc, entry);
  };

  priorityImageObjects.forEach((image) => {
    addEntry({
      loc: image.pageUrl,
      changefreq: "weekly",
      priority: image.position === 1 ? "1.0" : "0.90",
      images: [image],
    });
  });

  enrichedProjects.forEach((project) => {
    addEntry({
      loc: projectUrl(project),
      changefreq: "monthly",
      priority: project.id === "fulbright-focus-group-sponsored-by-openai" ? "0.92" : "0.76",
      images: [
        {
          ...project.seoImage,
          title: project.title,
          caption: project.seoDescription,
        },
      ],
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${Array.from(entries.values()).map(urlEntry).join("")}
</urlset>
`;
};

const robotsTxt = () => `${aiCrawlerAgents
  .map((agent) => `User-agent: ${agent}\nAllow: /\nAllow: /api/public/\nAllow: /api/public-content\nDisallow: /fulbrightmap\nDisallow: /strike-tracker\nDisallow: /api/\n`)
  .join("\n")}
User-agent: *
Allow: /
Allow: /api/public/
Allow: /api/public-content
Disallow: /fulbrightmap
Disallow: /strike-tracker
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/image-sitemap.xml
`;

const rssProjects = rssProjectIds
  .map((id) => projectById.get(id))
  .filter(Boolean)
  .sort((a, b) => b.year.localeCompare(a.year));

const rssFeedXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Work by Isaac Seiler</title>
    <link>${escapeXml(absoluteUrl("/work"))}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildTimestamp}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />
    ${rssProjects
      .map(
        (project) => `<item>
      <title>${escapeXml(project.title)}</title>
      <link>${escapeXml(projectUrl(project))}</link>
      <guid isPermaLink="true">${escapeXml(projectUrl(project))}</guid>
      <category>${escapeXml(project.source)}</category>
      <description>${escapeXml(project.summary)}</description>
      <media:content url="${escapeXml(project.seoImage.url)}" type="${escapeXml(project.seoImage.type)}" width="${project.seoImage.width}" height="${project.seoImage.height}" medium="image" />
    </item>`,
      )
      .join("\n    ")}
  </channel>
</rss>
`;

const writeGeneratedPublicFile = (relativePath, content) => {
  const publicPath = path.join(publicDir, relativePath);
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(publicPath, content);

  if (buildHasDist) {
    const distPath = path.join(distDir, relativePath);
    fs.mkdirSync(path.dirname(distPath), { recursive: true });
    fs.writeFileSync(distPath, content);
  }
};

writeGeneratedPublicFile("sitemap.xml", sitemapXml());
writeGeneratedPublicFile("image-sitemap.xml", imageSitemapXml());
writeGeneratedPublicFile("robots.txt", robotsTxt());
writeGeneratedPublicFile("feed.xml", rssFeedXml());

// These resources must ship with the build, not depend on Vite's dev middleware.
const profileMarkdown = `# Isaac Seiler — Tech Generalist\n\nCanonical: ${SITE_URL}/about\n\n${PROFILE_SUMMARY}\n\n${PROFILE_BIO.join("\n\n")}\n\n[Work](${SITE_URL}/work) · [LinkedIn](${SAME_AS[0]}) · [Email](mailto:${CONTACT_EMAIL})\n`;
writeGeneratedPublicFile("index.md", profileMarkdown);
writeGeneratedPublicFile("about.md", profileMarkdown);
writeGeneratedPublicFile("work.md", `# Work by Isaac Seiler\n\nCanonical: ${SITE_URL}/work\n\n${topPageByPath.get("/work").description}\n\n${enrichedProjects.map((project) => `## ${project.title}\n\n${project.year} · ${project.source}\n\n${project.seoDescription}\n\n[Case study](${projectUrl(project)}) · [Full text](${projectUrl(project)}.md)`).join("\n\n")}\n`);
writeGeneratedPublicFile("photos/map.md", `# Photo Map\n\nCanonical: ${SITE_URL}/photos/map\n\n${topPageByPath.get("/photos/map").description}\n`);
writeGeneratedPublicFile("llms.txt", `# Isaac Seiler — Tech Generalist\n\n> ${PROFILE_SUMMARY}\n\nCanonical website: ${SITE_URL}/\n\n## Profile and evidence\n- [About Isaac Seiler](${SITE_URL}/about.md)\n- [Selected work](${SITE_URL}/work.md)\n- [Public profile JSON](${SITE_URL}/api/public/profile)\n- [Agent guide](${SITE_URL}/agents)\n\n## Projects\n${enrichedProjects.map((project) => `- [${project.title}](${projectUrl(project)}.md): ${project.seoDescription}`).join("\n")}\n\n## Attribution\nThe government AI benchmark is an August 2025 snapshot. Teaching examples are illustrative workflows. OpenAI program participation, collaboration, and product feedback are distinct from employment. Project pages link to published evidence.\n`);
enrichedProjects.forEach((project) => {
  const sections = (project.sections ?? []).map((section) => `## ${section.heading}\n\n${(section.paragraphs ?? []).join("\n\n")}\n\n${(section.bullets ?? []).map((bullet) => `- ${bullet}`).join("\n")}\n\n${(section.links ?? []).map((link) => `- [${link.label}](${link.href})`).join("\n")}`).join("\n\n");
  writeGeneratedPublicFile(`projects/${project.id}.md`, `# ${project.title}\n\nCanonical: ${projectUrl(project)}\nYear: ${project.year}\nAuthor: Isaac Seiler\n\n${project.seoDescription}\n\n${sections}\n`);
});

const agentPage = { path: "/agents", navTitle: "For agents", title: "Public Content and Sources | Isaac Seiler", description: "Read Isaac Seiler's public profile, published projects, source links, and machine-readable content.", keywords: [], image: PREVIEW_IMAGE };
writeGeneratedPublicFile("agents.md", `# Public content and sources\n\n${PROFILE_SUMMARY}\n\n[Profile](${SITE_URL}/about.md) · [Work](${SITE_URL}/work.md) · [Content directory](${SITE_URL}/llms.txt)\n\nUse the primary evidence linked from each project. OpenAI collaboration is distinct from employment. The government benchmark is an August 2025 snapshot.\n`);
writeDistRoute(routeForPage(agentPage), `<main>${renderNav()}<h1>Public content and sources</h1><p>${escapeHtml(PROFILE_SUMMARY)}</p><p><a href="/about.md">About</a> · <a href="/work.md">Work</a> · <a href="/llms.txt">Content directory</a> · <a href="/api/public/profile">Profile JSON</a></p>${enrichedProjects.map(renderProjectSummary).join("")}</main>`);

topLevelPages.forEach((page) => {
  const route = routeForPage(page);
  writeDistRoute(route, renderPageFallback(page));
});

enrichedProjects.forEach((project) => {
  const route = routeForProject(project);
  writeDistRoute(route, renderProjectFallback(project));
});

console.log(`Generated SEO assets for ${topLevelPages.length} top-level routes and ${enrichedProjects.length} project routes.`);
console.log(`Prioritized ${priorityImageObjects.length} image candidates for image search.`);
