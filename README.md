# Hot Wax Weekly

## Local development

Use Node.js 24. Install dependencies with `npm ci`, copy `.env.example` to
`.env`, fill in the Supabase project URL and publishable key from its dashboard,
then run `npm run dev`. The Vite server
listens at http://127.0.0.1:5173. Run `npm run typecheck` and `npm run build`
to check changes; `npm run lint` checks React hooks and `npm test` runs tests.

The app uses its configured Supabase project for authentication and data. A
publishable key is intended for use in the browser; appropriate row-level
security policies are still required in Supabase. Never put a secret/service
role key in a `VITE_` variable. Restart Vite after changing environment values.

Spotify integration requires `VITE_SPOTIFY_CLIENT_ID` and an exact redirect
URI registered in the Spotify dashboard. Set `VITE_SPOTIFY_REDIRECT_URI` to
the registered URI; if omitted, the current page origin is used. Register the
local URI as well as the production URI in the Spotify dashboard.

## Identifying a deployment

Open the deployed app and check the browser developer console for
`[Hot Wax Weekly] Build commit: ...; built: ...`. The commit identifies the
source revision; the UTC build time distinguishes rebuilds of the same commit.
On Vercel the commit comes from `VERCEL_GIT_COMMIT_SHA`. Local builds use the
current Git commit and may also contain uncommitted changes. If neither source
is available, the commit is reported as `unknown`.

## UI styling

The UI uses Tailwind CSS v4 through the Vite plugin and shadcn/ui components
backed by Radix. Theme colors and Tailwind configuration live in
[`src/index.css`](src/index.css); reusable UI components live in
[`src/components/ui`](src/components/ui). Add shadcn components with the
shadcn CLI using the existing [`components.json`](components.json) configuration.
