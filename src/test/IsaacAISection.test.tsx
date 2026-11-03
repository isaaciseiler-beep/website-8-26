import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import IsaacAISection from "@/components/IsaacAISection";
import { CHAT_LIMIT_MESSAGE } from "@/lib/chatClient";

describe("IsaacAISection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the chat frame fixed and responds with a limit notice on the sixth user message", async () => {
    let replies = 0;
    const fetchMock = vi.fn(async () => {
      replies += 1;
      return new Response(
        JSON.stringify({
          message: `Mock answer ${replies}`,
          sources: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<IsaacAISection />);
    const input = screen.getByPlaceholderText("Ask about my work");
    const submit = screen.getByLabelText("Ask Isaac AI");
    const frame = container.querySelector(".h-\\[340px\\]");

    expect(frame).toBeTruthy();

    for (let index = 1; index <= 5; index += 1) {
      fireEvent.change(input, { target: { value: `Question ${index}` } });
      await waitFor(() => expect(submit).not.toBeDisabled());
      fireEvent.click(submit);
      await screen.findByText(`Mock answer ${index}`);
    }

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    expect(screen.queryByText("5/5")).not.toBeInTheDocument();
    expect(input).not.toBeDisabled();

    fireEvent.change(input, { target: { value: "Question 6" } });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    // The legacy notice is typed one character at a time (~0.9s before test
    // scheduling overhead); wait for the actual completed notice, not a race
    // against Testing Library's default 1s deadline in the parallel suite.
    await screen.findByText(CHAT_LIMIT_MESSAGE, {}, { timeout: 3000 });
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(input).toBeDisabled();
    expect(frame).toHaveClass("h-[340px]", "md:h-[400px]");
  });
});
