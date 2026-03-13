# POAP Family (Frontend)

Web app at [poap.family](https://poap.family) for discovering which POAPs different collectors have in common. Users enter drop IDs or collector addresses to compare shared attendance tokens on the POAP protocol.

## Tech Stack

- **React 18** with TypeScript, built via Create React App (react-scripts)
- **React Router v6** with data loaders for route-based data fetching
- **Context API + reducers** for state management (no Redux)
- **Axios** for API calls, **ethers.js** for ENS resolution
- **Plain CSS** files colocated per component in `src/styles/`
- **Deployed on Netlify** with edge functions for SSR/image handling

## Project Structure

```
src/
  app/          # App root, router config, layout
  pages/        # Route pages (Home, Drop, Drops, Addresses, Last)
  components/   # UI components (~50+)
  stores/       # Context providers (ethereum, drops, settings, html)
  services/     # API clients and business logic
  hooks/        # Custom React hooks for data fetching
  loaders/      # React Router data loaders
  models/       # TypeScript types and runtime parsers
  utils/        # Pure helper functions
  styles/       # CSS files (one per component)
  assets/       # Static assets
netlify/        # Edge functions and env loaders
public/         # Static files, fonts, redirects
```

## Commands

```bash
yarn start        # Dev server on localhost:3000
yarn build        # Production build
yarn type-check   # TypeScript checking
```

## Environment Variables

See `.env.template`:
- `REACT_APP_FAMILY_API_URL` - Backend API URL (https://api.poap.family)
- `REACT_APP_FAMILY_API_KEY` - API key for backend
- `REACT_APP_VERSION_BASE_URL` - Version tracking URL

## Key Patterns

- **One CSS file per component** in `src/styles/`, no CSS-in-JS
- **Runtime parsing** of API responses with typed parser functions in `models/`
- **ENS resolution** uses batched requests with dual context (forward/reverse)
- **URL-driven state**: drop comparisons via URL like `/drops/1,2,3`
- **Streaming**: SSE (EventSource) for progressive in-common data loading
- **Node 20+** required (see `.nvmrc`), **Yarn** as package manager

## Routing

Routes defined in `src/app/App.tsx`:
- `/` - Home/search page
- `/drop/:dropId` - Single drop details
- `/drops/:dropIds` - Compare multiple drops (comma-separated)
- `/addresses/:addresses` - Address collector view
- `/last` - Recent events
- Legacy `/event(s)/` routes redirect to `/drop(s)/`

## Backend

The frontend talks to the POAP Family API backend (separate repo at `poap-family-backend`). See that project's CLAUDE.md for backend details.
