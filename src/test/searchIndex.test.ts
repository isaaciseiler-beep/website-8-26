import { describe, expect, it } from "vitest";
import { hasSearchResults, searchDocuments, searchSite } from "@/lib/searchIndex";
import { hiddenProjectIds, newsItems, orderProjectItemsForWork, projectItems } from "@/lib/siteContent";

const titlesFor = (query: string, category: string) =>
  searchSite(query)
    .find((group) => group.category === category)
    ?.results.map((result) => result.title) ?? [];

describe("search index", () => {
  it("ignores stop-word-only queries", () => {
    expect(hasSearchResults(searchSite("and"))).toBe(false);
  });

  it("uses topic expansion for non-exact project language", () => {
    expect(titlesFor("government ai policy", "projects")).toContain("Mapping the Rise of AI Across State Government");
  });

  it("finds education work without exact title terms", () => {
    expect(titlesFor("classroom teaching with chatgpt", "projects")).toContain(
      "Leading AI Literacy Efforts in Taiwan",
    );
  });

  it("includes the restored scholarship features", () => {
    expect(titlesFor("Truman Forbes public service", "news")).toContain(
      "Winning the Leading Scholarship in Public Service: Featured in Forbes",
    );
    expect(titlesFor("Rhodes WashU finalist", "news")).toContain(
      "Becoming a Rhodes Scholarship Finalist",
    );
  });

  it("orders Fulbright before the final Rhodes and Truman features", () => {
    expect(newsItems.map((item) => item.id)).toEqual([1, 6, 2]);
  });

  it("places the Fulbright AI literacy work third", () => {
    const visibleProjects = orderProjectItemsForWork(projectItems).filter(
      (project) => !hiddenProjectIds.has(project.id),
    );
    expect(visibleProjects.slice(0, 3).map((project) => project.id)).toEqual([
      "artificial-intelligence-in-state-government-index",
      "congressional-office-setup-100-day-report",
      "fulbright-focus-group-sponsored-by-openai",
    ]);
  });

  it("groups photo album matches separately", () => {
    expect(titlesFor("taiwan travel photos", "photos")).toContain("Taiwan");
  });

  it("does not return primary site pages in the search index", () => {
    expect(searchSite("photo map").some((group) => String(group.category) === "pages")).toBe(false);
    expect(searchSite("resume timeline").some((group) => String(group.category) === "pages")).toBe(false);
  });

  it("does not index retired or placeholder projects", () => {
    const ids = searchDocuments.map((document) => document.id);
    expect(ids).not.toContain("electric-vehicle-access-analysis");
    expect(ids).not.toContain("communications-consultancy-supporting-local-candidates");
    expect(ids).not.toContain("2022-institute-for-nonprofit-news-index-survey");
    expect(ids).not.toContain("exclusive-interview-with-high-visibility-congressperson");
    expect(ids).not.toContain("fulbright-award-to-taiwan");
  });

  it("surfaces inspiration items through hidden tags", () => {
    expect(titlesFor("compact camera photography", "inspiration")).toContain("Ricoh GRIIIx");
  });

  it("handles conversational government AI queries", () => {
    expect(titlesFor("what did Isaac build for gen AI in state govt", "projects")).toContain(
      "Mapping the Rise of AI Across State Government",
    );
  });

  it("understands picture language for photo albums", () => {
    expect(titlesFor("show me pictures from Taipei", "photos")).toContain("Taiwan");
  });
});
