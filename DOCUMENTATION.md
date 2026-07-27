# MOSIAC Documentation

Mosiac is a high-performance, omni-media tracking platform unifying Movies, TV Shows, YouTube Videos, and Spotify Songs under a single, cohesive social ecosystem. It bridges the gap between fragmented media, allowing users to catalog, review, rate, share, and track all their media interactions universally.

---

## 1. The "Why"
Historically, users have had to use different platforms for different media formats (Letterboxd for films, TV Time for shows, Last.fm for music, and virtually nothing centralized for YouTube). **Mosiac** solves this fragmentation. By centralizing global metadata via API proxies and serving it seamlessly inside a unified social graph, users can now place a YouTube documentary right next to a Hollywood feature film in the same ranked list.

---

## 2. Core User Flow
1. **Unauthenticated Landing:** Anonymous visitors land on a branded Hero Splash page representing the platform's vision, strictly blocking access to internal dashboards until they authenticate.
2. **Authentication:** Secure JWT-based User signup and login.
3. **The Omni-Dashboard (Search Everything):** Once logged in, users land on the unified search dashboard. A single search dynamically executes parallel queries securely against TMDB, YouTube, and Spotify APIs, routing the aggregated results into categorized strips.
4. **Core Interactions:**
   - **Diary Logging**: Users log the date they consumed a media item, add a custom note, leave a dynamic 1-5 rating, and 'heart' it.
   - **Lists**: Users build custom curated collections, blending any media type together seamlessly.
   - **Reviews**: Long-form markdown/text reflection on entities.
5. **Automated Lazy-Ingestion:** When a user interacts with a globally searched entity that isn't tracked in our local database yet, the backend automatically "ingests" it. It seamlessly downloads all complex external metadata and generates a local SQL row on the fly before processing the user's action to enforce strict Foreign Key integrity.
6. **Social Graph:** Users visit other profiles and Follow/Unfollow peers. The central Activity Feed chronologically aggregates all social activity (reviews, logs, and favorites) performed by the accounts they follow.
7. **Profile Curation:** Users can pin 4 "Favorite Picks" to their profile header alongside tracking follower counts and recent history.

---

## 3. Technology Stack & Architecture
- **Monorepo Structure:** Managed via **Turborepo** to cleanly separate the Frontend UI and Backend Server while natively sharing TypeScript logic pipelines.
- **Frontend (UI Interface):** Built purely in **React.js (Vite)** + **TypeScript**. Uses Vanilla CSS mapping and CSS variables (avoiding heavy UI frameworks) to guarantee absolute styling autonomy, extreme performance, and custom dynamic styling. Relies on React-Router for tab state mapping.
- **Backend (API Gateway):** Powered by **Node.js, Express, and JWT**. Acts as a secure, lightweight REST aggregation layer to shield external API keys from client exposure.
- **Database (Source of Truth):** Relational schema built on top of **PostgreSQL** mapping strictly through the **Prisma ORM**.
- **External Integration Proxies:** 
  - **TMDB (The Movie Database)**: Supplies global movie and TV show data matrices.
  - **YouTube v3 API**: Resolves video lengths and thumbnails.
  - **Spotify Web API**: Ingests track listings and album artwork.

---

## 4. Architectural Highlights
- **Parallel Query Acceleration:** Unified search uses \Promise.all()\ mapping across external services heavily reducing total search resolution time.
- **Prisma Relational Aggregations:** Utilizing complex SQL includes natively allows us to load nested follower constraints (e.g. \User -> Follows -> User\, \Media -> DiaryEntry -> User\) in singular queries. 
- **Cinema Curtain Loader:** Features a custom CSS-driven application-wide initialization loader mirroring red velvet cinema curtains to mask initial cold-start fetch cycles without visual popping.

---

## 5. Current Bottlenecks & Limitations
1. **API Rate Limit Ceilings:** Because the omni-search directly proxies external APIs in real-time, heavy traffic spikes could temporarily breach public quotas for TMDB or Spotify.
2. **Metadata Desynchronization:** Cached local database entries aren't proactively updated. If an item on TMDB undergoes a massive poster re-design, Mosiac will continue to serve our locally cached fallback image indefinitely until forced to re-fetch.
3. **Synchronous Polling:** The Activity Feed architecture relies entirely on hard page-reloads or React unmounts to pull the newest chronological updates.
4. **Missing Pagination:** The global search engine pulls heavily batched arrays (e.g., top 10 items) rather than supporting infinite scrolling vectors.

---

## 6. What Can Be Done to Improve (Future Scaling)
- **Redis Query Caching:** Abstracting the external API searches behind a highly volatile Redis instance. Generic queries (e.g. "Spiderman") should be cached for ~15 minutes globally, shielding external APIs from 90% of redundant heavy loads and rendering search practically instantaneous.
- **Optimistic UI State Updating:** Upvotes, Favorites, and Follow toggles should blindly mutate local React state simultaneously alongside the \etch\ call, making interactions feel absolutely synchronous to the user regardless of network latency.
- **Background Pruning/Sync Cron Jobs:** Establishing daily worker layers using Node schedulers to randomly sample and refresh outdated \Media\ entries with live TMDB data silently.
- **WebSocket Streaming:** Upgrading the HTTP-only Activity Feed with a \Socket.io\ or \Supabase Realtime\ multiplexer layer to invisibly stream feed data directly into the user's DOM without refreshing.
