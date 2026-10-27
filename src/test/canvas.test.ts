import { describe, expect, it } from "vitest";
import { canvasReducer, initialState, localPlan, CONTENT_VERSION, publicProjects } from "../lib/canvas";

describe("adaptive canvas", () => {
  it("rejects stale revisions and content versions", () => {
    const state = { ...initialState(), revision: 2 };
    const stale = localPlan("Taiwan", state.view, [], 1);
    expect(canvasReducer(state, { type: "preview", plan: stale })).toBe(state);
    expect(canvasReducer(state, { type: "preview", plan: { ...stale, revision: 2, contentVersion: "old" } })).toBe(state);
  });
  it("keeps committed history and pins through refinements", () => {
    let state = initialState();
    const ids = publicProjects.slice(0,2).map(p => p.id);
    for (const id of ids) state = canvasReducer(state, { type: "pin", id });
    state = canvasReducer(state, { type: "draft", revision: 1 });
    const plan = localPlan("compare these", state.view, state.pins, 1);
    state = canvasReducer(state, { type: "commit", plan });
    expect(state.view.projectIds).toEqual(ids);
    const back = canvasReducer(state, { type: "back" });
    expect(back.view.layout).toBe("overview");
    expect(back.pins).toEqual(ids);
    expect(canvasReducer(state, { type: "reset" }).pins).toEqual([]);
  });
  it("clears an uncommitted draft to the committed view", () => {
    let state = initialState();
    state = canvasReducer(state, { type: "draft", revision: 1 });
    state = canvasReducer(state, { type: "preview", plan: localPlan("photography", state.view, [], 1) });
    expect(state.view.layout).toBe("photos");
    expect(canvasReducer(state, { type: "clear" }).view.layout).toBe("overview");
  });
  it.each([["Taiwan", "mixed"], ["Taiwan teaching", "detail"], ["Japan at night", "photos"], ["How this works", "architecture"], ["Contact", "contact"], ["zxq nonsense", "empty"]])("composes %s as %s", (query,layout) => {
    const plan = localPlan(query, initialState().view, [], 1);
    expect(plan.layout).toBe(layout);
    expect(plan.contentVersion).toBe(CONTENT_VERSION);
    expect(plan.projectIds.every(id => publicProjects.some(p => p.id === id))).toBe(true);
  });
});
