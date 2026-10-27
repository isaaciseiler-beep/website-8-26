import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SITE_URL, topLevelPages, projectPriorityOrder } from "./seo-data.mjs";

const read = (file) => fs.readFileSync(path.join("dist", file), "utf8");
const routes = [...topLevelPages.map(page => page.path), ...projectPriorityOrder.map(id => `/projects/${id}`), "/agents"];
for (const route of routes) {
  const html = read(route === "/" ? "index.html" : `${route.slice(1)}/index.html`);
  const canonical = new URL(route, SITE_URL).href;
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `Canonical: ${route}`);
  assert.ok(!html.includes("isaacseiler.xyz"), `Retired domain in ${route}`);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, `One structured graph: ${route}`);
  const graph = JSON.parse(scripts[0][1])["@graph"];
  assert.ok(graph.find(node => node["@type"] === "Person")?.description.includes("tech generalist"));
  if (route === "/about") assert.equal(graph.find(node => node["@type"] === "ProfilePage")?.mainEntity["@id"], `${SITE_URL}/#person`);
  assert.equal((html.match(/<noscript/g) ?? []).length, 1, `One route-specific fallback: ${route}`);
  assert.ok(html.includes('type="application/rss+xml"'), `Feed discovery: ${route}`);
  const markdown = read(`${route === "/" ? "index" : route.slice(1)}.md`);
  assert.ok(markdown.includes("Canonical:") || route === "/agents", `Markdown: ${route}`);
}
for (const file of ["sitemap.xml", "image-sitemap.xml", "feed.xml", "robots.txt", "llms.txt"]) {
  assert.ok(!read(file).includes("isaacseiler.xyz"), `Retired domain in ${file}`);
}
assert.ok(!read("sitemap.xml").includes("<lastmod>"), "Do not mark every rebuild as a content update");
assert.ok(!read("feed.xml").includes("<pubDate>"), "Only source years are known");
assert.ok(read("robots.txt").includes("Allow: /api/public/"));
assert.ok(read("llms.txt").includes("August 2025 snapshot"));
const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
for (const route of routes.filter(route => route !== "/")) {
  assert.ok(config.rewrites.some(rule => rule.source === route && rule.destination === `${route}/index.html`), `Production HTML mapping: ${route}`);
}
assert.ok(config.rewrites.some(rule => rule.source === "/api/public/:path*" && rule.destination.includes("path=:path*")));
assert.ok(config.redirects.some(rule => rule.has?.some(condition => condition.value === "www.isaacseiler.xyz") && rule.destination === `${SITE_URL}/:path*`));
console.log(`Verified canonical metadata, structured data, readable content, and feed discovery on ${routes.length} built routes.`);
