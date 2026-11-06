# Hot Wax Weekly

## Local development

Install dependencies with `npm ci`, then run `npm run dev`. The Vite server
listens at http://127.0.0.1:5173. Run `npm run typecheck` and `npm run build`
to check changes.

The app uses its configured Supabase project for authentication and data.
Spotify integration requires `VITE_SPOTIFY_CLIENT_ID`; its OAuth redirect is
currently configured for the production URL, not localhost.

## UI styling

The UI uses Tailwind CSS v4 through the Vite plugin and shadcn/ui components
backed by Radix. Theme colors and Tailwind configuration live in
[`src/index.css`](src/index.css); reusable UI components live in
[`src/components/ui`](src/components/ui). Add shadcn components with the
shadcn CLI using the existing [`components.json`](components.json) configuration.
