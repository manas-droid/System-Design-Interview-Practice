
### Database Schema Details

- There are 3 tables: User, Post and Follower
- Users can have many followers and a follower can have many users as followers
- A User can have multiple posts but a post can only be owned by a single User






![database schema](News-Service-Schema-v1.png)

### Dummy Data Script

- Use `npm run seed` to populate the `User` and `Follower` tables with 2,500 synthetic users and a dense follower graph that marks the first five users as "hot" (>= 1,000 followers).
- The script (`src/scripts/seedUsersAndFollowers.ts`) wipes existing users/followers, recreates users with realistic first/last names + handles, and generates tens of thousands of follower relationships so post fan-out experiments can distinguish hot vs. normal accounts.
- Every seeded account uses the plaintext password `NewsfeedPass123!`, which is hashed with bcrypt (12 salt rounds) before persisting.
- The PostgreSQL schema the application owns must be specified via `DB_SCHEMA` in `.env.dev` (example uses `schema_service`). Without explicitly setting it, the seed script may try to create tables in the default `public` schema where the limited app user does not have permissions.
- The seed script automatically runs `CREATE SCHEMA IF NOT EXISTS <DB_SCHEMA>` before initializing TypeORM, so ensure the configured DB user has privileges to create/use that schema.


## Reference for User Follower Graph:

- Hot user vera.garcia now has 1057 followers.
- Hot user silas.mason now has 1042 followers.
- Hot user ivy.santos now has 1054 followers.
- Hot user yara.usher now has 1044 followers.
- Hot user willow.zimmerman now has 1048 followers.
- Inserted 218575 follower relationships.
- Seeded 2500 users.