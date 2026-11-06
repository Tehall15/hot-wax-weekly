import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

console.info(
  `[Hot Wax Weekly] Build commit: ${__BUILD_COMMIT__}; built: ${__BUILD_TIME__}`,
);

const App = lazy(() => import("./App"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));

const pathParts = window.location.pathname.split("/").filter(Boolean);
const profileSlug = pathParts[0] === "u" && pathParts[1] ? pathParts[1] : null;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {!import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? (
      <main className="p-8" role="alert">
        Missing Supabase configuration. Set VITE_SUPABASE_URL and
        VITE_SUPABASE_PUBLISHABLE_KEY in your environment.
      </main>
    ) : (
      <Suspense fallback={<div className="p-8">Loading…</div>}>
        {profileSlug ? <PublicProfile slug={profileSlug} /> : <App />}
      </Suspense>
    )}
  </React.StrictMode>,
);
