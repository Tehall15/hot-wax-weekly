import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
  signedOut: false,
  authListener: undefined as ((event: string, session: { user: User } | null) => void) | undefined,
}));

const demoUser: User = {
  id: "demo",
  user_metadata: { display_name: "Demo" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
};

vi.mock("./lib/supabase", () => {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => query,
    update: () => query,
    then: (resolve: (value: { data: never[]; error: null }) => void) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };
  const channel = { on: () => channel, subscribe: () => channel };
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: mocks.signedOut ? null : { user: demoUser } } }),
        onAuthStateChange: (listener: typeof mocks.authListener) => {
          mocks.authListener = listener;
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
      },
      from: () => query,
      channel: () => channel,
      removeChannel: () => Promise.resolve(),
    },
  };
});

vi.mock("./lib/appData", async (importOriginal) => {
  const original = await importOriginal<typeof import("./lib/appData")>();
  return { ...original, loadJournal: mocks.load, saveJournal: mocks.save };
});
vi.mock("./hooks/useSpotify", () => ({ default: () => ({ token: null, expired: false }) }));
vi.mock("./components/layout/Header", () => ({
  default: ({ onAvatarClick, onTabChange }: { onAvatarClick: () => void; onTabChange: (tab: string) => void }) => (
    <><button onClick={onAvatarClick}>Avatar</button><button onClick={() => onTabChange("listen")}>Listen</button></>
  ),
}));
vi.mock("./components/avatar/AvatarPicker", () => ({
  default: ({ onSave }: { onSave: (value: string) => void }) => <button onClick={() => onSave("🎵")}>Save avatar</button>,
}));
vi.mock("./tabs/HottestWaxTab", () => ({ default: () => <div>Feed</div> }));
vi.mock("./tabs/ListenLaterTab", () => ({
  default: ({ listenLater }: { listenLater: { album: string }[] }) => <div>{listenLater.map((album) => album.album).join(", ")}</div>,
}));

import App from "./App";
import { emptyJournal } from "./lib/appData";

describe("journal hydration and saves", () => {
  beforeEach(() => {
    mocks.load.mockReset();
    mocks.save.mockReset();
    mocks.authListener = undefined;
    mocks.signedOut = false;
  });

  it("shows sign in when there is no session", async () => {
    mocks.signedOut = true;
    render(<App />);
    expect(await screen.findByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("hydrates a listen-later list even when there are no reviews", async () => {
    mocks.load.mockResolvedValue({ ...emptyJournal(), listenLater: [{ artist: "A", album: "Saved album" }] });
    render(<App />);
    fireEvent.click(await screen.findByText("Listen"));
    expect(screen.getByText("Saved album")).toBeInTheDocument();
  });

  it("reports a failed load and allows retry", async () => {
    mocks.load.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(emptyJournal());
    render(<App />);
    expect(await screen.findByText("Could not load your journal. Please try again.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Retry"));
    expect(await screen.findByText("Feed")).toBeInTheDocument();
    expect(mocks.load).toHaveBeenCalledTimes(2);
  });

  it("reports failed saves and retries the latest journal", async () => {
    mocks.load.mockResolvedValue(emptyJournal());
    mocks.save.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    render(<App />);
    fireEvent.click(await screen.findByText("Avatar"));
    fireEvent.click(screen.getByText("Save avatar"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");
    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[1][2].avatar).toBe("🎵");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("does not show the previous account's journal while another account loads", async () => {
    let resolveSecond!: (data: ReturnType<typeof emptyJournal>) => void;
    mocks.load
      .mockResolvedValueOnce({ ...emptyJournal(), listenLater: [{ artist: "A", album: "Private album" }] })
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }));
    render(<App />);
    fireEvent.click(await screen.findByText("Listen"));
    expect(screen.getByText("Private album")).toBeInTheDocument();
    const secondUser: User = { ...demoUser, id: "other" };
    act(() => mocks.authListener?.("SIGNED_IN", { user: secondUser }));
    expect(screen.queryByText("Private album")).not.toBeInTheDocument();
    await act(async () => resolveSecond(emptyJournal()));
    expect(screen.queryByText("Private album")).not.toBeInTheDocument();
  });

  it("uses the original account's name when a queued save finishes after switching accounts", async () => {
    let finishSave!: () => void;
    mocks.load.mockResolvedValue(emptyJournal());
    mocks.save.mockReturnValueOnce(new Promise<void>((resolve) => { finishSave = resolve; })).mockResolvedValue(undefined);
    render(<App />);
    fireEvent.click(await screen.findByText("Avatar"));
    fireEvent.click(screen.getByText("Save avatar"));
    fireEvent.click(screen.getByText("Avatar"));
    fireEvent.click(screen.getByText("Save avatar"));
    expect(mocks.save).toHaveBeenCalledTimes(1);
    const secondUser: User = { ...demoUser, id: "other", user_metadata: { display_name: "Other" } };
    act(() => mocks.authListener?.("SIGNED_IN", { user: secondUser }));
    await act(async () => finishSave());
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[1][0]).toBe("demo");
    expect(mocks.save.mock.calls[1][1]).toBe("Demo");
  });
});
