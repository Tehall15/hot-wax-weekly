export type SaveState = "idle" | "saving" | "error";

export function createSaveQueue<T>(
  save: (value: T) => Promise<void>,
  onStateChange: (state: SaveState, error?: unknown) => void,
) {
  let latest: T | undefined;
  let version = 0;
  let savedVersion = 0;
  let running = false;
  let failed = false;

  async function drain() {
    if (running || failed || latest === undefined) return;
    running = true;
    onStateChange("saving");
    try {
      while (savedVersion < version) {
        const currentVersion = version;
        const value = latest;
        await save(value);
        savedVersion = currentVersion;
      }
      onStateChange("idle");
    } catch (error) {
      failed = true;
      onStateChange("error", error);
    } finally {
      running = false;
    }
  }

  return {
    enqueue(value: T) {
      latest = value;
      version++;
      void drain();
    },
    retry() {
      failed = false;
      void drain();
    },
  };
}
