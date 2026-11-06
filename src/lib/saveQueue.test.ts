import { describe, expect, it, vi } from "vitest";
import { createSaveQueue } from "./saveQueue";

describe("createSaveQueue", () => {
  it("serializes writes and saves the newest pending snapshot", async () => {
    let resolveFirst!: () => void;
    const first = new Promise<void>((resolve) => { resolveFirst = resolve; });
    const save = vi.fn<(value: number) => Promise<void>>()
      .mockReturnValueOnce(first)
      .mockResolvedValue(undefined);
    const queue = createSaveQueue(save, () => {});
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);
    expect(save.mock.calls).toEqual([[1]]);
    resolveFirst();
    await vi.waitFor(() => expect(save.mock.calls).toEqual([[1], [3]]));
  });

  it("retains the newest snapshot after a failure for retry", async () => {
    const save = vi.fn<(value: number) => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const state = vi.fn();
    const queue = createSaveQueue(save, state);
    queue.enqueue(1);
    await vi.waitFor(() => expect(state).toHaveBeenCalledWith("error", expect.any(Error)));
    queue.enqueue(2);
    expect(save).toHaveBeenCalledTimes(1);
    queue.retry();
    await vi.waitFor(() => expect(save.mock.calls).toEqual([[1], [2]]));
    await vi.waitFor(() => expect(state).toHaveBeenCalledWith("idle"));
  });
});
