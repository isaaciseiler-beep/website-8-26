import { describe, expect, it } from "vitest";
import { shouldFoldChatForPageScroll } from "@/lib/motion";

describe("controlled motion behavior", () => {
  it("folds the Ask AI pane after a small deliberate page scroll", () => {
    expect(shouldFoldChatForPageScroll({
      currentScrollY: 139,
      initialScrollY: 100,
      keyboardOpen: false,
    })).toBe(false);
    expect(shouldFoldChatForPageScroll({
      currentScrollY: 140,
      initialScrollY: 100,
      keyboardOpen: false,
    })).toBe(true);
  });

  it("does not fold for keyboard-driven mobile viewport movement", () => {
    expect(shouldFoldChatForPageScroll({
      currentScrollY: 240,
      initialScrollY: 100,
      keyboardOpen: true,
    })).toBe(false);
  });
});
