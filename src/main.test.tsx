import { screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  document.getElementById("root")?.remove();
});

it("shows a clear error when Supabase configuration is missing", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  await import("./main");
  expect(await screen.findByRole("alert")).toHaveTextContent("Missing Supabase configuration");
});
