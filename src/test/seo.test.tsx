import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";
import SiteMetadata from "@/components/SiteMetadata";
import { metadataForPath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { publicProfile } from "@/lib/canvas";
import handler, { llmsText, markdown, publicContent } from "../../api/public-content";
import type { ApiRequest, ApiResponse } from "../../server/http";
import { getKnowledgeChunks } from "../../server/knowledge";

afterEach(cleanup);

describe("search and answer engine identity", () => {
  it("uses the same grounded positioning in metadata, public retrieval, and assistant evidence", () => {
    expect(SITE_URL).toBe("https://seiler.page");
    expect(metadataForPath("/").title).toBe("Isaac Seiler | Tech Generalist");
    expect(publicProfile.summary).toContain("tech generalist");
    expect(getKnowledgeChunks().find(chunk => chunk.id === "bio")?.content).toBe(publicProfile.summary);
    expect(publicContent("profile").data).toMatchObject({ headline: "Tech generalist", canonicalUrl: "https://seiler.page/about" });
    expect(markdown("/about")).toContain("tech generalist");
    expect(llmsText()).toContain("August 2025 snapshot");
  });

  it("identifies the profile's main entity and keeps publication dates honest", () => {
    const profile = metadataForPath("/about").structuredData["@graph"].find(node => node["@type"] === "ProfilePage");
    expect(profile).toMatchObject({ mainEntity: { "@id": "https://seiler.page/#person" } });
    const project = metadataForPath("/projects/artificial-intelligence-in-state-government-index");
    expect(project.description).toContain("August 2025");
    expect(JSON.stringify(project.structuredData)).not.toContain("2025-01-01");
    expect(metadataForPath("/does-not-exist").robots).toContain("noindex");
    expect(metadataForPath("/fulbrightmap").robots).toContain("noindex");
  });

  it("serves the public profile through the production rewrite target", () => {
    let output = "";
    const response = { statusCode: 0, setHeader() {}, end(value = "") { output += value; } };
    handler({ method: "GET", url: "/api/public-content?path=profile" } as ApiRequest, response as ApiResponse);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(output)).toMatchObject({ name: "Isaac Seiler", headline: "Tech generalist" });
  });

  it("updates the head on internal navigation without overwriting feed discovery", () => {
    const feed = document.createElement("link");
    feed.rel = "alternate";
    feed.type = "application/rss+xml";
    feed.href = "/feed.xml";
    document.head.append(feed);
    render(<MemoryRouter><SiteMetadata /><Link to="/about">About</Link><Link to="/work">Work</Link></MemoryRouter>);
    fireEvent.click(screen.getByRole("link", { name: "About" }));
    expect(document.title).toBe("About Isaac Seiler | Tech Generalist");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://seiler.page/about");
    expect(document.head.querySelector('link[type="text/markdown"]')?.getAttribute("href")).toBe("https://seiler.page/about.md");
    fireEvent.click(screen.getByRole("link", { name: "Work" }));
    expect(document.title).toBe("Work | Isaac Seiler");
    expect(document.head.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe("https://seiler.page/work");
    expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
    expect(document.head.querySelector('link[type="application/rss+xml"]')).toBe(feed);
    feed.remove();
  });
});
