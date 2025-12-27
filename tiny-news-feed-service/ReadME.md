# News Feed Service


## 1. Project Scope & Goals
The goal of this project is to implement a highly scalable and highly available news feed generation service, similar to the core timeline functionality of platforms like Twitter or Facebook.

The central challenge addressed by this design is the Fan-out problem: efficiently distributing content to millions of followers while maintaining low latency for both posts (writes) and feed retrieval (reads).

Key Design Objectives:
Low Read Latency: User feeds must load almost instantly (millisecond response times).

Asynchronous Processing: Posting should not block the user, leveraging message queues for non-critical tasks.

Hybrid Fan-out Strategy: Implement two distinct fan-out mechanisms to handle both common users and high-follower "celebrity" users efficiently.

Decoupling: Use a microservice architecture to separate concerns and allow independent scaling.

## 2. System Architecture
The system is designed as a set of decoupled, specialized services that communicate primarily via an API Gateway and an Asynchronous Message Queue.

### Services (Node.js)

| Service Name   | Primary Responsibilities                                                                                          | Clarification                                                                                                      |
|----------------|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| User Service   | Registration, Login, Authentication, User Profile Management, Follower Graph Management.                         |  This service must handle the Follower Graph (who follows whom) as this data is crucial for the Fan-out Service and is core user data. |
| Post Service   | Receiving post requests, validating user tokens, persisting post content to PostgreSQL, and publishing post events to Kafka. | Its job is to handle the write path's immediate persistence and event initiation.                                     |
| Feed Service   | Handling user read requests, orchestrating data pull from Redis/PostgreSQL, merging feed lists, and ranking/hydrating the final feed. | This is the core read-optimized service.                                                                             |
| Fan-out Service| Consuming Kafka post events, checking follower counts, implementing the Fan-out-on-Write (to Redis inboxes) OR Fan-out-on-Read setup (to Hot User Index in Redis). | Its responsibilities are focused on Fan-out logic and writes only. It handles all interactions with Kafka (consuming events) and all proactive Redis writes (inboxes/indices) but does not handle Redis reads (that's the Feed Service's job). |

### The Storage & Infrastructure

| Component            | Purpose                                                                 | Local Implementation (Ubuntu)      |
|----------------------|-------------------------------------------------------------------------|------------------------------------|
| Follower Graph Store | Stores User profiles and the crucial who-follows-whom relationship.     | PostgreSQL (Installed Natively)    |
| Post Data Store      | Stores the immutable content of all posts (text, images, metadata).     | PostgreSQL (Installed Natively)    |
| Feed Cache / Inbox   | Stores the aggregated list of Post IDs for every user's feed. Optimized for extreme read/write speeds. | Redis (Docker Container)           |
| Message Queue        | Buffers post events, decouples the Post Service from the Fan-out Service. | Apache Kafka (Docker Container)    |

### Fan-out Strategy (The Core Logic)
The Fan-out Service implements a Hybrid Approach based on a follower count threshold (e.g., 1,000 followers).

| Strategy              | User Type                                | Action on Post                                                                 | Read Path Impact                                                                 |
|-----------------------|------------------------------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| Fan-out-on-Write (Push)| Normal Users (Follower count <Threshold) | Post ID is immediately pushed (written) to all followers' Redis inboxes.        | Low latency read: followers' feeds are pre-computed.                             |
| Fan-out-on-Read (Pull)| Hot Users / Celebrities (Follower count ≥Threshold) | Post ID is NOT pushed to followers. The ID is only added to the hot user's own index. | Feed Service must actively pull the latest posts from all followed hot users during feed generation. |


Local Development Setup (Node.js & Ubuntu)
This project leverages a hybrid local setup, utilizing native installations for primary development tools and Docker for complex dependencies.

### Testing & Emulation Strategy
#### Validate the hybrid fan-out logic:

- Data Seeding Generate 5-10 Hot User IDs and seed the database with 5,000+ followers for each.
- Generate 20,000+ Normal User IDs who follow a modest, random number of people.
- The majority of followers for the Hot Users should be Normal Users.
- Load Testing Scenarios (using k6)

#### Latency Test (Write Path):

- Simulate high-frequency POST requests.

- Measure the response time of the Post Service. It should remain consistently low (fast) because the heavy Fan-out work is offloaded to the asynchronous queue.

### Prerequisites

1. Node.js & NPM/Yarn (For running service code).

2. PostgreSQL (Installed natively on Ubuntu).

3. Docker & Docker Compose (For running Kafka and Redis).

### Step-by-Step Setup

1. **Database Setup**: Ensure PostgreSQL is running. Run a schema migration script to create the necessary tables (users, followers, posts).

2. **Infrastructure Start**: Use the provided docker-compose.yml file to start the decoupled infrastructure. This will bring up the Kafka broker and Redis instance.




### Efficiency Test (Read Path):

Simulate thousands of concurrent GET requests to the Feed Service (from Normal User IDs).

Verify the P99 latency is below 100ms. This test validates the efficiency of the Redis read and the Feed Service's ability to merge the Hot User (Pull) content quickly.

### Authentication API (local dev focus)

- Environment variables `.env.dev` gained the following knobs: `PORT`, `PASSWORD_SALT_ROUNDS`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, and `REFRESH_COOKIE_NAME`. They control bcrypt cost, JWT secrets/expirations, and the refresh-token cookie name.
- The Express app now exposes `/api/auth/*` endpoints:
  - `POST /api/auth/signup` — accepts `{ email, password, handle, firstName, lastName }`, creates the user, responds with `{ user, accessToken, expiresIn }` and sets an httpOnly refresh-token cookie.
  - `POST /api/auth/login` — accepts `{ email, password }`, validates credentials, responds with a new access token + refresh cookie.
  - `POST /api/auth/refresh` — reads the refresh cookie, verifies it, and returns a new access token + cookie pair (401 if missing/invalid).
  - `POST /api/auth/logout` — clears the refresh cookie (no body, 204 response).
- Refresh tokens are stored only in the cookie named by `REFRESH_COOKIE_NAME`; access tokens are returned in the JSON payload so clients can store them however they like.

### Frontend integration checklist

1. **Sign-up/Login forms** post against `/api/auth/signup` or `/api/auth/login`. Persist the returned `accessToken` client-side (localStorage or memory for this local-only build).
2. **Attach credentials** by sending `Authorization: Bearer <accessToken>` on every API call that needs the user's identity.
3. **Handle expiry** by calling `POST /api/auth/refresh` whenever an API call fails with 401 or on proactive schedule; the browser automatically includes the refresh cookie, and the response returns a fresh access token.
4. **Logout** by hitting `/api/auth/logout` and wiping the stored access token locally; the backend will clear the cookie so refresh attempts fail after logout.
5. **Protect refresh cookies** by leaving them as httpOnly (no frontend access). During local dev you can keep everything on `localhost` without HTTPS; when deploying elsewhere switch `NODE_ENV=production` to force the cookie's `secure` flag.
