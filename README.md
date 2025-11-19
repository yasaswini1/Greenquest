
  # Gamified Sustainability Tracker

  This is a code bundle for Gamified Sustainability Tracker. The original project is available at https://www.figma.com/design/lAiysRZDaa8gsAoOIh3bFs/Gamified-Sustainability-Tracker.

  ## Running the code

1. Run `npm i` to install dependencies (installs both frontend and backend packages).
2. Start the API server (stores data in `server/localdb.sqlite`):
   ```bash
   npm run server
   ```
   The API listens on `http://localhost:4000` by default and seeds two demo users plus sample activities.
3. In a separate terminal, start the Vite dev server:
   ```bash
   npm run dev
   ```
4. The frontend expects `VITE_API_URL` to point at the API base (defaults to `http://localhost:4000` when the env var is missing).
  