# A-MAX

A-MAX is a cinematic digital home for filmmakers: a place to showcase work, build a portfolio, find collaborators, learn the craft, and join communities.

## Run locally

```bash
npm install
npm install --prefix client
npm install --prefix server
npm run dev
```

The client runs at `http://localhost:5174` and the API at `http://localhost:5000`. The client uses Google Identity Services to get an ID token, which the API verifies before signing the user in. To configure Google sign-in:

1. Create a **Web application** OAuth client in Google Cloud Console.
2. Add `http://localhost:5174` to its **Authorized JavaScript origins**. Google Identity Services uses its popup credential flow here, so no redirect URI or callback URL is required. Add the deployed site origin when deploying.
3. Copy `client/.env.example` to `client/.env` and set `VITE_GOOGLE_CLIENT_ID` to the web client ID.
4. Copy `server/.env.example` to `server/.env`. Set `GOOGLE_CLIENT_ID` to the same web client ID, set `MONGO_URI` to a running MongoDB database, and replace `JWT_SECRET` with a unique random value (for example, `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
   If your network's default DNS resolver refuses Atlas SRV lookups, set the optional `MONGODB_DNS_SERVERS=1.1.1.1,1.0.0.1` in `server/.env`. Leave it unset on deployments unless their DNS resolver needs an override.
5. To display current trailer search results in the homepage ad, enable the YouTube Data API v3 in Google Cloud and set `YOUTUBE_API_KEY` in `server/.env`. The API key remains server-side; restrict it to YouTube Data API v3 and appropriate quotas. If a key was shared publicly, rotate it before use.
6. To enable password-reset email, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `server/.env`. The reset endpoint returns a setup error until SMTP is configured; it does not expose reset tokens in API responses.
7. Restart the dev servers after changing either environment file.

The project root does not need a `.env` file: Vite runs with `client/` as its root and reads `client/.env`; the API reads `server/.env`. If a root `.env` already exists, preserve its other entries and add only the relevant variable to the appropriate client or server file. The API intentionally boots without MongoDB so the client can be explored before infrastructure is configured.

### Deploy the API to Render

The repository includes a Render Blueprint in `render.yaml` for the backend service. In Render, create a Blueprint from this repository and provide:

- `MONGO_URI`: a production MongoDB connection string. Configure the database network allowlist for Render.
- `JWT_SECRET`: a unique random value of at least 32 characters.
- `CLIENT_URL`: the deployed frontend origin, or comma-separated origins if more than one frontend is used.

The backend defaults production uploads to `/var/data`, the Render Blueprint's persistent-disk mount path. The current service must have a persistent disk mounted there; without the disk, uploaded files will not be durable. Keep the disk attached: film uploads, scripts, and chat attachments are stored on it and are not recoverable from MongoDB alone. If migrating an existing deployment, copy the contents of `server/storage` to the disk while preserving its `films`, `scripts`, and `message-attachments` subdirectories. The 10 GB disk is a starting point; increase it as uploads grow. Persistent disks require a paid Render web service.

Render uses `/api/health` as its health check. It reports ready only after MongoDB, indexes, and persistent storage are available. For password-reset email and Google sign-in, also configure the SMTP variables and `GOOGLE_CLIENT_ID` in the Render environment. Configure the frontend's `VITE_API_URL` to the Render API URL plus `/api`.

### Authentication and onboarding

- Email registration and login use the Express API, bcrypt password hashes, and seven-day signed JWTs. `JWT_SECRET` is required for issuing or validating sessions; never use the example placeholder in a deployed environment.
- Google sign-in uses the existing Google Identity Services popup flow and server-side ID-token verification. For local development, add `http://localhost:5174` as an **Authorized JavaScript origin** in the Google OAuth web client. No redirect URI is used. Set the same client ID in `client/.env` and `server/.env`; never put a Google Client Secret in the frontend.
- The MongoDB `User` document now includes a preferences subdocument, onboarding state, and reset-token hashes. Mongoose adds these fields when users are next saved; no destructive migration or separate collection is needed. Back up production data before deploying schema changes.
- New and legacy users with pending onboarding are directed to the five-step preference flow. Each step saves to the authenticated user's document. Skipping all applies defaults without replacing preferences already selected. Completed and skipped users can return to **Preferences** from the sidebar or profile.
- The home feed uses genre matches against available film metadata and falls back to the existing general feed if no matches exist. Language preferences are stored for future filtering but current film records do not contain language metadata, so no content is hidden based on language. This is deterministic matching, not a machine-learning recommendation model.
- Film publishing saves searchable film metadata and a resized poster to the authenticated `Content` API. The homepage merges server-published films with local uploads so publications remain visible after navigation and across browsers.
- Published scripts and stories are stored as `Content` records and uploaded through authenticated `/api/uploads/scripts` (PDF, DOC, DOCX, or TXT; 25 MB maximum). Their documents are served from `/api/scripts/files`; PDFs are previewed in the reader, DOCX and TXT files are rendered as text, and legacy DOC files are offered as downloads. Deployments must retain `server/storage/scripts` or replace it with shared durable storage. Saved state and unique counts use the same authenticated content bookmark API as films, and `/api/content/saved?page=1&limit=50` returns a paginated library with per-type totals. Prototype/local-only scripts without a published content ID are not saveable and are excluded from persistent saved counts.
- Uploaded film MP4s are streamed to `server/storage/films` through the authenticated `/api/uploads/films` endpoint (500 MB maximum) and served with HTTP range support for browser playback. Previously published records without a playable video need to be republished with the original MP4.
- Film likes and saved-film state are stored on the MongoDB `Content` record and use idempotent authenticated state updates; counts are calculated from persisted likes. Film comments and one-level replies are stored in MongoDB, paginated, editable/deletable by their author, and deduplicated on retried submissions using a client request ID.
- Film likes, comments, and replies create persistent notifications for the film owner or parent-comment author. Notifications are delivered to the recipient's Socket.IO user room, scoped to that recipient in API reads, and support unread counts plus marking one or all as read. A like notification is unique per actor/film pair and remains in history if that like is later removed.
- Server startup creates the unique comment-request and notification-event indexes when MongoDB is connected. To provision them before deploying, run `npm --prefix server run migrate:engagement`; this creates indexes only and does not delete or rewrite content.
- Film upload crew entries use AMAX usernames; the uploader's username is prefilled as director. Crew handles are resolved to public profile names and avatars before publication.
- New equipment listings are stored in MongoDB with the authenticated seller identity. Buyers can open the seller chat and send a request; the seller receives a notification and can approve from chat or Notifications. Approval removes the listing from active marketplace results and notifies the buyer. Existing demo/local listings are not linked to accounts and do not support this workflow.
- Explore's Filmmakers section loads every account whose selected identity is Filmmaker from the public profile directory endpoint. The response contains public profile fields only and never includes email or authentication data.
- Password reset links expire after one hour, are stored as hashes, and are sent only when SMTP is configured.
- Direct messages use the existing Express, MongoDB, JWT, and Socket.IO stack. `Conversation` stores the unique participant pair and each participant's read timestamp; `Message` stores the authenticated sender, body, timestamp, and idempotency key. Create required indexes on existing/production databases with `npm --prefix server run migrate:messages`; this uses Mongoose `createIndexes()` and does not drop data. The existing MongoDB data directory is not deleted or recreated on server startup.
- Homepage trailer promos are fetched through `GET /api/trailers`. The backend builds and encodes the YouTube Data API search URL, keeps `YOUTUBE_API_KEY` server-side, and caches results for 15 minutes. Configure the key in `server/.env`; without it the homepage falls back to its existing promos.
- The weekly homepage carousel is served by public `GET /api/showcase/current`. Its fixed order is up to two approved short films from the current India-time week, recent YouTube trailer picks, five scripts/stories, and currently published festival/competition events. Film likes and script reads are queried live within the current week so the ranking and counts move as people engage.
- Short-film candidates must be published `film` records with category `short-film`; an admin must approve each one for the homepage. Admins can review `GET /api/admin/showcase/short-films/candidates` and approve or unapprove with `PATCH /api/admin/showcase/short-films/:contentId/approval` and `{ "approved": true }`. Approval is separate from public publishing and is off by default.
- Authenticated script/story reads are counted by `POST /api/content/:id/view`, at most once per account per UTC day. The weekly list ranks the five newest-week records by these persisted read counts, then likes. No raw IP addresses are stored for counting.
- YouTube weekly searches cover the scheduled Indian languages plus Hollywood, world cinema, Japanese, Korean, French, and Spanish. Only titles identified as trailers from a curated list of studio/distributor channels are eligible; reactions, reviews, explainers, teasers, full movies, and creator commentary are filtered out. The feed returns at most three YouTube trailers, ranked by views and recency. Add trusted regional channel titles with the server-only, pipe-separated `SHOWCASE_OFFICIAL_CHANNELS` setting. `SHOWCASE_TRAILER_LIMIT` can lower the cap (maximum 3); `SHOWCASE_TRAILER_LOOKBACK_DAYS` controls recency (default 45). The API key stays in the server environment. A scheduled refresh runs Monday at 00:15 India time; the first public request also builds the current week if no snapshot exists. An admin can request a refresh with `POST /api/admin/showcase/refresh`, rate-limited to once per 24 hours after the API key is configured.
- Festival and competition details are admin-curated so the site does not silently promote stale or unverified external listings. Create with `POST /api/admin/showcase/events`, edit with `PATCH /api/admin/showcase/events/:eventId`, and archive with `DELETE /api/admin/showcase/events/:eventId`. New entries begin as drafts; set `status: "published"` to display them. Each needs an HTTPS `applicationUrl` and either an `endAt` or `submissionDeadline`; optional fields include `eventType`, `summary`, `description`, `posterUrl`, `region`, `startAt`, and `eventUrl`. Expired published entries leave the carousel automatically. All these admin routes require the separate admin bearer token and write audit entries.
- Admins can manage approvals and festival listings from `/admin` → **Weekly Showcase**. The same panel shows the weekly trailer search status and permits a quota-limited refresh. If a key is configured but searches fail, confirm YouTube Data API v3 is enabled for its Google Cloud project and that the key restrictions allow this API.
- Script/story reads are counted server-side for signed-in readers, with at most one counted view per reader per item per UTC day; the per-reader deduplication records expire after 35 days. The weekly top five uses these counts, with likes and recency as tie breakers.
- The messaging page searches real AMAX accounts, loads persisted direct conversations and paginated history, marks messages read, and sends through authenticated HTTP. After a successful database save, the API emits Socket.IO updates to authorized conversation and participant rooms. On reconnect, the client refreshes conversations and history from MongoDB. The client never supplies the sender identity.

Run the API and frontend with `npm run dev`. To check the full flow, verify: registration with matching passwords; onboarding answers surviving refresh/logout/login; skipping one step and skipping all; existing accounts going through onboarding once; Google login with configured origins; direct access to protected routes after signing out or allowing a token to expire; preference changes reflected in the home feed; and reset email plus expired/invalid reset links.

To verify messaging locally, create two accounts at `/signup` in separate browser profiles, then sign in to each. Search for the other account by username or display name from **Messages** and send a message. Messages are saved in MongoDB before live delivery, so offline recipients see them when they next sign in. `npm --prefix server test` runs the server's automated preference and message helper tests.

## Architecture

```text
A-MAX/
  client/                  Vite + React application
    src/
      App.jsx              Route shell and phase-one product surfaces
      styles.css            Cinematic responsive design system
      main.jsx              Browser entrypoint
  server/                  Express + Socket.IO API
    src/
      models/               Mongoose domain models
      routes/               Resource-focused REST routes
      middleware/           Authentication and authorization
      server.js             HTTP, Socket.IO, and Mongo bootstrap
```

The client uses React Router and the shared authenticated fetch service. The server separates transport, domain models, and access control. Socket.IO rooms are used for conversation membership and recipient-scoped real-time notification events.

## Domain schema

The data model is intentionally reference-oriented:

- `User`: identity, flexible creative roles, profile, skills, followers, and following.
- `Content`: films, trailers, scripts, stories, and BTS media owned by a creator; film likes and saved film/script/story IDs are stored as user references.
- `Comment`: film comments and one-level replies, with author ownership and request idempotency keys.
- `Notification`: recipient-scoped film likes/comments/replies with actor, content, read timestamp, and unique event key.
- `Community`: members and moderators; community posts and comments will reference both community and author.
- `Comment`, `Review`, `Bookmark`, `Follow`, `Notification`: activity records referencing users and their target resource.
- `Conversation`, `Message`, `Group`: direct and group communication, with Socket.IO room IDs.
- `MarketplaceProduct`, `Wishlist`: equipment listings, seller ownership, and buyer saves.
- `LearningModule`, `LearningProgress`: structured lessons and per-user completion state.
- `Report`: moderation queue with reporter, target, reason, status, and moderator resolution.

## Page map

Public routes: `/`, `/explore`, `/films/:id`, `/scripts/:id`, `/profile/:username`, `/marketplace`, `/products/:id`, `/learn`, `/learn/:slug`, `/news`, `/login`, `/register`.

Protected routes: `/home`, `/upload`, `/profile/edit`, `/dashboard`, `/messages`, `/communities`, `/communities/:id`, `/notifications`, `/bookmarks`, `/wishlist`, `/listings`, `/settings`.

Admin routes: `/admin`, `/admin/users`, `/admin/content`, `/admin/marketplace`, `/admin/communities`.

The current UI implements the high-signal first slice: home feed, film exploration, creator profile, learning workshop, communities, responsive navigation, create/upload entry points, and route placeholders for the remaining modules. It uses remote image URLs for prototype media; production uploads should be routed through a signed Cloudinary or S3 flow and persisted as media metadata.

## Delivery phases

1. Foundation: auth, roles, profiles, navigation, database connection.
2. Core showcase: uploads, film detail, interactions, follows, portfolio.
3. Community: posts, discussions, direct and group messaging, notifications.
4. Learning: modules, search, bookmarks, completion progress.
5. Marketplace: listings, filters, wishlists, seller dashboard.
6. Integrations: movie metadata and industry news, kept separate from user content.
7. Admin and polish: moderation, analytics, validation, testing, and performance.
