import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import CommentsSection from "./CommentsSection";

it("prevents posting until existing comments have loaded", () => {
  const props = {
    commentInput: "Hello",
    userId: "me",
    isMe: false,
    onDelete: vi.fn(),
    onInputChange: vi.fn(),
    onSubmit: vi.fn(),
  };
  const { rerender } = render(<CommentsSection {...props} comments={undefined} />);
  expect(screen.getByPlaceholderText("Add a comment…")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Submit comment" })).toBeDisabled();
  rerender(<CommentsSection {...props} comments={[]} />);
  expect(screen.getByRole("button", { name: "Submit comment" })).toBeEnabled();
});
