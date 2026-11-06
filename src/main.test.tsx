import { screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  document.getElementById("root")?.remove();
});

it("shows a clear error when Supabase configuration is missing", async () => {
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  await import("./main");
  expect(await screen.findByRole("alert")).toHaveTextContent("Missing Supabase configuration");
  expect(log).toHaveBeenCalledWith(
    expect.stringMatching(/^\[Hot Wax Weekly\] Build commit: (?:[0-9a-f]{40}|unknown); built: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
  );
  log.mockRestore();
});
